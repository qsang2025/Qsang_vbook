// helper.js — Ham parse chung cho search.js va gen.js (SangtacvietApp)
//
// Ca hai file deu parse cung mot dang HTML tra ve tu API
// /io/searchtp/searchBooks: cac muc "a.booksearch" (img, tieu de,
// link, tag) va phan trang theo quy tac "du 48 muc thi con trang sau"
// (PAGE_SIZE trong config.js).
//
// CHI dung bien toan cuc tu config.js (BASE_URL, PAGE_SIZE) — file nay
// KHONG duoc load() them file nao khac (load khong de quy).
// Tra ve { data: [...], next: "..." } — next LUON la string, "" khi het.

function parseSearchPage(doc, pageNum) {
    var el = doc.select("a.booksearch");
    var data = [];

    el.forEach(function(e) {
        var imgEl = e.select("img").first();
        var img = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
        if (img.indexOf("//") === 0) img = "https:" + img;

        var titleEl = e.select(".searchbooktitle").first();
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

    var next = "";
    if (data.length >= PAGE_SIZE) {
        next = String(pageNum + 1);
    }

    return { data: data, next: next };
}
