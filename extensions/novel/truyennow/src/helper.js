// helper.js — Ham dung chung cho TruyenNow (longthieu.com).
//
// Site VN, truyen chu sang tac goc cua Long Thieu (Tailwind SSR + API
// JSON). Port tu mizhm truyennow v1 (fork tren dia) — base chet hoan
// toan (site doi domain truyen.now -> longthieu.com va doi giao dien,
// moi selector cu deu tra 0) nen viet lai toan bo theo hop dong hien tai.
//
// Co che site (kiem chung tu VM 2026-11-14):
// - Danh sach: the truyen a.group[href*="/truyen/"] (anh bia img
//   /covers/<slug>.webp, ten h3, the loai o p.truncate, so chuong o
//   span chua i.bi-journal-text); 24 muc/trang o /danh-sach, 21 muc o
//   /the-loai/tien-hiep (het 1 trang); phan trang ?page=N (nav co link
//   /danh-sach?page=1..3 + mui ten sang trang sau).
// - The loai: trang /the-loai liet ke ~50 muc (a[href^="/the-loai/"],
//   ten + so truyen); LOC the loai "18+" (slug /the-loai/18) — khong
//   dua vao danh sach the loai cua extension.
// - Tim kiem: GET /tim-kiem?q=<tu khoa> (form GET cua site); tham so
//   q tren /danh-sach BI BO QUA (tra lai danh sach mac dinh — kiem
//   chung: q="Sống" van tra dung 5 truyen dau cua /danh-sach), API
//   /api/search/suggest chi goi y (khong dung lam tim kiem chinh).
// - Chi tiet: /truyen/<slug>/ — h1 ten truyen; anh bia img[src*="/covers/"]
//   co alt trung ten truyen; trang thai o span badge ("Hoàn thành" /
//   "Đang ra"); the loai la pill a[href*="/the-loai/"] co style chua
//   var(--accent) (link the loai o footer/nav khong co style nay — phai
//   loc dung selector nay, khong lay rong); mo ta o div dau cua
//   #tab-intro; muc luc SSR 50 chuong/trang (?order=asc&page=N) nhung
//   toc.js dung API thay vi SSR. Site KHONG hien tac gia tren trang chi
//   tiet — tac gia la Long Thieu (xac minh: moi ket qua API suggest deu
//   tra author "Long Thieu"; footer trang chuong ghi "Tác phẩm của
//   Long Thiếu").
// - Muc luc: GET /api/chapters/<slug>?order=asc tra JSON
//   {chapters: [{chapter_number, title}], total} — DU 1 lan (200/200
//   chuong truyen mau 1, kiem chung tu VM); khong can page.js.
// - Chuong: /truyen/<slug>/doc/<n> — noi dung KHONG nam san trong DOM
//   (#reader-content chi co "Đang tải nội dung..."); noi dung that nam
//   trong bien _ed cua script bao ve: base64(URL-encode(HTML)) — GIAI
//   MA KHONG KHOA (decodeURIComponent(atob(_ed)) theo dung code cua
//   site). Runtime vBook khong co atob nen tu viet base64 giai ma bang
//   JS thuan (mau docln helper.js). _ed chua cac <p> theo dung thu tu
//   truyen (kiem chung: ch.1 truyen mau 1 = 116 doan, mo dau "Cơn mưa
//   rào đầu mùa trút xuống đường Bình Quới..."; ch.2 = 99 doan noi tiep;
//   ch.1 truyen mau 2 = 89 doan, mo dau "Tiếng cánh quạt của chiếc máy
//   điều hòa đời cũ..."; 0 dong moi, 0 lan nhac "Long Thiếu" trong
//   noi dung). Trang render moi xao tron thu tu DOM + chen cau moi vo
//   hinh (CSS order) — lay truc tiep tu _ed thi khong dinh; van loc
//   phong thu 14 cau moi cua site (DECOYS) neu gap.
// - DevTools detection cua site (kiem tra kich thuoc cua so / console /
//   debugger) chi chay trong trinh duyet that co mo devtools — runtime
//   vBook khong chay JS trang nen khong anh huong; khong can vuot qua.
// - Trang /doc/ chan UA bot (curl khong UA tra 403 "Access denied",
//   UA desktop Chrome tra 200) nen fetchLtPage luon gui DESKTOP_UA
//   (xem config.js).
// - Chuong VIP / login: 0 marker vip/lock tren site (kiem chung
//   2026-11-14) — toc.js/chap.js van phong thu: gap dau hieu khoa/mua
//   thi bao loi tieng Viet, khong mo khoa.
// - Dung safeFirst() thay cho kiem tra truthy cua .first() (quirk
//   runtime: .first() khong bao gio tra null).
// - Dung pacedFetch() cua lib rate-limit.js (pacing + retry 429/405/
//   503 + cooldown).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.

// --- Fetch 1 trang: tra {doc, rawHtml} hoac {error} -----------------------
// Doc rawHtml truoc roi Html.parse (chi doc body 1 lan — tranh double-read
// lam .html() tra null). Luon gui UA desktop (ly do o config.js).
function fetchLtPage(url, options) {
    options = options || {};
    var headers = { "User-Agent": DESKTOP_UA };
    if (options.headers) {
        for (var k in options.headers) headers[k] = options.headers[k];
    }
    var opts = { headers: headers };
    if (options.referer) opts.referer = options.referer;
    var r = null;
    try {
        r = pacedFetch(url, opts);
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!r) return { error: "Không tải được trang: " + url };
    if (r.error === "cooldown") {
        return { error: rateLimitErrorMessage("TruyenNow", pacedHostOf(url), r.cooldownRemainingMs) };
    }
    if (!r.ok) {
        var st = r.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("TruyenNow", pacedHostOf(url), r.cooldownRemainingMs) };
        }
        if (st === 403) {
            return { error: "Trang bị chặn truy cập (HTTP 403) — hãy mở longthieu.com trong trình duyệt của app một lần rồi thử lại: " + url };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
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
        return { error: "Trang đang yêu cầu xác minh Cloudflare — hãy mở longthieu.com trong trình duyệt của app một lần rồi thử lại." };
    }
    return { doc: doc, rawHtml: rawHtml };
}

// --- Fetch JSON: tra object da parse hoac null ----------------------------
// Dung cho API /api/chapters/<slug>. Kiem marker challenge truoc khi
// JSON.parse (trang challenge HTTP 200 co body HTML).
function fetchLtJson(url) {
    var headers = { "User-Agent": DESKTOP_UA };
    var r = null;
    try {
        r = pacedFetch(url, { headers: headers });
    } catch (e) {
        return null;
    }
    if (!r || r.error === "cooldown" || !r.ok) return null;
    var text = "";
    try {
        text = r.res.text();
    } catch (e2) {
        return null;
    }
    if (!text || isChallengeText(text)) return null;
    try {
        return JSON.parse(text);
    } catch (e3) {
        return null;
    }
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
    // Doi host cu (truyen.now) ve host hien tai.
    return u.replace(/^https?:\/\/truyen\.now\//i, BASE_URL + "/").replace(/([^:])\/\/+/g, "$1/");
}

function cleanText(s) {
    return String(s || "").replace(/\s+/g, " ").trim();
}

// --- Thu thap the truyen tu 1 trang danh sach -------------------------------
// The truyen: a.group[href*="/truyen/"] (anh bia img /covers/, ten h3,
// the loai o p.truncate, so chuong o span chua i.bi-journal-text).
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

    var cards = doc.select("a.group[href*=\"/truyen/\"]");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var link = String(card.attr("href") || "").trim();
        if (!link) continue;
        if (link.indexOf("/doc/") !== -1) continue;

        var title = "";
        var titleEl = safeFirst(card.select("h3"));
        if (titleEl) title = cleanText(titleEl.text());
        if (!title) {
            var imgAlt = safeFirst(card.select("img"));
            if (imgAlt) title = cleanText(imgAlt.attr("alt"));
        }
        if (!title) continue;

        var cover = "";
        var imgEl = safeFirst(card.select("img"));
        if (imgEl) {
            cover = String(imgEl.attr("src") || "").trim();
            if (cover) cover = normalizeUrl(cover);
        }

        var descParts = [];
        var genreEl = safeFirst(card.select("p.truncate"));
        if (genreEl) {
            var g = cleanText(genreEl.text());
            if (g) descParts.push(g);
        }
        var countText = "";
        var spans = card.select("span");
        for (var s = 0; s < spans.size(); s++) {
            var sp = spans.get(s);
            var inner = "";
            try { inner = sp.html(); } catch (e) { inner = ""; }
            if (inner.indexOf("bi-journal-text") !== -1) {
                countText = cleanText(sp.text());
                break;
            }
        }
        if (countText) descParts.push(countText + " chương");
        var statusEl = safeFirst(card.select("span.badge-full, span.badge-hot"));
        if (statusEl) {
            var st = cleanText(statusEl.text());
            if (st) descParts.push(st);
        }

        pushItem(title, link, cover, descParts.join(" - "));
    }
    return items;
}

// --- Phan trang danh sach ---------------------------------------------------
// Tra token trang ke (chuoi) neu con trang sau, "" neu het. Quet moi link
// ?page=N tren trang, lay so lon nhat; neu trang hien tai < max thi con.
function detectNextPageToken(doc, page) {
    var cur = parseInt(page, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    var max = cur;
    var links = doc.select("a[href*=\"page=\"]");
    for (var i = 0; i < links.size(); i++) {
        var href = String(links.get(i).attr("href") || "");
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > max) max = n;
        }
    }
    if (max > cur) return String(cur + 1);
    return "";
}

// --- URL trang danh sach theo so trang --------------------------------------
// Trang 1: giu nguyen URL. Trang N>1: them ?page=N (hoac &page=N neu URL
// da co query nhu ?sort= / ?filter= / ?q=).
function buildListPageUrl(url, page) {
    if (!page || page === "1") return url;
    var sep = url.indexOf("?") === -1 ? "?" : "&";
    return url + sep + "page=" + page;
}

// --- Giai ma chuong: base64 + URL-encode (khong khoa) -----------------------
// Runtime vBook (Rhino) khong co atob/TextDecoder, nen tu viet bang JS
// thuan (mau docln helper.js): base64 -> chuoi ASCII (cac %XX) ->
// decodeURIComponent -> HTML. _ed nam trong script bao ve cua trang:
// var _ed = '....'; — lay bang regex tren raw HTML (khong chay JS trang).
var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function base64ToAscii(s) {
    var clean = String(s || "").replace(/[^A-Za-z0-9+\/=]/g, "");
    var out = "";
    var i = 0;
    while (i < clean.length) {
        var c1 = B64_ALPHABET.indexOf(clean.charAt(i++));
        var c2 = B64_ALPHABET.indexOf(clean.charAt(i++));
        var c3 = B64_ALPHABET.indexOf(clean.charAt(i++));
        var c4 = B64_ALPHABET.indexOf(clean.charAt(i++));
        if (c1 < 0 || c2 < 0) break;
        var n = (c1 << 18) | (c2 << 12) | ((c3 < 0 ? 0 : c3) << 6) | (c4 < 0 ? 0 : c4);
        out += String.fromCharCode((n >> 16) & 255);
        if (c3 >= 0) out += String.fromCharCode((n >> 8) & 255);
        if (c4 >= 0) out += String.fromCharCode(n & 255);
    }
    return out;
}

// 14 cau moi vo hinh site chen khi render (xem script bao ve cua trang
// chuong) — loc phong thu neu co lan trong _ed.
var DECOY_LINES = [
    "Đêm ấy trời không trăng, con đường về làng dài hơn thường lệ.",
    "Tiếng chó sủa xa xa rồi im bặt, chỉ còn gió lùa qua hàng tre.",
    "Bà cụ ngồi bên bếp lửa, tay vẫn đều đều têm trầu như mọi tối.",
    "Chiếc ghe nhỏ trôi chậm giữa dòng, không ai buồn chèo tiếp.",
    "Ngoài hiên, mưa bắt đầu nặng hạt trên mái tôn cũ.",
    "Người khách lạ dừng chân trước cổng, ngần ngừ không bước vào.",
    "Ngọn đèn dầu chao nghiêng theo từng đợt gió lùa khe cửa.",
    "Tiếng gà gáy sớm vang lên từ phía cuối xóm nghèo.",
    "Cánh đồng sau vụ gặt trơ gốc rạ, thẳng tắp đến chân trời.",
    "Ông lão đưa mắt nhìn ra sông, điếu thuốc cháy dở trên tay.",
    "Trong nhà, mùi nhang trầm còn vương lại từ đêm hôm trước.",
    "Đứa trẻ ôm cặp sách chạy vụt qua, không kịp chào ai.",
    "Chuyến xe cuối ngày rời bến trong ánh đèn vàng vọt.",
    "Tấm rèm cửa lay nhẹ dù không có cơn gió nào thổi qua."
];

function isDecoyLine(text) {
    for (var i = 0; i < DECOY_LINES.length; i++) {
        if (text === DECOY_LINES[i]) return true;
    }
    return false;
}

// Giai ma noi dung chuong tu raw HTML trang /doc/<n>. Tra chuoi HTML cac
// <p> theo dung thu tu truyen, hoac null neu khong thay _ed.
function decodeChapterHtml(rawHtml) {
    var m = String(rawHtml || "").match(/var _ed\s*=\s*'([^']+)'/);
    if (!m || !m[1]) return null;
    var html = "";
    try {
        html = decodeURIComponent(base64ToAscii(m[1]));
    } catch (e) {
        return null;
    }
    if (!html) return null;
    var doc = null;
    try {
        doc = Html.parse(html);
    } catch (e2) {
        return null;
    }
    if (!doc) return null;
    var ps = doc.select("p");
    var parts = [];
    for (var i = 0; i < ps.size(); i++) {
        var t = cleanText(ps.get(i).text());
        if (!t) continue;
        if (isDecoyLine(t)) continue;
        parts.push("<p>" + t + "</p>");
    }
    if (parts.length === 0) return null;
    return parts.join("\n");
}
