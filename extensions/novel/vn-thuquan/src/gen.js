// gen.js — Danh sach truyen 1 trang (execute(url, page) -> items, next).
//
// Cac dang URL (kiem chung live 2026-11-16):
// - /Truyen/moinhat/Trang-<n> (1.601 trang), /Truyen/luotxem/Trang-<n>,
//   /Truyen/danhgia/Trang-<n>, /Truyen/TacGiaTheoKhuVuc/<vung>/Trang-<n>
//   — trang 1 co the go "/Trang-1" hoac khong.
// - /Truyen/Theloai/<Ten>/Trang-<n> (vd. "Lich-su,-Da-su", 18 trang) —
//   trang 1 khong co "/Trang-1" cung dung.
// - /Truyen/TacGia/<slug>-<id> (trang tac gia, cung bo cuc card).
// page la so trang ke do lan goi truoc tra ve (data2); "" thi dung url.
// Phan trang: bo /Trang-<cu> o cuoi URL roi noi /Trang-<n> (trang 1 tra
// URL goc). So trang ke doc tu chu "Trang N / M" tren trang.
// App cat "/" cuoi cua URL doi so — site chap ca hai dang cho trang chi
// tiet, con URL danh sach khong phu thuoc "/" cuoi.
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

function execute(url, page) {
    var base = String(url || "");
    if (!base) base = BASE_URL + "/Truyen/moinhat/Trang-1";
    base = normalizeVntqUrl(base);
    if (!base) return Response.error("Đường dẫn danh sách không hợp lệ.");

    var pn = 1;
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    if (pRaw !== "") {
        var n = parseInt(pRaw, 10);
        if (!isNaN(n) && n > 1) pn = n;
    }
    var target = listPageUrl(base, pn);

    var r = fetchVntqDoc(target);
    if (r.error) return Response.error(r.error);
    var items = parseListItems(r.doc);
    if (items.length === 0) return Response.error("Không có truyện nào ở trang này.");
    var next = nextPageToken(r.doc);
    return Response.success(items, next);
}
