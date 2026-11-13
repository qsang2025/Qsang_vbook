// toc.js — Danh sach chuong: #list-chapter ul.list-chapter li a, 50 muc/trang.
// Ten chuong nam trong .chapter-text-all dang "#N. Chuong N: ..." — cat
// tien to "#N. " cho gon. 2 muc dau "Gioi thieu" / "Muc luc" la cach site
// tu danh so (#1/#2) nen giu nguyen. Dao nguoc neu site liet ke giam dan.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function extractChapterNumber(item) {
    var text = (item.name || "") + " " + (item.url || "");
    var m = text.match(/chuong[-\s]*(\d+)/i);
    if (!m) m = text.match(/chap[-\s]*(\d+)/i);
    if (!m) m = text.match(/\/chuong-(\d+)/i);
    if (!m) m = text.match(/(\d+)/);
    if (!m) return -1;
    return parseInt(m[1], 10);
}

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);

    var elements = r.doc.select("#list-chapter a");
    if (elements.size() === 0) elements = r.doc.select("#mobile-list-chapter a");
    if (elements.size() === 0) elements = r.doc.select(".list-chapter a");
    if (elements.size() === 0) elements = r.doc.select("a[href*=\"/chuong-\"]");

    var chapters = [];
    var seen = {};
    for (var i = 0; i < elements.size(); i++) {
        var e = elements.get(i);
        var href = String(e.attr("href") || "").trim();
        if (!href) continue;
        var chapterUrl = normalizeUrl(href.split("#")[0]);
        if (!chapterUrl || seen[chapterUrl]) continue;
        var lowerUrl = chapterUrl.toLowerCase();
        if (lowerUrl.indexOf("/tac-gia/") >= 0 ||
            lowerUrl.indexOf("/the-loai/") >= 0 ||
            lowerUrl.indexOf("/danh-sach/") >= 0 ||
            lowerUrl.indexOf("/dang-nhap") >= 0 ||
            lowerUrl.indexOf("/dang-ky") >= 0 ||
            lowerUrl.indexOf("page=") >= 0) {
            continue;
        }
        seen[chapterUrl] = true;

        var nameEl = safeFirst(e.select(".comic-info-chapter-name-content"));
        if (!nameEl) nameEl = safeFirst(e.select(".comic-info-chapter-name"));
        if (!nameEl) nameEl = safeFirst(e.select(".chapter-text-all"));
        var chapterName = nameEl ? cleanText(nameEl.text()) : "";
        if (!chapterName) chapterName = cleanText(e.text());
        if (!chapterName) chapterName = cleanText(e.attr("title") || "");
        if (!chapterName) chapterName = "Chương " + (chapters.length + 1);
        chapterName = chapterName.replace(/^#\d+\.\s*/, "");

        chapters.push({ name: chapterName, url: chapterUrl, host: BASE_URL });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách chương nào");
    }

    if (chapters.length > 1) {
        var firstNum = -1;
        var lastNum = -1;
        for (var f = 0; f < chapters.length; f++) {
            var fn = extractChapterNumber(chapters[f]);
            if (fn !== -1) { firstNum = fn; break; }
        }
        for (var l = chapters.length - 1; l >= 0; l--) {
            var ln = extractChapterNumber(chapters[l]);
            if (ln !== -1) { lastNum = ln; break; }
        }
        if (firstNum !== -1 && lastNum !== -1 && firstNum > lastNum) {
            chapters.reverse();
        }
    }

    return Response.success(chapters);
}
