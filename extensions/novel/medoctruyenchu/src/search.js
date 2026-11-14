// search.js — Tim kiem Me Doc Truyen Chu (medoctruyenchu.net).
//
// Trang GET /tim-kiem?key_word=... chi tra khung rong (ket qua khong
// render phia server — kiem chung live 2026-11-14: "dao quan", "ta co"
// deu 0 ket qua) nen tim kiem chay qua API goi y cua site:
//   1. GET trang chu, lay CSRF token trong window.SuuTruyen.csrfToken
//      VA cookie phien (laravel_session + XSRF-TOKEN) tu header
//      Set-Cookie — token Laravel gan voi session nen POST phai gui kem
//      cookie thi token moi hop le (lan thu 1 chi gui token, server tra
//      419 tren may that).
//   2. POST /ajax/search-story, JSON {key_word}, header X-CSRF-TOKEN +
//      Cookie. Tra JSON {success, stories: [{name, slug, ...}]}.
// POST nay TREO tu VM (timeout 20s, 2 lan, ca khi co cookie) — co the
// la tarpit IP datacenter; chi kiem chung duoc tren may that.
load("config.js");
load("rate-limit.js");

function execute(query, page) {
    var q = String(query || "").trim();
    if (!q) return Response.error("Nhập từ khóa để tìm truyện");
    var p = parseInt(page, 10);
    if (isNaN(p) || p < 1) p = 1;
    if (p > 1) return Response.success([], "");

    var rr = null;
    try {
        rr = pacedFetch(BASE_URL + "/", { referer: BASE_URL + "/" });
    } catch (e) {
        return Response.error("Không tải được dữ liệu (lỗi mạng): " + BASE_URL + "/");
    }
    if (!rr || !rr.ok) {
        return Response.error("Không tải được dữ liệu (HTTP " + (rr ? rr.status : 0) + "): " + BASE_URL + "/");
    }
    var homeText = "";
    try {
        homeText = rr.res.text() + "";
    } catch (e2) {
        return Response.error("Không đọc được dữ liệu: " + BASE_URL + "/");
    }
    var m = homeText.match(/csrfToken:\s*'([^']+)'/);
    if (!m) return Response.error("Không lấy được mã xác thực tìm kiếm, thử lại sau.");
    var token = m[1];

    // Runtime fetch KHONG tu gui cookie cua request truoc (GET lay token
    // xong POST khong kem cookie phien thi server tra 419), nhung fetch
    // CO ghi cookie vao CookieManager cua app — doc lai bang localCookie
    // (kiem chung tren may that 2026-11-14: getCookie tra 720 ky tu, co
    // ca medoctruyenchu_session) roi gui kem thu cong o header Cookie.
    var cookieHeader = "";
    try {
        if (typeof localCookie !== "undefined" && localCookie.getCookie) {
            cookieHeader = String(localCookie.getCookie(BASE_URL + "/") || "");
        }
    } catch (e3) {
    }

    var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-CSRF-TOKEN": token
    };
    if (cookieHeader) headers["Cookie"] = cookieHeader;

    var r = mdcFetchText(BASE_URL + "/ajax/search-story", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ key_word: q }),
        referer: BASE_URL + "/"
    });
    if (r.error) return Response.error(r.error);
    var json = null;
    try {
        json = JSON.parse(r.text || "");
    } catch (e) {
        return Response.error("Không đọc được kết quả tìm kiếm.");
    }
    if (!json || !json.success) {
        return Response.error("Không tìm thấy truyện nào với từ khóa này");
    }
    var stories = json.stories || [];
    var items = [];
    for (var i = 0; i < stories.length; i++) {
        var s = stories[i];
        var name = s.name ? String(s.name) : "";
        var slug = s.slug ? String(s.slug) : "";
        if (!name || !slug) continue;
        var cover = "";
        if (s.image) cover = String(s.image);
        else if (s.cover) cover = String(s.cover);
        else if (s.coverimg) cover = String(s.coverimg);
        else cover = BASE_URL + "/images/stories/" + slug.split("-").join("_") + ".jpg";
        // author la object {id, name} (kiem chung live 2026-11-14) — lay
        // .name, khong String() truc tiep keo ra "[object Object]".
        var authorName = "";
        if (s.author) {
            if (typeof s.author === "object") authorName = s.author.name ? String(s.author.name) : "";
            else authorName = String(s.author);
        }
        items.push({
            name: name,
            link: BASE_URL + "/truyen/" + slug,
            cover: normalizeUrl(cover),
            description: authorName,
            tag: "",
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa này");
    return Response.success(items, "");
}
