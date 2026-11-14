// homecontent.js — Noi dung cac tab trang chu cua Me Truyen Sang Tac.
//
// "home" (BTV De Cu) va "updated" (Chuong Moi Cap Nhat): trang chu "/" la
// SSR that — parse theo muc:
//   - home: 18 link a.story-title dau tien theo thu tu tai lieu (muc BTV
//     De Cu dung truoc bang cap nhat).
//   - updated: chi cac link a.story-title trong <table> (bang chuong moi
//     cap nhat, 24 truyen).
// "new" (Truyen Moi = trang thai Dang ra) va "full" (Truyen Hoan Thanh):
// trang danh sach chi render banner o HTML tinh — danh sach that do JS
// tai qua POST pages/fetch_stories.php (status=0 Dang ra / status=1 Hoan
// thanh). Dung API POST truoc; that bai thi mo trang loc bang trinh duyet
// (JS cua site tu tai danh sach).
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function buildCoverMap(doc) {
    var map = {};
    var all = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
    var lastSlug = "";
    var lastImg = "";
    var i = 0;
    for (i = 0; i < all.size(); i++) {
        var el = all.get(i);
        var href = el.attr("href") || "";
        var src = el.attr("src") || "";
        if (href.indexOf("/truyen/") !== -1 && href.indexOf("/truyen/index.php") === -1) {
            var s = extractSlug(href);
            if (s) {
                lastSlug = s;
                if (lastImg && !map[s]) map[s] = lastImg;
                lastImg = "";
            }
        } else if (src.indexOf("/uploads/") !== -1) {
            var imgUrl = el.attr("data-src") || el.attr("data-original") || src;
            if (imgUrl.indexOf("logo") === -1 && imgUrl.indexOf("banner") === -1) {
                if (imgUrl.charAt(0) === "/") imgUrl = BASE_URL + imgUrl;
                if (lastSlug && !map[lastSlug]) map[lastSlug] = imgUrl;
                lastImg = imgUrl;
            }
        }
    }
    return map;
}

function parseStoryCards(doc, cap) {
    var result = [];
    var seen = {};
    var coverMap = buildCoverMap(doc);
    var links = doc.select("a[href*='/truyen/']");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        if (!href || href === "/" || href.indexOf("/truyen/index.php") !== -1) continue;
        var slug = extractSlug(href);
        if (!slug || seen[slug]) continue;
        var name = a.text().trim();
        if (!name || name === "Logo" || name === "Xem thêm" || name === "Xem tất cả") continue;
        if (name.indexOf("Banner Image") !== -1) continue;
        if (name.indexOf("Banner") !== -1) continue;
        if (name.length < 2) continue;
        seen[slug] = true;
        var cover = "";
        var img = safeFirst(a.select("img"));
        if (img) {
            cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
            if (cover.indexOf("logo") !== -1 || cover.indexOf("banner") !== -1) cover = "";
        }
        if (!cover && coverMap[slug]) cover = coverMap[slug];
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
        result.push({
            name: name,
            link: "/truyen/" + slug,
            host: BASE_URL,
            cover: cover,
            description: ""
        });
        if (result.length >= cap) break;
    }
    return result;
}

// Token trang ke tu phan trang cua API: tim data-page lon nhat; neu lon
// hon trang hien tai thi con trang ke.
function nextFromDataPage(doc, p) {
    var pages = doc.select("[data-page]");
    var maxPage = 0;
    var i = 0;
    for (i = 0; i < pages.size(); i++) {
        var v = parseInt(pages.get(i).attr("data-page") || "0", 10);
        if (!isNaN(v) && v > maxPage) maxPage = v;
    }
    if (maxPage > p) return String(p + 1);
    return "";
}

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    // --- Tab SSR: BTV De Cu / Chuong Moi Cap Nhat -----------------------
    if (url === "home" || url === "updated") {
        var r = fetchMTS(BASE_URL + "/");
        var doc = null;
        if (r.ok && r.res) {
            try { doc = r.res.html(); } catch (e) { doc = null; }
        }
        if (!doc) doc = openInBrowser(BASE_URL + "/");
        if (!doc) return Response.error(pacedErrorMessage(r));

        var items = [];
        if (url === "home") {
            // 18 link a.story-title dau tien = muc BTV De Cu.
            var allLinks = doc.select("a.story-title");
            var seen = {};
            var coverMap = buildCoverMap(doc);
            var i = 0;
            for (i = 0; i < allLinks.size(); i++) {
                var a = allLinks.get(i);
                var href = a.attr("href") || "";
                var slug = extractSlug(href);
                if (!slug || seen[slug]) continue;
                var name = a.text().trim();
                if (!name || name.length < 2) continue;
                seen[slug] = true;
                var cover = "";
                var img = safeFirst(a.select("img"));
                if (img) cover = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
                if (!cover && coverMap[slug]) cover = coverMap[slug];
                if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
                items.push({ name: name, link: "/truyen/" + slug, host: BASE_URL, cover: cover, description: "" });
                if (items.length >= 18) break;
            }
        } else {
            // Chi link trong <table> = bang chuong moi cap nhat.
            var tableLinks = doc.select("table a.story-title");
            var seen2 = {};
            var coverMap2 = buildCoverMap(doc);
            var j = 0;
            for (j = 0; j < tableLinks.size(); j++) {
                var a2 = tableLinks.get(j);
                var href2 = a2.attr("href") || "";
                var slug2 = extractSlug(href2);
                if (!slug2 || seen2[slug2]) continue;
                var name2 = a2.text().trim();
                if (!name2 || name2.length < 2) continue;
                seen2[slug2] = true;
                items.push({ name: name2, link: "/truyen/" + slug2, host: BASE_URL, cover: coverMap2[slug2] || "", description: "" });
                if (items.length >= 30) break;
            }
        }
        if (!items || items.length === 0) return Response.error("Không tải được danh sách truyện");
        return Response.success(items, "");
    }

    // --- Tab API: Truyen Moi (status=0 Dang ra) / Hoan Thanh (status=1) --
    if (url !== "new" && url !== "full") return Response.error("Tab không hợp lệ");
    var status = url === "full" ? "1" : "0";
    var listUrl = BASE_URL + "/index.php?quanly=truyen&tinhtrang=" + status;
    var body = "status=" + status + "&page=" + p;
    var r2 = fetchMTS(BASE_URL + "/pages/fetch_stories.php", {
        method: "POST",
        body: body,
        referer: listUrl,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-Requested-With": "XMLHttpRequest"
        }
    });
    var doc2 = null;
    if (r2.ok && r2.res) {
        try { doc2 = r2.res.html(); } catch (e2) { doc2 = null; }
    }
    if (!doc2) {
        // Fallback: trinh duyet mo trang loc, JS cua site tu goi API.
        doc2 = openInBrowser(listUrl + (p > 1 ? "&page=" + p : ""));
    }
    if (!doc2) return Response.error(pacedErrorMessage(r2));
    var items2 = parseStoryCards(doc2, 30);
    if (!items2 || items2.length === 0) return Response.success([], "");
    return Response.success(items2, nextFromDataPage(doc2, p));
}
