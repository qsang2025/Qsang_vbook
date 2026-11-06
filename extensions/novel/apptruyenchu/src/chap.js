// chap.js — doc noi dung mot chuong cua App Truyen Chu.
// Noi dung chuong nam trong <article> ben trong <main> (khao sat 2026-11-06):
//   <article> CHUONG N | <h1>Ten chuong</h1> | link ten truyen | dong meta
//   "· HH:MM DD/MM/YYYY" | cac doan <p> | link "Chuong sau"
// Trang chuong co trong HTML tai lan dau (SSR) nen doc truc tiep duoc.
// Cach lay: uu tien <article>, du phong cac selector chung, giu ket qua
// dai nhat. Loc bo dong nhan "CHUONG N", dong ngay gio, nut dieu huong.
// Tieu de tra ve (data2) dang "Chuong N: Ten chuong" de app hien dung ten
// chuong thay cho ten trong muc luc.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js vao src/.
// Thu tu load quan trong: config.js truoc (dinh nghia BASE_URL), roi cac
// file lib (khong file lib nao duoc load them file khac).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('cleanHtml.js');

var CHAP_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
};

// Selector noi dung chuong, thu theo thu tu; cach du phong chon ket qua
// dai nhat trong cac selector nay. "article" la dung that cua site nay.
var CHAP_SELECTORS = [
    "article",
    "main article",
    ".chapter-content",
    "#chapter-content",
    "#content",
    "main"
];

// Tai trang chuong, retry toi da 3 lan. Loi 429 doi theo Retry-After
// (toi da 30 giay) roi thu lai; loi khac backoff 500ms, 1000ms.
function getPage(url) {
    var i = 0;
    for (i = 0; i < 3; i++) {
        try {
            var headers = {};
            var k = "";
            for (k in CHAP_HEADERS) headers[k] = CHAP_HEADERS[k];
            headers["Referer"] = BASE_URL + "/";
            var res = fetch(url, { headers: headers });
            if (res && res.ok) return res;
            var status = res ? res.status : 0;
            Console.log("chap HTTP " + status + " lan " + (i + 1) + ": " + url);
            if (status === 429) {
                var wait = 1000 * (i + 1);
                try {
                    var ra = res.headers["Retry-After"] || res.headers["retry-after"];
                    var sec = parseInt(String(ra), 10);
                    if (!isNaN(sec) && sec > 0) wait = sec * 1000;
                } catch (e2) {
                }
                if (wait > 30000) wait = 30000;
                try { sleep(wait); } catch (e3) {}
                continue;
            }
        } catch (e) {
            Console.log("chap fetch loi lan " + (i + 1) + ": " + e);
        }
        try { sleep(500 * (i + 1)); } catch (e4) {}
    }
    return null;
}

// Dong rac can loai khoi noi dung chuong cua site nay.
function isJunk(line) {
    if (/^CHƯƠNG\s+\d+$/i.test(line)) return true;
    if (/^Chương trước$/i.test(line)) return true;
    if (/^Chương sau$/i.test(line)) return true;
    if (/^·\s*\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}/.test(line)) return true;
    if (/^\d{2}:\d{2}\s+\d{2}\/\d{2}\/\d{4}$/.test(line)) return true;
    if (/apptruyenchu\.pro/i.test(line) && line.length < 80) return true;
    if (/^Bạn đang đọc truyện trên/i.test(line)) return true;
    if (/^Báo lỗi chương$/i.test(line)) return true;
    if (/^Quảng cáo$/i.test(line)) return true;
    if (/^Aa$/.test(line)) return true;
    if (/^\d+\s+\/\s+[\d\.]+$/.test(line)) return true;
    return false;
}

function cleanLine(line) {
    var i = 0;
    for (i = 0; i < 3; i++) {
        line = line.replace(/&(?:amp;)*#?[a-z0-9]+;/gi, " ");
    }
    return line.replace(/^[\s\u3000\u2000-\u200B\uFEFF]+|[\s\u3000\u2000-\u200B\uFEFF]+$/g, "");
}

// Cat HTML tho thanh cac dong sach (bo script/style/comment/a, <br> -> xuong dong).
function toLines(fragment) {
    var s = String(fragment)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<a[\s>][\s\S]*?<\/a>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, "");
    var out = [];
    var parts = s.split(/\r?\n/);
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var line = cleanLine(parts[i]);
        if (!line || isJunk(line)) continue;
        out.push(line);
    }
    return out;
}

// Thu cac selector, giu lai ket qua dai nhat.
function fromSelectors(raw) {
    var doc = Html.parse(raw);
    var best = [];
    var i = 0;
    for (i = 0; i < CHAP_SELECTORS.length; i++) {
        try {
            var els = doc.select(CHAP_SELECTORS[i]);
            if (els.isEmpty()) continue;
            var lines = toLines(String(els.first().html()));
            if (lines.length > best.length) best = lines;
        } catch (e) {
            Console.log("selector " + CHAP_SELECTORS[i] + " loi: " + e);
        }
    }
    return best;
}

// Ten chuong trong <h1> cua article (vd "Tiem Nho").
function chapterTitle(raw) {
    var title = "";
    var re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
    var m = null;
    while ((m = re.exec(raw)) !== null) {
        var t = m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        if (t) title = t;
    }
    return title;
}

function execute(url) {
    url = normalizeUrl(url);
    var response = getPage(url);
    if (!response) {
        // Thu mirror truoc khi bao loi (fetchWithFallback dung MIRROR_LIST
        // trong config.js; chi chay khi fetch thuong that bai het).
        var fb = fetchWithFallback(url, MIRROR_LIST);
        if (fb && !fb.browser) {
            response = fb;
        } else if (fb && fb.browser) {
            var doc = fb.doc;
            var html = "";
            try { html = String(doc.html()); } catch (e) { html = ""; }
            if (html) {
                var bLines = fromSelectors(html);
                if (bLines.length > 0) {
                    return Response.success(cleanHtml(bLines.join("<br>")), chapterTitle(html));
                }
            }
            return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);
        }
    }
    if (!response) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

    var raw = String(response.text());

    // Trang loi Next.js (vd URL chuong thieu slug ten) tra ve "Application
    // error" thay vi noi dung chuong.
    if (/Application error/i.test(raw) && !/<article/i.test(raw)) {
        return Response.error("Site báo lỗi ứng dụng ở chương này (có thể URL chương thiếu phần tên, hãy mở từ mục lục): " + url);
    }

    var lines = [];
    try { lines = fromSelectors(raw); } catch (e) { Console.log("fromSelectors loi: " + e); }

    var title = "";
    try { title = chapterTitle(raw); } catch (e) {}
    if (lines.length > 0 && title && lines[0] === title) lines.shift();

    if (lines.length === 0) {
        return Response.error("Không đọc được nội dung chương (html " + raw.length + " ký tự): " + url);
    }

    var n = chapterNumber(url);
    var fullTitle = title ? (n > 0 ? "Chương " + n + ": " + title : title) : "";
    Console.log("chap dong: " + lines.length + " | tieu de: " + fullTitle);

    return Response.success(cleanHtml(lines.join("<br>")), fullTitle);
}
