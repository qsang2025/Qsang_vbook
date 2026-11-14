// toc.js — Muc luc day du qua AJAX cua site.
// Trang chi tiet chi SSR 20 chuong dau; toan bo chuong lay qua POST
// sources/ajax/load-chapters.php {page, id_truyen, pnvn_token}, lap den
// khi tra ve rong hoac khong con link <a>. Token lay tu trang chi tiet
// (hidden input, fallback regex tren JS inline); token co the bi xoay
// nen gap loi thi lay token moi qua get-csrf-token.php roi thu lai 1 lan.
load("config.js");
load("rate-limit.js");

function loadChaptersPage(storyUrl, idTruyen, token, pageNum) {
    var pr = ttlFetchPost(BASE_URL + "/sources/ajax/load-chapters.php",
        { page: String(pageNum), id_truyen: idTruyen, pnvn_token: token }, storyUrl);
    if (pr.error) return { error: pr.error };
    var resHtml = "";
    try {
        resHtml = pr.res.text();
    } catch (e) {
        return { error: "Không đọc được mục lục: " + storyUrl };
    }
    return { html: resHtml };
}

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var rr = ttlFetchDoc(storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;
    var htmlText = "";
    try {
        htmlText = doc.html();
    } catch (e) {
    }
    var auth = extractStoryAuth(doc, htmlText);
    if (!auth.id) return Response.error("Không đọc được mã truyện để tải mục lục: " + storyUrl);
    if (!auth.token) {
        auth.token = refreshPnvnToken();
        if (!auth.token) return Response.error("Không đọc được mã bảo mật để tải mục lục: " + storyUrl);
    }

    var allChapters = [];
    var pageNum = 1;
    var tokenRefreshed = false;
    while (pageNum <= 500) {
        var r = loadChaptersPage(storyUrl, auth.id, auth.token, pageNum);
        if (r.error) {
            // Co the token da bi xoay: lay token moi, thu lai trang nay 1 lan.
            if (!tokenRefreshed) {
                var newToken = refreshPnvnToken();
                if (newToken) {
                    auth.token = newToken;
                    tokenRefreshed = true;
                    r = loadChaptersPage(storyUrl, auth.id, auth.token, pageNum);
                }
            }
            if (r.error) {
                if (allChapters.length > 0) break;
                return Response.error(r.error);
            }
        }
        var resHtml = r.html || "";
        if (!resHtml || resHtml.trim() === "" || resHtml.indexOf("<a") === -1) break;
        var ajaxDoc = null;
        try {
            ajaxDoc = Html.parse(resHtml);
        } catch (e) {
            break;
        }
        var chapters = ajaxDoc.select("a");
        if (chapters.size() === 0) break;
        for (var i = 0; i < chapters.size(); i++) {
            var chap = chapters.get(i);
            var name = cleanText(chap.text());
            var link = normalizeUrl(chap.attr("href") || "");
            if (link && name) allChapters.push({ name: name, url: link, host: BASE_URL });
        }
        pageNum++;
    }
    if (allChapters.length === 0) return Response.error("Không đọc được mục lục (site trả về rỗng): " + storyUrl);
    return Response.success(allChapters);
}
