// search.js — Tim kiem cua Me Truyen Sang Tac.
//
// API goi y: GET pages/search_suggestions.php?query=<tu khoa> tra JSON
// [{tieude, tacgia, slug}]. Tim duoc ca khi go khong dau ("hoang" tim
// thay truyen co chu "Hoang"). That bai thi mo trang tim kiem bang trinh
// duyet (JS cua site tu tai ket qua qua API loc).
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function parseSearchCards(doc) {
    var result = [];
    var seen = {};
    var links = doc.select("a[href*='/truyen/']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href.indexOf("/truyen/index.php") !== -1) continue;
        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;
        var name = a.text().trim();
        if (!name || name === "Logo" || name === "Xem thêm" || name.length < 2) continue;
        if (name.indexOf("Banner") !== -1) continue;
        seen[slug] = true;
        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: BASE_URL,
            cover: "",
            description: ""
        });
        if (result.length >= 30) break;
    }
    return result;
}

function execute(key, page) {
    var kw = (key || "").trim();
    if (!kw) return Response.success([], "");

    var searchUrl = BASE_URL + "/pages/search_suggestions.php?query=" + encodeURIComponent(kw);
    var r = fetchMTS(searchUrl, {
        referer: BASE_URL + "/",
        headers: { "X-Requested-With": "XMLHttpRequest" }
    });
    if (r.ok && r.res) {
        var data = null;
        try { data = r.res.json(); } catch (e) { data = null; }
        if (data && data.length > 0) {
            var result = [];
            var i = 0;
            for (i = 0; i < data.length; i++) {
                var item = data[i];
                var slug = item.slug || "";
                var title = item.tieude || "";
                var author = item.tacgia || "";
                if (!slug || !title) continue;
                result.push({
                    name: title,
                    link: "/truyen/" + slug,
                    host: BASE_URL,
                    cover: "",
                    description: author ? "Tác giả: " + author : ""
                });
            }
            if (result.length > 0) return Response.success(result, "");
        }
    }

    // Fallback: trinh duyet mo trang tim kiem, JS cua site tu tai ket qua.
    var webUrl = BASE_URL + "/index.php?quanly=truyen&key=" + encodeURIComponent(kw);
    var doc = openInBrowser(webUrl);
    if (!doc) return Response.error(pacedErrorMessage(r));
    var items = parseSearchCards(doc);
    return Response.success(items, "");
}
