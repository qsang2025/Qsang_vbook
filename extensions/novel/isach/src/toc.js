// toc.js — muc luc sach.
//
// GET <url chi tiet>&chapter=0000 — danh sach chuong nam trong
// #motsach_content_body: moi chuong 1 div.right_menu_item, ten dang
// "Chương N - Ten chuong", link story.php?story=<slug>&chapter=NNNN.
// Header "Muc Luc" la div.ms_chapter nen khong lot vao selector.
// Base cu tim chuoi <div id="c0000" bang ngoac kep trong khi site dung
// nhay don — nen toc cu luon roi ve fallback; ban nay dung selector
// jsoup truc tiep. Khong co muc nao -> sach chua co noi dung doc online
// (chi co ban tai ve) -> bao loi tieng Viet ro rang.
// Toan bo muc luc ve trong 1 lan goi — khong can page.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";
    var tocUrl = url.replace(/&chapter=\d+/, "").replace(/chapter=\d+&?/, "");
    if (tocUrl.indexOf("?") < 0) tocUrl += "?";
    tocUrl += "&chapter=0000";

    rateLimitDelay("isach.info");
    var response = fetch(tocUrl);
    if (!response.ok) return Response.error("Không tải được mục lục (HTTP " + response.status + ")");
    var doc = response.html();

    var links = doc.select("#motsach_content_body div.right_menu_item a");
    var data = [];
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var name = a.text().replace(/^\s+|\s+$/g, "");
        var link = absUrl(a.attr("href"));
        if (!name || !link) continue;
        if (link.indexOf("chapter=") < 0) continue;
        data.push({
            name: name,
            url: link,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Sách này chưa có nội dung đọc online trên iSach (chỉ có bản tải về).");

    return Response.success(data);
}
