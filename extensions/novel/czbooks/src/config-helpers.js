// config-helpers.js — LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Quy tac build (xem thiet ke khung xuong muc 6.9): file nay chi la nguon mau
// o repo root. Buoc build PHAI copy/inline no vao thu muc src/ cua tung
// extension truoc khi dong plugin.zip, vi load() cua vBook chi load file o
// top level src/ trong cung extension, khong de quy, va file duoc load
// khong duoc load them file khac. Trong script dung no, viet o dau file:
//     load('config.js');
//     load('config-helpers.js');
// (config.js PHAI load truoc, vi cac ham duoi day dung BASE_URL do config.js
// dinh nghia; file nay KHONG tu dinh nghia BASE_URL de tranh ghi de len
// gia tri DOMAIN/CONFIG_URL da override trong config.js.)
//
// Y tuong: config.js kieu thu vien dung chung cua ustaezav (truyenc) —
// BASE_URL + override DOMAIN/CONFIG_URL, normalizeUrl, absUrl, cleanText,
// storyItem/storyItems, nextPageToken — cong them parseList/dedupe cua MeoU.
// Viet lai thanh ban chuan dung chung, selector trong storyItem da tong
// quat hoa (co fallback) de dung cho nhieu site; khi lam extension that thi
// thu hep selector theo giao dien site do.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// BASE_URL do config.js dinh nghia. Neu script nao do quen load config.js
// truoc, bao loi ro rang thay vi chay voi BASE_URL rong.
if (typeof BASE_URL === "undefined" || !BASE_URL) {
    throw new Error("config-helpers.js: can load('config.js') truoc (BASE_URL chua co)");
}

function siteOrigin() {
    var m = BASE_URL.match(/^(https?:\/\/[^\/]+)/);
    return m ? m[1] : BASE_URL;
}

// Viet lai host cua url ve BASE_URL, giu nguyen path va query. Goi dau tien
// trong moi execute(url) nhan url tu app (url cu co the la mirror hoac www).
function normalizeUrl(url) {
    var s = String(url === undefined || url === null ? "" : url);
    var m = s.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?[^\/\n]+(\/.*)$/);
    return m ? siteOrigin() + m[1] : s;
}

// Giai quyet link tim duoc tren trang thanh URL tuyet doi cua site.
function absUrl(href) {
    if (!href) return "";
    href = String(href);
    if (/^https?:\/\//i.test(href)) return normalizeUrl(href);
    if (href.charAt(0) === "/") return siteOrigin() + href;
    return BASE_URL + "/" + href;
}

// Cat khoang trang thua (gom ca khoang trang toan giac U+3000) va trim.
function cleanText(s) {
    return String(s === undefined || s === null ? "" : s)
        .replace(/[\s\u3000]+/g, " ")
        .trim();
}

// Parser MỘT dong truyen dung chung cho home/genre/search. Nhan mot element
// dong danh sach, tra ve doi tuong truyen hoac null neu khong phai dong truyen.
// Selector mac dinh theo dang pho bien nhat; thu hep theo site that khi can.
function storyItem(el) {
    var link = "";
    var anchors = el.select("a");
    var i = 0;
    for (i = 0; i < anchors.size(); i++) {
        var href = anchors.get(i).attr("href");
        if (href && String(href).length > 1) {
            link = absUrl(href);
            break;
        }
    }
    if (!link) return null;

    var name = "";
    var titleEl = el.select("h2, h3, .story-title, a[title]").first();
    if (titleEl !== null) {
        name = cleanText(titleEl.text()) || cleanText(titleEl.attr("title"));
    }
    if (!name) {
        var img0 = el.select("img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var img = el.select("img").first();
    var descEl = el.select("p, .description, .excerpt").first();
    var tagEl = el.select(".badge, .tag, .status").first();

    return {
        name: name,
        cover: img === null ? "" : img.attr("src"),
        link: link,
        description: descEl === null ? "" : cleanText(descEl.text()),
        tag: tagEl === null ? "" : cleanText(tagEl.text()),
        host: siteOrigin()
    };
}

// Parser ca danh sach: duyet cac dong, bo trung (dedupe theo link, theo MeoU).
function storyItems(node, rowSelector) {
    var items = [];
    var seen = {};
    var sel = rowSelector || "div.d-flex, .story-item, li.list-row, .book-item";
    node.select(sel).forEach(function (el) {
        var item = storyItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// So trang ke tiep ("") = het. Trang cuoi van hien link "Trang sau" tu tro
// ve chinh no, nen KHONG kiem tra su ton tai cua link do; thay vao do so
// trang hien tai voi so trang lon nhat ma pager link toi.
function nextPageToken(doc) {
    var current = 1;
    var active = doc.select("ul.pagination li.active a, .pagination .active a, .pagination .current").first();
    if (active !== null) {
        var m = String(active.attr("href") || active.text()).match(/[?&]page=(\d+)/);
        if (m) {
            current = parseInt(m[1], 10);
        } else {
            var n = parseInt(cleanText(active.text()), 10);
            if (!isNaN(n)) current = n;
        }
    }

    var last = current;
    doc.select("ul.pagination a, .pagination a").forEach(function (el) {
        var mm = String(el.attr("href")).match(/[?&]page=(\d+)/);
        if (mm) last = Math.max(last, parseInt(mm[1], 10));
    });

    return last > current ? String(current + 1) : "";
}

// Ghe so trang vao URL danh sach (dung query ?page=N). Trang 1 tra URL goc.
function pagedUrl(url, page) {
    var number = parseInt(page, 10);
    if (isNaN(number) || number < 1) number = 1;
    if (number === 1) return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "page=" + number;
}
