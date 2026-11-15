// config.js — Cứu Truyện (cuutruyen.net), truyện tranh.
// Site dùng JSON API công khai /api/v2, đọc ẩn danh, không cần đăng nhập:
// danh sách, tìm kiếm, chi tiết, mục lục, ảnh chương. Ảnh chương bị xáo
// trộn theo cơ chế hiển thị của chính site (drm_data) — giải mã bằng
// file image_decode.js (thư viện cuudrm của site, chạy trong trình duyệt
// headless), rồi ráp lại bằng Graphics trong file image.js khi hiển thị.
// Không có cơ chế mở khóa VIP, không giả lập đăng nhập: toàn bộ nội dung
// đọc được ẩn danh, kể cả truyện gắn cờ is_nsfw.
// Thể loại 18+ (warning_tags + ecchi) đã ẩn khỏi danh sách thể loại;
// manifest gắn cờ nsfw: true (tiền lệ FanMTL/ReaderNovel/WuxiaBox).
// Tương thích Rhino ES6: chỉ dùng var/function, nối chuỗi bằng +.

var BASE_URL = "https://cuutruyen.net";
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// Thể loại bị ẩn khỏi danh sách thể loại và khỏi mục genres ở trang chi
// tiết. warning_tags của site: bạo lực, khỏa thân, lgbt, nsfw; ecchi nằm
// trong normal_tags nên phải chặn riêng theo slug. Tìm kiếm không lọc.
// Việc ẩn có thể đảo ngược nếu Anh yêu cầu.
var BLOCKED_TAG_SLUGS = ["bao-luc", "khoa-than", "lgbt", "nsfw", "ecchi"];
function isBlockedTag(tag) {
    if (!tag) return true;
    var slug = String(tag.slug || "").toLowerCase();
    for (var i = 0; i < BLOCKED_TAG_SLUGS.length; i++) {
        if (slug === BLOCKED_TAG_SLUGS[i]) return true;
    }
    return false;
}

// GET JSON có pacing (1 request/lần, retry 429/405/503 tối đa 3 lần,
// cooldown 60 phút khi bị chặn) — xem file rate-limit.js.
// Trả về {ok, status, data, error, cooldownMs}.
function fetchJson(url) {
    var pf = pacedFetch(url, { headers: { "Accept": "application/json" } });
    if (!pf || !pf.ok || !pf.res) {
        return {
            ok: false,
            status: pf ? pf.status : 0,
            data: null,
            error: pf ? pf.error : "network error",
            cooldownMs: pf ? pf.cooldownRemainingMs : 0
        };
    }
    try {
        var body = pf.res.text();
        return { ok: true, status: pf.status, data: JSON.parse(body), error: null, cooldownMs: 0 };
    } catch (e) {
        return { ok: false, status: pf.status, data: null, error: "JSON parse error", cooldownMs: 0 };
    }
}

// Thông báo lỗi tiếng Việt theo mã HTTP của một lần gọi API thất bại.
function apiErrorMessage(result, what) {
    var whatText = what || "dữ liệu";
    if (result) {
        if (result.status === 429 || result.status === 405) {
            return rateLimitErrorMessage("Cứu Truyện", pacedHostOf(BASE_URL), result.cooldownMs || 0);
        }
        if (result.status === 403) {
            return "Cứu Truyện đang yêu cầu xác minh Cloudflare. Mở cuutruyen.net trong trình duyệt của app, qua bước xác minh rồi quay lại thử lại.";
        }
        if (result.status) {
            return "Không tải được " + whatText + " (HTTP " + result.status + ").";
        }
    }
    return "Không tải được " + whatText + ". Kiểm tra lại kết nối mạng.";
}

function normalizeLink(href) {
    if (!href) return "";
    if (String(href).indexOf("http") === 0) return String(href);
    if (String(href).charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

// Chuyển một truyện trong JSON API thành item danh sách chuẩn của vBook.
function mangaToItem(m) {
    if (!m || !m.id) return null;
    return {
        name: String(m.name || "").trim(),
        cover: m.cover_url || "",
        link: BASE_URL + "/mangas/" + m.id,
        description: m.description || "",
        host: BASE_URL
    };
}

// Đọc một trang danh sách truyện từ API. Hai dạng trả về:
//   {data: [...], _metadata} — recently_updated, top (có phân trang);
//   {data: {mangas: [...], tag}} — tag (không có _metadata, dùng mẹo
//   trang đầy: trả đủ 24 mục thì còn trang sau).
// Trả về Response.success(items, nextToken) — nextToken là chuỗi, "" khi hết.
function parseMangaList(url, page) {
    var pageNum = parseInt(page || "1", 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var sep = url.indexOf("?") === -1 ? "?" : "&";
    var target = url + sep + "page=" + pageNum + "&per_page=24";
    var result = fetchJson(target);
    if (!result.ok || !result.data) {
        return Response.error(apiErrorMessage(result, "danh sách truyện"));
    }
    var raw = result.data.data;
    var mangas = null;
    if (raw && raw.mangas && Array.isArray(raw.mangas)) {
        mangas = raw.mangas;
    } else if (Array.isArray(raw)) {
        mangas = raw;
    }
    if (!mangas) {
        return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện).");
    }
    var items = [];
    for (var i = 0; i < mangas.length; i++) {
        var item = mangaToItem(mangas[i]);
        if (item && item.name) items.push(item);
    }
    var next = "";
    var meta = result.data._metadata;
    if (meta && typeof meta.current_page === "number" && typeof meta.total_pages === "number") {
        if (meta.current_page < meta.total_pages) next = String(meta.current_page + 1);
    } else if (mangas.length >= 24) {
        next = String(pageNum + 1);
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, next);
}
