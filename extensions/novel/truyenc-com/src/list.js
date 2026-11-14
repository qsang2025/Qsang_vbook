load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Paged story listing behind the home tabs and the genre chips. `query` is
// a category url ("/tim-truyen-ma", "/truyen-ma-dai-ky", ...).
function execute(query, page) {
    var url = cleanText(query) || "/tim-truyen-ma";
    if (url.indexOf("/") === 0) url = siteOrigin() + url;
    url = absUrl(url);

    if (isExcludedSection(url)) {
        return Response.error("Mục này không có trong nguồn Truyện ma & Truyện cười");
    }

    rateLimitDelay("truyenc.com");
    var response = fetch(pagedUrl(url, page));
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    return Response.success(storyItems(doc), nextPageToken(doc));
}
