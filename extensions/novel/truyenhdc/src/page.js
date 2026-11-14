// page.js — Phan trang muc luc TruyenHD (truyenhdc.com).
//
// Muc luc tren trang chi tiet chi hien 50 chuong/trang, phan trang
// bang .pagination li[data-id] (mau: 7 trang). Moi trang sau lay qua
// POST admin-ajax user_truyen_pagination (id + slug o #views).
// Tra ve mang token — toc.js se doc tung token (mau theo base
// Darkrai9x v15). Token DAU TIEN la URL trang chi tiet (khong phai
// payload trang 1): phan hoi AJAX khong co badge VIP (kiem chung
// tren may that 2026-11-14: vipCount=0) nen chi doc truc tiep trang
// chi tiet moi danh dau duoc chuong VIP (mau: ch.31-50); cac trang
// sau dung payload AJAX nhu thuong.
// Truyen khong co #dsc: dung action all_chap lay toan bo muc luc.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link truyện không hợp lệ.");
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var viewsEl = selFirst(doc, "#views");
    var dataId = viewsEl ? (viewsEl.attr("data-id") || "") : "";
    var dataSlug = viewsEl ? (viewsEl.attr("data-slug") || "") : "";
    if (!dataId) return Response.error("Không đọc được mã truyện để tải mục lục: " + full);

    var list = [];
    var dscEl = selFirst(doc, "#dsc");
    if (!dscEl) {
        list.push(JSON.stringify({ action: "all_chap", id: dataId }));
        return Response.success(list);
    }
    var maxPage = 1;
    doc.select(".pagination li[data-id]").forEach(function (el) {
        var n = parseInt(el.attr("data-id") || "0", 10);
        if (!isNaN(n) && n > maxPage) maxPage = n;
    });
    // Token dau = URL trang chi tiet (giữ dấu VIP trang 1 — xem
    // ghi chu o dau file); cac trang sau = payload AJAX.
    list.push(full);
    for (var i = 2; i <= maxPage; i++) {
        list.push(JSON.stringify({
            action: "user_truyen_pagination",
            page: i,
            type: "",
            id: dataId,
            slug: dataSlug
        }));
    }
    return Response.success(list);
}
