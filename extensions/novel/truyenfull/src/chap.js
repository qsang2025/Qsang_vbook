// chap.js — doc noi dung mot chuong cua Truyen Full.
// Noi dung chuong nam trong #chapter-c, SSR day du trong HTML (khao sat
// 2026-11-06, chuong mau Cực Đạo Thiên Ma chuong 1: 126 dong sach):
//   <div id="chapter-c">
//     <div id="ads-chapter-top"></div>   (quang cao, rong trong SSR)
//     <p>...</p> ...                     (noi dung chuong)
//     <p class="tv6-read-at">Đọc truyện full tại <a>...</a></p>
//   </div><hr class="chapter-end">
//   <div class="chapter-nav">...</div>  (nam NGOAI #chapter-c)
// Tieu de chuong trong <h1> ("Chương 1: Đạo pháp vô tình").
// Cach lay: #chapter-c la duong chinh (da kiem chung live 2026-11-09:
// khoi duy nhat chua noi dung chuong, ~16k ky tu; cac selector khac
// khong co tren trang chuong that). Cac selector du phong chi chay khi
// #chapter-c trong, va chi nhan khoi co text dai that (> 200 ky tu) de
// tranh gom nham nav/binh luan/quang cao khi site doi theme.
// Loc dong rac (dong quang cao "Đọc truyện full tại", nav
// "Chương trước/sau").
// KHONG xoay User-Agent (quy tac 10): dung header mac dinh cua
// fetch-helpers.js (Accept/Accept-Language/Referer, khong set UA).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js vao src/.
// Thu tu load quan trong: config.js truoc (dinh nghia BASE_URL), roi cac
// file lib (khong file lib nao duoc load them file khac).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');

// Selector noi dung chuong. "#chapter-c" la duong chinh cua site nay;
// cac selector du phong chi dung khi duong chinh trong.
var CHAP_FALLBACK_SELECTORS = [
    ".chapter-c",
    "#chapter-content",
    ".chapter-content",
    "#content",
    "article",
    "main"
];

// Tai trang chuong, retry toi da 3 lan. Loi 429 doi theo Retry-After
// (toi da 30 giay) roi thu lai; loi khac backoff 500ms, 1000ms.
function getPage(url) {
    var i = 0;
    for (i = 0; i < 3; i++) {
        try {
            var res = fetch(url, { headers: defaultHeaders(BASE_URL + "/") });
            if (res && res.ok) return res;
            var status = res ? res.status : 0;
            console.log("chap HTTP " + status + " lan " + (i + 1) + ": " + url);
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
            console.log("chap fetch loi lan " + (i + 1) + ": " + e);
        }
        try { sleep(500 * (i + 1)); } catch (e4) {}
    }
    return null;
}

// Dong rac can loai khoi noi dung chuong cua site nay.
function isJunk(line) {
    if (/^Đọc truyện full tại/i.test(line)) return true;
    if (/truyenfull\.link/i.test(line) && line.length < 80) return true;
    if (/^Chương trước$/i.test(line)) return true;
    if (/^Chương sau$/i.test(line)) return true;
    if (/^Bạn đang đọc truyện trên/i.test(line)) return true;
    if (/^Báo lỗi chương$/i.test(line)) return true;
    if (/^Quảng cáo$/i.test(line)) return true;
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

// Lay cac dong sach trong khoi dau tien khop selector (tra [] neu khong co).
function linesFromSelector(doc, selector) {
    try {
        var els = doc.select(selector);
        if (els.isEmpty()) return [];
        return toLines(String(els.first().html()));
    } catch (e) {
        console.log("selector " + selector + " loi: " + e);
        return [];
    }
}

// Lay noi dung chuong: #chapter-c truoc; neu trong moi thu cac selector
// du phong theo thu tu, chi nhan khoi co text dai that (> 200 ky tu).
function fromSelectors(raw) {
    var doc = Html.parse(raw);
    var lines = linesFromSelector(doc, "#chapter-c");
    if (lines.length > 0) return lines;
    var i = 0;
    for (i = 0; i < CHAP_FALLBACK_SELECTORS.length; i++) {
        var fb = linesFromSelector(doc, CHAP_FALLBACK_SELECTORS[i]);
        if (fb.length > 0 && fb.join("").length > 200) return fb;
    }
    return [];
}

// Ten chuong trong <h1> (vd "Chương 1: Đạo pháp vô tình").
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

    var lines = [];
    try { lines = fromSelectors(raw); } catch (e) { console.log("fromSelectors loi: " + e); }

    var title = "";
    try { title = chapterTitle(raw); } catch (e) {}
    if (lines.length > 0 && title && lines[0] === title) lines.shift();

    if (lines.length === 0) {
        return Response.error("Không đọc được nội dung chương (html " + raw.length + " ký tự): " + url);
    }
    console.log("chap dong: " + lines.length + " | tieu de: " + title);

    return Response.success(cleanHtml(lines.join("<br>")), title);
}
