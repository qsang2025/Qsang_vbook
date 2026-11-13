// config.js — Cau hinh cho extension ValvrareTeam (valvrareteam.net).
//
// Site VN (Light Novel Vietsub), Next.js App Router + API JSON rieng.
// Kiem chung tu VM 2026-11-14:
// - Danh sach /api/novels?limit=N&page=N tra JSON {novels, pagination}
//   (232 truyen; limit toi da 100/trang). THAM SO genre/status BI API
//   BO QUA (kiem chung: ?genre=Fantasy va ?status=Completed tra dung
//   danh sach khong loc, cung thu tu) — loc the loai / trang thai phai
//   lam phia client trong homecontent.js / genrecontent.js.
// - Chi tiet /api/novels/<id> tra {novel, modules} day du 1 lan — muc
//   luc khong phan trang (truyen 330 chuong van tra du 1 lan).
// - Tim kiem /api/novels/search?title=<kw> tra mang, khong phan trang,
//   can co tu khoa (khong co thi tra {"message":"Search query is required"}).
// - Chuong: khong co API noi dung — noi dung nam trong RSC payload cua
//   trang chuong (xem chap.js). Chuong co chapterBalance > 0 van doc du
//   noi dung day du khi khong dang nhap (kiem chung ch.301 Trong Sinh
//   Tu Tien Doi Thuong, balance 167: 202 doan day du) — khong danh dau
//   khoa / tra phi.
// - Khong co mirror: www.valvrareteam.net chet (000, kiem chung
//   2026-11-14). Chi dung domain chinh.
// - The loai "Incest" / "Netorare" co tren site nhung KHONG dua vao
//   danh sach the loai cua extension (quy tac nha: khong dua noi dung
//   NSFW vao catalog chung); truyen co cac the loai do van tim duoc qua
//   tim kiem / danh sach / chi tiet.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js.

var BASE_URL = "https://valvrareteam.net";

// Domain co the doi trong cai dat nguon (valvrareteam.net mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung (www chet, xem ghi chu dau file).
var MIRROR_LIST = [];

var ID_RE = /__ID__([0-9a-fA-F]{24})/;
var CID_RE = /__CHAPID__([0-9a-fA-F]{24})/;
var SHORT_NOVEL_RE = /\/truyen\/x-([0-9a-fA-F]{8})\//;
var SHORT_CHAP_RE = /\/chuong\/([0-9a-fA-F]{8})/;

function extractNovelId(url) {
    var m = ID_RE.exec(url);
    if (m) return m[1];
    var s = SHORT_NOVEL_RE.exec(url);
    return s ? s[1] : null;
}

function extractChapId(url) {
    var m = CID_RE.exec(url);
    if (m) return m[1];
    var s = SHORT_CHAP_RE.exec(url);
    return s ? s[1] : null;
}

function shortId(id) {
    var s = String(id || "");
    return s.substring(s.length - 8);
}

function makeNovelUrl(id) {
    return BASE_URL + "/truyen/__ID__" + id;
}

function makeChapUrl(nid, cid) {
    return BASE_URL + "/truyen/__ID__" + nid + "/chuong/__CHAPID__" + cid;
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

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

function mapStatus(s) {
    if (s === "Ongoing") return "Đang tiến hành";
    if (s === "Completed") return "Hoàn thành";
    if (s === "Hiatus") return "Tạm ngưng";
    return s || "";
}

function stripHtml(html) {
    if (!html) return "";
    return String(html).replace(/<[^>]*>/g, " ").replace(/&(amp|lt|gt|nbsp|apos|quot);/g, function (m, e) {
        return { amp: "&", lt: "<", gt: ">", nbsp: " ", apos: "'", quot: '"' }[e] || m;
    }).replace(/&#(\d+);/g, function (m, d) {
        return String.fromCharCode(parseInt(d, 10));
    }).replace(/\s+/g, " ").trim();
}

// The loai nguoi lon khong dua vao danh sach duyet (xem ghi chu dau file).
var BLOCKED_GENRES = { "Incest": true, "Netorare": true };

function isBlockedGenre(g) {
    return !!BLOCKED_GENRES[g];
}

// Goi API JSON: tra {data} hoac {error}. Dung pacedFetch (file
// rate-limit.js) de co pacing + retry + cooldown; doc body 1 lan
// bang res.text(). Chap nhan ca duong dan tuong doi (/api/...) va
// URL day du.
function fetchApiJson(path) {
    var url = String(path || "");
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== "/") url = "/" + url;
        url = BASE_URL + url;
    }
    var r = null;
    try {
        r = pacedFetch(url);
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Valvrareteam", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Valvrareteam", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!text) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    if (isChallengeText(text)) {
        return { error: "Trang đang yêu cầu xác minh — hãy mở valvrareteam.net trong trình duyệt của app một lần rồi thử lại." };
    }
    try {
        return { data: JSON.parse(text) };
    } catch (e3) {
        return { error: "Không đọc được dữ liệu (JSON lỗi): " + url };
    }
}

// --- Danh sach truyen dung chung ------------------------------------------
// input: URL API day du, co the kem fragment "#genre=<ten>" hoac
// "#status=<trang thai>" de loc phia client (API bo qua cac tham so
// nay — xem ghi chu dau file). Token trang tra ve la so trang API ke
// tiep (chuoi), "" khi het.
// - Khong loc: 1 request/trang, 20 muc/trang.
// - Co loc: dung limit=100 de gom nhanh; quet tuan tu cac trang API
//   cho du 20 muc khop roi dung (toi da 15 trang — toan bo catalog
//   chi co 3 trang limit=100).
var LIST_PAGE_SIZE = 20;
var FILTER_PAGE_SIZE = 100;

function novelToItem(n) {
    var ch = n.chapters || [];
    var latest = ch.length > 0 ? (ch[0].title || "") : "";
    var parts = [];
    if (n.author) parts.push(n.author);
    var st = mapStatus(n.status);
    if (st) parts.push(st);
    if (n.totalChapters) parts.push(n.totalChapters + " chương");
    if (n.dailyViews) parts.push("Lượt xem hôm nay: " + n.dailyViews);
    if (latest && !n.totalChapters && !n.dailyViews) parts.push(latest);
    return {
        name: n.title || "",
        cover: n.illustration || "",
        link: makeNovelUrl(n._id),
        host: BASE_URL,
        description: parts.join(" | ")
    };
}

function parseNovels(input, page) {
    var filterKey = "";
    var filterValue = "";
    var apiUrl = String(input || "");
    var hash = apiUrl.indexOf("#");
    if (hash !== -1) {
        var frag = apiUrl.substring(hash + 1);
        apiUrl = apiUrl.substring(0, hash);
        var eq = frag.indexOf("=");
        if (eq > 0) {
            filterKey = frag.substring(0, eq);
            try {
                filterValue = decodeURIComponent(frag.substring(eq + 1));
            } catch (e) {
                filterValue = frag.substring(eq + 1);
            }
        }
    }
    if (apiUrl.indexOf("limit=") === -1) {
        apiUrl += (apiUrl.indexOf("?") !== -1 ? "&" : "?") + "limit=" + (filterKey ? FILTER_PAGE_SIZE : LIST_PAGE_SIZE);
    }
    var p = 1;
    if (page) {
        p = parseInt(page, 10);
        if (isNaN(p) || p < 1) p = 1;
    }
    var items = [];
    var apiPage = p;
    var guard = 0;
    while (guard < 15) {
        guard++;
        var sep = apiUrl.indexOf("?") !== -1 ? "&" : "?";
        var rr = fetchApiJson(apiUrl + sep + "page=" + apiPage);
        if (rr.error) {
            if (items.length > 0) return Response.success(items, "");
            return Response.error(rr.error);
        }
        var data = rr.data || {};
        var novels = data.novels || [];
        var pg = data.pagination || {};
        var totalPages = pg.totalPages || 1;
        for (var i = 0; i < novels.length; i++) {
            var n = novels[i];
            if (filterKey === "genre") {
                var gs = n.genres || [];
                var ok = false;
                for (var gi = 0; gi < gs.length; gi++) {
                    if (gs[gi] === filterValue) {
                        ok = true;
                        break;
                    }
                }
                if (!ok) continue;
            } else if (filterKey === "status") {
                if (n.status !== filterValue) continue;
            }
            items.push(novelToItem(n));
            if (items.length >= 20) break;
        }
        if (items.length >= 20) {
            return Response.success(items, apiPage < totalPages ? String(apiPage + 1) : "");
        }
        if (apiPage >= totalPages) return Response.success(items, "");
        apiPage++;
        if (!filterKey) return Response.success(items, String(apiPage));
    }
    return Response.success(items, "");
}
