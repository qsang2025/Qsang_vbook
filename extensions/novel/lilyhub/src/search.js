// search.js — Tim kiem LilyHub.
// API PostgREST dung `ilike` nhung o day ilike lai phan biet HOA/thuong va
// khong bo dau ("DUYÊN" khong khop "duyen"), nen ta tai danh sach (site nho)
// roi tu so khop khong phan biet HOA/thuong + bo dau: "nguoi" se ra "NGƯỜI".

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(keyword, page) {
    var kw = keyword + "";
    if (!kw) return Response.error("Vui lòng nhập từ khoá tìm kiếm.");
    var pn = parseInt(page + "", 10);
    if (!pn || pn < 1) pn = 1;

    // chapter_count=gt.0: truyen chua co chuong thi khong doc duoc trong VBook
    var rows = lilyQuery("novels?select=id,title,author,cover_url,description,status,chapter_count,category&is_hidden=eq.false&chapter_count=gt.0&limit=200");
    if (!rows) return Response.error("Không lấy được danh sách truyện từ LilyHub.");

    var needle = lilyFoldName(kw);
    var hit = [];
    for (var i = 0; i < rows.length; i++) {
        var title = lilyFoldName(rows[i].title);
        var author = lilyFoldName(rows[i].author);
        if (title.indexOf(needle) >= 0 || author.indexOf(needle) >= 0) hit.push(rows[i]);
    }

    if (!hit.length) return Response.success([], "");

    var from = (pn - 1) * LILY_PAGE_SIZE;
    var out = [];
    for (var j = from; j < hit.length && out.length < LILY_PAGE_SIZE; j++) {
        var n = hit[j];
        out.push({
            name: n.title + "",
            link: BASE_URL + "/truyen/" + n.id,
            cover: lilyCover(n.cover_url),
            description: lilyShortDesc(n),
            host: "https://www.lilyhub.top"
        });
    }
    var next = (from + LILY_PAGE_SIZE < hit.length) ? String(pn + 1) : "";
    return Response.success(out, next);
}
