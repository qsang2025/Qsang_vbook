// helper.js — Ham dung chung cua WTR-LAB (wtr-lab.com).
//
// Site Next.js: du lieu qua __NEXT_DATA__ (trang chi tiet / danh sach /
// xep hang) va API JSON: GET /api/chapters/<raw_id> (muc luc day du 1 lan
// goi), POST /api/reader/get (noi dung chuong — tra data.data.body hoac
// content_url co chu ky), POST /api/search {text} (tim kiem).
// QUIRK QUAN TRONG (kiem chung 2026-11-16): POST /api/reader/get va
// POST /api/search TREO tu VM (IP datacenter bi tarpit, 30-90s, HTTP 000)
// nhung chay tot tren may that (probe 2026-11-16 ~09:05: reader success +
// content_url, search 10 ket qua). Vi vay chap.js/search.js KHONG the
// kiem chung tu VM — chi kiem chung duoc tren may that.
// Phan trang danh sach la 0-based: ?page=0 la trang dau (kiem chung:
// ?page=11295 tra 7 muc cuoi voi count 112947).
// URL truyen dung raw_id (so trong /en/novel/<raw_id>/<slug>), KHONG phai
// id (serie_id) — 2 so nay khac nhau (vd. raw_id 115146, id 110488).
// File nay khong nap them file nao.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var GENRE_LIST = [
    { id: 1, slug: "action" },
    { id: 2, slug: "adult" },
    { id: 3, slug: "adventure" },
    { id: 4, slug: "comedy" },
    { id: 5, slug: "drama" },
    { id: 6, slug: "ecchi" },
    { id: 7, slug: "erciyuan" },
    { id: 8, slug: "fan-fiction" },
    { id: 9, slug: "fantasy" },
    { id: 10, slug: "game" },
    { id: 11, slug: "gender-bender" },
    { id: 12, slug: "harem" },
    { id: 13, slug: "historical" },
    { id: 14, slug: "horror" },
    { id: 15, slug: "josei" },
    { id: 16, slug: "martial-arts" },
    { id: 17, slug: "mature" },
    { id: 18, slug: "mecha" },
    { id: 19, slug: "military" },
    { id: 20, slug: "mystery" },
    { id: 21, slug: "psychological" },
    { id: 22, slug: "romance" },
    { id: 23, slug: "school-life" },
    { id: 24, slug: "sci-fi" },
    { id: 25, slug: "seinen" },
    { id: 26, slug: "shoujo" },
    { id: 27, slug: "shoujo-ai" },
    { id: 28, slug: "shounen" },
    { id: 29, slug: "shounen-ai" },
    { id: 30, slug: "slice-of-life" },
    { id: 31, slug: "smut" },
    { id: 32, slug: "sports" },
    { id: 33, slug: "supernatural" },
    { id: 34, slug: "tragedy" },
    { id: 35, slug: "urban-life" },
    { id: 36, slug: "wuxia" },
    { id: 37, slug: "xianxia" },
    { id: 38, slug: "xuanhuan" },
    { id: 39, slug: "yaoi" },
    { id: 40, slug: "yuri" }
];

var GENRE_SLUGS = {};
(function () {
    var i = 0;
    for (i = 0; i < GENRE_LIST.length; i++) {
        GENRE_SLUGS[GENRE_LIST[i].id] = GENRE_LIST[i].slug;
    }
})();

// The loai nguoi lon (trang chi tiet khong co co is_adult — nhan biet
// qua id the loai): adult, ecchi, mature, smut, yaoi, yuri.
var ADULT_GENRE_IDS = [2, 6, 17, 31, 39, 40];

var STATUS_TEXT = {
    0: "Đang ra",
    1: "Hoàn thành",
    2: "Tạm dừng",
    3: "Đã drop"
};

function genreSlug(id) {
    return GENRE_SLUGS[id] || "";
}

function isAdultGenres(ids) {
    var i = 0, j = 0;
    if (!ids) return false;
    for (i = 0; i < ids.length; i++) {
        for (j = 0; j < ADULT_GENRE_IDS.length; j++) {
            if (Number(ids[i]) === ADULT_GENRE_IDS[j]) return true;
        }
    }
    return false;
}

// Giai ma cac HTML entity co ban trong tieu de / mo ta API tra ve.
function htmlDecode(input) {
    var s = String(input === undefined || input === null ? "" : input);
    s = s.replace(/&apos;/g, "'");
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/&amp;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    return s;
}

// Escape text thuong thanh HTML an toan (dung khi ghep doan van chuong).
function escapeHtml(input) {
    var s = String(input === undefined || input === null ? "" : input);
    s = s.replace(/&/g, "&amp;");
    s = s.replace(/</g, "&lt;");
    s = s.replace(/>/g, "&gt;");
    s = s.replace(/"/g, "&quot;");
    s = s.replace(/'/g, "&#39;");
    return s;
}

// Tach __NEXT_DATA__ (JSON trong the script cua trang Next.js) thanh object.
// Tra null neu khong tim thay hoac parse loi.
function extractNextData(htmlText) {
    var m = null;
    try {
        m = String(htmlText || "").match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!m) return null;
        return JSON.parse(m[1]);
    } catch (e) {
        return null;
    }
}

// GET JSON qua pacedFetch (co pacing + retry 429/405/503 + cooldown).
// Tra {json} khi thanh cong, {error} (tieng Viet) khi that bai.
function fetchWtrJson(url, timeoutMs) {
    var r = pacedFetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        timeout: timeoutMs || 20000,
        maxRetries: 2
    });
    if (!r.ok) {
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs) };
        }
        if (r.status === 429 || r.status === 405) {
            return { error: rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs) };
        }
        if (r.status) return { error: "Không tải được dữ liệu (HTTP " + r.status + ")." };
        return { error: "Không kết nối được tới WTR-LAB, hãy kiểm tra mạng rồi thử lại." };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e) {
        return { error: "Không đọc được dữ liệu trả về." };
    }
    if (!text || text.charAt(0) === "<") {
        return { error: "Website trả về trang lỗi thay vì dữ liệu." };
    }
    try {
        return { json: JSON.parse(text) };
    } catch (e2) {
        return { error: "Dữ liệu trả về không phải JSON." };
    }
}

// POST JSON qua pacedFetch. Khong retry (maxRetries 0): POST cua site nay
// treo rat lau tu IP datacenter khi gap tarpit — retry chi nhan doi cho.
// Tra {json} khi thanh cong, {error} (tieng Viet) khi that bai.
function postWtrJson(url, obj, timeoutMs) {
    var r = pacedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(obj),
        timeout: timeoutMs || 30000,
        maxRetries: 0
    });
    if (!r.ok) {
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs) };
        }
        if (r.status === 429 || r.status === 405) {
            return { error: rateLimitErrorMessage("WTR-LAB", "wtr-lab.com", r.cooldownRemainingMs) };
        }
        if (r.status) return { error: "Không tải được dữ liệu (HTTP " + r.status + ")." };
        return { error: "Không kết nối được tới WTR-LAB, hãy kiểm tra mạng rồi thử lại." };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e) {
        return { error: "Không đọc được dữ liệu trả về." };
    }
    if (!text || text.charAt(0) === "<") {
        return { error: "Website trả về trang lỗi thay vì dữ liệu." };
    }
    try {
        return { json: JSON.parse(text) };
    } catch (e2) {
        return { error: "Dữ liệu trả về không phải JSON." };
    }
}

// Tach raw_id + slug tu URL trang chi tiet (/en/novel/<raw_id>/<slug>
// hoac /novel/<raw_id>/<slug> — link noi bo cua site dung dang khong /en/).
// Tra {rawId, slug} hoac null.
function parseDetailUrl(url) {
    var m = String(url === undefined || url === null ? "" : url).match(/\/(?:en\/)?novel\/(\d+)\/([^\/\?#]+)/);
    if (!m) return null;
    return { rawId: m[1], slug: m[2] };
}

// URL chuong theo dung dang cua site: /en/novel/<raw_id>/<slug>/chapter-<order>.
function chapterUrl(rawId, slug, order) {
    return BASE_URL + "/en/novel/" + rawId + "/" + slug + "/chapter-" + order;
}

// Tach raw_id + slug + so chuong tu URL chuong.
function parseChapterUrl(url) {
    var m = String(url === undefined || url === null ? "" : url).match(/\/(?:en\/)?novel\/(\d+)\/([^\/\?#]+)\/chapter-(\d+)/);
    if (!m) return null;
    return { rawId: m[1], slug: m[2], order: parseInt(m[3], 10) };
}

// Lay muc luc qua API: GET /api/chapters/<raw_id> — day du 1 lan goi.
// Tra {chapters} hoac {error}.
function fetchToc(rawId) {
    var r = fetchWtrJson(BASE_URL + "/api/chapters/" + rawId, 20000);
    if (r.error) return { error: r.error };
    var chs = (r.json && r.json.chapters) || null;
    if (!chs) return { error: "Không đọc được mục lục." };
    return { chapters: chs };
}

// Doi 1 ban ghi truyen (serie) cua API/__NEXT_DATA__ thanh item cua app.
// Link luon dung raw_id + slug (khong dung id/serie_id).
function parseSerieItem(s) {
    if (!s) return null;
    var rawId = s.raw_id || s.id;
    if (!rawId || !s.slug) return null;
    var d = s.data || {};
    var title = htmlDecode(d.title || "");
    if (!title && d.raw && d.raw.title) title = htmlDecode(d.raw.title);
    if (!title) return null;
    var desc = String(d.description || "").replace(/\s+/g, " ").trim();
    if (desc.length > 300) desc = desc.substring(0, 300) + "...";
    var tag = "";
    var st = STATUS_TEXT[s.status];
    if (st) tag = st;
    if (s.chapter_count !== undefined && s.chapter_count !== null) {
        tag = tag ? tag + " • " + s.chapter_count + " chương" : s.chapter_count + " chương";
    }
    return {
        name: title,
        cover: d.image || "",
        link: BASE_URL + "/en/novel/" + rawId + "/" + s.slug,
        description: desc,
        tag: tag
    };
}

// Doi body chuong (chuoi hoac mang doan van) thanh HTML hien trong reader.
// Mang doan van: escape tung doan roi boc <p>. Chuoi: neu co the HTML thi
// lam sach, neu khong thi tach doan theo dong trong roi boc <p>.
function bodyToHtml(body) {
    var i = 0;
    var html = "";
    if (body instanceof Array) {
        for (i = 0; i < body.length; i++) {
            var p = String(body[i] === undefined || body[i] === null ? "" : body[i]).trim();
            if (!p) continue;
            html += "<p>" + escapeHtml(p).replace(/\n/g, "<br>") + "</p>";
        }
        return html;
    }
    var s = String(body === undefined || body === null ? "" : body);
    if (!s) return "";
    if (s.indexOf("<p") !== -1 || s.indexOf("<br") !== -1 || s.indexOf("<div") !== -1) {
        return cleanHtml(s);
    }
    var parts = s.split(/\n\s*\n/);
    for (i = 0; i < parts.length; i++) {
        var q = parts[i].trim();
        if (!q) continue;
        html += "<p>" + escapeHtml(q).replace(/\n/g, "<br>") + "</p>";
    }
    return html;
}
