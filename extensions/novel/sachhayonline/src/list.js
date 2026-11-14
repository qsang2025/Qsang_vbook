// list.js — danh sach sach cho the loai / tac gia.
//
// Input: URL danh sach day du dang
//   https://www.sachhayonline.com/danh-muc/<slug>
//   https://www.sachhayonline.com/tac-gia/<slug>
// App goi execute(query, "2") cho trang 2 tro di (page la chuoi so).
//
// Parse: ul.default li (20 sach/trang). Moi muc:
//   <a> dau tien: ten + link truyen; phan text con lai cua li la
//   "– xuất bản năm YYYY của Tác giả" (lam description).
// Phan trang: ul.pagination a co href ?page=N; token tiep = so trang
// nho nhat > trang hien tai, khong co thi "".
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    url = url || "";
    var cur = 1;
    if (page) {
        cur = parseInt(page, 10);
        if (isNaN(cur) || cur < 1) cur = 1;
    }
    var u = url.replace(/[?&]page=\d+/, "");
    if (u.indexOf("?") < 0) u += "?";
    else u += "&";
    u += "page=" + cur;

    var r = fetchDoc(u);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var el = doc.select("ul.default li");
    var data = [];
    for (var i = 0; i < el.size(); i++) {
        var item = parseListItem(el.get(i));
        if (item) data.push(item);
    }
    if (data.length === 0) return Response.error("Không tìm thấy sách nào trong danh sách này.");

    return Response.success(data, nextPageToken(doc, cur));
}

function parseListItem(li) {
    var a = safeFirst(li.select("a"));
    if (!a) return null;
    var name = cleanText(a.text());
    var link = absUrl(a.attr("href"));
    if (!name || !link) return null;
    var full = cleanText(li.text());
    var desc = full;
    if (full.indexOf(name) === 0) desc = cleanText(full.substring(name.length));
    return {
        name: name,
        link: link,
        cover: "",
        description: desc,
        host: BASE_URL
    };
}

// Token trang tiep: so trang nho nhat > trang hien tai trong cac link
// phan trang; khong co thi "" (het danh sach).
function nextPageToken(doc, cur) {
    var links = doc.select("ul.pagination a");
    var best = 0;
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/page=(\d+)/);
        if (!m) continue;
        var n = parseInt(m[1], 10);
        if (n > cur && (best === 0 || n < best)) best = n;
    }
    return best > 0 ? String(best) : "";
}
