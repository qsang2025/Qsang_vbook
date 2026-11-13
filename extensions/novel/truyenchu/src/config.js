// config.js — Cau hinh cho extension TruyenChu (truyenchu.net).
//
// Site VN (truyen chu, WordPress + theme Madara WP-Manga), SSR day du cho
// danh sach + chi tiet + chuong, khong can dang nhap, khong Cloudflare
// challenge (kiem chung tu VM 2026-11-13: curl tra 200, trang chu ~147KB).
// Chi dung truyenchu.net — truyenchu.vn la DNS sinkhole, KHONG dua vao
// mirror. Khong co mirror nao khac duoc kiem chung song.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://truyenchu.net";

// Domain co the doi trong cai dat nguon (truyenchu.net mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung (truyenchu.vn la DNS sinkhole,
// www.truyenchu.net chua xac minh, khong dua vao).
var MIRROR_LIST = [];
