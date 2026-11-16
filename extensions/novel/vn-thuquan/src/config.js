// config.js — cau hinh goc cua extension Viet Nam Thu Quan (vnthuquan.org).
//
// BASE_URL mac dinh la domain chinh; nguoi dung doi domain trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua bien
// DOMAIN duoc app inject, nam trong try/catch. MIRRORS (neu co trong
// plugin.json) override sau cung. Ca hai phep override deu nam trong
// try/catch: neu app khong inject bien do thi BASE_URL mac dinh van dung
// duoc. Luu y: DOMAIN / MIRRORS la bien do app inject — chi duoc THAM
// CHIEU trong try/catch, KHONG duoc khai bao var trung ten.
//
// DAC BIET (kiem chung live 2026-11-16, tu VM, UA mobile):
// - Site dung UTF-8 — giai ma mac dinh duoc.
// - Trang chi tiet /TacPham/<slug>-<id>/ (co hay khong co "/" cuoi deu
//   tra 200) — khong can khoi phuc "/" cuoi khi app cat no.
// - Trang chuong /TacPham/<slug>-<id>/chuong-<n> CO SAN noi dung day du
//   trong #vntqTextContent (ch.2 Tay Son 168 doan <p>, 19.928 ky tu;
//   ch.1 Loi Mo Dau 4 doan, 6.727 ky tu) — fetch tinh duoc, khong can
//   WebView.
// - Muc luc qua API chinh thuc /api/tacpham/get-mucluc?tuaId=<id>
//   &page=<p>&pageSize=100 -> {success, chapters:[{chuongId, title}]}
//   (Tay Son 71 chuong, Thuy Hu 70 chuong); khong co truong total nen
//   lap trang den khi 1 trang tra < 100 muc.
// - Tim kiem GET /Truyen/TimKiem/<tu-khoa>/Trang-<n> (tu khoa doi khoang
//   trang thanh "-", giu dau tieng Viet — site nhan ca dang co dau da
//   encode lan chu thuong); ket qua cung bo cuc card nhu trang danh sach.
// - Danh sach: /Truyen/moinhat/Trang-<n> (1.601 trang), /Truyen/luotxem/,
//   /Truyen/danhgia/, /Truyen/Theloai/<Ten>/Trang-<n> (the loai dung ten
//   hien thi co dau phay, vd. "Lich-su,-Da-su"), /Truyen/TacGiaTheoKhuVuc/
//   <VietNam|PhuongDong|PhuongTay>/Trang-<n>. Phan trang doc tu chu
//   "Trang N / M" tren trang.
// - Fetch dung UA mac dinh cua runtime (khong xoay UA — quy tac nha 6.10).
//
// LUU Y ve file lib: file nay duoc cac script khac nap bang lenh load,
// nen KHONG duoc nap them file nao khac o day. Script nao can helper thi
// tu nap file lib do o dau file cua chinh no.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://vnthuquan.org";

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

// Danh sach mirror mac dinh (khop voi config MIRRORS trong plugin.json).
// Site hien chi co 1 domain, khong co mirror biet truoc — de rong, nguoi
// dung tu them neu sau nay co.
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

// Chuan hoa URL ve vnthuquan.org:
// - //vnthuquan.org/... -> https://vnthuquan.org/...
// - www.vnthuquan.org -> vnthuquan.org.
// - Duong dan tuong doi (/TacPham/...) -> tuyet doi tren BASE_URL.
// - GIU NGUYEN query va fragment, giu "/" cuoi neu co (site chap ca hai
//   dang cho trang chi tiet, nhung trang chuong /chuong-<n> khong co "/").
function normalizeVntqUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    if (s.indexOf("//") === 0) s = "https:" + s;
    if (s.indexOf("http") !== 0) {
        if (s.charAt(0) !== "/") s = "/" + s;
        s = BASE_URL.replace(/\/+$/, "") + s;
    }
    s = s.replace(/^https?:\/\/www\.vnthuquan\.org/i, "https://vnthuquan.org");
    return s;
}

// Lay <id> so cua truyen tu URL dang /TacPham/<slug>-<id>/ (co hoac khong
// co "/" cuoi); tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/TacPham\/[^\/?#]+-(\d+)\/?(?:[?#]|$)/);
    return m ? m[1] : "";
}

// Lay phan <slug>-<id> tu URL truyen (dung de dung lai URL chuong); "" khi
// khong phai URL truyen.
function bookSlugId(url) {
    var m = String(url || "").match(/\/TacPham\/([^\/?#]+-\d+)\/?(?:[?#]|$)/);
    return m ? m[1] : "";
}

// Fetch 1 trang HTML (UTF-8) co pacing; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
// Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing).
function fetchVntqDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var r = null;
        try {
            r = pacedFetch(candidates[i], {});
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng).";
            continue;
        }
        if (!r) {
            lastError = "Không tải được trang.";
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("vnthuquan", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("vnthuquan", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + ").";
            } else {
                lastError = "Không tải được trang (lỗi mạng).";
            }
            continue;
        }
        var doc = null;
        try {
            doc = docFromResponse(r.res, candidates[i]);
        } catch (e2) {
            lastError = "Không đọc được trang.";
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được trang.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || "Không tải được trang." };
}

// Fetch 1 JSON tu API cua site (vi du get-mucluc); tra ve object da parse
// hoac null. Dung fetchJson cua lib (co kiem challenge truoc khi parse).
function fetchVntqJson(url) {
    var data = null;
    try {
        rateLimitDelay(pacedHostOf(url));
        data = fetchJson(url, {});
    } catch (e) {
        return null;
    }
    return data;
}
