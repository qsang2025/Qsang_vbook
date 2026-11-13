// config.js — Cau hinh cho extension Tang Thu Vien (tangthuvien.org).
//
// Site VN (truyen chu tien hiep, Next.js App Router), SSR day du cho
// danh sach + chi tiet + chuong, khong can dang nhap, khong Cloudflare
// challenge (kiem chung tu VM 2026-11-13: curl khong UA tra 200 day du,
// trang chu 469KB). Chi dung .org — tangthuvien.vn la DNS sinkhole
// (khong toi duoc) nen KHONG dua vao mirror.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

var BASE_URL = "https://tangthuvien.org";

// Domain co the doi trong cai dat nguon (tangthuvien.org mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song: tangthuvien.vn la DNS sinkhole (kiem chung
// 2026-11-13, 000 ca https lan http).
var MIRROR_LIST = [];
