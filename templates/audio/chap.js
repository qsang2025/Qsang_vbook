// chap.js (audio: buoc 1 cua chap -> track) — giai URL mot track thanh
// handle nguon, app se chuyen sang track.js (template audio).
// Y tuong: template audio cua Darkrai9x.
// KHAC video: trinh phat audio KHONG hien bo chon server, no chi lay muc
// DAU TIEN. Dat nguon tot nhat len dau; cac muc sau bi bo qua.
// Khong bao gio tra ve mot URL tran lam toan bo du lieu Response (app se
// parse lai thanh JSON va hong): du chi 1 nguon cung phai boc thanh
// [{ title: "Mặc định", data: url }].
// SELECTOR_SOURCE_NODES / SELECTOR_SOURCE_DATA_ATTR: doi theo site that.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được trang track audio: " + url);

    var sources = [];
    doc.select("SELECTOR_SOURCE_NODES").forEach(function (el) {
        var data = el.attr("SELECTOR_SOURCE_DATA_ATTR");
        if (!data) return;
        sources.push({ title: cleanText(el.text()) || "Mặc định", data: data });
    });

    if (sources.length === 0) {
        // Khong co node nguon ro rang — dua URL trang cho track.js giai tiep.
        sources.push({ title: "Mặc định", data: url });
    }

    return Response.success(sources);
}
