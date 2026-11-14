// toc.js — Muc luc LilyHub.
// Luu y: chapter_number KHONG lien tuc (ngoai truyen nam o so rat lon,
// vi du 1000002), nen phai lay dung danh sach server tra ve thay vi tu
// sinh 0..chapter_count-1. Lay du 1 lan (limit=2000), khong can page.js.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    var id = lilyNovelId(url);
    if (!id) return Response.error("Không đọc được mã truyện từ URL này.");

    var rows = lilyQuery("chapters?select=chapter_number,title&novel_id=eq." + id + "&order=chapter_number.asc&limit=2000");
    if (!rows) return Response.error("Không lấy được mục lục từ LilyHub.");
    if (!rows.length) return Response.error("Truyện này hiện chưa có chương nào.");

    var out = [];
    var seen = {};
    for (var i = 0; i < rows.length; i++) {
        var num = rows[i].chapter_number;
        var link = BASE_URL + "/truyen/" + id + "/" + num;
        if (seen[link]) continue;
        seen[link] = true;
        out.push({
            name: (rows[i].title ? rows[i].title + "" : "Chương " + num),
            url: link,
            host: "https://www.lilyhub.top"
        });
    }
    return Response.success(out);
}
