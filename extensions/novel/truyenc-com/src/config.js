// Shared code for the TruyenC.com extension (truyenc.com).
// Every other script starts by loading this file; a loaded library must not
// load another file, so all helpers live here. Scripts that fetch load the
// rate-limit and safe-first files themselves, after this file.
//
// Scope: ghost stories (truyen ma) and jokes (truyen cuoi) ONLY. The site's
// 18+ section and audio section are out of scope (see TRUYENC-PROGRESS.md
// section 1); helpers below filter them out of genres, detail and search.
// Do NOT confuse this source with truyenc.net (a different novel site,
// extension "TruyenC" in extensions/novel/truyenc/).
//
// Pages are served from truyenc.com; covers live on the i.truyenc.com image
// CDN. BASE_URL is only the page host — cover URLs come back absolute and
// are never rewritten.

var BASE_URL = "https://truyenc.com";
try {
    if (DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var SITEMAP_CACHE_KEY = "truyenccom-sitemap-v1";

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

// True when a category/story URL belongs to an out-of-scope section
// (18+ or audio). The check is on the URL path, not on the label: some
// jokes carry a "Truyen cuoi 18+" badge even though the joke itself is
// clean, so labels are never used for filtering.
function isExcludedSection(url) {
    var lower = String(url).toLowerCase();
    var path = lower.replace(/^https?:\/\/[^\/]+/, "");
    if (path === "/tim-truyen-18" || path.indexOf("/tim-truyen-18/") === 0) return true;
    if (path === "/tim-truyen-audio" || path.indexOf("/tim-truyen-audio/") === 0) return true;
    if (path === "/truyen-sex" || path.indexOf("/truyen-sex") === 0) return true;
    if (path === "/truyen-h" || path.indexOf("/truyen-h/") === 0 || path.indexOf("/truyen-h?") === 0) return true;
    if (path === "/truyen-sac-hiep" || path.indexOf("/truyen-sac-hiep") === 0) return true;
    if (path === "/truyen-dam-hiep" || path.indexOf("/truyen-dam-hiep") === 0) return true;
    if (path === "/truyen-cuoi-18" || path.indexOf("/truyen-cuoi-18") === 0) return true;
    if (path.indexOf("/truyen-ma-audio") === 0) return true;
    if (path.indexOf("/truyen-audio") === 0) return true;
    return false;
}

// One story row. Every listing (home page and category pages alike) renders
// the same `div.d-flex` block: cover in `img.story-image`, category badge,
// title in `h2`, excerpt in `p.mt-2` and the story link on both the cover
// and the button.
function storyItem(el) {
    var img = safeFirst(el.select("img.story-image"));
    if (img === null) return null;

    var link = "";
    var anchors = el.select("a");
    for (var i = 0; i < anchors.size(); i++) {
        var href = anchors.get(i).attr("href");
        if (href && String(href).indexOf("/truyen/") !== -1) {
            link = absUrl(href);
            break;
        }
    }
    if (!link) return null;

    var name = cleanText(el.select("h2").text()) || cleanText(img.attr("alt"));
    if (!name) return null;

    var description = safeFirst(el.select("p.mt-2"));
    var badge = safeFirst(el.select("a.badge"));

    return {
        name: name,
        cover: img.attr("src"),
        link: link,
        description: description === null ? "" : cleanText(description.text()),
        tag: badge === null ? "" : cleanText(badge.text()),
        host: siteOrigin()
    };
}

function storyItems(node) {
    var items = [];
    node.select("div.d-flex").forEach(function (el) {
        var item = storyItem(el);
        if (item) items.push(item);
    });
    return items;
}

// Next page number from `ul.pagination`, or "" on the last page. The last
// page still renders a "Trang sau" link pointing at itself, so compare with
// the highest page number the pager links to instead of testing for that
// link.
function nextPageToken(doc) {
    var current = 1;
    var active = safeFirst(doc.select("ul.pagination li.active a.page-link"));
    if (active !== null) {
        var match = String(active.attr("href")).match(/[?&]page=(\d+)/);
        if (match) current = parseInt(match[1], 10);
    }

    var last = current;
    doc.select("ul.pagination a.page-link").forEach(function (el) {
        var match = String(el.attr("href")).match(/[?&]page=(\d+)/);
        if (match) last = Math.max(last, parseInt(match[1], 10));
    });

    return last > current ? String(current + 1) : "";
}

function pagedUrl(url, page) {
    var number = parseInt(page, 10);
    if (isNaN(number) || number < 1) number = 1;
    if (number === 1) return url;
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "page=" + number;
}

// Sub-categories of one top-level section page (/tim-truyen-ma or
// /tim-truyen-cuoi). The page's own list sits in
// `div.content.mb-2 div.list-group` (the slide-out menu has its own
// list-group with every section — that one is NOT selected here).
// Returns [{ title, input }] or null when the page cannot be read.
function sectionCategories(pageUrl) {
    rateLimitDelay("truyenc.com");
    var response = fetch(pageUrl);
    if (!response.ok) return null;
    var doc = response.html();

    var categories = [];
    var seen = {};
    doc.select("div.content.mb-2 div.list-group a").forEach(function (el) {
        var href = el.attr("href");
        if (!href) return;
        var url = absUrl(href);
        if (seen[url] || isExcludedSection(url)) return;

        // The row holds the name in its first span and the story count in a
        // badge span.
        var label = safeFirst(el.select("span"));
        var title = cleanText(label === null ? "" : label.text());
        if (!title) return;

        seen[url] = true;
        categories.push({ title: title, input: url });
    });

    return categories.length > 0 ? categories : null;
}

// ---------------------------------------------------------------------------
// Search support.
//
// The site publishes no keyword search (its /tim-kiem route answers the
// empty "unclassified" page for every term), so search matches the query
// against the story slugs in the site's own sitemap.xml, then reads the
// matching story pages for their real titles and covers.
// ---------------------------------------------------------------------------

// Vietnamese diacritics are folded so "cam tu" matches the slug "cam-tu".
function foldVietnamese(text) {
    return String(text).toLowerCase()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
        .replace(/[èéẹẻẽêềếệểễ]/g, "e")
        .replace(/[ìíịỉĩ]/g, "i")
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
        .replace(/[ùúụủũưừứựửữ]/g, "u")
        .replace(/[ỳýỵỷỹ]/g, "y")
        .replace(/đ/g, "d");
}

function queryTokens(query) {
    var folded = foldVietnamese(query).replace(/[^a-z0-9]+/g, " ").trim();
    if (!folded) return [];
    return folded.split(" ");
}

// Every token must be a whole word of the slug, so "han" does not match
// "hanh-trinh".
function slugMatches(slug, tokens) {
    var padded = "-" + slug + "-";
    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] && padded.indexOf("-" + tokens[i] + "-") === -1) return false;
    }
    return true;
}

// Story slugs from the site's sitemap (~2000 entries), cached. Returns an
// array, or null when the sitemap cannot be read.
function sitemapSlugs() {
    var cached = null;
    try {
        cached = cacheStorage.getItem(SITEMAP_CACHE_KEY);
    } catch (e) {
    }
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
        }
    }

    rateLimitDelay("truyenc.com");
    var response = fetch(siteOrigin() + "/sitemap.xml");
    if (!response.ok) return null;

    // An XML sitemap is not queryable through the DOM parser, so read the
    // raw text and pull the story slugs out of the <loc> entries.
    var xml = response.text();
    var slugs = [];
    var pattern = /<loc>([^<]*\/truyen\/[^<]+)<\/loc>/g;
    var match;
    while ((match = pattern.exec(xml)) !== null) {
        var url = match[1].replace(/\s+$/, "");
        var slug = url.substring(url.indexOf("/truyen/") + 8);
        if (slug && slug.indexOf("/") === -1) slugs.push(slug);
    }
    if (slugs.length === 0) return null;

    try {
        cacheStorage.setItem(SITEMAP_CACHE_KEY, JSON.stringify(slugs));
    } catch (e) {
    }
    return slugs;
}

// The top-level section of a story page, from its FIRST category badge
// (h6.color-highlight a.badge): /tim-truyen-ma, /tim-truyen-cuoi,
// /tim-truyen-18 or /tim-truyen-audio. Returns "" when unreadable.
function storySection(doc) {
    var badges = doc.select("h6.color-highlight a.badge");
    if (badges.size() === 0) return "";
    var first = badges.get(0);
    if (!first) return "";
    return absUrl(first.attr("href"));
}
