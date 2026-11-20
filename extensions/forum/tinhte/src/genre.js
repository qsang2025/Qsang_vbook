// genre.js — danh sach board (chuyen muc) cua Tinhte Forum.
//
// Lay tu trang /forums/ (XenForo co dien): moi h3.nodeTitle la mot node.
// Chi giu node co duong dan bat dau bang "/forums/" (12 board that) —
// loai "categories/dien-dan.778/" (nhom) va "links/nhat-tao.643/"
// (link ngoai). Mo ta lay tu blockquote nodeDescription ma link
// tro toi qua data-description. Moi muc tro ve list.js voi input la
// duong dan board day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var response = fetch(BASE_URL + "/forums/");
    if (!response.ok) return Response.error("Không tải được danh sách board (HTTP " + response.status + ")");
    var doc = response.html();

    var genres = [];
    doc.select("h3.nodeTitle a").map(function (el) {
        var href = el.attr("href");
        if (!href) return null;
        if (href.indexOf("http") === 0) {
            var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
            if (!m) return null;
            href = m[1];
        } else if (href.indexOf("/") !== 0) {
            href = "/" + href;
        }
        if (href.indexOf("/forums/") !== 0) return null;
        var desc = "";
        var descRef = el.attr("data-description");
        if (descRef && descRef.charAt(0) === "#") {
            desc = doc.select(descRef).text();
        }
        genres.push({
            title: el.text(),
            input: href,
            script: "list.js",
            description: desc
        });
        return null;
    });

    return Response.success(genres);
}
