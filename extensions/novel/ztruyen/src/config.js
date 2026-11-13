// config.js — Cau hinh cho extension ZTruyen (ztruyen.vn).
//
// Site VN (truyen chu, WordPress + theme truyenbiz.net), SSR day du cho
// danh sach + chi tiet + chuong, khong can dang nhap, khong Cloudflare
// challenge (kiem chung tu VM 2026-11-13: curl khong UA tra 200 day du,
// trang chu 218KB). Chi dung ztruyen.vn — khong co mirror nao duoc
// kiem chung song.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://ztruyen.vn";

// Domain co the doi trong cai dat nguon (ztruyen.vn mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung (www.ztruyen.vn chua xac
// minh, khong dua vao).
var MIRROR_LIST = [];
