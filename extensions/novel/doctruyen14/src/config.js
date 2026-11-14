// Shared code for the DocTruyen14 extension (doctruyen14.biz).
// Every other script starts by loading this file; a loaded library must not
// load another file, so all helpers live here. Scripts that fetch load the
// rate-limit and safe-first files themselves, after this file.
//
// Scope: ALL 7 genres, per the user's decision 2026-11-14 23:39 ("Gắn cờ
// nsfw, build đủ 7 thể loại"). The site is an 18+ adult-story site, so the
// manifest carries nsfw: true and its description states 18+ clearly
// (NiACG / MongTruyen / TruyệnHD / Banshanren / FanMTL precedent).
//
// The site is WordPress with a custom theme. The WP REST API is login-locked
// (401 restx_logged_out), so everything is scraped from HTML. Posts are
// single-installment short stories read in full on one page
// (div.entry-content); a "series" is just separate posts, each one chapter,
// with no chapter links between them. There is no cover image anywhere on
// the site (story cards carry no <img>, detail pages have no og:image).
// Genre URLs are /<genre-slug>/, 20 stories per page, /page/N/ pagination.
// Search is GET /?s=<kw>, 20 results per page, /page/N/?s=<kw>.

var BASE_URL = "https://doctruyen14.biz";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

// The site's 7 genres, in the site's own order (home page box order).
var GENRES = [
    { slug: "truyen-sex-nguoi-lon", title: "Truyện Sex Người Lớn" },
    { slug: "truyen-ma", title: "Truyện Ma" },
    { slug: "truyen-teen", title: "Truyện Teen" },
    { slug: "truyen-tinh-cam", title: "Truyện Tình Cảm" },
    { slug: "truyen-cuoi", title: "Truyện Cười" },
    { slug: "truyen-gay", title: "Truyện Gay" },
    { slug: "truyen-les", title: "Truyện Les" }
];

function siteOrigin() {
    var match = BASE_URL.match(/^(https?:\/\/[^\/]+)/);
    return match ? match[1] : BASE_URL;
}

// Rewrite an incoming url's host (old/mirror/www-prefixed) to BASE_URL,
// keeping path and query. Call this first thing in every url-receiving
// execute(url).
function normalizeUrl(url) {
    var match = String(url).match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?[^\/\n]+(\/.*)$/);
    return match ? siteOrigin() + match[1] : String(url);
}

// Resolve a link found on a page into an absolute site url.
function absUrl(href) {
    if (!href) return "";
    href = String(href);
    if (/^https?:\/\//i.test(href)) return normalizeUrl(href);
    if (href.charAt(0) === "/") return siteOrigin() + href;
    return BASE_URL + "/" + href;
}

function cleanText(text) {
    return String(text === undefined || text === null ? "" : text)
        .replace(/[\s\u3000]+/g, " ")
        .trim();
}

// One story card. Category and search pages render the same
// `article.post.story-card` block: link on `a.story-card__link`, title in
// `h2.entry-title`, excerpt in `p.story-card__excerpt`, author chip in the
// meta row. No cover exists on this site.
function storyItem(el) {
    var linkEl = safeFirst(el.select("a.story-card__link"));
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;

    var name = cleanText(el.select("h2.entry-title").text());
    if (!name) return null;

    var excerpt = safeFirst(el.select("p.story-card__excerpt"));
    var author = safeFirst(el.select("a.story-chip--author"));

    return {
        name: name,
        cover: "",
        link: absUrl(href),
        description: excerpt === null ? "" : cleanText(excerpt.text()),
        tag: author === null ? "" : cleanText(author.text()),
        host: siteOrigin()
    };
}

function storyItems(doc) {
    var items = [];
    doc.select("article.post.story-card").forEach(function (el) {
        var item = storyItem(el);
        if (item) items.push(item);
    });
    return items;
}

// Next page number, or "" on the last page. Three signals, in order:
// 1. the wp-pagenavi "next" link (a.next.page-numbers) -> /page/N/
// 2. <link rel="next" href=".../page/N/"> in the head
// 3. the <title> "Trang N trên M" (only on pages 2+)
function nextPageToken(doc) {
    var next = safeFirst(doc.select("a.next.page-numbers"));
    if (next !== null) {
        var m = String(next.attr("href")).match(/\/page\/(\d+)\//);
        if (m) return m[1];
    }

    var rel = safeFirst(doc.select("link[rel=next]"));
    if (rel !== null) {
        var m2 = String(rel.attr("href")).match(/\/page\/(\d+)\//);
        if (m2) return m2[1];
    }

    var title = cleanText(doc.select("title").text());
    var m3 = title.match(/Trang (\d+) trên (\d+)/);
    if (m3) {
        var cur = parseInt(m3[1], 10);
        var total = parseInt(m3[2], 10);
        if (cur < total) return String(cur + 1);
    }

    return "";
}

// Page-N url for a genre list: page 1 is the bare url, later pages are
// <url>page/N/ (the url always ends with "/").
function pagedUrl(url, page) {
    var number = parseInt(page, 10);
    if (isNaN(number) || number < 1) number = 1;
    if (number === 1) return url;
    var base = String(url);
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + "page/" + number + "/";
}

// Search url: page 1 is /?s=<kw>, later pages are /page/N/?s=<kw>.
function searchUrl(query, page) {
    var number = parseInt(page, 10);
    if (isNaN(number) || number < 1) number = 1;
    var q = encodeURIComponent(query);
    if (number === 1) return siteOrigin() + "/?s=" + q;
    return siteOrigin() + "/page/" + number + "/?s=" + q;
}
