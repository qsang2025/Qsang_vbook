// helper.js — Ham dung chung cho Tang Thu Vien (tangthuvien.org).
//
// Site VN, Next.js App Router, SSR day du cho danh sach / chi tiet /
// chuong (khong can giai ma GBK, khong can WebView). Port tu alexsonxxx
// tangthuvien v1 (fork tren dia) — NHUNG src cua base da ma hoa
// (api.js/aes.js chi la chuoi nhi phan, khong doc duoc) nen extension
// nay viet moi tu khao sat site, chi giu ten + metadata cua base.
// - Danh sach: the truyen `div.flex.items-start.gap-2` tren /truyen,
//   /truyen-moi, /thinh-hanh, /de-cu, /moi-cap-nhat, /bang-xep-hang/tuan
//   va /truyen?keyword=... (24 muc/trang, phan trang ?page=N).
// - The loai: 50 the loai dang ?genre=<slug> tren /truyen (doc live).
// - Tim kiem: GET /truyen?keyword=<tu khoa co dau> — form tim kiem cua
//   site day ve /truyen?keyword=... (route /tim-kiem khong tra ket qua).
// - Chi tiet: /<slug> — h1, anh bia Next Image (giai ma url= trong
//   src/srcSet), hang thong tin Status/Tac Gia/Danh Muc, mo ta, tong so
//   chuong "N Chuong", bookId 24 ky tu hex trong RSC.
// - Muc luc: Next.js Server Action actionGetChaptersOfBook
//   (ID c05deb810402fe1998675d59adb521ecd6cf5592f2, kiem chung tu chunk
//   JS cua site 2026-11-13), POST ve URL truyen, body
//   [{"bookId","page","limit":100,"isNewest":false}], tra {data:[...]}.
//   LUU Y: action chi tra 50 chuong/trang (kiem chung tren may that
//   2026-11-13: trang 1 = ch.1-50, trang 11 = ch.501-550) du gui
//   limit=100 — page.js va fallback sinh chuong chia 50 chuong/trang.
// - Chuong: /<slug>/<n> — noi dung day du trong
//   div[class*=source_serif] (171 doan o ch.1 truyen mau, khong quang
//   cao, khong can dang nhap, khong preview, khong 401, khong khoa —
//   kiem chung tu VM 2026-11-13).
// - Dung safeFirst() thay cho kiem tra truthy cua .first() (runtime
//   .first() khong bao gio tra null — xem FIRST-QUIRK-AUDIT.md).
// - Dung pacedFetch() cua lib/rate-limit.js (default headers + pacing
//   + retry 429/405/503).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null).
function fetchTtvPage(url, options) {
    options = options || {};
    var lastError = "";
    var r = null;
    try {
        r = pacedFetch(url, options);
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được trang: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("Tàng Thư Viện", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Tàng Thư Viện", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st) lastError = "Không tải được trang (HTTP " + st + "): " + url;
        else lastError = "Không tải được trang (lỗi mạng): " + url;
        return { error: lastError };
    }
    var rawHtml = "";
    try {
        rawHtml = r.res.text();
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!rawHtml) return { error: "Không đọc được nội dung trang: " + url };
    var doc = null;
    try {
        doc = Html.parse(rawHtml);
    } catch (e3) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    if (isChallengeDoc(doc)) {
        return { error: "Trang đang yêu cầu xác minh Cloudflare — hãy mở tangthuvien.org trong trình duyệt của app một lần rồi thử lại." };
    }
    return { doc: doc, rawHtml: rawHtml };
}

// --- Tien ich URL / text ---------------------------------------------------
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

function buildPageUrl(url, page) {
    // Runtime vBook (Rhino ES6) KHONG co URLSearchParams — dung xu ly
    // chuoi thuan. Giu nguyen cac query param khac, thay page=N.
    var p = parseInt(page, 10);
    if (isNaN(p) || p <= 1) return url;
    var clean = String(url || "").split("#")[0];
    var q = clean.indexOf("?");
    var base = q >= 0 ? clean.substring(0, q) : clean;
    var query = q >= 0 ? clean.substring(q + 1) : "";
    var parts = query ? query.split("&") : [];
    var kept = [];
    for (var i = 0; i < parts.length; i++) {
        if (parts[i].indexOf("page=") !== 0) kept.push(parts[i]);
    }
    kept.push("page=" + String(p));
    return base + "?" + kept.join("&");
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// Slug-hoa tu khoa tieng Viet thanh dang khong dau (dung cho tim kiem
// neu can; tim kiem cua site chap nhan ca tu khoa co dau).
function toSlug(str) {
    if (!str) return "";
    var slug = String(str).toLowerCase();
    var from = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ";
    var to = "";
    var i = 0;
    for (i = 0; i < 17; i++) to += "a";
    for (i = 0; i < 11; i++) to += "e";
    for (i = 0; i < 5; i++) to += "i";
    for (i = 0; i < 17; i++) to += "o";
    for (i = 0; i < 11; i++) to += "u";
    for (i = 0; i < 5; i++) to += "y";
    to += "d";
    for (i = 0; i < from.length; i++) {
        slug = slug.split(from.charAt(i)).join(to.charAt(i));
    }
    return slug.replace(/[^a-z0-9\- ]/g, "")
               .replace(/\s+/g, "-")
               .replace(/\-+/g, "-")
               .replace(/^\-+|\-+$/g, "");
}

// --- Anh bia Next Image ----------------------------------------------------
// Anh bia cua site la Next Image: src="/_next/image?url=<URL-that-da
// encode>&w=3840&q=75". Giai ma tham so url= de lay URL goc tren CDN
// (s2.ttyapi.site); neu giai ma that bai thi dung nguyen src.
function decodeCoverUrl(src) {
    var s = String(src || "").trim();
    if (!s) return "";
    var m = s.match(/[?&]url=([^&]+)/);
    if (m) {
        try {
            var decoded = decodeURIComponent(m[1]);
            if (decoded) return decoded;
        } catch (e) {
        }
    }
    return s;
}

function coverFromImg(imgEl) {
    if (!imgEl) return "";
    var srcSet = String(imgEl.attr("srcset") || imgEl.attr("srcSet") || "").trim();
    if (srcSet) {
        var first = srcSet.split(",")[0].trim().split(" ")[0];
        var decoded = decodeCoverUrl(first);
        if (decoded) return normalizeUrl(decoded);
    }
    var src = String(imgEl.attr("src") || "").trim();
    if (src) return normalizeUrl(decodeCoverUrl(src));
    return "";
}

// --- Phan trang danh sach ---------------------------------------------------
// Lay token trang ke: SO TRANG trong URL trang ke (vd. ?page=2 -> "2").
// Neu URL khong co page thi lay trang hien tai + 1.
function extractPageToken(url, currentPage) {
    var m = String(url || "").match(/[?&]page=(\d+)/);
    if (m) return m[1];
    var page = parseInt(currentPage, 10);
    if (isNaN(page) || page < 1) page = 1;
    return String(page + 1);
}

// Tim link "trang ke" trong phan trang cua site
// (a[aria-label="Next page"] href="?page=N"). Tra URL day du hoac "".
function detectNextPage(doc, currentUrl) {
    var nextEl = safeFirst(doc.select("a[aria-label=\"Next page\"]"));
    if (!nextEl) return "";
    var href = String(nextEl.attr("href") || "").trim();
    if (!href || href.indexOf("javascript:") === 0 || href === "#") return "";
    if (href.charAt(0) === "?") {
        var base = String(currentUrl || "").split("?")[0];
        return base + href;
    }
    return normalizeUrl(href.split("#")[0]);
}

// --- Thu thap the truyen tu 1 trang danh sach -------------------------------
// The truyen: div.flex.items-start.gap-2 > a (anh bia) + div.flex-1 >
// a > h3 (ten). 24 muc/trang tren /truyen, /truyen-moi, /thinh-hanh,
// /de-cu, /moi-cap-nhat, /bang-xep-hang/tuan va /truyen?keyword=...
function collectStoryCards(doc) {
    var items = [];
    var seen = {};

    function pushItem(name, link, cover, description) {
        if (!name || !link) return;
        var full = normalizeUrl(link);
        if (!full || seen[full]) return;
        seen[full] = true;
        items.push({ name: name, link: full, cover: cover || "", description: description || "", host: BASE_URL });
    }

    var cards = doc.select("div.flex.items-start.gap-2");
    for (var i = 0; i < cards.size(); i++) {
        var e = cards.get(i);
        var titleA = safeFirst(e.select("div.flex-1 a"));
        if (!titleA) titleA = safeFirst(e.select("a"));
        if (!titleA) continue;
        var href = String(titleA.attr("href") || "").trim();
        if (!href) continue;
        var nameEl = safeFirst(titleA.select("h3"));
        var name = nameEl ? cleanText(nameEl.text()) : cleanText(titleA.text());
        var img = safeFirst(e.select("img"));
        var cover = img ? coverFromImg(img) : "";
        pushItem(name, href, cover, "");
    }
    return items;
}

// --- Trich bookId + tong so chuong tu trang chi tiet -----------------------
// bookId: 24 ky tu hex trong du lieu RSC cua Next.js, dang
// bookId":"<24 hex>" (dau ngoac kep da escape) hoac "bookId":"..."
// tuy cach doc HTML, nen thu ca hai mau (mau giong apptruyenchu).
function extractBookId(raw) {
    var m = String(raw || "").match(/bookId\\":\\"([a-f0-9]{24})\\"/);
    if (m) return m[1];
    m = String(raw || "").match(/["']bookId["']\s*:\s*["']([a-f0-9]{24})["']/i);
    if (m) return m[1];
    return "";
}

// Tong so chuong: chuoi "N Chuong" trong header trang chi tiet
// (<span>N<!-- --> Chuong</span> — jsoup text() thanh "N Chuong").
// Site viet so lon co dau phan cach hang nghin ("1,068 Chuong") nen
// phai lay ca dau ,/. roi bo di truoc khi parseInt — regex (\d+)
// don thuan se lay nham "68".
function extractTotalChapters(doc) {
    var text = "";
    try {
        text = String(doc.text() || "");
    } catch (e) {
        return 0;
    }
    var m = text.match(/([\d,\.]+)\s*Chương/);
    if (m) {
        var num = parseInt(m[1].replace(/[,\.]/g, ""), 10);
        if (!isNaN(num)) return num;
    }
    return 0;
}

// Ten chuong moi nhat trong RSC cua trang chi tiet (5 chuong moi nhat,
// dang {"number":N,"bookId":"...","name":"Chuong N: ..."}). Tra map
// {number: name} de toc.js dung cho duong fallback.
function extractNewestChapterNames(raw) {
    var map = {};
    var re = /\\"number\\":(\d+),\\"bookId\\":\\"[a-f0-9]{24}\\",\\"name\\":\\"((?:[^\\"]|\\.)*)\\"/g;
    var m = null;
    try {
        while ((m = re.exec(String(raw || ""))) !== null) {
            var num = parseInt(m[1], 10);
            var name = String(m[2] || "").replace(/\\"/g, "\"").replace(/\\\\/g, "\\");
            if (num > 0 && name) map[num] = cleanText(name);
        }
    } catch (e) {
    }
    return map;
}

// The loai cua truyen trong RSC: "categories":[{"slugId":"...",
// "name":"..."}, ...]. Tra [{title, slug}].
// LUU Y 1: thu tu field trong tung object the loai KHONG co dinh —
// co object name dung ngay sau slugId (he-thong), co object name nam
// sau bookTypes/cover/description (hong-hoang). Vi vay cat vung
// categories thanh tung object roi trich slugId + name rieng trong moi
// object; ten file anh bia trong cover (vd. "i-a4...jpg") cung la
// field "name" nen phai loai ten co duoi anh ra.
// LUU Y 2 (loi gap tren may that 2026-11-13): sau mang categories la
// mang newChapters — cac chuong cung co slugId (dang "chuong-1068-...")
// va name ("Chuong 1068: ...") nen KHONG duoc cat vung bang cach tim
// field "author" (co sach khong co field author sau categories, vung
// se tran sang newChapters va sinh chip the loai rac). Cung KHONG dem
// ngoac can bang duoc: muc escape cua dau " thay doi theo vung trong
// file (delimiter co the la \" hay \\\" tuy cho) nen khong phan biet
// duoc dau " mo/dong chuoi bang dem so backslash. Cat dung bang dau
// hieu cau truc: mang categories dong bang }] roi toi 1 field cap
// sach (type/translateType/...). Cover array ben trong cung dong bang
// }] nhung sau no la "path"/"description" nen khong khop.
function extractCategoriesArray(raw) {
    var s = String(raw || "");
    var start = s.indexOf('\\"categories\\":[{');
    if (start < 0) start = s.indexOf('"categories":[{');
    if (start < 0) return "";
    var arrStart = s.indexOf('[', start);
    if (arrStart < 0) return "";
    var rest = s.substring(arrStart);
    var m = rest.match(/\}\],\\*"(type|translateType|tags|lastChapter|totalViews|rate|author|newChapters|status|publishStatus|composeType)\\*":/);
    if (!m) return "";
    var arrEnd = arrStart + m.index + 2;
    return s.substring(arrStart, arrEnd);
}

function extractBookCategories(raw) {
    var out = [];
    var arrayText = extractCategoriesArray(raw);
    if (!arrayText) return out;
    // Go escape 1-2 lop de parse bang regex thuong (ten the loai khong
    // bao gio chua dau " nen go sach dau " trong gia tri la an toan).
    var clean = arrayText.replace(/\\\\"/g, '"').replace(/\\"/g, '"');
    var chunks = clean.split('},{');
    for (var i = 0; i < chunks.length; i++) {
        var chunk = chunks[i];
        var sm = chunk.match(/"slugId":"([a-z0-9-]+)"/);
        if (!sm) continue;
        var slug = sm[1];
        var names = [];
        var nm = null;
        var re = /"name":"([^"]+)"/g;
        try {
            while ((nm = re.exec(chunk)) !== null) {
                var cand = nm[1];
                if (!/\.(jpg|jpeg|png|webp|gif)$/i.test(cand)) names.push(cand);
            }
        } catch (e) {
        }
        if (names.length === 0) continue;
        // Ten the loai la field name CUOI CUNG khong phai ten file anh
        // trong object (cover nam truoc name cua the loai).
        var title = cleanText(names[names.length - 1]);
        if (title) out.push({ title: title, slug: slug });
    }
    return out;
}
