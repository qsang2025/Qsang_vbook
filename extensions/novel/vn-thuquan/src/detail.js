// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /TacPham/<slug>-<id>/ (kiem chung live 2026-11-16):
// - Ten: h1.vntq-reader-title (fallback: alt cua img#vntqCoverImg).
// - Tac gia: div.vntq-author-top a (vd. "Lê Đình Danh").
// - Anh bia: img#vntqCoverImg src (tuong doi; bo qua defaultcover.jpg).
// - Mo ta: #vntqTextContent — trang chi tiet nhung san Loi Mo Dau
//   (gioi thieu sach) o day (Tay Son 6.727 ky tu, khop chuong 1).
// - Thong tin: "Lượt đọc: <span id=lblSoLanDoc> | <span id=lblSoNguoi>
//   Đánh giá: <span id=lblTrungBinhSao>/10 Sao" + so chuong doc tu
//   tieu de modal muc luc "Mục lục (71 chương)".
// - The loai: trang chi tiet KHONG hien the loai cua sach (chi co link
//   "Review Sách" o nav) nen tra genres: [].
// - Trang thai: site khong ghi trang thai hoan thanh/dang ra; thu vien
//   nay hau het la tac pham co dien da hoan thanh nen mac dinh
//   ongoing=false (ghi ro gia dinh o PROGRESS).
// - Goi y: khoi sidebar "Truyện năm sao" (ul.truyen-list a.truyen-title)
//   neu co tren trang.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeVntqUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    if (!bookId(url)) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchVntqDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = "";
    var h1El = safeFirst(doc.select("h1.vntq-reader-title"));
    if (h1El !== null) name = cleanText(h1El.text());
    if (!name) {
        var covAlt = safeFirst(doc.select("img#vntqCoverImg"));
        if (covAlt !== null) name = cleanText(covAlt.attr("alt") || "");
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var author = "";
    var auEl = safeFirst(doc.select("div.vntq-author-top a"));
    if (auEl !== null) author = cleanText(auEl.text());

    var cover = "";
    var covEl = safeFirst(doc.select("img#vntqCoverImg"));
    if (covEl !== null) {
        cover = String(covEl.attr("src") || "");
        if (cover.indexOf("defaultcover") !== -1) cover = "";
        if (cover && cover.indexOf("http") !== 0) cover = normalizeVntqUrl(cover);
    }

    var desc = "";
    var deEl = safeFirst(doc.select("#vntqTextContent"));
    if (deEl !== null) desc = cleanText(deEl.text());
    // Trang chi tiet nhung san ca chuong 1 (Thuy Hu: 45.896 ky tu) — cat
    // mo ta o 3.000 ky tu de man hinh chi tiet khong bi nang; doc day du
    // van co o chuong 1 qua muc luc.
    if (desc.length > 3000) desc = desc.substring(0, 3000) + "…";

    var detailParts = [];
    var viewsEl = safeFirst(doc.select("#lblSoLanDoc"));
    if (viewsEl !== null) {
        var v = cleanText(viewsEl.text());
        if (v) detailParts.push("Lượt đọc: " + v);
    }
    var rateEl = safeFirst(doc.select("#lblTrungBinhSao"));
    var rateNEl = safeFirst(doc.select("#lblSoNguoi"));
    if (rateEl !== null) {
        var rt = cleanText(rateEl.text());
        if (rt) {
            var rn = "";
            if (rateNEl !== null) rn = cleanText(rateNEl.text());
            detailParts.push("Đánh giá: " + rt + "/10" + (rn ? " (" + rn + " đánh giá)" : ""));
        }
    }
    var tocH = doc.select("h3");
    for (var hi = 0; hi < tocH.size(); hi++) {
        var ht = cleanText(tocH.get(hi).text());
        var hm = ht.match(/Mục lục \((\d+) chương\)/);
        if (hm) {
            detailParts.push("Số chương: " + hm[1]);
            break;
        }
    }

    var suggests = [];
    var sugLinks = doc.select("ul.truyen-list a.truyen-title");
    for (var si = 0; si < sugLinks.size() && suggests.length < 10; si++) {
        var sa = sugLinks.get(si);
        var sh = String(sa.attr("href") || "");
        if (!bookId(sh)) continue;
        var sn = cleanText(sa.text());
        if (!sn) continue;
        suggests.push({
            name: sn,
            link: BASE_URL + "/TacPham/" + bookSlugId(sh) + "/",
            cover: ""
        });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailParts.join(" | "),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: false,
        genres: [],
        suggests: suggests
    });
}
