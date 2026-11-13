// search.js — Tim kiem: GET /?s=<tu khoa> (form mac dinh WordPress,
// go co dau duoc, khong dau cung tra ket qua — kiem chung 2026-11-14:
// "chong toi phai long ban than" tra dung truyen dich, 24 ket qua/trang).
// Phan trang /page/N/?s=<tu khoa>.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(key, page) {
    if (!key) return Response.success([], "");
    if (!page) page = "1";

    var encodedKey = encodeURIComponent(key);
    var searchUrl;
    if (page === "1") {
        searchUrl = BASE_URL + "/?s=" + encodedKey;
    } else {
        searchUrl = BASE_URL + "/page/" + page + "/?s=" + encodedKey;
    }

    var r = fetchVivuPage(searchUrl);
    if (r.error) return Response.error(r.error);

    var data = collectStoryCards(r.doc);
    if (data.length === 0) return Response.success([], "");

    var next = detectNextPageToken(r.doc, page);
    return Response.success(data, next);
}
