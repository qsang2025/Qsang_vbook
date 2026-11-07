// gen.js — Danh sach truyen Sang Tac Viet
load('config.js');

function toCapitalize(sentence) {
    if (!sentence) return "";
    var words = sentence.split(" ");
    var res = [];
    for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (w.length > 0) {
            res.push(w.charAt(0).toUpperCase() + w.substring(1));
        }
    }
    return res.join(" ");
}

function execute(param, page) {
    page = page ? String(page) : '1';
    var query = param || "sort=update";
    var url = BASE_URL + "/io/searchtp/searchBooks?find=&minc=0&" + query + "&p=" + page + "&tag=";

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
        var rawTitle = titleEl ? titleEl.text().trim() : "";
        var name = toCapitalize(rawTitle);

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

    return Response.success(data, next);
}
