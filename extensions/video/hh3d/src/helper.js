// helper.js — ham dung chung cua extension HH3D (hh3d.ad).
// Site WordPress + theme tuy chinh (giong HaLim):
//   danh sach: .movie-item > .movie-poster a.movie-link[href],
//              img[src], .movie-title a, .movie-original-title,
//              .episode-badge ("Tập N" — trang chu Mới Cập Nhật dung
//              a.movie-card-update1 thay cho .movie-item)
//   phan trang danh sach: a.next.page-numbers[href] (/page/N/)
//   chi tiet:  h1.movie-title-detail, meta og:image/og:description,
//              .detail-row (Ten / Ten Khac / The Loai / Tap moi nhat /
//              Thong Tin Khac / Danh Gia), span.genre-tag (chi text),
//              a.episode-item[href] (danh sach tap day du)
//   trang xem: var all_sources = ["https://.../index.m3u8"] (1 link,
//              chinh la link PhimAPI cua tap do — host thay doi theo
//              tap: s3/s4.phim1280.tv, a.kvp726.com...), var all_subtitles
//              (rong). Player ArtPlayer, khong player.php, khong streamfree.
// File nay duoc nap boi cac script khac, KHONG nap them file nao o day.
// Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js
// truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : siteOrigin();
}

function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src).replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}

// Map ten the loai (text trong span.genre-tag) ve duong dan /the-loai/.
var GENRE_PATHS = {
    "Tiên Hiệp": "tien-hiep",
    "Huyền Huyễn": "huyen-huyen",
    "Kiếm Hiệp": "kiem-hiep",
    "Cổ Trang": "co-trang",
    "Hiện Đại": "hien-dai",
    "Xuyên Không": "xuyen-khong",
    "Trùng Sinh": "trung-sinh",
    "Hài Hước": "hai-huoc"
};

function genreInputFor(name) {
    var slug = GENRE_PATHS[cleanText(name)];
    if (slug) return "/the-loai/" + slug + "/";
    return "";
}

// Parser mot card phim .movie-item (trang danh sach / tim kiem / the loai).
function parseFilmCard(item) {
    if (!item) return null;
    var nameLink = safeFirst(item.select(".movie-title a"));
    if (nameLink === null) nameLink = safeFirst(item.select("a.movie-link"));
    if (nameLink === null) return null;
    var name = cleanText(nameLink.attr("title")) || cleanText(nameLink.text());
    if (!name) {
        var img0 = safeFirst(item.select("img"));
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;
    var href = String(nameLink.attr("href") || "");
    if (!href) return null;
    var link = absUrl(href).replace(/\/+$/, "");
    var path = link.replace(/^https?:\/\/[^\/]+/i, "");
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    if (/^\/(the-loai|popular-tag|phim-le|hoan-thanh|danh-gia-cao|lich-chieu|tin-tuc|login|search|ajax|wp-)/.test(path)) {
        return null;
    }
    var cover = "";
    var img = safeFirst(item.select(".movie-poster img"));
    if (img === null) img = safeFirst(item.select("img"));
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
    }
    var tagParts = [];
    var orig = safeFirst(item.select(".movie-original-title"));
    if (orig !== null) {
        var ot = cleanText(orig.text());
        if (ot) tagParts.push(ot);
    }
    return {
        name: name,
        cover: cover,
        link: link,
        description: "",
        tag: tagParts.join(" · "),
        host: ""
    };
}

// Parser mot card "Moi Cap Nhat" tren trang chu: a.movie-card-update1.
function parseUpdateCard(a) {
    if (!a) return null;
    var href = String(a.attr("href") || "");
    if (!href) return null;
    var link = absUrl(href).replace(/\/+$/, "");
    var path = link.replace(/^https?:\/\/[^\/]+/i, "");
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    var name = "";
    var titleEl = safeFirst(a.select("h3.movie-title"));
    if (titleEl !== null) name = cleanText(titleEl.text());
    if (!name) {
        var img0 = safeFirst(a.select("img"));
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;
    var cover = "";
    var img = safeFirst(a.select("img"));
    if (img !== null) cover = unwrapCover(img.attr("src"));
    var tagParts = [];
    var badge = safeFirst(a.select(".episode-badge"));
    if (badge !== null) {
        var bt = cleanText(badge.text());
        if (bt) tagParts.push(bt);
    }
    var orig = safeFirst(a.select(".movie-original-title"));
    if (orig !== null) {
        var ot = cleanText(orig.text());
        if (ot) tagParts.push(ot);
    }
    return {
        name: name,
        cover: cover,
        link: link,
        description: "",
        tag: tagParts.join(" · "),
        host: ""
    };
}

// Parse trang danh sach (.movie-item) + token trang sau (duong dan /page/N/).
// Tra ve {items, next} — next la duong dan day du (vd. "/the-loai/tien-hiep/page/2/")
// hoac "" khi het.
function parseListPage(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".movie-item");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    var next = "";
    var nextA = safeFirst(doc.select("a.next.page-numbers[href]"));
    if (nextA !== null) {
        var href = String(nextA.attr("href") || "");
        if (href) {
            next = href.replace(/^https?:\/\/[^\/]+/i, "");
            if (next.indexOf("/") !== 0) next = "/" + next;
        }
    }
    return { items: items, next: next };
}

function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/i);
    if (!m) m = String(s || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

// Trich var all_sources = [...] tu HTML tho cua trang xem.
// Tra ve mang URL (thuong chi 1 link .m3u8).
function parseAllSources(html) {
    var out = [];
    var m = String(html || "").match(/var\s+all_sources\s*=\s*\[([\s\S]*?)\]/i);
    if (!m || !m[1]) return out;
    var parts = m[1].split(",");
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var u = String(parts[i] || "").replace(/^\s+|\s+$/g, "").replace(/^["']|["']$/g, "").replace(/\\"/g, "");
        if (u && (u.indexOf(".m3u8") !== -1 || u.indexOf(".mp4") !== -1)) {
            out.push(u.replace(/&amp;/g, "&"));
        }
    }
    return out;
}
