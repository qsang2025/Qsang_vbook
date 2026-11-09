// helper.js — Ham parse chung cho search.js va gen.js (Sang Tac Viet)
//
// Ca hai file deu parse cung mot dang HTML tra ve tu API
// /io/searchtp/searchBooks: cac muc "a.booksearch" (img, tieu de,
// link, tag) va phan trang theo quy tac "du 48 muc thi con trang sau"
// (PAGE_SIZE trong config.js). Tach ra day de sua selector mot cho
// khoi lech hai file (tung xay ra o cac ext khac).
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

    // Trang ket qua cua STV khong co phan tu phan trang trong HTML (da
    // kiem chung bang curl 2026-11-08: khong co chuoi "pagination" nao;
    // moi trang tra dung 48 muc). Con trang sau khi trang hien tai tra
    // du PAGE_SIZE muc, het khi tra it hon. nextToken LUON la string,
    // khong bao gio null (hop dong runtime). 0 muc van tra next "" —
    // do la ket qua rong binh thuong, khong phai loi (xem C2).
    var next = "";
    if (data.length >= PAGE_SIZE) {
        next = String(pageNum + 1);
    }

    return { data: data, next: next };
}
