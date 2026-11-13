// config.js — Cau hinh cho extension Truyen Mo (truyenmo.one).
//
// Site VN (truyen chu + Zhihu), SSR day du, khong can dang nhap, khong
// Cloudflare challenge (kiem chung tu VM 2026-11-13: curl khong UA cung
// tra 200 day du). Site da chuyen domain: truyenmo.xyz 301 ve truyenmo.one
// (ca www va bare) — mac dinh dung truyenmo.one.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://truyenmo.one";

// Domain co the doi trong cai dat nguon (truyenmo.one mac dinh;
// truyenmo.xyz chi 301 ve .one nen khong nen dat lam chinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Mirror: ca 2 bien the .xyz deu 301 ve truyenmo.one (kiem chung
// 2026-11-13), nen chi la du phong — fetch() se theo redirect.
var MIRROR_LIST = [
    "https://www.truyenmo.xyz",
    "https://truyenmo.xyz"
];
