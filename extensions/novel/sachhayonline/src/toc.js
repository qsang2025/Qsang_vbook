// toc.js — muc luc sach.
//
// GET <url chi tiet> — danh sach chuong nam trong ul.default: moi chuong
// 1 li, ten la text cua <a>, link dang
// /tua-sach/<slug>/<chuong|hoi>-<so>/<id>.
// Toan bo muc luc ve trong 1 lan goi — khong can page.js.
// Luu y: mot so sach chi co mot phan chuong tren site (vd. Tat den chi
// co 9 chuong XVIII–XXVI) — toc tra dung nhung gi site liet ke, khong
// bia them. Khong co muc nao -> sach chua co noi dung doc online
// (chi co ban tai ve) -> bao loi tieng Viet ro rang.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";

    var r = fetchDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var links = doc.select("ul.default li a");
    var data = [];
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = cleanText(a.text());
        var link = absUrl(a.attr("href"));
        if (!name || !link) continue;
        data.push({
            name: name,
            url: link,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Sách này chưa có nội dung đọc online trên Sách Hay Online (chỉ có bản tải về).");

    return Response.success(data);
}
