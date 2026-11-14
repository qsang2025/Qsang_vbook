// config.js — Cau hinh cho extension MongTruyen (mongtruyen.com).
//
// Site VN (PHP, SSR + AJAX), chuyen ngon tinh / dam my. Kiem chung tu VM
// 2026-11-14:
// - GET trang chu / chi tiet / chuong / tim kiem / the-loai tra 200, khong
//   chan bot theo UA (curl UA mac dinh). Dung UA mac dinh cua runtime
//   (quy tac 10 AGENTS.md), khong set UA rieng.
// - MOI endpoint /sources/ajax/* deu TREO tu VM (GET get-csrf-token.php,
//   POST load-chapters.php, POST load-chapter-content.php deu timeout 30-90s
//   ca khi gui kem cookie PHPSESSID): tarpit theo IP datacenter, giong
//   tangthuvien (VM POST treo, tren may chay duoc). Noi dung chuong CHI
//   kiem chung duoc tren may that qua device test, khong kiem chung tu VM.
// - Trang chi tiet /<slug>.html: ten .mdv-san-pham-show-name, tac gia
//   a.tac-gia-ten, bia .san-pham-book-item-show-image img, trang thai
//   .thong-tin-tinh-trang-text, mo ta .mdv-san-pham-show-gioi-thieu-des,
//   the loai .san-pham-the-loai-item a; hidden input id_truyen + pnvn_token.
//   Chu y: status tra ve dang NFD (dau tach roi, vd "Hoàn Thành") nen
//   phai boc dau truoc khi so sanh.
// - Muc luc: trang chi tiet chi SSR 20 chuong dau; day du qua POST
//   sources/ajax/load-chapters.php {page, id_truyen, pnvn_token}, lap den
//   khi tra ve rong/khong co link <a>. URL chuong dang ?chuong=N.
// - Chuong: noi dung KHONG co trong DOM (closed shadow root), chi lay qua
//   POST sources/ajax/load-chapter-content.php {pnvn_token, id_truyen,
//   id_chapter, nonce} -> JSON {status:"success", noi_dung}. id_chapter +
//   nonce lay tu #noi_dung_truyen (data-mt-*), token moi lay tu hidden
//   input tren trang chuong. Token co the bi xoay sau khi endpoint khac
//   xu ly xong -> co GET sources/ajax/get-csrf-token.php de lay lai.
// - coin_chapter = 0 la chuong mien phi; chuong VIP/co phi tra ve loi
//   hoac rong -> chap.js tra Response.error tieng Viet, KHONG mo khoa.
// - Site co huy hieu VIP + 18+ tren nhieu truyen (22/37 card trang chu
//   co VIP, hau het kem 18+); manifest de nsfw: true, toc.js khong danh
//   dau VIP duoc vi danh sach chuong SSR/AJAX khong co marker khoa.
// - Tim kiem GET /search.html?q=<tu khoa>: 12 ket qua, khong phan trang.
// - The loai: /the-loai.html co 103 the loai (sau khi dedup theo href);
//   danh sach truyen theo the loai qua POST sources/ajax/ajax-pagination.php
//   {page, limit:24, theloai, do:"pagination_theloai"} -> JSON {html, total_page}.
// - Trang chu: 2 tab tinh qua POST sources/ajax/mong-truyen-truyen-danh-muc.php
//   {page, limit:12, chuyenmuc}: 193 = Hoan Thanh, 194 = Truyen Cho Full.
// - Khong co mirror da kiem chung. Chi dung domain chinh.
// - Anh bia: /img_data/images/anh_truyen/<id>.jpg; icon lay tu favicon
//   PNG 512x512 cua site.
//
// Luu y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper thi tai
// truoc theo thu tu: file config.js, file rate-limit.js.

var BASE_URL = "https://mongtruyen.com";

// Domain co the doi trong cai dat nguon (mongtruyen.com mac dinh).
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN && String(DOMAIN).trim() !== "") {
        BASE_URL = String(DOMAIN).replace(/\/+$/, "");
    }
} catch (e) {
}

// Khong co mirror song nao duoc kiem chung. Chi dung domain chinh.
var MIRROR_LIST = [];

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

// Boc dau tieng Viet (ca dang NFD: a + dau tach) + ha chu, de so sanh
// trang thai / tu khoa khong phu thuoc dang chuan hoa cua site.
function stripMarks(s) {
    var t = String(s || "");
    try {
        t = t.replace(/[̀-ͯ]/g, "");
    } catch (e) {
    }
    return t.toLowerCase();
}

// Lay phan tu dau tien cua mot select (tranh bay .first() cua runtime:
// select rong van tra ve object truthy — xem FIRST-QUIRK-AUDIT.md).
function selFirst(el, css) {
    var r = el.select(css);
    return r.size() > 0 ? r.get(0) : null;
}

function rateLimitErr(siteName, url, r) {
    if (r && r.error === "cooldown") {
        return rateLimitErrorMessage(siteName, pacedHostOf(url), r.cooldownRemainingMs);
    }
    if (r && (r.status === 429 || r.status === 405)) {
        return rateLimitErrorMessage(siteName, pacedHostOf(url), r.cooldownRemainingMs);
    }
    if (r && r.status) return "Không tải được dữ liệu (HTTP " + r.status + "): " + url;
    return "Không tải được dữ liệu (lỗi mạng): " + url;
}

// --- Fetch GET co pacing ----------------------------------------------------
// Tra {doc} hoac {error}.
function ttlFetchDoc(url, referer) {
    var r = null;
    try {
        r = pacedFetch(url, { referer: referer || (BASE_URL + "/") });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (!r.ok) return { error: rateLimitErr("Mộng Truyện", url, r) };
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    if (!doc) return { error: "Không đọc được dữ liệu (site trả về rỗng): " + url };
    return { doc: doc };
}

// --- Fetch POST form co pacing ----------------------------------------------
// bodyObj: flat object (gui dang form-urlencoded). Tra {res} hoac {error}.
function ttlFetchPost(url, bodyObj, referer) {
    var r = null;
    try {
        r = pacedFetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "X-Requested-With": "XMLHttpRequest" },
            body: bodyObj,
            referer: referer || (BASE_URL + "/")
        });
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được dữ liệu: " + url };
    if (!r.ok) return { error: rateLimitErr("Mộng Truyện", url, r), status: r.status };
    return { res: r.res };
}

// Lay lai token CSRF hien hanh tu server (token co the bi xoay). Tra token
// moi hoac "" khi khong lay duoc.
function refreshPnvnToken() {
    try {
        var r = pacedFetch(BASE_URL + "/sources/ajax/get-csrf-token.php", { referer: BASE_URL + "/" });
        if (!r || !r.ok) return "";
        var j = null;
        try { j = r.res.json(); } catch (e) { return ""; }
        if (j && j.status === "success" && j.token) return String(j.token);
        if (j && j.token) return String(j.token);
    } catch (e) {
    }
    return "";
}

// Trich id_truyen + pnvn_token tu trang HTML (uu tien hidden input, fallback
// regex tren JS inline cua site). Tra {id, token} (chuoi, co the rong).
function extractStoryAuth(doc, htmlText) {
    var id = "";
    var token = "";
    try {
        var idEl = selFirst(doc, "input[name='id_truyen']");
        if (idEl) id = (idEl.attr("value") || "").trim();
    } catch (e) {
    }
    try {
        var tkEl = selFirst(doc, "input[name='pnvn_token']");
        if (tkEl) token = (tkEl.attr("value") || "").trim();
    } catch (e) {
    }
    if ((!id || !token) && htmlText) {
        try {
            var m1 = /const id_truyen\s*=\s*(\d+)/.exec(htmlText);
            if (m1 && !id) id = m1[1];
            var m2 = /pnvn_token:\s*"([0-9a-f]{32})"/.exec(htmlText);
            if (m2 && !token) token = m2[1];
            var m3 = /name=\\"pnvn_token\\" value=\\"([0-9a-f]{32})\\"/.exec(htmlText);
            if (m3 && !token) token = m3[1];
        } catch (e2) {
        }
    }
    return { id: id, token: token };
}
