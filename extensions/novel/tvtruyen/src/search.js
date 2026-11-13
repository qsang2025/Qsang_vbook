// search.js — Tim kiem: GET /tim-kiem?tukhoa=<slug-khong-dau>&page=N.
// Site tu slug-hoa tu khoa co dau (301 ve dang khong dau) nen slug-hoa
// truoc nhu base. Ket qua dung layout .info-mobile-card (30 muc/trang).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(query, page) {
    var keyword = query;
    if (typeof query === "object" && query !== null && query.length !== undefined) {
        keyword = query[0];
        page = query[1];
    }
    if (!keyword) return Response.success([], "");
    if (!page) page = "1";

    var key = toSlug(keyword);
    if (!key) return Response.success([], "");
    var fetchUrl = BASE_URL + "/tim-kiem?tukhoa=" + encodeURIComponent(key) + "&page=" + encodeURIComponent(String(page));
    var r = fetchTvPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = "";
    var nextUrl = detectNextPage(r.doc);
    if (nextUrl) next = extractPageToken(nextUrl, page);
    return Response.success(data, next);
}
