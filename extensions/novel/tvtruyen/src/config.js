// config.js — Cau hinh cho extension TruyenTV (tvtruyen.space).
//
// Site VN (truyen chu, cap nhat lien tuc), SSR day du, khong can dang
// nhap, khong Cloudflare challenge (kiem chung tu VM 2026-11-13: curl
// khong UA cung tra 200 day du, 395KB). Site hay doi domain: tvtruyen.cc
// 301 ve https://www.tvtruyen.space (kiem chung 2026-11-13); tvtruyen.vip
// cung 301 ve .space; tvtruyen.com 403; tvtruyen.net/.org/.xyz/.me chet
// (000). Mac dinh dung www.tvtruyen.space.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://www.tvtruyen.space";

// Domain co the doi trong cai dat nguon (www.tvtruyen.space mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: www.tvtruyen.cc va www.tvtruyen.vip deu 301 ve .space (kiem
// chung 2026-11-13) — fetch() se theo redirect.
var MIRROR_LIST = [
    "https://www.tvtruyen.cc",
    "https://www.tvtruyen.vip"
];
