// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Site luu moi thu bang GBK, nen tu khoa phai encode GBK thi backend moi
// khop (kiem chung live 2026-11-15: POST UTF-8 cho 凡骨 tra trang rong,
// 0 ket qua; POST GBK + action=login tra dung). WebView encode form body
// theo charset cua document, nen tim qua form tim kiem cua chinh site bang
// Engine.newBrowser() (tien le bixiange, cung van de GBK).
// - 1 ket qua duy nhat: site 302 thang ve trang chi tiet — doc tra ve la
//   trang chi tiet (nhan biet bang meta og:novel:book_name), tra 1 muc.
// - Nhieu ket qua: #fengtui .bookbox, 30 muc, khong thay phan trang
//   nen luon tra next = "".
// - 0 ket qua: #fengtui rong -> bao loi tieng Viet ro rang.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm.");

    if (typeof Engine === "undefined") {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
    }
    var b = Engine.newBrowser();
    var doc = null;
    try {
        b.launch(BASE_URL + "/", 15000);
        b.callJs("(function(){var f=document.querySelector('form[name=articlesearch]');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=searchkey]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";f.submit();return 'SUBMITTED';})()", 8000);
        // Trang ket qua ve sau ~0.5-2s; poll thay vi sleep co dinh dai.
        for (var t = 0; t < 12; t++) {
            sleep(600);
            doc = b.html(6000);
            var ti = String(doc.select("title").text() || "");
            if (ti.indexOf("有关的小说") !== -1) break;
            if (ti.indexOf("最新章节") !== -1) break;
        }
    } catch (e) {
        return Response.error("Lỗi trình duyệt tìm kiếm: " + e);
    } finally {
        try { b.close(); } catch (e2) {}
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");

    // 1 ket qua duy nhat: site 302 thang ve trang chi tiet.
    var bookName = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (bookName) {
        var link = doc.select('meta[property="og:url"]').attr("content") || "";
        var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
        var cover = doc.select('meta[property="og:image"]').attr("content") || "";
        if (!link) return Response.error("Không đọc được link truyện.");
        return Response.success([{
            name: bookName,
            cover: cover,
            link: link,
            description: author,
            host: siteOrigin()
        }], "");
    }

    var items = parseBookBoxes(doc);
    if (items.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");
    return Response.success(items, "");
}
