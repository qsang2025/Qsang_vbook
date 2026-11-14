// config.js — Cau hinh cho extension LilyHub (lilyhub.top).
//
// Site VN truyen bach hop / GL / ABO, React SPA, du lieu qua API PostgREST
// cua Supabase (khoa publishable cong khai — web frontend cua site tu gui
// cho moi khach, nam trong JS bundle /assets/main-*.js).
//
// API host: thu db.lilyhub.top truoc (proxy chinh thuc cua site, client web
// dung no dau tien), roi moi fallback sang supabase.co truc tiep — dung thu
// tu nhu client web cua site.
// Luu y: tu VM (IP datacenter) ca 2 host deu treo o buoc TLS (0 byte,
// timeout) — kiem chung tren may that moi ket luan duoc API co doc duoc khong.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file fetch-helpers.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.lilyhub.top";

// Domain co the doi trong cai dat nguon (www.lilyhub.top mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// API hosts theo thu tu uu tien (giong client web cua site).
var LILY_API_HOSTS = [
    "https://db.lilyhub.top/rest/v1/",
    "https://vnchwolfbckhhherrzjk.supabase.co/rest/v1/"
];

var LILY_MEDIA = "https://media.lilyhub.top/";

// Khoa publishable (anon) cua Supabase — khoa CONG KHAI, web frontend cua
// site tu gui cho moi khach (nam trong JS bundle tai /assets/main-*.js),
// chi doc duoc bang novels/chapters da publish. Khong phai token nguoi
// dung, khong phai secret.
var LILY_KEY = "sb_publishable_fBI0JdeuAHrlZGg_2wA_oA_-oHzhiKk";

var LILY_PAGE_SIZE = 20;

function lilyHeaders() {
    return {
        "apikey": LILY_KEY,
        "Authorization": "Bearer " + LILY_KEY,
        "Content-Type": "application/json"
    };
}

// Goi API PostgREST, co fallback host + pacing (xem file rate-limit.js).
// Tra ve mang JSON da parse, hoac null khi loi.
// Thu lan luot cac API host; moi host pacedFetch toi da 1 retry cho
// 429/405/503. Gap 401/403/404 thi dung luon vi ca 2 host dung chung khoa
// + schema nen ket qua se giong nhau.
function lilyQuery(path) {
    for (var h = 0; h < LILY_API_HOSTS.length; h++) {
        var r = pacedFetch(LILY_API_HOSTS[h] + path, {
            headers: lilyHeaders(),
            timeout: 20000,
            maxRetries: 1
        });
        if (r.ok && r.res) {
            var txt = "";
            try { txt = r.res.text() + ""; } catch (e) { txt = ""; }
            var parsed = null;
            try { parsed = JSON.parse(txt); } catch (e2) { parsed = null; }
            if (parsed) return parsed;
            return null;
        }
        if (r.status === 401 || r.status === 403 || r.status === 404) return null;
    }
    return null;
}

// Tai file text (noi dung chuong .txt tren media CDN), co pacing.
// Tra ve chuoi text, hoac null khi loi.
function lilyFetchText(url) {
    var r = pacedFetch(url, { timeout: 30000, maxRetries: 1 });
    if (r.ok && r.res) {
        var body = "";
        try { body = r.res.text() + ""; } catch (e) { body = ""; }
        if (body) return body;
    }
    return null;
}

// Bo khoi <!--META:{...}--> ma site nhung cuoi mo ta.
function lilyCleanDesc(raw) {
    var s = raw + "";
    var i = s.indexOf("<!--META:");
    if (i >= 0) {
        var j = s.indexOf("-->", i);
        s = j >= 0 ? s.substring(0, i) + s.substring(j + 3) : s.substring(0, i);
    }
    return s.replace(/^\s+|\s+$/g, "");
}

function lilyCover(u) {
    var s = u + "";
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    return BASE_URL + "/" + s.replace(/^\//, "");
}

function lilyShortDesc(n) {
    var d = lilyCleanDesc(n.description);
    // "Do dai: 642 chuong" la dong dau hay nhat de hien o danh sach
    var m = d.match(/Độ dài:[^\n]*/);
    if (m) return m[0];
    if (d.length > 120) return d.substring(0, 120) + "...";
    // Mot so truyen chi co khoi <!--META--> nen mo ta rong -> lay tam the loai
    if (!d && n.category) return n.category + "";
    return d ? d : "Chưa có mô tả.";
}

function lilyItem(n) {
    return {
        name: n.title + "",
        link: BASE_URL + "/truyen/" + n.id,
        cover: lilyCover(n.cover_url),
        description: lilyShortDesc(n),
        host: "https://www.lilyhub.top"
    };
}

// Rut uuid truyen tu url web (…/truyen/<uuid>[/<n>]) hoac tu chuoi uuid thuan.
function lilyNovelId(input) {
    var s = (input + "").replace(/^\s+|\s+$/g, "");
    var parts = s.split("/");
    for (var i = parts.length - 1; i >= 0; i--) {
        var seg = parts[i];
        if (seg.indexOf("-") > 0 && seg.length >= 32 && /^[0-9a-fA-F-]+$/.test(seg)) return seg;
    }
    var m = s.match(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    if (m) return m[0];
    return "";
}

function lilyStatusText(s) {
    if (s === "completed") return "Hoàn thành";
    if (s === "ongoing") return "Đang cập nhật";
    if (s === "upcoming") return "Sắp ra mắt";
    return s + "";
}

// Bo dau tieng Viet + ha chu thuong, de so khop "Bach Hop" voi "BÁCH HỢP".
function lilyFoldName(s) {
    var low = (s + "").toLowerCase();
    var out = "";
    var i = 0;
    while (i < low.length) {
        var ch = low.charAt(i);
        var rep = lilyDiacritic(ch);
        out += rep ? rep : ch;
        i++;
    }
    return out;
}

function lilyDiacritic(ch) {
    var map = lilyDiacriticMap();
    var v = map[ch];
    return v ? v : "";
}

function lilyDiacriticMap() {
    var m = {};
    var groups = [
        ["àáạảãâầấậẩẫăằắặẳẵ", "a"],
        ["èéẹẻẽêềếệểễ", "e"],
        ["ìíịỉĩ", "i"],
        ["òóọỏõôồốộổỗơờớợởỡ", "o"],
        ["ùúụủũưừứựửữ", "u"],
        ["ỳýỷỹỵ", "y"],
        ["đ", "d"]
    ];
    for (var g = 0; g < groups.length; g++) {
        var chars = groups[g][0];
        var base = groups[g][1];
        var i = 0;
        while (i < chars.length) {
            m[chars.charAt(i)] = base;
            i++;
        }
    }
    return m;
}

function lilyEscape(s) {
    return (s + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
