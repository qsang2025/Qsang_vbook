// gen.js — Danh sach truyen Sang Tac Viet
load('config.js');

function execute(param, page) {
    page = page ? String(page) : '1';
    var pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var query = param || "sort=update";
    var url = BASE_URL + "/io/searchtp/searchBooks?find=&minc=0&" + query + "&p=" + pageNum + "&tag=";

    var response = null;
    try {
        response = fetchWithMirrors(url);
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }
    if (!response || !response.ok) return Response.error("Không tải được danh sách truyện (HTTP " + (response ? response.status : 0) + ")");
    var doc = response.html();

    var el = doc.select("a.booksearch");
    var data = [];

    el.forEach(function(e) {
        var imgEl = e.select("img").first();
        var img = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
        if (img.indexOf("//") === 0) img = "https:" + img;

        var titleEl = e.select(".searchbooktitle").first();
        // Giu nguyen ten nhu site tra ve (khong viet hoa lai tung tu:
        // toCapitalize() cu lam ten hien thi lech voi ten goc tren site
        // va lech voi ket qua cua search.js).
        var name = titleEl ? titleEl.text().trim() : "";

        var link = e.attr("href") || (e.select("a").first() ? e.select("a").first().attr("href") : "");
        var tagEl = e.select(".searchtag").first();
        var desc = tagEl ? tagEl.text().trim() : "";

        if (name && link) {
            data.push({
                name: name,
                link: link,
                cover: img,
                description: desc,
                host: BASE_URL
            });
        }
    });

    if (data.length === 0) {
        return Response.error("Không tìm thấy truyện trên trang.");
    }

    // Xem ghi chu phan trang trong search.js: STV khong co phan tu phan
    // trang trong HTML, moi trang 48 muc; du 48 muc thi con trang sau.
    // nextToken LUON la string, khong bao gio null (hop dong runtime).
    var next = "";
    if (data.length >= PAGE_SIZE) {
        next = String(pageNum + 1);
    }

    return Response.success(data, next);
}
