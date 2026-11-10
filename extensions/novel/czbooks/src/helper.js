// helper.js — ham phu cua extension 小說狂人 (czbooks.net).
//
// Site tieng Trung phon the, UTF-8, SSR hoan toan, khong chong bot.
// Danh sach truyen dung chung mot cau truc item:
//   ul.nav.novel-list > li.novel-item-wrapper > div.novel-item
// (trang tim kiem /s/{kw} 42 item/trang, trang the loai /c/{slug}
// 72 item/trang, bang xep hang cung vay).
//
// LUU Y jsoup (bai hoc sto9 2026-11-07): the <a> long nhau co the bi
// tach — khi chon link trong danh sach, chi lay <a> co href khop
// /n/{slug-truyen} (khong lay link chuong moi /n/{slug}/{chuong}).
// Khong dung .parent() (khong ton tai).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file helper.js;
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js +
// fetch-helpers.js TRUOC helper.js (cac ham duoi day dung BASE_URL,
// absUrl, cleanText, fetchWithFallback, MIRROR_LIST).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Map ten the loai hien thi -> slug /c/{slug} (khao sat 2026-11-07).
// Slug lech ten hien thi, KHONG suy tu ten:
//   科幻未來 dung slug wangyou (khong phai 网游),
//   奇幻冒險 dung slug fanatsy (site viet sai chinh ta, giu nguyen).
// KHONG co muc 都市 rieng.
function genreSlugByName(name) {
    var map = {
        "玄幻奇幻": "xuanhuan",
        "言情": "yanqing",
        "武俠仙俠": "xianxia",
        "軍事歷史": "lishi",
        "科幻未來": "wangyou",
        "靈異玄幻": "lingyi",
        "女生同人": "tongren",
        "原創同人": "erciyuan",
        "耽美": "danmei",
        "百合": "baihe",
        "日系": "japan",
        "奇幻冒險": "fanatsy",
        "電視劇": "drama",
        "情色工口": "herotic",
        "耽美工口": "blerotic",
        "經典文學": "classicbook",
        "推理": "suspense",
        "女性向": "girl",
        "短篇": "short",
        "狂人原創": "creator",
        "精選排行": "normal",
        "人氣榜": "all",
        "收藏榜": "favorite",
        "完本榜": "finish",
        "工口榜": "hot"
    };
    var n = cleanText(name || "");
    return map[n] ? map[n] : "";
}

// Cover: img dung src truc tiep (khong lazy-load). Truyen chua co cover
// that dung /images/default_no_thumbnail.jpg -> tra "".
function coverFromImg(img) {
    if (img === null) return "";
    var src = img.attr("data-src") || img.attr("data-original") || img.attr("src") || "";
    if (!src) return "";
    if (src.indexOf("default_no_thumbnail") !== -1) return "";
    return absUrl(src);
}

// Giai quyet link tim duoc tren trang thanh URL tuyet doi.
// QUAN TRONG: czbooks.net dung link protocol-relative (//czbooks.net/...)
// — absUrl() cua lib khong nhan dang dang nay (no chi biet http(s) hoac
// /...), nen phai them "https:" truoc roi moi goi absUrl, neu khong se
// ra URL nhan doi host (https://czbooks.net//czbooks.net/...).
function resolveHref(href) {
    if (!href) return "";
    href = String(href);
    if (href.indexOf("//") === 0) href = "https:" + href;
    return absUrl(href);
}

// C1 (2026-11-09): site tra 404 khi URL truyen/chuong co dau "/" cuoi
// (kiem chung live: /n/s6pbed/ -> 404, /n/s6pbed -> 200) — bo dau "/"
// cuoi cua URL /n/... truoc khi fetch. Chi ap dung cho path /n/...
// (khong dung cho /c/... hay /s/... chua kiem chung).
function stripNovelTrailingSlash(url) {
    var s = String(url || "");
    if (s.charAt(s.length - 1) === "/" && s.indexOf("/n/") !== -1 && s.indexOf("?") === -1 && s.indexOf("#") === -1) {
        return s.substring(0, s.length - 1);
    }
    return s;
}

// Parse MOT the truyen o trang danh sach / tim kiem:
//   li.novel-item-wrapper > div.novel-item
//   link: div.novel-item-cover-wrapper > a[href="//czbooks.net/n/{slug}"]
//   ten: div.novel-item-title[title] (text giong title)
//   cover: div.novel-item-thumbnail > img[src]
//   badge: div.novel-item-state (已完結/試閱本/看這本！/斷更)
//   tac gia: div.novel-item-author > a
//   chuong moi: div.novel-item-newest-chapter > a
//   ngay: div.novel-item-date
//   收藏/观看: div.novel-item-status li (i.fas.fa-bookmark / i.fas.fa-eye)
function parseNovelItem(el) {
    var link = "";
    var coverLink = el.select("div.novel-item-cover-wrapper > a").first();
    if (coverLink !== null) link = coverLink.attr("href") || "";
    if (!link) {
        // Du phong: <a> dau tien co href dang /n/{slug-truyen}
        // (khong lay link chuong moi /n/{slug}/{chuong}).
        var anchors = el.select('a[href*="/n/"]');
        var i = 0;
        for (i = 0; i < anchors.size(); i++) {
            var href = anchors.get(i).attr("href") || "";
            if (/\/n\/[^\/]+$/.test(href)) { link = href; break; }
        }
    }
    if (!link) return null;
    link = resolveHref(link);
    link = stripNovelTrailingSlash(link);

    var titleEl = el.select("div.novel-item-title").first();
    var name = "";
    if (titleEl !== null) {
        name = cleanText(titleEl.attr("title")) || cleanText(titleEl.text());
    }
    if (!name) return null;

    var img = el.select("div.novel-item-thumbnail img").first();
    if (img === null) img = el.select("img").first();

    var state = cleanText(el.select("div.novel-item-state").text());
    var author = cleanText(el.select("div.novel-item-author a").text());
    if (!author) author = cleanText(el.select("div.novel-item-author").text()).replace(/^作者:\s*/, "");
    var newestEl = el.select("div.novel-item-newest-chapter a").first();
    var newest = newestEl !== null ? cleanText(newestEl.text()) : "";
    var date = cleanText(el.select("div.novel-item-date").text());
    var counts = [];
    el.select("div.novel-item-status li").forEach(function (li) {
        var t = cleanText(li.text());
        if (t) counts.push(t);
    });

    var desc = "";
    if (author) desc = author;
    if (newest) desc = desc ? desc + " — 最新：" + newest : "最新：" + newest;
    if (date) desc = desc ? desc + " — " + date : date;
    if (counts.length > 0) desc = desc ? desc + " — " + counts.join(" / ") : counts.join(" / ");

    return {
        name: htmlDecode(name),
        cover: coverFromImg(img),
        link: link,
        description: desc,
        tag: state,
        host: siteOrigin()
    };
}

// Giai ma cac HTML entity pho bien trong tieu de/mo ta lay tu thuoc tinh HTML.
function htmlDecode(s) {
    var text = String(s === undefined || s === null ? "" : s);
    var map = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " "
    };
    var key = "";
    for (key in map) {
        text = text.split(key).join(map[key]);
    }
    text = text.replace(/&#(\d+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 10));
    });
    text = text.replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 16));
    });
    return text;
}

// Token trang ke cua cac trang danh sach (tim kiem / the loai / bang):
//   ul.nav.paginate — li.active la trang hien tai, cac link /{...}/{N},
//   link cuoi co the la "11~" (text co dau "~").
// Tra ve PATH cua trang ke (vd "/c/xuanhuan/2"), "" khi het trang.
// Luot goi sau nhan page bat dau bang "/" thi fetch thang path do.
function nextListPath(doc) {
    var current = 1;
    var active = doc.select("ul.paginate li.active a").first();
    if (active !== null) {
        var n = parseInt(cleanText(active.text()), 10);
        if (!isNaN(n)) current = n;
    }
    var want = current + 1;
    var next = "";
    doc.select("ul.paginate a").forEach(function (a) {
        if (next) return;
        var t = cleanText(a.text()).replace(/~/g, "");
        var num = parseInt(t, 10);
        if (!isNaN(num) && num === want) {
            var href = a.attr("href") || "";
            if (href.charAt(0) === "/") next = href;
            else if (href.indexOf("http") === 0) {
                var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
                if (m) next = m[1];
            }
        }
    });
    return next;
}

// Lay Document, thu mirror neu domain chinh chet (dung MIRROR_LIST trong
// config.js qua fetchWithFallback trong fetch-helpers.js). Tra ve Document
// hoac null. Dung thay cho fetchDoc() o cac script cua extension nay.
