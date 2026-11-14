// genre.js — Danh sach the loai Xa Lo Sach (xalosach.com).
// Doc live tu nav trang chu (83 muc rieng biet, kiem chung 2026-11-14);
// neu fetch that bai thi dung danh sach cung gom cac the loai chinh
// (base v3 chi co 15 muc cung — site hien co nhieu hon the).

load("config.js");
load("rate-limit.js");

function execute() {
    var fallback = [
        { title: "Tiên Hiệp", input: BASE_URL + "/the-loai/tien-hiep.html", script: "gen.js" },
        { title: "Huyền Huyễn", input: BASE_URL + "/the-loai/huyen-huyen.html", script: "gen.js" },
        { title: "Đô Thị", input: BASE_URL + "/the-loai/do-thi.html", script: "gen.js" },
        { title: "Khoa Huyễn", input: BASE_URL + "/the-loai/khoa-huyen.html", script: "gen.js" },
        { title: "Kiếm Hiệp", input: BASE_URL + "/the-loai/kiem-hiep.html", script: "gen.js" },
        { title: "Võng Du", input: BASE_URL + "/the-loai/vong-du.html", script: "gen.js" },
        { title: "Dị Giới", input: BASE_URL + "/the-loai/di-gioi.html", script: "gen.js" },
        { title: "Đồng Nhân", input: BASE_URL + "/the-loai/dong-nhan.html", script: "gen.js" },
        { title: "Ngôn Tình", input: BASE_URL + "/the-loai/ngon-tinh.html", script: "gen.js" },
        { title: "Cổ Đại", input: BASE_URL + "/the-loai/co-dai.html", script: "gen.js" },
        { title: "Dã Sử", input: BASE_URL + "/the-loai/da-su.html", script: "gen.js" },
        { title: "Hệ Thống", input: BASE_URL + "/the-loai/he-thong.html", script: "gen.js" },
        { title: "Học Đường", input: BASE_URL + "/the-loai/hoc-duong.html", script: "gen.js" },
        { title: "Xuyên Không", input: BASE_URL + "/the-loai/xuyen-khong.html", script: "gen.js" },
        { title: "Hài Hước", input: BASE_URL + "/the-loai/hai-huoc.html", script: "gen.js" }
    ];
    var r = xlsFetchDoc(BASE_URL + "/", BASE_URL + "/");
    if (r.error || !r.doc) return Response.success(fallback);
    var els = r.doc.select("a.dropdown-item[href*=\"/the-loai/\"]");
    var list = [];
    var seen = {};
    for (var i = 0; i < els.size(); i++) {
        var e = els.get(i);
        var href = e.attr("href");
        var title = cleanText(e.text());
        if (!href || !title) continue;
        if (seen[href]) continue;
        seen[href] = true;
        list.push({ title: title, input: absUrl(href), script: "gen.js" });
    }
    if (list.length < 10) return Response.success(fallback);
    return Response.success(list);
}
