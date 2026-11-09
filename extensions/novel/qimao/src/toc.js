// toc.js — muc luc chuong cua 七猫免费小说 (qimao.com).
// API chinh thuc cua app (khao sat 2026-11-09, da kiem chung live tu VM
// + tren may that — xem qimao-api.js):
//   GET https://api-ks.wtzw.com/api/v1/chapter/chapter-list
//   params ky: {chapter_ver:"0", id:"<bookid>"}
//   data.chapter_lists[]: {id, content_md5, index, title, words,
//   chapter_sort} — sap xep theo chapter_sort.
// Vi du that: 10090611 tra DU 510 chuong, dau 第1章 为了小慧的名声，
// 我愿意负责 (id 41836422), cuoi 第510章 双胞胎该喊小舅还是弟弟（完结篇）
// (id 48554501). Link chuong that: /shuku/<bookid>-<chapterid>/.
// KHONG tu tinh so chuong, KHONG tu sinh link — chi dung id + title
// that tu API, giu dung thu tu chapter_sort.
// Catalog API khong co co is_vip — de lock/pay = false (noi dung chuong
// van doc duoc qua chapterData giai ma, xem chap.js); neu sau nay API
// them is_vip thi gan co vao day.
//
// Load: build se copy crypto.js (built-in), config.js, config-helpers.js,
// fetch-helpers.js, qimao-api.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('crypto.js');
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('qimao-api.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/shuku\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var json = qimaoApiGet(QIMAO_API_KS, "/api/v1/chapter/chapter-list", {
        chapter_ver: "0",
        id: bookId
    }, bookId);
    if (!json) return Response.error("Không tải được mục lục (lỗi mạng hoặc API 七猫 không trả về): " + url);

    var data = json.data || {};
    var list = data.chapter_lists || [];
    if (!list || list.length === 0) {
        return Response.error("Không đọc được mục lục (API trả về rỗng): " + url);
    }

    // Sap xep theo chapter_sort (so), du phong index.
    list.sort(function (a, b) {
        var sa = (a.chapter_sort === undefined || a.chapter_sort === null) ? parseInt(a.index, 10) : a.chapter_sort;
        var sb = (b.chapter_sort === undefined || b.chapter_sort === null) ? parseInt(b.index, 10) : b.chapter_sort;
        if (isNaN(sa)) sa = 0;
        if (isNaN(sb)) sb = 0;
        return sa - sb;
    });

    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var c = list[i];
        var cid = c.id || "";
        var title = cleanText(c.title || "");
        if (!cid || !title) continue;
        var link = BASE_URL + "/shuku/" + bookId + "-" + cid + "/";
        if (seen[link]) continue;
        seen[link] = true;
        chapters.push({
            name: title,
            url: link,
            description: c.words ? String(c.words) + "字" : "",
            lock: false,
            pay: false
        });
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (API trả về rỗng): " + url);
    return Response.success(chapters);
}
