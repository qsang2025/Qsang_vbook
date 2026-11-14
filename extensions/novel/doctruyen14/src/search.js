load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Keyword search: GET /?s=<kw>, 20 results per page, /page/N/?s=<kw>.
// The site search matches the query against titles and story text (not
// just slugs), so it works with and without diacritics.
function execute(query, page) {
    query = cleanText(query);
    if (!query) return Response.success([], "");

    rateLimitDelay("doctruyen14.biz");
    var response = fetch(searchUrl(query, page));
    if (!response.ok) return Response.error("HTTP " + response.status);
    var doc = response.html();

    return Response.success(storyItems(doc), nextPageToken(doc));
}
