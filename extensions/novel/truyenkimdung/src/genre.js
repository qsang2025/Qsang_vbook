// genre.js — Danh sach "the loai" Truyen Kim Dung (truyenkimdung.net).
//
// Site chi co 1 the loai vo hiep Kim Dung, phan loai duy nhat la PHIEN
// BAN (form loc tren trang chu, kiem chung live 2026-11-19): Ban cu,
// Truyen ngan, Tan tu. Tra ve cac phien ban nay lam danh sach the loai,
// moi muc tro ve gen.js voi duong dan loc tuong ung (gia tri version la
// tieng Viet co dau, encodeURIComponent khi dung URL).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var versions = ["Bản cũ", "Truyện ngắn", "Tân tu"];
    var out = [];
    var i = 0;
    for (i = 0; i < versions.length; i++) {
        out.push({
            title: versions[i],
            input: "/?version=" + encodeURIComponent(versions[i]) + "&pageSize=20",
            script: "gen.js"
        });
    }
    return Response.success(out);
}
