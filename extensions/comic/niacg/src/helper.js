// helper.js — ham phu cua extension NiACG (niacg.com).
//
// Site dung EmpireCMS, URL tinh gia:
//   danh sach: /listinfo-<classid>-<page>.html (page bat dau tu 0, 60 item/trang)
//   tag:       /tags-<tu khoa>-<page>.html
//   chi tiet gallery: /moehome-<classid>-<id>.html
//   chi tiet info/series: /showinfo-<classid>-<id>-0.html (chi -0 hop le)
//   doc full gallery: /moeupup-<classid>-<id>.html (toan bo anh 1 trang)
//   tim kiem: /e/search/?searchget=1&keyboard=<kw>&show=title
//             -> 302 toi /e/search/result/?searchid=<id>
//             phan trang: /e/search/result/index.php?page=<N>&searchid=<id>
// Classid PHAI khop id (moehome-3-162877 loi, moehome-1-162877 moi dung)
// nen luon lay classid tu URL danh sach, khong tu doan.
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file config-helpers.js;
//     file helper.js;
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js TRUOC helper.js vi cac ham duoi
// day dung BASE_URL (absUrl) va cleanText (config-helpers.js phai duoc
// load truoc helper.js). Build se copy file nay vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Classid tu URL dang /moehome-<class>-<id>.html, /showinfo-<class>-<id>-0.html,
// /moeupup-<class>-<id>.html hoac /listinfo-<class>-<page>.html.
// Tra ve 0 neu khong tach duoc.
function classIdOf(url) {
    var m = String(url || "").match(/\/(?:moehome|showinfo|moeupup|listinfo)-(\d+)-/);
    return m ? parseInt(m[1], 10) : 0;
}

// ID item tu URL dang /moehome-<class>-<id>.html,
// /showinfo-<class>-<id>-0.html hoac /moeupup-<class>-<id>.html.
// Tra ve "" neu khong tach duoc.
function itemIdOf(url) {
    var m = String(url || "").match(/\/(?:moehome|showinfo|moeupup)-\d+-(\d+)(?:-0)?\.html/);
    return m ? m[1] : "";
}

// Co phai URL series manga khong: showinfo + class 14/15.
function isSeriesUrl(url) {
    var s = String(url || "");
    return isSeriesClass(classIdOf(s)) && s.indexOf("/showinfo-") !== -1;
}

// URL doc full gallery cua 1 item.
function moeupupUrl(classid, id) {
    return BASE_URL + "/moeupup-" + classid + "-" + id + ".html";
}

// URL chi tiet gallery cua 1 item.
function moehomeUrl(classid, id) {
    return BASE_URL + "/moehome-" + classid + "-" + id + ".html";
}

// URL chi tiet info/series cua 1 item.
function showinfoUrl(classid, id) {
    return BASE_URL + "/showinfo-" + classid + "-" + id + "-0.html";
}

// Giai quyet URL ANH thanh URL tuyet doi, GIU NGUYEN HOST CDN (khac voi
// absUrl() — absUrl viet lai host ve BASE_URL, dung cho link trang site,
// nhung se pha URL anh CDN: boom.xunge.cyou/slthh/... -> niacg.com/slthh
// (404). Anh tren niacg.com nam tren CDN *.xunge.cyou nen phai giu host.
function absImageUrl(src) {
    if (!src) return "";
    src = String(src);
    if (/^https?:\/\//i.test(src)) return src;
    if (src.indexOf("//") === 0) return "https:" + src;
    if (src.charAt(0) === "/") return siteOrigin() + src;
    return BASE_URL + "/" + src;
}

// Anh bia that cua 1 dong danh sach: img co data-src (anh that), src chi la
// anh placeholder "imgloading*.gif". Tra ve "" neu khong co anh that.
function coverOf(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || "";
    if (src && src.indexOf("imgloading") === -1) return absImageUrl(src);
    var src2 = img.attr("src") || "";
    if (src2 && src2.indexOf("imgloading") === -1 && src2.indexOf("/skin/") === -1) return absImageUrl(src2);
    return "";
}

// Parse MOT dong item trong trang danh sach (.list-col):
//   a[href] (link + title attr), img[data-src] (anh bia), span.video-title
//   (ten), .label-sub (ten muc), .title-truncate (tac gia/tag).
// Tra ve doi tuong item hoac null neu khong phai dong item.
function parseGalleryRow(row) {
    var linkEl = row.select("a[href]").first();
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var link = absUrl(href);
    // Chi nhan link chi tiet gallery/series (moehome/showinfo); bo link
    // dieu huong, tag, trang khac.
    if (link.indexOf("/moehome-") === -1 && link.indexOf("/showinfo-") === -1) return null;

    var name = cleanText(linkEl.attr("title") || "");
    if (!name) {
        var titleEl = row.select("span.video-title").first();
        if (titleEl !== null) name = cleanText(titleEl.text());
    }
    if (!name) return null;

    var img = row.select("img").first();
    var cover = coverOf(img);

    var tagEl = row.select(".label-sub").first();
    var tag = tagEl === null ? "" : cleanText(tagEl.text());

    var desc = "";
    var authorEl = row.select(".title-truncate a").first();
    if (authorEl !== null) desc = cleanText(authorEl.text());

    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse ca trang danh sach (dung chung cho home/genre/search/tag).
// currentPage: so trang HIEN TAI cua app (bat dau tu 1; site bat dau tu 0).
// Tra ve { items, next }: next = so trang app ke ("") = het.
// Trang danh sach co link phan trang /listinfo-<class>-<N>.html hoac
// /tags-<kw>-<N>.html; lay N lon nhat lam trang cuoi cua site.
function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;
    var sitePage = cur - 1;

    doc.select(".list-col").forEach(function (row) {
        var item = parseGalleryRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var maxSitePage = sitePage;
    doc.select("a[href]").forEach(function (a) {
        var href = String(a.attr("href"));
        var m = href.match(/\/(?:listinfo-\d+|tags-[^\/]+)-(\d+)\.html/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxSitePage) maxSitePage = p;
        }
    });

    return { items: items, next: maxSitePage > sitePage ? String(cur + 1) : "" };
}

// Lay Document, thu mirror neu domain chinh chet (dung MIRROR_LIST trong
// config.js qua fetchWithFallback trong fetch-helpers.js). Tra ve Document
// hoac null. Hien khong co mirror mac dinh (xpicvid.com chi 301 ve domain
// chinh — xem config.js); fetchWithFallback van thu MIRRORS neu nguoi dung
// nhap them.

// Ghe so trang app (bat dau tu 1) vao URL danh sach dang
// /listinfo-<class>-<N>.html hoac /tags-<kw>-<N>.html (site bat dau tu 0).
function listPageUrl(baseUrl, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    var sitePage = n - 1;
    var s = String(baseUrl);
    var q = s.indexOf("?");
    var path = q === -1 ? s : s.substring(0, q);
    var query = q === -1 ? "" : s.substring(q);
    path = path.replace(/-(\d+)\.html$/, "-" + sitePage + ".html");
    return path + query;
}
