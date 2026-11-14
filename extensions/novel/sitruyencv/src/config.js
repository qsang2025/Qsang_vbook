// config.js — Cau hinh cho extension Si Truyen CV (sitruyencv.com).
//
// Site VN truyen chu (Convert + Dich), kiem chung tu VM 2026-11-14:
// - Trang chu chi la shell SPA React (2,1 KB); moi du lieu qua API
//   api.sitruyencv.com (root 200 {"status":"ok"}), khong Cloudflare.
// - Tim kiem POST /api/stories/search?page=N&limit=24, body JSON
//   {keyword} hoac {category_ids:[id]} / {tag_ids:[id]} /
//   {story_type:"Convert"|"Dich"} / {status:"Completed"} /
//   {sort_by:"Views"|"Updated"|"Recommended"}; 30.727 truyen.
//   Tim kiem CHI CO DAU ("doan tau" -> 0, "đoàn tàu" -> dung truyen).
// - The loai GET /api/categories/?page=1&limit=100 (chu y trailing slash:
//   khong co slash thi 307 ve http://.../api/categories/?...); 45 muc.
// - Chi tiet GET /api/stories/{id}; ban dich GET
//   /api/stories/{id}/translate-versions (lay id dau tien, type Official).
// - Muc luc GET /api/chapters/{versionId}?page=N&limit=100&story_id={id}
//   &sort_order=asc (100 chuong/trang); chap GET
//   /api/chapters/{versionId}/read/{n}?story_id={id}.
// - Chuong VIP: has_access=false, content rong, price (vd. 102 xu),
//   vip_from_chapter (vd. 50) — chi bao loi tieng Viet, khong mo khoa.
//   Chuong thuong doc du, khong can dang nhap (kiem chung ch.1/ch.2).
// - Noi dung chuong co dong quang cao cuoi chuong
//   "Trang Nạp Xu dự phòng... napxu.sitruyencv.pro" — chap.js loc bo.
// - API chay tot voi UA mac dinh cua runtime (kiem chung tu VM bang
//   curl khong UA: read ch.2 tra 200, 6.586 ky tu) — KHONG dung UA
//   desktop cung nhu base Klein (quy tac 10 AGENTS.md).
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://sitruyencv.com";

// Domain co the doi trong cai dat nguon (sitruyencv.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// API host co dinh (khong phu thuoc DOMAIN — site khong co mirror API).
var API_URL = "https://api.sitruyencv.com";

// Khong co mirror song nao khac duoc kiem chung. Chi dung domain chinh.
var MIRROR_LIST = [];

function apiHeaders(referer) {
    return {
        "accept": "application/json, text/plain, */*",
        "origin": BASE_URL,
        "referer": referer || (BASE_URL + "/")
    };
}

function normalizeUrl(raw) {
    var u = String(raw || "").trim();
    if (!u) return "";
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.indexOf("http") !== 0) {
        if (u.charAt(0) !== "/") u = "/" + u;
        return BASE_URL + u;
    }
    return u.replace(/([^:])\/\/+/g, "$1/");
}

function absUrl(href) {
    return normalizeUrl(href);
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// Lay id truyen tu URL dang /story/<id> hoac /story/<id>-<slug>.
function storyIdFromUrl(url) {
    var m = /story\/(\d+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

function categoryText(cats) {
    if (!cats || !cats.length) return "";
    var parts = [];
    for (var i = 0; i < cats.length; i++) {
        if (cats[i] && cats[i].name) parts.push(cats[i].name);
    }
    return parts.join(", ");
}

function mapStory(e) {
    if (!e || !e.id) return null;
    var slug = e.slug || "";
    var cat = categoryText(e.categories);
    var chapters = e.total_chapters != null ? e.total_chapters : 0;
    var views = e.total_views != null ? e.total_views : 0;
    var desc = [];
    if (cat) desc.push(cat);
    desc.push(chapters + " chương");
    desc.push(views + " lượt xem");
    var status = (e.status || "").toLowerCase();
    return {
        name: e.title || e.name || "",
        link: BASE_URL + "/story/" + e.id + (slug ? "-" + slug : ""),
        cover: e.cover_image_url || "",
        description: desc.join(" | "),
        tag: e.story_type || "",
        ongoing: status !== "completed" && status !== "complete",
        host: BASE_URL
    };
}

// --- Fetch JSON co pacing (dung pacedFetch cua file rate-limit.js) -------
// Tra {json} hoac {error}. Khong retry 403; 429/405 thi ghi cooldown,
// khong dung browser fallback (cung IP, vo ich — quy tac 11 AGENTS.md).
function stvFetchJson(url, options) {
    var opts = options || {};
    var headers = apiHeaders(opts.referer);
    if (opts.method) headers["content-type"] = "application/json";
    var req = { headers: headers };
    if (opts.method) req.method = opts.method;
    if (opts.body) req.body = opts.body;
    var r = null;
    try {
        r = pacedFetch(url, req);
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Si Truyện CV", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Si Truyện CV", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var txt = "";
    try {
        txt = r.res.text() + "";
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!txt) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    var json = null;
    try {
        json = JSON.parse(txt);
    } catch (e3) {
        return { error: "Không đọc được dữ liệu (site trả về không phải JSON): " + url };
    }
    return { json: json };
}

// Lay id ban dich dau tien cua truyen (type Official). Tra {versionId}
// hoac {error}.
function resolveVersionId(storyId) {
    var rr = stvFetchJson(API_URL + "/api/stories/" + storyId + "/translate-versions");
    if (rr.error) return { error: rr.error };
    var json = rr.json;
    if (!json || !json.data || !json.data.length) {
        return { error: "Không lấy được bản dịch truyện." };
    }
    var id = parseInt(json.data[0].id, 10);
    if (!id) return { error: "Không lấy được bản dịch truyện." };
    return { versionId: id };
}
