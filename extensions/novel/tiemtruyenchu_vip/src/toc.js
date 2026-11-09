// toc.js — Danh sach chuong Tiem Truyen Chu (HTML da login hoac Public API v1)
load('config.js');

function execute(url) {
    var storyId = resolveStoryId(url);
    if (!storyId) {
        return Response.error("Không xác định được mã truyện để lấy mục lục.");
    }

    var list = [];
    var ck = getSavedCookie();

    // 1. Neu co Cookie, thu tai trang HTML de lay ten chuong day du trong #chapter-list-container
    if (ck) {
        var pageUrl = BASE_URL + "/truyen/" + storyId;
        try {
            var res = fetch(pageUrl, { headers: buildHeaders(ck) });
            if (res && res.ok) {
                var doc = res.html();
                var links = doc.select("#chapter-list-container a[href*='/doc-truyen/']");
                for (var i = 0; i < links.size(); i++) {
                    var a = links.get(i);
                    var href = a.attr("href");
                    var title = a.text().trim();
                    if (href) {
                        list.push({
                            name: title || ("Chương " + (i + 1)),
                            url: normalizeUrl(href),
                            host: BASE_URL
                        });
                    }
                }
                if (list.length > 0) {
                    return Response.success(list);
                }
            }
        } catch (e) {
        }
    }

    // 2. Goi Public API v1 /api/v1/stories/<id> (khong can dang nhap).
    // API tra mang chapters THAT o TOP LEVEL cua JSON (moi item co
    // chapterNumber + title that), khong nam trong story — dung mang nay,
    // khong tu sinh ten "Chuong N" nua.
    var apiUrl = BASE_URL + "/api/v1/stories/" + storyId;
    var json = fetchJson(apiUrl);
    var wrapped = unwrapStory(json);
    var story = wrapped.story;
    var chapters = wrapped.chapters;

    if (chapters && chapters.length) {
        for (var j = 0; j < chapters.length; j++) {
            var ch = chapters[j];
            if (!ch) continue;
            var num = ch.chapterNumber || ch.chapter_number || ch.number || (j + 1);
            var chTitle = ch.title || ("Chương " + num);
            var item = {
                name: chTitle,
                url: BASE_URL + "/doc-truyen/" + storyId + "/chuong/" + num,
                host: BASE_URL
            };
            // Đánh dấu chương VIP theo chapter_price của API (0 = miễn phí).
            // Người dùng nhìn mục lục là biết chương nào sẽ trả tiếng Trung
            // qua tuyến tự mở khóa (chưa mua) và chương nào trả tiếng Việt.
            // Không có đăng nhập nên không biết chương nào tài khoản đã mua
            // (isPurchased chỉ có khi đăng nhập) — chỉ đánh dấu theo giá.
            var price = ch.chapter_price || ch.price || 0;
            if (price > 0) {
                item.lock = true;
                item.pay = "VIP · " + price + " hoa";
            }
            list.push(item);
        }
        return Response.success(list);
    }

    // 3. Du phong cuoi: chi biet tong so chuong thi sinh 1..total (ten that
    // chi co o chuong moi nhat). Chi dung khi total nho (<= 50): so API lech
    // voi so hien thi (vd. 669: API 1451 = "Chương 1462") nen danh sach sinh
    // hàng loạt cho truyện dài có thể trỏ nhầm chương — thà báo lỗi để thử
    // lại còn hơn trả 1.000 mục sai.
    var total = story && story.total_chapters ? parseInt(story.total_chapters, 10) : 0;
    if (total > 0 && total <= 50) {
        var latestTitle = "";
        if (story.latest_chapter && story.latest_chapter.title) {
            latestTitle = String(story.latest_chapter.title).trim();
        } else if (story.latest_chapter_title) {
            latestTitle = String(story.latest_chapter_title).trim();
        }
        for (var k = 1; k <= total; k++) {
            var chapName = "Chương " + k;
            if (k === total && latestTitle) {
                chapName = latestTitle;
            }
            list.push({
                name: chapName,
                url: BASE_URL + "/doc-truyen/" + storyId + "/chuong/" + k,
                host: BASE_URL
            });
        }
        return Response.success(list);
    }

    return Response.error("Không thể tải danh sách chương cho truyện #" + storyId + ".");
}
