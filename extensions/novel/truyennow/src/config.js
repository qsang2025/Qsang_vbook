// config.js — Cau hinh cho extension TruyenNow (longthieu.com).
//
// Site VN, truyen chu sang tac goc cua Long Thieu, SSR day du cho danh
// sach + chi tiet, API JSON cho muc luc, chuong ma hoa base64+URL-encode
// trong trang /doc/ (khong khoa — giai ma o helper.js). Khong can dang
// nhap, khong Cloudflare challenge, khong chuong VIP (kiem chung tu VM
// 2026-11-14: trang chu + danh sach + chi tiet + API chuong deu 200).
//
// DOMAIN: longthieu.com la domain hien tai (truyen.now 301 ve day, kiem
// chung 2026-11-14 ~00:24); truyen.now giu trong select lam mirror du
// phong (MIRROR_LIST), khong phai domain chinh.
//
// UA DESKTOP: trang /doc/ chan UA bot — curl khong UA tra 403 "Access
// denied", UA desktop Chrome tra 200 (kiem chung 2026-11-14). Trang
// danh sach / chi tiet / API thi tra 200 ca khi khong co UA, nhung de
// dong nhat va tranh 403 giua chung, toan bo request tren host nay dung
// UA desktop Chrome co dinh (ngoai le co bang chung cho quy tac 10,
// nhu Tadu). Khong co Cloudflare challenge tren site nen khong vuong
// chuyen cookie cf_clearance gan UA.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://longthieu.com";

// Domain co the doi trong cai dat nguon (longthieu.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror du phong: truyen.now 301 ve longthieu.com (kiem chung 00:24
// 14/11/2026) — van giu lam fallback khi domain chinh chet.
var MIRROR_LIST = [
    "https://truyen.now"
];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = String(MIRRORS).split(",");
        var cleaned = [];
        for (var i = 0; i < injected.length; i++) {
            var m = injected[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (m && m !== BASE_URL) cleaned.push(m);
        }
        if (cleaned.length > 0) MIRROR_LIST = cleaned;
    }
} catch (e) {
}

// UA desktop Chrome co dinh cho host nay (ly do o header file).
var DESKTOP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
