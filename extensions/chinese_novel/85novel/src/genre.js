// genre.js — Danh sach the loai tinh (khong fetch).
//
// 24 id the loai + 3 loc trang thai, doi chieu du voi link /list/<id>/
// tren HTML that cua site (khao sat 2026-11-14). Khong fetch trang live
// de lay them the loai — tiet kiem request (site yeu cau pacing 30s).
// Loc theo config CONFIG_GENRE (full/nam/nu/XB, mac dinh full):
//   nam = chi the loai Nam + muc xep hang; nu = chi the loai Nu;
//   XB = cac muc con lai (van hoc + trang thai).
// Load: file config.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");

var STATIC_GENRES = [
    { title: "男生小說 - 玄幻奇幻", input: "/list/667/" },
    { title: "男生小說 - 仙俠武俠", input: "/list/668/" },
    { title: "男生小說 - 都市生活", input: "/list/669/" },
    { title: "男生小說 - 歷史軍事", input: "/list/670/" },
    { title: "男生小說 - 遊戲競技", input: "/list/671/" },
    { title: "男生小說 - 科幻未來", input: "/list/672/" },
    { title: "男生小說 - 懸疑靈異", input: "/list/728/" },
    { title: "男生小說 - 次元宅萌", input: "/list/734/" },
    { title: "男生小說 - 諸天無限", input: "/list/735/" },
    { title: "男生小說 - 其他小說", input: "/list/738/" },
    { title: "女生小說 - 古代言情", input: "/list/673/" },
    { title: "女生小說 - 現代言情", input: "/list/674/" },
    { title: "女生小說 - 浪漫青春", input: "/list/733/" },
    { title: "女生小說 - 玄幻仙俠", input: "/list/675/" },
    { title: "女生小說 - 科幻遊戲", input: "/list/736/" },
    { title: "女生小說 - 靈異懸疑", input: "/list/737/" },
    { title: "女生小說 - 其他小說", input: "/list/739/" },
    { title: "文學刊物 - 文學藝術", input: "/list/741/" },
    { title: "文學刊物 - 人文社科", input: "/list/742/" },
    { title: "文學刊物 - 經管勵志", input: "/list/743/" },
    { title: "文學刊物 - 經典文學", input: "/list/744/" },
    { title: "文學刊物 - 出版小說", input: "/list/745/" },
    { title: "文學刊物 - 少兒教育", input: "/list/746/" },
    { title: "文學刊物 - 其他小說", input: "/list/749/" },
    { title: "完結狀態 - 全部", input: "/list/index" },
    { title: "完結狀態 - 連載中", input: "/list/finish1/" },
    { title: "完結狀態 - 已完結", input: "/list/finish2/" }
];

function execute() {
    var channel = getGenreFilter();
    var out = [];
    var i = 0;
    for (i = 0; i < STATIC_GENRES.length; i++) {
        var item = STATIC_GENRES[i];
        if (channel === "nam" && !isMaleGenre(item.title)) continue;
        if (channel === "nu" && !isFemaleGenre(item.title)) continue;
        if (channel === "XB" && (isMaleGenre(item.title) || isFemaleGenre(item.title))) continue;
        var title = item.title;
        if (channel === "nam" || channel === "nu") {
            title = title.replace(/^男生小說\s*-\s*/, "").replace(/^女生小說\s*-\s*/, "");
        }
        out.push({ title: title, input: item.input, script: "gen.js" });
    }
    return Response.success(out);
}

function isMaleGenre(title) {
    return /^男生小說(?:\s*-|$)/.test(title || "");
}

function isFemaleGenre(title) {
    return /^女生小說(?:\s*-|$)/.test(title || "");
}

// Doc config CONFIG_GENRE do app inject (chuoi); mac dinh "full".
function getGenreFilter() {
    var value = "";
    try {
        if (typeof CONFIG_GENRE !== "undefined" && CONFIG_GENRE) {
            value = normalizeGenreFilter(CONFIG_GENRE);
        }
    } catch (e) {
    }
    if (value) return value;
    return "full";
}

function normalizeGenreFilter(value) {
    if (value === null || typeof value === "undefined") return "";
    var key = String(value).replace(/^\s+|\s+$/g, "").toLowerCase();
    if (key === "full") return "full";
    if (key === "nam") return "nam";
    if (key === "nu" || key === "nữ") return "nu";
    if (key === "xb") return "XB";
    return "";
}
