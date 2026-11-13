// toc.js — Muc luc chuong: GET /api/novels/<id> tra {novel, modules}
// day du 1 lan (khong phan trang — truyen 330 chuong van tra du 1 lan,
// kiem chung tu VM 2026-11-14). Giu nguyen thu tu module / chuong nhu
// API tra (la thu tu doc). Tat ca chuong deu doc duoc: chuong co
// chapterBalance > 0 van tra day du noi dung khi khong dang nhap
// (kiem chung ch.301 Trong Sinh Tu Tien Doi Thuong, balance 167:
// 202 doan day du) nen khong danh dau khoa / tra phi.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var novelId = extractNovelId(url);
    if (!novelId) return Response.error("URL truyện không hợp lệ");

    var r = fetchApiJson("/api/novels/" + novelId);
    if (r.error) return Response.error(r.error);
    var data = r.data || {};
    if (!data.novel) return Response.error("Không tải được danh sách chương");

    var chapters = [];
    var modules = data.modules || [];
    for (var mi = 0; mi < modules.length; mi++) {
        var modChaps = modules[mi].chapters || [];
        for (var ci = 0; ci < modChaps.length; ci++) {
            var chap = modChaps[ci];
            chapters.push({
                name: chap.title || ("Chương " + (chap.order + 1)),
                url: makeChapUrl(novelId, chap._id),
                host: BASE_URL
            });
        }
    }

    if (chapters.length === 0) return Response.error("Truyện chưa có chương nào");
    return Response.success(chapters);
}
