// detail.js — thong tin truyen (wfxs.tw).
// Nhan URL trang chi tiet /xiaoshuo/<id>/, doc cac truong:
// #bookinfo.booktitle h1 (ten), #author a (tac gia), #bookimg img[_src]
// (bia), #bookintro p (gioi thieu), .count li (the loai / trang thai /
// luot doc / so chu), .new.uptime span (cap nhat), .nav a.current
// (the loai hien tai, co link ve trang the loai).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocPaced(url);
    if (!doc) return Response.error("Không tải được trang truyện (" + lastFetchError + "): " + url);

    var titleEl = safeFirst(doc.select("#bookinfo h1"));
    if (!titleEl) return Response.error("Không đọc được thông tin truyện: " + url);
    var title = cleanText(titleEl.text());
    if (!title) return Response.error("Không đọc được tên truyện: " + url);

    var authorEl = safeFirst(doc.select("#author a"));
    var author = authorEl ? cleanText(authorEl.text()) : "";

    var coverEl = safeFirst(doc.select("#bookimg img"));
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("_src") || coverEl.attr("src") || "";
        if (cover && cover.indexOf("http") !== 0) cover = absUrl(cover);
    }

    var introEl = safeFirst(doc.select("#bookintro p"));
    var description = introEl ? cleanText(introEl.text()) : "";
    // Bo hau to quang cao site o cuoi gioi thieu ("...祭品。來自微風小說網").
    description = description.replace(/來自微風小說網.*$/, "").replace(/[\s\u3000]+$/, "");

    // Hang .count: li chua "小" = the loai, "狀" = trang thai,
    // "點" = luot doc, "字" = so chu (gia tri trong span).
    var category = "";
    var status = "";
    var counts = doc.select(".count li");
    var i = 0;
    for (i = 0; i < counts.size(); i++) {
        var li = counts.get(i);
        var liText = li.text();
        var spanEl = safeFirst(li.select("span"));
        var spanText = spanEl ? cleanText(spanEl.text()) : "";
        if (liText.indexOf("小") >= 0) category = spanText;
        if (liText.indexOf("狀") >= 0) status = spanText;
    }

    var updateEl = safeFirst(doc.select(".new .uptime span"));
    var update = updateEl ? cleanText(updateEl.text()) : "";

    var genres = [];
    var navEl = safeFirst(doc.select(".nav a.current"));
    if (navEl) {
        var gTitle = cleanText(navEl.text());
        var gHref = navEl.attr("href") || "";
        if (gTitle && gHref) {
            genres.push({ title: gTitle, input: gHref, script: "search.js" });
        }
    }
    if (genres.length === 0 && category) {
        genres.push({ title: category, input: "", script: "search.js" });
    }

    var ongoing = true;
    if (status && status.indexOf("完") >= 0) ongoing = false;

    var detail = {
        name: title,
        cover: cover,
        author: author,
        description: description,
        detail: (category ? "分類: " + category + "\n" : "")
            + (status ? "狀態: " + status + "\n" : "")
            + (update ? "更新: " + update : ""),
        ongoing: ongoing,
        host: siteOrigin()
    };
    if (genres.length > 0) detail.genres = genres;
    return Response.success(detail);
}
