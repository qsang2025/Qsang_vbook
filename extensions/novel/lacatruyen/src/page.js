// page.js — Phan trang muc luc truyen La Ca Truyen (moi trang 500 chuong)
load('crypto.js');
load('config.js');

var TOC_PAGE_SIZE = 500;
var TOC_MAX_PAGES = 50;

function execute(url) {
    var storyUrl = stripQueryAndHash(normalizeUrl(url)).replace(/\/+$/, "");
    if (!storyUrl) return Response.error("URL truyện không hợp lệ.");

    var res = fetch(storyUrl, {
        method: "GET",
        headers: buildAuthHeaders()
    });
    if (!res || !res.ok) {
        return Response.error("Không thể tải trang truyện để phân trang mục lục.");
    }

    var nextData = extractNextData(res.html());
    if (!nextData || !nextData.props || !nextData.props.pageProps) {
        return Response.error("Không đọc được dữ liệu truyện từ trang.");
    }

    var pageProps = nextData.props.pageProps;
    var story = pageProps.story || {};
    var storyId = story.id;
    if (!storyId) {
        return Response.error("Không tìm thấy mã định danh truyện (story.id).");
    }

    var chapterCount = parseInt(story.count_chapter || story.count_chap || pageProps.count_chapter || 0, 10);

    // Neu SSR chua co count_chapter, probe 1 chuong tu API list-chapters de doc latest_chapter.chapter_order
    if (isNaN(chapterCount) || chapterCount <= 0) {
        try {
            var probeBody = {
                id_story: aesEncrypt(String(storyId), MASTER_KEY),
                page: aesEncrypt("1", MASTER_KEY),
                items_per_page: aesEncrypt("1", MASTER_KEY),
                order: aesEncrypt("ASC", MASTER_KEY)
            };
            var probeRes = fetch(BASE_URL + "/api/chapters/list-chapters", {
                method: "POST",
                headers: buildAuthHeaders({
                    "Content-Type": "application/json",
                    "Referer": storyUrl
                }),
                body: JSON.stringify(probeBody)
            });
            if (probeRes && probeRes.ok) {
                var probeJson = probeRes.json();
                if (probeJson && probeJson.latest_chapter) {
                    var latestDec = aesDecrypt(probeJson.latest_chapter, MASTER_KEY);
                    if (latestDec) {
                        var latestObj = JSON.parse(latestDec);
                        var latestOrder = parseInt(latestObj.chapter_order || latestObj.order || 0, 10);
                        if (!isNaN(latestOrder) && latestOrder > 0) {
                            chapterCount = latestOrder;
                        }
                    }
                }
            }
        } catch (e) {
        }
    }

    if (isNaN(chapterCount) || chapterCount <= 0) {
        return Response.success([storyUrl + "?story_id=" + storyId + "&page=1&size=" + TOC_PAGE_SIZE]);
    }

    var totalPages = Math.ceil(chapterCount / TOC_PAGE_SIZE);
    if (totalPages < 1) totalPages = 1;
    if (totalPages > TOC_MAX_PAGES) totalPages = TOC_MAX_PAGES;

    var pages = [];
    for (var p = 1; p <= totalPages; p++) {
        pages.push(storyUrl + "?story_id=" + storyId + "&page=" + p + "&size=" + TOC_PAGE_SIZE);
    }

    return Response.success(pages);
}
