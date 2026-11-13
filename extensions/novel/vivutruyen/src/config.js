// config.js — Cau hinh cho extension VivuTruyen (vivutruyen.net).
//
// Site VN (truyen chu, WordPress, SSR day du cho danh sach + chi tiet +
// chuong, khong can dang nhap, khong Cloudflare challenge — kiem chung
// tu VM 2026-11-14: trang chu HTTP 200, ~85KB; chi tiet + chuong 200).
// Khong co mirror nao duoc kiem chung song.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://vivutruyen.net";

// Domain co the doi trong cai dat nguon (vivutruyen.net mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung.
var MIRROR_LIST = [];
