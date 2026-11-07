// search.js — Tim kiem truyen tren Sang Tac Viet
load('config.js');

function execute(key, page) {
    if (!key || !String(key).trim()) {
        return Response.error("Nhập từ khóa tìm kiếm.");
    }
    page = page ? String(page) : '1';

    var url = BASE_URL + "/io/searchtp/searchBooks?find=&findinname=" + encodeURIComponent(String(key).trim()) + "&minc=0&p=" + page + "&tag=";

    var response = fetch(url);
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var next = null;
    var nextLi = doc.select(".pagination li.active + li").first();
    if (nextLi && nextLi.text().trim()) {
        next = nextLi.text().trim();
    }

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

    if (data.length === 0) {
        return Response.error("Không tìm thấy truyện phù hợp.");
    }

    return Response.success(data, next);
}
