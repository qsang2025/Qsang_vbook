// search.js — tim kiem theo tu khoa cua 思兔閱讀 (sto9.com).
// GET /search/{tu-khoa-url-encoded}/{page}.html (da kiem chung: tim
// "辰東" tra 3 ket qua: 夜無疆 連載, 聖墟 全本, 完美世界 全本).
// Ket qua: div.newbox > ul#article_list_content > li (cung cau truc item
// nhu trang the loai — xem helper.js parseSearchItem).
// DAC BIET: tu khoa khop dung 1 truyen se redirect thang ve trang chi
// tiet /book/{id}.html — nhan ra bang meta og:novel:book_name va tra
// ve 1 item duy nhat lay tu OG meta. Dieu kien kich hoat (kiem chung live
// 2026-11-09): site redirect khi tu khoa KHOP CHINH XAC ten 1 truyen
// (vd "夜無疆" -> /book/671.html, "聖墟" -> /book/12067.html); tim theo
// tac gia ("辰東") hay tu khoa mo thi tra trang ket qua binh thuong,
// khong co meta og:novel:book_name nen khong vao nhanh nay. Item tra ve
// la truyen duy nhat site redirect toi — dung ket qua tot nhat theo site,
// khong phai lua chon cua extension.
// Phan trang: nut ke la <a class="next"> (chu ">"); token trang ke tra
// ve la PATH cua link ke, luot sau nhan page bat dau bang "/" thi fetch
// thang path do.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = "";
    if (page && page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        url = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        url = BASE_URL + "/search/" + encodeURIComponent(query) + "/" + n + ".html";
    }

    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    // Redirect ve trang chi tiet (site chi redirect khi tu khoa khop chinh
    // xac ten 1 truyen — da kiem chung live: "夜無疆", "聖墟" redirect,
    // "辰東" thi khong):
    // trang detail co meta og:novel:book_name, trang ket qua thi khong.
    var ogName = doc.select('meta[property="og:novel:book_name"]').first();
    if (ogName !== null) {
        var name = cleanText(ogName.attr("content"));
        if (name) {
            var ogId = doc.select('meta[property="og:book_id"]').first();
            var bookId = ogId !== null ? cleanText(ogId.attr("content")) : "";
            var link = bookId ? BASE_URL + "/book/" + bookId + ".html" : url;
            var ogAuthor = doc.select('meta[property="og:novel:author"]').first();
            var ogImg = doc.select('meta[property="og:image"]').first();
            var ogLatest = doc.select('meta[property="og:novel:latest_chapter_name"]').first();
            var ogStatus = doc.select('meta[property="og:novel:status"]').first();
            var cover = "";
            if (ogImg !== null) {
                cover = ogImg.attr("content") || "";
                if (cover.indexOf("nocover") !== -1) cover = "";
                else if (cover) cover = absUrl(cover);
            }
            var item = {
                name: htmlDecode(name),
                cover: cover,
                link: link,
                description: ogLatest !== null ? cleanText(ogLatest.attr("content")) : "",
                tag: ogStatus !== null ? cleanText(ogStatus.attr("content")) : "",
                host: siteOrigin()
            };
            if (ogAuthor !== null) item.description = cleanText(ogAuthor.attr("content")) + (item.description ? " — " + item.description : "");
            return Response.success([item], "");
        }
    }

    var items = [];
    var seen = {};
    doc.select("#article_list_content > li").forEach(function (el) {
        var item = parseSearchItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var next = "";
    var nextLink = doc.select("a.next").first();
    if (nextLink === null) nextLink = doc.select("a:contains(下一頁)").first();
    if (nextLink === null) nextLink = doc.select("a:contains(下一页)").first();
    if (nextLink !== null) {
        var href = nextLink.attr("href");
        if (href) {
            if (href.indexOf("http") === 0) {
                var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
                next = m ? m[1] : "";
            } else if (href.charAt(0) === "/") {
                next = href;
            }
        }
    }

    return Response.success(items, next);
}
