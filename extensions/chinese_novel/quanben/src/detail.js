// detail.js — Thong tin chi tiet mot truyen QuanBen (quanben5.com).
//
// Trang chi tiet `/n/<slug>/` (HTML tinh, kiem chung live 2026-11-12):
// - Ten: `h1` trong topbar (VD 傲世丹神).
// - Bia: anh dau tien trong `div.pic_txt_list` cua khoi sach
//   (VD https://img.c0m.io/quanben5.com/upload/book_images/38/37501.jpg).
// - Tac gia: `p.info` chua "作者:" + `span.author` (VD 寂小贼).
// - The loai: `p.info` chua "类别:" (VD 玄幻); link the loai o breadcrumb
//   `/category/<N>.html` -> input giong vay, script book.js.
// - Trang thai: `p.info` chua "状态:" (完结 = hoan thanh, 连载 = dang ra).
// - Mo ta: `div.description` (text tran, khong co <p> ben trong).
// - Luu y: trang con co muc "更多玄幻小说" (cac .pic_txt_list khac) nen
//   CHI lay .pic_txt_list DAU TIEN cho thong tin sach.
// - Trang chi tiet khong ghi tong so chuong — khong dua so chuong
//   vao detail (muc luc moi co so that).
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");
    // App cat dau "/" cuoi cua URL arg khi chay that; site dung URL co "/".
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl = detailUrl + "/";

    var r = fetchQBDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select("h1"));
    var name = nameEl !== null ? cleanText(nameEl.text()) : "";
    if (!name) {
        var t = doc.title() || "";
        name = cleanText(t.split(" - ")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    // Khoi sach dau tien (cac khoi sau la "them truyen cung the loai").
    var info = safeFirst(doc.select("div.pic_txt_list"));

    var cover = "";
    if (info !== null) {
        var img = safeFirst(info.select("div.pic img"));
        if (img === null) img = safeFirst(info.select("img"));
        if (img !== null) {
            cover = img.attr("src") || "";
            if (cover.indexOf("//") === 0) cover = "https:" + cover;
        }
    }

    var author = "";
    var category = "";
    var status = "";
    if (info !== null) {
        info.select("p.info").forEach(function (el) {
            var txt = cleanText(el.text());
            if (txt.indexOf("作者:") === 0 || txt.indexOf("作者：") === 0) {
                var aEl = safeFirst(el.select("span.author"));
                author = aEl !== null ? cleanText(aEl.text()) : cleanText(txt.replace(/^作者[:：]\s*/, ""));
            } else if (txt.indexOf("类别:") === 0 || txt.indexOf("类别：") === 0) {
                category = cleanText(txt.replace(/^类别[:：]\s*/, ""));
            } else if (txt.indexOf("状态:") === 0 || txt.indexOf("状态：") === 0) {
                status = cleanText(txt.replace(/^状态[:：]\s*/, ""));
            }
        });
    }

    var description = "";
    var descEl = safeFirst(doc.select("div.description"));
    if (descEl !== null) description = cleanText(descEl.text());

    var ongoing = true;
    if (/完结|完本|已完结/.test(status)) {
        ongoing = false;
    }

    var genres = [];
    if (category) {
        var catLink = safeFirst(doc.select("div.breadcrumb a[href^='/category/']"));
        var catHref = catLink !== null ? (catLink.attr("href") || "") : "";
        var cm = catHref.match(/^\/category\/(\d+)\.html$/);
        if (cm) {
            genres.push({ title: category, input: "/category/" + cm[1] + ".html", script: "book.js" });
        }
    }

    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (category) detailParts.push("Thể loại: " + category);
    detailParts.push("Trạng thái: " + (ongoing ? "Đang cập nhật" : "Hoàn thành"));

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" • "),
        url: detailUrl,
        type: "chinese_novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
