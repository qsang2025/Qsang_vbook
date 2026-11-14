load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Paged story listing behind the home tabs and the genre chips. `query` is
// a genre url ("/truyen-ma/" or absolute). 20 stories per page.
function execute(query, page) {
    var url = cleanText(query) || "/truyen-ma/";
    if (url.indexOf("/") === 0) url = siteOrigin() + url;
    url = absUrl(url);

    rateLimitDelay("doctruyen14.biz");
    var response = fetch(pagedUrl(url, page));
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    return Response.success(storyItems(doc), nextPageToken(doc));
}
