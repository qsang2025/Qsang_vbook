// helper.js — Ham parse chung cho search.js va gen.js (SangtacvietApp)
//
// Ho tro ca 2 che do:
// 1. Uu tien parse JSON tra ve tu API khi gui header App (sieu toc, day du du lieu).
// 2. Fallback parse DOM HTML (a.booksearch) khi server tra ve dinh dang web.
//
// CHI dung bien toan cuc tu config.js (BASE_URL, PAGE_SIZE) — file nay
// KHONG duoc load() them file nao khac (load khong de quy).
// Tra ve { data: [...], next: "..." } — next LUON la string, "" khi het.

function parseSearchPage(input, pageNum) {
    var data = [];
    var raw = "";

    if (typeof input === "string") {
        raw = input.replace(/^\s+|\s+$/g, "");
    } else if (input && typeof input.text === "function") {
        try {
            raw = input.text().replace(/^\s+|\s+$/g, "");
        } catch (eText) {}
    }

    // 1. Parse JSON tu Mobile API
    if (raw && (raw.charAt(0) === "[" || raw.charAt(0) === "{")) {
        try {
            var json = JSON.parse(raw);
            var list = [];
            if (json instanceof Array) {
                list = json;
            } else if (json && json.list && (json.list instanceof Array)) {
                list = json.list;
            } else if (json && json.data && (json.data instanceof Array)) {
                list = json.data;
            }

            for (var i = 0; i < list.length; i++) {
                var b = list[i];
                if (!b) continue;
                var bName = (b.tname || "").replace(/^\s+|\s+$/g, "") || (b.name || "").replace(/^\s+|\s+$/g, "");
                var bHost = b.host || "";
                var bId = b.id || "";
                if (!bName || !bHost || !bId) continue;

                var bLink = "/truyen/" + bHost + "/1/" + bId + "/";
                var bCover = b.thumb || "";
                if (bCover.indexOf("//") === 0) bCover = "https:" + bCover;
                if (bCover.indexOf("http://") === 0) bCover = "https://" + bCover.substring(7);

                var descParts = [];
                var author = (b.hauthor || b.author || "").replace(/^\s+|\s+$/g, "");
                if (author) descParts.push(author);
                if (b.chaptercount) {
                    descParts.push(b.chaptercount + " chương");
                } else if (b.category) {
                    descParts.push(String(b.category).replace(/^\s+|\s+$/g, ""));
                }

                data.push({
                    name: bName,
                    link: bLink,
                    cover: bCover,
                    description: descParts.join(" • "),
                    host: BASE_URL
                });
            }

            var next = "";
            if (data.length >= PAGE_SIZE) {
                next = String(pageNum + 1);
            }
            return { data: data, next: next };
        } catch (eJson) {}
    }

    // 2. Fallback parse HTML web truyen thong
    var doc = null;
    if (input && typeof input.select === "function") {
        doc = input;
    } else if (raw && typeof Html !== "undefined" && Html && typeof Html.parse === "function") {
        try {
            doc = Html.parse(raw);
        } catch (eHtml) {}
    }

    if (doc) {
        var el = doc.select("a.booksearch");
        el.forEach(function(e) {
            var imgEl = e.select("img").first();
            var img = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
            if (img.indexOf("//") === 0) img = "https:" + img;
            if (img.indexOf("http://") === 0) img = "https://" + img.substring(7);

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
    }

    var next2 = "";
    if (data.length >= PAGE_SIZE) {
        next2 = String(pageNum + 1);
    }

    return { data: data, next: next2 };
}
