// search.js — tim kiem tu khoa + renderer danh sach cho tab home/genre
// (execute(query, page) -> items, next).
//
// Hai nhanh:
// - query bat dau bang "/" hoac "http": duyet chuyen muc (input cua tab
//   home/genre), tai thang URL do.
// - query con lai: tu khoa, site dung /search/<tu-khoa>.html (UTF-8,
//   encodeURIComponent).
// Phan trang danh sach dung duong dan /<muc>/<so>.html (vd.
// /library/<id>/2.html, /search/<kw>/2.html, /ranking/hits/2.html) nen
// token trang ke tiep la URL tuyet doi lay tu link .next trong #pagelink;
// lan goi sau page la URL do thi tai thang, khong ghep ?page=.
// Layout dong truyen (.bookbox > .p10):
//   h2.bookname a[href="/book/<id>.html"]  ten truyen + link
//   .author (dong 1)                       "作者：<tac gia>"
//   .update                                tom tat (text hoac title)
// Danh sach khong co anh bia nen cover de rong.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function listUrl(query, page) {
    var p = String(page || "");
    if (p.indexOf("http") === 0) return normalizeUrl(p);
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        return normalizeUrl(query.indexOf("http") === 0 ? query : BASE_URL + query);
    }
    return BASE_URL + "/search/" + encodeURIComponent(query) + ".html";
}

function parseItems(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select(".bookbox .p10");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var a = row.select("h2.bookname a").first();
        if (a === null) continue;
        var href = String(a.attr("href") || "");
        var name = cleanText(a.text());
        if (!href || !name) continue;
        var link = absUrl(href);
        if (seen[link]) continue;
        seen[link] = true;

        var author = "";
        var authors = row.select(".author");
        var j = 0;
        for (j = 0; j < authors.size(); j++) {
            var t = cleanText(authors.get(j).text());
            if (t.indexOf("作者") !== -1) {
                author = cleanText(t.replace("作者：", "").replace("作者:", ""));
                break;
            }
        }

        var description = "";
        var upd = row.select(".update").first();
        if (upd !== null) {
            description = cleanText(upd.text());
            if (!description) description = cleanText(String(upd.attr("title") || ""));
            description = description.replace("简介：", "").replace("简介:", "");
        }

        items.push({
            name: name,
            link: link,
            author: author,
            cover: "",
            description: description,
            host: siteOrigin()
        });
    }
    return items;
}

function nextToken(doc) {
    var next = doc.select("#pagelink a.next").first();
    if (next === null) return "";
    var href = String(next.attr("href") || "");
    if (!href) return "";
    return absUrl(href);
}

function execute(query, page) {
    query = String(query || "");
    page = String(page || "");
    var url = listUrl(query, page);
    rateLimitDelay("sto66.com", 500, 1500);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được kết quả: " + url);

    var items = parseItems(doc);
    if (items.length === 0) {
        return Response.error("Không có kết quả tại " + url);
    }
    return Response.success(items, nextToken(doc));
}
