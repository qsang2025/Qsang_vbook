// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Site UTF-8 nen POST truc tiep bang UTF-8 duoc (khong can WebView
// nhu biqugezz — site do luu GBK). Form that cua site:
// <form name="articlesearch" method="post" action="/search.html">
// voi searchkey + searchtype=all (kiem chung live 2026-11-15).
// - 1 ket qua duy nhat: site 302 thang ve trang chi tiet — doc tra ve
//   la trang chi tiet (nhan biet bang meta og:novel:book_name), tra 1 muc.
// - Nhieu ket qua: div#alistbox, 50 muc/trang; next lay tu
//   .articlepage a.next (page sau GET thang URL do — CHUA kiem chung,
//   phan trang tim kiem chua thay mau that).
// - 0 ket qua: bao loi tieng Viet kem chan doan (title + 300 ky tu dau
//   body) de biet chinh xac buoc nao hong.
// LUU Y: POST /search.html TREO tu VM (khong tra loi trong 10-20s, 2 lan
// thu 2026-11-15) — co the site tarpit IP datacenter (tien le
// tangthuvien: VM treo, may that chay). Test tren may that se quyet
// dinh giu hay bo search.js (tien le readernovel/aztruyen).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm.");

    var url = "";
    var method = "GET";
    var body = null;
    if (page !== undefined && page !== null && String(page) !== "") {
        // Trang ke cua ket qua tim kiem: GET thang URL phan trang.
        url = absUrl(String(page));
    } else {
        url = BASE_URL + "/search.html";
        method = "POST";
        body = "searchkey=" + encodeURIComponent(k) + "&searchtype=all";
    }
    if (!url) return Response.error("Đường dẫn tìm kiếm không hợp lệ.");

    var res = null;
    try {
        res = pacedFetch(url, {
            method: method,
            body: body,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 15000
        });
    } catch (e) {
        return Response.error("Lỗi mạng khi tìm kiếm: " + e);
    }
    if (!res) return Response.error("Không tải được trang tìm kiếm.");
    if (res.error === "cooldown") {
        return Response.error(rateLimitErrorMessage("图书迷", pacedHostOf(url), res.cooldownRemainingMs));
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return Response.error(rateLimitErrorMessage("图书迷", pacedHostOf(url), res.cooldownRemainingMs));
        }
        return Response.error("Không tải được trang tìm kiếm (HTTP " + st + "). Lưu ý: từ máy ảo, POST /search.html treo không trả lời — có thể site chặn IP datacenter; thử lại trên điện thoại.");
    }
    var doc = null;
    try {
        doc = res.res.html();
    } catch (e2) {
        return Response.error("Không đọc được trang kết quả tìm kiếm.");
    }
    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");

    // 1 ket qua duy nhat: site 302 thang ve trang chi tiet.
    var bookName = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (bookName) {
        var link = doc.select('meta[property="og:novel:read_url"]').attr("content") || "";
        if (!link) link = doc.select('meta[property="og:url"]').attr("content") || "";
        if (!link) return Response.error("Không đọc được link truyện.");
        var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
        var cover = doc.select('meta[property="og:image"]').attr("content") || "";
        return Response.success([{
            name: bookName,
            cover: cover,
            link: link,
            description: author,
            host: siteOrigin()
        }], "");
    }

    var items = parseBookBoxes(doc);
    if (items.length === 0) {
        var finalTitle = "";
        try { finalTitle = String(doc.select("title").text() || ""); } catch (eT) {}
        var bodySample = "";
        try { bodySample = cleanText(doc.select("body").text() || "").substring(0, 300); } catch (eC) {}
        return Response.error("Không tìm thấy \"" + k + "\" [chẩn đoán: title=\"" + finalTitle + "\", body: " + bodySample + "]");
    }
    var next = "";
    var nextEl = safeFirst(doc.select(".articlepage a.next"));
    if (nextEl !== null) next = nextEl.attr("href") || "";
    return Response.success(items, next);
}
