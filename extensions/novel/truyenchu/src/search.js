// search.js — Tim kiem: GET /?s=<tu khoa>&post_type=wp-manga (form tim
// kiem cua Madara — kiem chung tu VM 2026-11-13: "quang am" tra 12 ket
// qua, co "Quang Am Chi Ngoai"; phan trang /page/N/?s=<tu khoa>).
// Ket qua dung layout the truyen nhu trang danh sach (22 muc/trang).
// Go co dau duoc.
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

    var key = String(keyword).trim();
    if (!key) return Response.success([], "");
    var encoded = encodeURIComponent(key);
    var fetchUrl = BASE_URL + "/?s=" + encoded + "&post_type=wp-manga";
    if (String(page) !== "1") {
        fetchUrl = BASE_URL + "/page/" + encodeURIComponent(String(page)) + "/?s=" + encoded + "&post_type=wp-manga";
    }
    var r = fetchTruyenchuPage(fetchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = detectNextPageToken(r.doc);
    return Response.success(data, next);
}
