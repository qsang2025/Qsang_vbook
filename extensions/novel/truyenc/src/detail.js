// detail.js — Thong tin chi tiet truyen tren TruyenC
//
// Trang chi tiet la SSR. Cac neo that da kiem chung bang curl 2026-11-08
// (truyen mau Linh Kiem Ton):
//  - Ten: h1. Tac gia: link /tac-gia/.
//  - Anh bia: <img alt="ten truyen"> (CloudFront). KHONG lay img dau
//    trang (ban cu lay img dau tien se trung logo/badge App Store).
//  - Mo ta: div.prose duy nhat tren trang (duoi tieu de "Tom tat noi
//    dung"). KHONG gom moi <p> tren trang.
//  - Trang thai + tong so chuong + the loai: doc tu JSON-LD / RSC nhung
//    trong HTML (regex tren embedded JSON — hop le theo runtime.md):
//    "numberOfPages":5418, "status":"COMPLETED", "genre":["Tien Hiep"...].
//    Du phong: badge trang thai ("Hoan thanh"/"Dang ra"), chu "Xem tat ca
//    (N chuong)", link the loai dang pill (class rounded-full + uppercase).
//  - Heuristic cu indexOf("Full") tren toan trang da bo: chu "Full" xuat
//    hien o nhieu cho khong lien quan (tab "Da Hoan Thanh", badge "Full").
load('config.js');
load('fetch-helpers.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn truyện.");
    url = normalizeUrl(url);

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    var name = doc.select("h1").first() ? doc.select("h1").first().text().trim() : "";
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var imgs = doc.select("img[src*='cloudfront.net']");
    for (var ci = 0; ci < imgs.size(); ci++) {
        var cand = imgs.get(ci);
        if ((cand.attr("alt") || "").trim() === name) {
            cover = cand.attr("data-src") || cand.attr("src") || "";
            break;
        }
    }
    if (!cover && imgs.size() > 0) {
        var first = imgs.get(0);
        cover = first.attr("data-src") || first.attr("src") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = "";
    var authorEl = doc.select("a[href*='/tac-gia/']").first();
    if (authorEl) {
        author = authorEl.text().trim();
    } else {
        var aMatch = doc.text().match(/Tác giả\s*:\s*([^\n\r]+)/);
        if (aMatch) author = aMatch[1].trim();
    }

    var description = "";
    var descEl = doc.select("div.prose").first();
    if (descEl) description = descEl.html();

    var html = "";
    try { html = doc.html(); } catch (e) { html = ""; }

    // Trang thai that: "status":"COMPLETED" (JSON-LD) hoac
    // \"status\":\"COMPLETED\" (RSC flight, co backslash) — regex nay khop
    // ca hai dang.
    var ongoing = true;
    var statusKnown = false;
    var stMatch = html.match(/status[^A-Za-z]{0,10}(COMPLETED|ONGOING|HIATUS)/);
    if (stMatch) {
        statusKnown = true;
        ongoing = (stMatch[1] !== "COMPLETED");
    }
    if (!statusKnown) {
        if (doc.select("span:contains(Hoàn thành)").size() > 0) {
            statusKnown = true;
            ongoing = false;
        } else if (doc.select("span:contains(Đang ra)").size() > 0) {
            statusKnown = true;
            ongoing = true;
        }
    }

    // Tong so chuong that, theo thu tu uu tien: JSON-LD numberOfPages,
    // RSC "chapters":N, chu "Xem tat ca (N chuong)", badge "Danh sach
    // chuong N". KHONG dung regex /(\\d+)\\s*Chuong/ tren toan trang
    // (ban cu): no khop so dau tien gap phai, khong phai tong so.
    var chapterCount = 0;
    var npMatch = html.match(/"numberOfPages"\s*:\s*(\d+)/);
    if (npMatch) {
        chapterCount = parseInt(npMatch[1], 10);
    } else {
        var chMatch = html.match(/chapters[^0-9]{0,10}(\d+)/);
        if (chMatch) {
            chapterCount = parseInt(chMatch[1], 10);
        } else {
            var allMatch = doc.text().match(/\(\s*(\d+)\s*chương\s*\)/);
            if (allMatch) {
                chapterCount = parseInt(allMatch[1], 10);
            } else {
                var badgeMatch = doc.text().match(/Danh sách chương\s*(\d+)/);
                if (badgeMatch) chapterCount = parseInt(badgeMatch[1], 10);
            }
        }
    }

    // The loai: uu tien link pill o header truyen (class rounded-full +
    // uppercase — link the loai o nav khong co class nay). Du phong: ten
    // the loai trong JSON-LD "genre":[...], doi sang slug qua GENRES.
    var genres = [];
    var gSeen = {};
    var pillLinks = doc.select("a[href*='/the-loai/']");
    for (var gi = 0; gi < pillLinks.size(); gi++) {
        var gl = pillLinks.get(gi);
        var cls = gl.attr("class") || "";
        if (cls.indexOf("rounded-full") === -1 || cls.indexOf("uppercase") === -1) continue;
        var gHref = gl.attr("href") || "";
        var gTitle = gl.text().trim();
        if (!gHref || !gTitle || gSeen[gHref]) continue;
        gSeen[gHref] = true;
        genres.push({ title: gTitle, input: gHref, script: "gen.js" });
    }
    if (genres.length === 0) {
        // Khong co link pill the loai: dung du phong JSON-LD "genre" map
        // qua bang GENRES tinh. Log de biet tan suat roi vao nhanh nay
        // (bang tinh co the lech khi site them/bot the loai — kiem tra
        // dinh ky voi /the-loai; xem ghi chu tren bang GENRES).
        console.log("detail: khong co link pill the loai, dung du phong JSON-LD genre: " + url);
        var geMatch = html.match(/"genre"\s*:\s*\[([^\]]*)\]/);
        if (geMatch) {
            var rawNames = geMatch[1].match(/"([^"]+)"/g);
            if (rawNames) {
                for (var ni = 0; ni < rawNames.length; ni++) {
                    var gName = rawNames[ni].replace(/"/g, "");
                    for (var ki = 0; ki < GENRES.length; ki++) {
                        if (GENRES[ki].title.toLowerCase() === gName.toLowerCase()) {
                            if (!gSeen[GENRES[ki].slug]) {
                                gSeen[GENRES[ki].slug] = true;
                                genres.push({ title: GENRES[ki].title, input: GENRES[ki].slug, script: "gen.js" });
                            }
                            break;
                        }
                    }
                }
            }
        }
    }

    var detailLines = [];
    if (author) detailLines.push("<b>Tác giả:</b> " + author);
    detailLines.push("<b>Trạng thái:</b> " + (ongoing ? "Đang ra" : "Hoàn thành"));
    if (chapterCount > 0) detailLines.push("<b>Số chương:</b> " + chapterCount);

    // Luot xem
    var viewMatch = html.match(/class="[^"]*font-bold[^"]*truncate">([^<]+)<\/div><div[^>]*>Lượt xem<\/div>/i);
    if (viewMatch) {
        var views = viewMatch[1].trim();
        if (views) detailLines.push("<b>Lượt xem:</b> " + views);
    }

    // Danh gia
    var rateMatch = html.match(/class="[^"]*font-bold[^"]*truncate">([^<]+)<!-- -->\s*<span[^>]*>★<\/span><\/div><div[^>]*>([0-9]+)<!-- -->\s*đánh giá<\/div>/i);
    if (rateMatch) {
        var score = rateMatch[1].trim();
        var votes = rateMatch[2].trim();
        if (score && score !== "0" && votes && votes !== "0") {
            detailLines.push("<b>Đánh giá:</b> " + score + " ⭐ (" + votes + " đánh giá)");
        }
    }

    // StoryId dung cho API comments
    var storyId = "";
    var sidMatch = html.match(/"storyId"\s*:\s*"([a-f0-9\-]{36})"/i);
    if (sidMatch) storyId = sidMatch[1];

    var commentConfig = {
        title: "Bình luận",
        input: storyId || url,
        script: "comment.js"
    };

    var comments = [];
    if (storyId) {
        try {
            var cData = fetchJson(BASE_URL + "/api/comments?target_type=story&target_id=" + storyId + "&sort=newest&page=1&limit=10");
            if (cData && cData.data && cData.data.length > 0) {
                for (var ci = 0; ci < cData.data.length; ci++) {
                    var cItem = cData.data[ci];
                    var uName = (cItem.user && (cItem.user.username || cItem.user.name)) || "Thành viên";
                    var uAva = (cItem.user && cItem.user.avatar_url) || "";
                    if (uAva && uAva.indexOf("//") === 0) uAva = "https:" + uAva;
                    comments.push({
                        name: uName,
                        content: cItem.content || "",
                        avatar: uAva,
                        description: cItem.created_at ? cItem.created_at.substring(0, 10) : ""
                    });
                }
            }
        } catch (eComments) {}
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detailLines.join("<br>"),
        genres: genres,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        comment: commentConfig,
        comments: comments
    });
}
