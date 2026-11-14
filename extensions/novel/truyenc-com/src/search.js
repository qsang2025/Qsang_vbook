load('config.js');
load('rate-limit.js');
load('safe-first.js');

// The site has no keyword search, so the query is matched against the story
// slugs in its sitemap (see config.js). Each visible result is then read
// from its story page to show the real title and cover; those reads are
// cached per story. Stories from the out-of-scope sections (18+/audio) are
// skipped, judged by the FIRST category badge on their story page.
var SEARCH_PAGE_SIZE = 12;

function resolveStory(slug) {
    var url = siteOrigin() + "/truyen/" + slug;
    var key = "truyenccom-story-v1:" + slug;

    var cached = null;
    try {
        cached = cacheStorage.getItem(key);
    } catch (e) {
    }
    if (cached) {
        try {
            return JSON.parse(cached);
        } catch (e) {
        }
    }

    rateLimitDelay("truyenc.com");
    var response = fetch(url);
    if (!response.ok) return null;
    var doc = response.html();

    // Out-of-scope section (18+/audio): skip, do not cache.
    if (isExcludedSection(storySection(doc))) return null;

    var name = cleanText(doc.select("div.page-title h1").text());
    if (!name) return null;
    var img = safeFirst(doc.select("img.story-image"));
    var item = {
        name: name,
        link: url,
        cover: img === null ? "" : img.attr("src"),
        host: siteOrigin()
    };

    try {
        cacheStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
    }
    return item;
}

function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.success([], "");

    var tokens = queryTokens(query);
    if (tokens.length === 0) return Response.success([], "");

    var slugs = sitemapSlugs();
    if (slugs === null) return Response.error("Không tải được danh sách truyện");

    // Stories whose slug starts with the query rank first, then the rest by name.
    var prefix = tokens.join("-");
    var leading = [];
    var rest = [];
    for (var i = 0; i < slugs.length; i++) {
        if (!slugMatches(slugs[i], tokens)) continue;
        if (slugs[i].indexOf(prefix) === 0) leading.push(slugs[i]); else rest.push(slugs[i]);
    }
    leading.sort();
    rest.sort();
    var matches = leading.concat(rest);

    var current = parseInt(page, 10);
    if (isNaN(current) || current < 1) current = 1;
    var offset = (current - 1) * SEARCH_PAGE_SIZE;
    var end = Math.min(offset + SEARCH_PAGE_SIZE, matches.length);

    var items = [];
    for (var j = offset; j < end; j++) {
        var item = resolveStory(matches[j]);
        if (item) items.push(item);
    }

    return Response.success(items, end < matches.length ? String(current + 1) : "");
}
