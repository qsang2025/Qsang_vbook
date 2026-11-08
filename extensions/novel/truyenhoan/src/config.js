// config.js — Cau hinh, danh muc va helper dung chung cho Truyen Hoan
// LUU Y: file nay duoc load() boi cac script khac, nen KHONG duoc load()
// them file nao khac o day.
var BASE_URL = "https://truyenhoan.com";

try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// MIRROR — CANH BAO ID KHONG NHAT QUAN GIUA CAC MIRROR:
// .4780 la "Van Co Than De" o truyenhoan.com nhung la "Chi Vi Yeu" o
// wetruyen.com (Van Co Than De o wetruyen la .8404). Vi vay KHONG doi host
// giua cac mirror cho detail/toc/chap/page: moi truyen chi doc tren dung
// host cua link goc. dtruyen.com 301 het ve wetruyen.com nen khong phai
// mirror doc lap, da bo khoi danh sach domain. DOMAIN o day chi dung de
// build link tuyet doi cho search/gen (tim kiem/danh sach khong gan ID
// truyen cu the) — khong phai failover tu dong cho detail/chap.

var CATEGORIES = [
    { title: "Truyện HOT", input: "truyen-hot" },
    { title: "Mới Cập Nhật", input: "truyen-moi-cap-nhat" },
    { title: "Đã Hoàn Thành", input: "truyen-full" },
    { title: "Truyện Mới Đăng", input: "truyen-moi-dang" }
];

// Slug the loai PHAI co hau to /hoan moi dung link that cua site
// (vd /truyen-tien-hiep/hoan/); thieu /hoan site 301 ve lai trang 1 nen
// phan trang the loai lap vo han. Luu y: trang the loai cua site chi liet
// ke truyen DA HOAN THANH.
var GENRES = [
    { title: "Tiên Hiệp", slug: "truyen-tien-hiep/hoan" },
    { title: "Kiếm Hiệp", slug: "truyen-kiem-hiep/hoan" },
    { title: "Huyền Huyễn", slug: "truyen-huyen-huyen/hoan" },
    { title: "Đô Thị", slug: "truyen-do-thi/hoan" },
    { title: "Võng Du", slug: "truyen-vong-du/hoan" },
    { title: "Khoa Huyễn", slug: "truyen-khoa-huyen/hoan" },
    { title: "Dị Giới", slug: "truyen-di-gioi/hoan" },
    { title: "Hệ Thống", slug: "truyen-he-thong/hoan" },
    { title: "Xuyên Không", slug: "truyen-xuyen-khong/hoan" },
    { title: "Trọng Sinh", slug: "truyen-trong-sinh/hoan" },
    { title: "Trinh Thám", slug: "truyen-trinh-tham/hoan" },
    { title: "Linh Dị", slug: "truyen-linh-di/hoan" },
    { title: "Ngôn Tình", slug: "truyen-ngon-tinh/hoan" },
    { title: "Cổ Đại", slug: "truyen-co-dai/hoan" },
    { title: "Mạt Thế", slug: "truyen-mat-the/hoan" },
    { title: "Quân Sự", slug: "truyen-quan-su/hoan" },
    { title: "Lịch Sử", slug: "truyen-lich-su/hoan" }
];

// fetch() co the throw (loi mang/DNS) hoac tra ve null: boc lai de cac
// script chi can kiem tra gia tri tra ve truoc khi dung.
function safeFetch(url) {
    try {
        var res = fetch(url);
        if (!res) return null;
        return res;
    } catch (e) {
        return null;
    }
}

// Lay origin (scheme + host) cua mot URL tuyet doi.
function siteOrigin(u) {
    if (!u) return "";
    var m = String(u).match(/^(https?:\/\/[^\/\?#]+)/i);
    return m ? m[1] : "";
}

// Chuan hoa URL truyen/chuong ve dung host cua no (KHONG doi host):
// - chi chap nhan truyenhoan.com va wetruyen.com (ke ca www.);
// - dtruyen.com va host la khac tra ve "" (caller bao loi tieng Viet);
// - link tuong doi thi gan BASE_URL; ep https; bo fragment.
function normalizeSiteUrl(u) {
    if (!u) return "";
    var s = String(u).trim();
    if (!s) return "";
    s = s.replace(/#.*$/, "");
    if (s.indexOf("/") === 0) {
        s = BASE_URL.replace(/\/+$/, "") + s;
    } else if (s.indexOf("http") !== 0) {
        s = BASE_URL.replace(/\/+$/, "") + "/" + s;
    }
    var m = s.match(/^https?:\/\/([^\/\?#]+)/i);
    if (!m) return "";
    var host = m[1].toLowerCase();
    if (host.indexOf("www.") === 0) host = host.substring(4);
    if (host !== "truyenhoan.com" && host !== "wetruyen.com") return "";
    return "https://" + host + s.substring(m[0].length);
}

// Link tuyet doi cho cac dong danh sach: giu nguyen host goc cua link,
// link tuong doi thi gan BASE_URL. Khong doi host.
function normalizeLink(href) {
    if (!href) return "";
    if (href.indexOf("http") === 0) return href;
    if (href.charAt(0) === "/") return BASE_URL + href;
    return BASE_URL + "/" + href;
}

function pickCover(row) {
    var lazy = row.select("div.lazyimg").first();
    if (lazy) {
        var u = lazy.attr("data-desk-image") || lazy.attr("data-image");
        if (u) {
            if (u.indexOf("//") === 0) u = "https:" + u;
            if (u.indexOf("_cover_list") >= 0) {
                u = u.replace("_cover_list", "_cover_large");
            } else if (u.indexOf("_cover_small") >= 0) {
                u = u.replace("_cover_small", "_cover_large");
            }
            return u;
        }
    }
    var img = row.select("img").first();
    if (img) {
        var s = img.attr("data-src") || img.attr("src") || "";
        if (s.indexOf("//") === 0) return "https:" + s;
        return s;
    }
    return "";
}

// Parse cac dong truyen dung chung cho search.js va gen.js (site dung
// cung mot layout danh sach cho ca tim kiem lan danh muc/the loai).
function parseNovelRows(doc) {
    var rows = doc.select("#list-page .list.list-truyen .row[itemscope]");
    if (rows.size() === 0) {
        rows = doc.select("#list-page .list-truyen .row[itemscope]");
    }
    if (rows.size() === 0) {
        rows = doc.select("#list-page div.row[itemscope]");
    }
    if (rows.size() === 0) {
        rows = doc.select(".col-truyen-main .list.list-truyen .row[itemscope]");
    }
    if (rows.size() === 0) {
        rows = doc.select(".list.list-truyen .row[itemscope]");
    }
    var novels = [];
    rows.forEach(function(row) {
        var titleA = row.select("h3.truyen-title a").first();
        if (!titleA) return;

        var name = titleA.text().trim();
        var href = normalizeLink(titleA.attr("href"));
        if (!name || !href) return;

        var authorName = "";
        var chapterInfo = "";
        row.select("span.author").forEach(function(sp) {
            var t = sp.text().trim().replace(/\s+/g, " ");
            if (sp.attr("itemprop") === "author") {
                authorName = t;
            } else if (sp.select(".glyphicon-list").size() > 0) {
                chapterInfo = t;
            }
        });

        var badges = [];
        if (row.select(".label-full").size() > 0) badges.push("Full");
        if (row.select(".label-hot").size() > 0) badges.push("Hot");
        if (row.select(".label-new").size() > 0) badges.push("New");

        var parts = [];
        if (authorName) parts.push(authorName);
        if (chapterInfo) parts.push(chapterInfo);
        if (badges.length > 0) parts.push(badges.join(", "));

        novels.push({
            name: name,
            link: href,
            cover: pickCover(row),
            description: parts.join(" - "),
            host: BASE_URL
        });
    });
    return novels;
}

// Tim so trang ke tiep trong phan trang danh sach/tim kiem.
// Site dung 2 dang: /trang-N/ (danh muc/the loai) va ?paged=N (tim kiem).
// Het trang thi tra "" (khong bao gio null).
function findNextPage(doc) {
    var lis = doc.select("ul.pagination > li");
    var idx = -1;
    for (var i = 0; i < lis.size(); i++) {
        var cls = lis.get(i).attr("class") || "";
        if (cls.indexOf("active") >= 0) {
            idx = i;
            break;
        }
    }
    if (idx < 0) return "";
    for (var j = idx + 1; j < lis.size(); j++) {
        var a = lis.get(j).select("a").first();
        if (!a) continue;
        var href = a.attr("href") || "";
        var m = href.match(/trang-(\d+)\//);
        if (m) return m[1];
        m = href.match(/[?&]paged=(\d+)/);
        if (m) return m[1];
    }
    return "";
}
