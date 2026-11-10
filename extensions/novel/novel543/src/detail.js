// detail.js — chi tiet truyen cua 稷下書院 (novel543.com).
// URL: https://www.novel543.com/<10 chu so>/ (vd /0609709217/).
// Uu tien meta OG (og:novel:book_name, author, category, status 連載/完結,
// update_time, latest_chapter_name), DOM fallback (h1.title, .cover img,
// p.meta .author, .intro, link the loai /bookstack/?cid=N).
// genres: the loai cua truyen -> book.js /bookstack/<slug>/.
// suggests: muc 編輯推薦 (ul.flex.list > li).
// detail: dong mo ta gom tac gia / trang thai / the loai / cap nhat /
// chuong moi nhat.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function ogContent(doc, prop) {
    var el = doc.select('meta[property="' + prop + '"]').first();
    if (el === null) return "";
    return cleanText(el.attr("content"));
}

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");

    rateLimitDelay("www.novel543.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được trang truyện: " + url);

    // Ten: OG uu tien, fallback h1.title.
    var name = ogContent(doc, "og:novel:book_name");
    if (!name) name = cleanText(doc.select("h1.title").text());
    if (!name) return Response.error("Không nhận dạng được trang truyện: " + url);

    // Tac gia: OG uu tien, fallback p.meta .author.
    var author = ogContent(doc, "og:novel:author");
    if (!author) author = cleanText(doc.select("p.meta .author").text());

    // Cover: .cover img uu tien, fallback og:image (la anh cover o day).
    var cover = coverFromImg(doc.select(".cover img").first());
    if (!cover) {
        var ogImg = ogContent(doc, "og:image");
        if (ogImg && ogImg.indexOf("nocover") === -1) cover = absUrl(ogImg);
    }

    // Mo ta: .intro (cac <br /> da duoc cleanText gop khoang trang).
    var description = cleanText(doc.select(".intro").text());

    // Trang thai: 連載 = dang ra (ongoing=true), 完結 = hoan thanh.
    var status = ogContent(doc, "og:novel:status");
    var ongoing = true;
    if (status.indexOf("完結") !== -1 || status.indexOf("完结") !== -1) ongoing = false;

    var updateTime = ogContent(doc, "og:novel:update_time");
    if (!updateTime) {
        // p.meta: "更新： 2026-11-10" — lay phan sau dau ":".
        var metaText = cleanText(doc.select("p.meta").text());
        var mUp = metaText.match(/更新[：:]\s*([0-9\-]+)/);
        if (mUp) updateTime = mUp[1];
    }

    var latestName = ogContent(doc, "og:novel:latest_chapter_name");
    var latestUrl = ogContent(doc, "og:novel:latest_chapter_url");

    // The loai: OG uu tien (ten tieng Trung), fallback link /bookstack/?cid=N.
    var category = ogContent(doc, "og:novel:category");
    if (!category) {
        var catLink = doc.select('p.meta a[href*="/bookstack/"]').first();
        if (catLink !== null) category = cleanText(catLink.text());
    }

    var genres = [];
    var slug = genreSlugByName(category);
    if (slug) {
        genres.push({ title: category, input: "/bookstack/" + slug + "/", script: "book.js" });
    }

    // De xuat: muc 編輯推薦 (ul.flex.list > li).
    var suggests = [];
    doc.select("ul.flex.list > li").forEach(function (el) {
        var linkEl = null;
        var h3Links = el.select("h3 a");
        var i = 0;
        for (i = 0; i < h3Links.size(); i++) {
            var cand = h3Links.get(i);
            if (cleanText(cand.text())) { linkEl = cand; break; }
        }
        if (linkEl === null) return;
        var href = linkEl.attr("href");
        if (!href) return;
        var title = cleanText(linkEl.text());
        if (!title) {
            var img0 = el.select("img").first();
            if (img0 !== null) title = cleanText(img0.attr("alt"));
        }
        if (!title) return;
        var sg = {
            name: htmlDecode(title),
            cover: coverFromImg(el.select("img").first()),
            link: absUrl(href),
            description: "",
            tag: cleanText(el.select("p.author").text()),
            host: siteOrigin()
        };
        suggests.push(sg);
    });

    // Dong chi tiet hien thi.
    var detail = "";
    if (author) detail = "作者：" + author;
    detail = detail + (detail ? " | " : "") + "狀態：" + (ongoing ? "連載" : "完結");
    if (category) detail = detail + " | 分類：" + category;
    if (updateTime) detail = detail + " | 更新：" + updateTime;
    if (latestName) detail = detail + " | 最新：" + latestName;

    return Response.success({
        name: htmlDecode(name),
        author: author,
        cover: cover,
        description: description,
        detail: detail,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
