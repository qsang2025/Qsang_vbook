// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /novelbooks/<id>/ (kiem chung live 2026-11-16):
// - Ten: li.h2.mb-2.
// - Bia: img[src*='/pics/'] dau tien (bo /pics/qr/ — ma QR).
// - Tac gia: span.item-info-author ("作者: 愛似百匯").
// - Mo ta: li.full_text.mt-2.
// - Trang thai: li.small.text-gray ("120篇 狀態:已完結96萬字...") —
//   co "已完結" thi ongoing=false, khong thi ongoing=true.
// - The loai: breadcrumb small.item-navbar-text (link /booklists/<id>/
//   rong + ten the loai la text node sau no); doi chieu chinh xac voi
//   GENRES (11 the loai). KHONG quet toan bo trang — nav "小說分類" chua
//   ca 11 the loai nen quet rong se lay sai the loai dau tien.
// - Khong co suggests (khoi "More" cuoi trang la quang cao truyen ngan,
//   khong phai sach cung the loai).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalize8bUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    // Trang chi tiet khong co "/" cuoi se 301 ve dang co "/" (kiem chung
    // live 2026-11-16) — them "/" de tranh loi HTTP 301.
    if (/\/novelbooks\/\d+$/.test(url)) url += "/";
    var r = fetch8bDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select("li.h2.mb-2"));
    var name = nameEl !== null ? cleanText(nameEl.text()) : "";
    if (!name) {
        var ti = String(doc.select("title").text() || "");
        name = cleanText(ti.split(",")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var cover = "";
    var imgs = doc.select("img[src*='/pics/']");
    for (var ci = 0; ci < imgs.size(); ci++) {
        var src = imgs.get(ci).attr("src") || "";
        if (src.indexOf("/pics/qr/") !== -1) continue;
        cover = absUrl(src);
        break;
    }

    var author = "";
    var auEl = safeFirst(doc.select("span.item-info-author"));
    if (auEl !== null) author = cleanText(auEl.text()).replace(/^作者:\s*/, "");

    var desc = "";
    var deEl = safeFirst(doc.select("li.full_text.mt-2"));
    if (deEl !== null) desc = cleanText(deEl.text());

    var detail = "";
    var ongoing = true;
    var stEl = safeFirst(doc.select("li.small.text-gray"));
    if (stEl !== null) {
        detail = cleanText(stEl.text());
        if (detail.indexOf("已完結") !== -1) ongoing = false;
    }

    var genres = [];
    var bc = safeFirst(doc.select("small.item-navbar-text"));
    if (bc !== null) {
        var gl = safeFirst(bc.select("a[href*='/booklists/']"));
        if (gl !== null) {
            var ghref = gl.attr("href") || "";
            var gtitle = cleanText(bc.text()).replace(/^首页\s*/, "").replace(/^首頁\s*/, "");
            for (var k = 0; k < GENRES.length; k++) {
                // So sanh chinh xac (khong dung indexOf: "/booklists/1"
                // la tien to cua "/booklists/14").
                if (ghref.replace(/\/$/, "") === GENRES[k].input.replace(/\/$/, "")) {
                    if (!gtitle) gtitle = GENRES[k].title;
                    genres.push({ title: gtitle, input: "https://www.8book.com" + GENRES[k].input, script: "gen.js" });
                    break;
                }
            }
        }
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
