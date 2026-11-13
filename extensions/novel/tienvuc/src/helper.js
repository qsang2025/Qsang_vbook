// helper.js — Ham dung chung cho Tien Vuc (tienvuc.blog).
//
// Site VN (truyen dich online), Nuxt SSR + API JSON rieng (kiem chung tu
// VM 2026-11-13):
// - The loai: GET /api/categories/all -> [{slug, name}] (39 the loai).
// - Danh sach: GET /api/public-collections/<ten>?page&limit=20 ->
//   {totalDocs, page, docs:[{name, slug, categories, status, views,
//   vip, author:{name}, cover:{domain, url}, intro}]}.
// - Theo the loai: GET /api/categories/<slug>/books?slug=<slug>&page&
//   limit=20 -> cung dang {totalDocs, docs}.
// - Tim kiem: GET /api/search?search=<tu-khoa>&page&limit=20 -> cung
//   dang {totalDocs, docs}; go co dau duoc (kiem chung: "đế bá" -> 128
//   ket qua, dau tien la Đế Bá).
// - Chi tiet: GET /api/reading/<slug> -> {name, status, views, vip,
//   author:{name}, categories:[{name, slug}], cover, intro}.
// - Muc luc: GET /api/reading/<slug>/chapters -> {totalDocs, docs:[
//   {num, name, coins, isBought}]} — TOAN BO chuong trong 1 goi (Đế Bá
//   4.941 chuong, Linh Vũ Thiên Hạ 4.703 chuong); chuong co coins > 0 va
//   isBought false la chuong tra phi (kinh-tieu: 735/785 chuong co phi).
// - Chuong: HTML SSR day du trong .chapter-content (khong can dang nhap,
//   khong preview, khong 401 — kiem chung tu VM 2026-11-13: Đế Bá ch.1
//   133 doan, mo dau "Be be…be be…be be…", nhan vat Lý Thất Dạ; Linh Vũ
//   Thiên Hạ ch.1 34 doan, mo dau "- Ưm, ta đang ở nơi nào thế này?",
//   nhan vat Lục Thiếu Du — dung truyen goc). Chuong VIP tra ve thong
//   bao "Chương VIP ... cần mua bằng XU" (0 doan <p>) — chap.js bao loi
//   tieng Viet ro rang, KHONG mo khoa, KHONG mua ho.
// - Binh luan: GET /api/comments/books/<slug>?sort=-_id&limit=20&next=
//   <token> -> {docs, next, options.counts}; tra loi qua ?parent=<id>.
// - Mirror tienvuc.me tra cung API + cung noi dung (kiem chung
//   2026-11-13).
//
// Port tu kychi tienvuc v16 (fork tren dia, src doc duoc), viet lai theo
// quy tac nha (AGENTS.md §6):
// - BO User-Agent cung trong base (site tra 200 day du ca khi khong co
//   UA — kiem chung tu VM 2026-11-13) — dung pacedFetch() cua
//   lib/rate-limit.js (default headers + pacing + retry 429/405/503).
// - BO crypto.js 48KB cua base: chuong SSR hien tai khong ma hoa (HTML
//   tra thang <p>, khong co dau hieu CryptoJS/AES — kiem chung tu VM
//   2026-11-13); chap.js doc thang .chapter-content, khong can giai ma.
// - BO tab "Truyện VIP" cua base: chi doc noi dung mien phi; chuong VIP
//   bao loi ro rang thay vi hien tab toan truyen tra phi (tien le theo
//   tvtruyen #32).
// - BO browser fallback cua base trong chap.js: SSR tra day du noi dung
//   chuong mien phi; chuong VIP tra thong bao khoa ca tren SSR — browser
//   cung khong doc duoc neu khong dang nhap/mua, nen khong can.
// - Sua loi phan trang cua base: allPage = floor(total/10)+1 sai khi
//   total chia het cho limit (vd. 100 -> 11 trang ao); dung
//   ceil(totalDocs/limit). Token next LUON la chuoi "" khi het trang
//   (base tra null).
// - Loi tra Response.error tieng Viet thay vi tra [] cam (base tra [] khi
//   API loi — app khong phan biet duoc "het sach" voi "loi mang").
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Goi API JSON: tra {json} hoac {error} ---------------------------------
// Thu domain chinh truoc, roi mirror (doi host giu nguyen path + query).
// pacedFetch khong chuyen queries — URL phai build san day du.
function fetchTvApi(path) {
    var candidates = [BASE_URL + path];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        if (MIRROR_LIST[i] !== BASE_URL) candidates.push(MIRROR_LIST[i] + path);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var r = null;
        try {
            r = pacedFetch(candidates[i], { headers: { "Accept": "application/json" } });
        } catch (e) {
            lastError = "Không tải được dữ liệu (lỗi mạng): " + path;
            continue;
        }
        if (!r) {
            lastError = "Không tải được dữ liệu: " + path;
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("Tiên Vực", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Tiên Vực", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được dữ liệu (HTTP " + st + "): " + path;
            } else {
                lastError = "Không tải được dữ liệu (lỗi mạng): " + path;
            }
            continue;
        }
        try {
            var json = r.res.json();
            return { json: json };
        } catch (e2) {
            lastError = "Dữ liệu trả về không phải JSON: " + path;
            continue;
        }
    }
    return { error: lastError || "Không tải được dữ liệu: " + path };
}

// --- Tai 1 trang HTML: tra {doc} hoac {error} ------------------------------
// Dung cho chap.js (noi dung chuong trong .chapter-content).
function fetchTvPage(url) {
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
            r = pacedFetch(candidates[i]);
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!r) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (r.error === "cooldown") {
            return { error: rateLimitErrorMessage("Tiên Vực", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
        }
        if (!r.ok) {
            var st = r.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Tiên Vực", pacedHostOf(candidates[i]), r.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
            } else {
                lastError = "Không tải được trang (lỗi mạng): " + url;
            }
            continue;
        }
        var doc = null;
        try {
            doc = r.res.html();
        } catch (e2) {
            lastError = "Không đọc được trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được trang: " + url;
            continue;
        }
        if (typeof isChallengeDoc === "function" && isChallengeDoc(doc)) {
            return { error: "Trang yêu cầu xác minh trình duyệt — hãy mở trang này một lần trong trình duyệt của app rồi thử lại." };
        }
        return { doc: doc };
    }
    return { error: lastError || "Không tải được trang: " + url };
}

// --- Item truyen chuan tu 1 ban ghi API ------------------------------------
// link tuyet doi (host + slug); cover ghep domain + url; tag VIP neu co.
function buildBookItem(book) {
    if (!book) return null;
    var slug = book.slug || "";
    if (!slug || !book.name) return null;
    var cover = "";
    if (book.cover) {
        if (typeof book.cover === "string") {
            cover = book.cover;
        } else if (book.cover.domain && book.cover.url) {
            cover = book.cover.domain + "/" + book.cover.url;
        }
    }
    var authorName = "";
    if (book.author && book.author.name) authorName = cleanText(book.author.name);
    var item = {
        name: book.name,
        link: BASE_URL + "/" + slug,
        cover: normalizeUrl(cover),
        description: authorName,
        host: BASE_URL
    };
    if (book.vip === true) item.tag = "Truyện VIP";
    return item;
}

// --- Token trang ke tu totalDocs -------------------------------------------
// totalPages = ceil(total/limit); het trang thi tra "" (chuoi rong).
function nextPageToken(totalDocs, limit, page) {
    var total = parseInt(totalDocs, 10);
    if (isNaN(total) || total <= 0) return "";
    var lim = parseInt(limit, 10);
    if (isNaN(lim) || lim <= 0) lim = 20;
    var totalPages = Math.ceil(total / lim);
    var cur = parseInt(page, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    if (cur < totalPages) return String(cur + 1);
    return "";
}
