// config.js — cau hinh goc cua extension WTR-LAB (wtr-lab.com).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. Site khong co mirror nao
// biet duoc nen danh sach mac dinh rong.
//
// DAC BIET (khao sat VM 2026-11-16, xem WTRLAB-PROGRESS.md):
// - Site Next.js pages-router, truyen dich tieng Anh. Du lieu qua API JSON:
//   GET /api/chapters/<raw_id> (muc luc day du 1 lan goi), POST
//   /api/reader/get {translate, language, raw_id, chapter_no, chapter_id}
//   (noi dung chuong — tra data.data.body hoac content_url co chu ky
//   /api/v2/reader/content/... can GET them), POST /api/search {text}.
// - POST /api/reader/get + POST /api/search TREO tu VM (timeout 30-90s,
//   ca ai/web, ca co cookie; GET thi nhanh) — kha nang tarpit IP
//   datacenter (tien le sjks88/trxs). Probe tren may that se quyet dinh
//   POST co chay khong (xem WTRLAB-PROBE-README.md).
// - Chi tiet truyen doc tu __NEXT_DATA__ cua trang chi tiet (GET binh
//   thuong): title, author, description, image (img.wtr-lab.com),
//   chapter_count, genres (id so), is_adult.
// - Genre id -> slug (tu JS cua site): 1:action, 2:adult, 3:adventure,
//   4:comedy, 5:drama, 6:ecchi, 7:erciyuan, 8:fan-fiction, 9:fantasy,
//   10:game, 11:gender-bender, 12:harem, 13:historical, 14:horror,
//   15:josei, 16:martial-arts, 17:mature, 18:mecha, 19:military,
//   20:mystery, 21:psychological, 22:romance, 23:school-life, 24:sci-fi,
//   25:seinen, 26:shoujo, 27:shoujo-ai, 28:shounen, 29:shounen-ai,
//   30:slice-of-life, 31:smut, 32:sports, 33:supernatural, 34:tragedy,
//   35:urban-life, 36:wuxia, 37:xianxia, 38:xuanhuan, 39:yaoi, 40:yuri.
//   Loc the loai: GET /en/novel-list?genre=<id> (slug khong co tac dung).
// - Trang chuong tinh KHONG co text (nap client-side) — chap.js doc qua
//   API, hoac WebView neu API khong chay (xem probe).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day. Script nao can helper thi tu load()
// file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://wtr-lab.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Tach chuoi mirror cach nhau bang dau phay (hoac mang co san) thanh mang
// cac base URL sach (bo khoang trang va dau "/" cuoi).
function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = parts[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = String(value[i]).replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

// Danh sach mirror mac dinh (site khong co mirror nao biet duoc).
var MIRROR_LIST = [];

try {
    if (typeof MIRRORS !== "undefined" && MIRRORS) {
        var injected = parseMirrorList(MIRRORS);
        if (injected.length > 0) MIRROR_LIST = injected;
    }
} catch (e) {
}

// BASE_URL khong bao gio nam trong danh sach mirror (tranh thu lap chinh no).
(function () {
    var kept = [];
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        if (MIRROR_LIST[k] !== BASE_URL) kept.push(MIRROR_LIST[k]);
    }
    MIRROR_LIST = kept;
})();

// Chuan hoa URL ve BASE_URL: bo host cu, them "/" cuoi cho /en/novel/<id>
// (trang chi tiet khong "/" se 301), giu nguyen query.
function normalizeWtrUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    s = s.replace(/^https?:\/\/(www\.)?wtr-lab\.com/i, BASE_URL);
    return s;
}
