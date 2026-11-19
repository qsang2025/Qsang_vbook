// config.js — Cau hinh cho extension TruyenTV (tvtruyen1.com).
//
// Site VN (truyen chu, cap nhat lien tuc), SSR day du, khong can dang
// nhap, khong Cloudflare challenge (kiem chung tu VM 2026-11-13: curl
// khong UA cung tra 200 day du, 395KB). Site hay doi domain: tu
// 2026-11-19 www.tvtruyen.space 301 ve https://www.tvtruyen1.com (kiem
// chung tu VM: trang chu + chuong mau deu 200 tren domain moi); truoc do
// tvtruyen.cc va tvtruyen.vip 301 ve .space (kiem chung 2026-11-13);
// tvtruyen.com 403; tvtruyen.net/.org/.xyz/.me chet (000). Mac dinh dung
// www.tvtruyen1.com.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://www.tvtruyen1.com";

// Domain co the doi trong cai dat nguon (www.tvtruyen1.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: www.tvtruyen.space 301 ve www.tvtruyen1.com (kiem chung
// 2026-11-19); www.tvtruyen.cc va www.tvtruyen.vip truoc do 301 ve
// .space (kiem chung 2026-11-13) — fetch() se theo redirect.
var MIRROR_LIST = [
    "https://www.tvtruyen.space",
    "https://www.tvtruyen.cc",
    "https://www.tvtruyen.vip"
];
