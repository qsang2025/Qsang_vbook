// search.js — Danh sach theo the loai + tim kiem theo tu khoa.
//
// Hai che do:
// 1. Duong dan (query bat dau bang "/" hoac "http", vd. "/list_1/"): fetch
//    trang danh sach; phan trang bang hau to "_N/" (vd. "/list_1_2/").
// 2. Tu khoa: POST /e/search/ (keyboard + show=title,ftitle,writer); site
//    tra 302 ve /e/search/result/?searchid=N — app khong tu theo redirect
//    cua POST nen doc Location roi fetch tiep. Chi tra trang 1 (phan trang
//    ket qua tim kiem cua Empire CMS chua kiem chung duoc; tra data2 rong
//    de app khong goi lai trang 2 trung du lieu).
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(query, page) {
    query = query || "";
    page = page || "1";
    if (!query) return Response.error("Nhập từ khóa để tìm kiếm");

    var url = "";
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var path = query;
        if (page !== "1") path = path.replace(/\/?$/, "_" + page + "/");
        url = absUrl(path);
        var rr = ttlFetchDoc(url);
        if (rr.error) return Response.error(rr.error);
        return parseList(rr.doc, page, true);
    }

    // --- Tim kiem theo tu khoa: POST /e/search/ ---
    var postUrl = BASE_URL + "/e/search/";
    var r = null;
    try {
        r = pacedFetch(postUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "keyboard=" + encodeURIComponent(query) + "&show=title,ftitle,writer",
            timeout: 45000
        });
    } catch (e) {
        return Response.error("Không tải được dữ liệu (lỗi mạng): " + postUrl);
    }
    if (!r) return Response.error("Không tải được dữ liệu: " + postUrl);
    if (r.status === 301 || r.status === 302) {
        var location = "";
        try { location = String(r.res.header("location") || r.res.header("Location") || ""); } catch (e2) {}
        if (!location && r.headers) {
            try { location = String(r.headers["location"] || ""); } catch (e3) {}
        }
        if (!location) return Response.error("Tìm kiếm không trả về trang kết quả (HTTP " + r.status + ")");
        if (location.indexOf("http") !== 0 && location.indexOf("/") !== 0) location = "/e/search/" + location;
        var rr2 = ttlFetchDoc(absUrl(location));
        if (rr2.error) return Response.error(rr2.error);
        return parseList(rr2.doc, "1", false);
    }
    if (!r.ok) return Response.error(rateLimitErr("书本书", postUrl, r));
    var doc = null;
    try { doc = r.res.html(); } catch (e4) { return Response.error("Không đọc được dữ liệu: " + postUrl); }
    if (!doc) return Response.error("Không đọc được dữ liệu (site trả về rỗng): " + postUrl);
    return parseList(doc, "1", false);
}

function parseList(doc, page, allowNext) {
    var items = [];
    var rows = doc.select("#newscontent .l li");
    for (var i = 0; i < rows.size(); i++) {
        var el = rows.get(i);
        var a = selFirst(el, ".s2 a");
        if (!a) continue;
        var link = a.attr("href");
        var name = cleanText(a.text());
        if (!link || !name) continue;
        var author = cleanText(el.select(".s4").text());
        var latest = cleanText(el.select(".s3").text());
        var desc = author;
        if (latest) desc = desc ? desc + " · " + latest : latest;
        items.push({
            name: name,
            link: link,
            cover: coverOf(link),
            description: desc,
            host: BASE_URL
        });
    }
    if (items.length === 0) {
        // Trang ket qua co the dung layout khac (#hotcontent .item).
        var cards = doc.select("#hotcontent .item");
        for (var j = 0; j < cards.size(); j++) {
            var card = cards.get(j);
            var ca = selFirst(card, "dt a");
            if (!ca) continue;
            var clink = ca.attr("href");
            var cname = cleanText(ca.text());
            if (!clink || !cname) continue;
            var imgEl = selFirst(card, ".image img");
            var cover = imgEl ? absUrl(imgEl.attr("data-original") || imgEl.attr("src") || "") : coverOf(clink);
            items.push({
                name: cname,
                link: clink,
                cover: cover,
                description: cleanText(card.select(".btm a").text()),
                host: BASE_URL
            });
        }
    }
    if (items.length === 0) {
        // Empire CMS tra trang "信息提示" khi tim kiem bi chan/loi.
        var msg = cleanText(doc.select(".box, table").text());
        var pageTitle = cleanText(doc.select("title").text());
        if (pageTitle.indexOf("信息提示") !== -1 || pageTitle.indexOf("資訊提示") !== -1) {
            return Response.error(msg || pageTitle);
        }
        return Response.error("Không tìm thấy truyện phù hợp");
    }
    // Chi danh sach theo duong dan moi co phan trang that (_N/); tim kiem
    // theo tu khoa luon tra data2 rong (xem ghi chu o dau file).
    var nextPage = "";
    if (allowNext && doc.select("#pagelink strong + a").size() > 0) {
        nextPage = (parseInt(page, 10) + 1).toString();
    }
    return Response.success(items, nextPage);
}
