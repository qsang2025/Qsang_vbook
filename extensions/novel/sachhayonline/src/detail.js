// detail.js — chi tiet sach.
//
// GET /tua-sach/<slug> — lay:
//   ten: .inner a h3
//   tac gia: .inner p a (link /tac-gia/...); co sach khong co dong tac
//     gia (vd. Tam quốc diễn nghĩa) -> author "".
//   bia: div.image img (src tuong doi /themes/.../book-photos/<N>.jpg)
//   mo ta: meta description ("Ten sach cua Tac gia" — mong, chi co
//     ten + tac gia)
//   the loai: link /danh-muc/ trong breadcrumb .nav
//   so chuong: dem ul.default li ngay tren trang chi tiet (cung 1 request)
// Site khong co tin hieu hoan thanh -> ongoing=true mac dinh (ghi ro la
// han che trong SACHHAYONLINE-PROGRESS.md). Ban tai ePub/mobi/PDF khong
// co link truc tiep trong HTML nen chi ghi chu trong detail, khong dua
// link tai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";

    var r = fetchDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var titleEl = safeFirst(doc.select(".inner a h3"));
    var name = titleEl ? cleanText(titleEl.text()) : "";
    if (!name) return Response.error("Không tải được trang truyện.");

    var coverEl = safeFirst(doc.select("div.image img"));
    var cover = "";
    if (coverEl) cover = absUrl(coverEl.attr("src"));

    var author = "";
    var innerLinks = doc.select(".inner p a");
    for (var i = 0; i < innerLinks.size(); i++) {
        var href = innerLinks.get(i).attr("href") || "";
        if (href.indexOf("/tac-gia/") >= 0) {
            author = cleanText(innerLinks.get(i).text());
            break;
        }
    }

    var genres = [];
    var navLinks = doc.select(".nav a");
    for (var j = 0; j < navLinks.size(); j++) {
        var gh = navLinks.get(j).attr("href") || "";
        var label = cleanText(navLinks.get(j).text());
        if (gh.indexOf("/danh-muc/") >= 0 && label) {
            genres.push({title: label, input: absUrl(gh), script: "list.js"});
        }
    }

    var des = "";
    var metaEl = safeFirst(doc.select("meta[name=description]"));
    if (metaEl) des = cleanText(metaEl.attr("content"));

    var chapCount = doc.select("ul.default li").size();
    var info = chapCount > 0 ? ("Số chương: " + chapCount) : "";
    info += (info ? " | " : "") + "Đọc online miễn phí — bản tải ePub/mobi/PDF không mở được trong app.";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: des,
        detail: info,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: genres,
        suggests: []
    });
}
