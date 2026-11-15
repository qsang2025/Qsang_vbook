// search.js — tim kiem theo ten truyen / tac gia tren 乐文小说.
// Form cua site: POST /search.html, tham so searchkey + searchtype=all
// (application/x-www-form-urlencoded). Ket qua cung cau truc #alistbox
// nhu trang the loai (50 ket qua/trang).
// LUU Y: tu VM, /search.html tra HTTP 500 (ca GET lan POST, co/khong
// cookie) — chua xac dinh duoc la do IP datacenter bi chan hay backend
// tim kiem hong; test tren may that se quyet dinh (tien le: search POST
// cua shubenshu treo tu VM nhung chay tren may; cua readernovel 500
// ca tren may nen da bo search.js). Neu tren may cung 500 thi bo
// search.js theo tien le do, giu lai toc/chap.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function safeString(value) {
    if (value === undefined || value === null) return "";
    return String(value).replace(/^\s+|\s+$/g, "");
}

function execute(query, page) {
    query = safeString(query);
    if (!query) return Response.success([]);
    var res = fetchPage(BASE_URL + "/search.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "searchkey=" + encodeURIComponent(query) + "&searchtype=all"
    });
    if (!res.ok) return Response.error("Không tải được kết quả tìm kiếm (HTTP " + res.status + ")");
    var doc = res.html();
    var data = [];
    var rows = doc.select("#alistbox > div");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var linkEl = safeFirst(e.select(".pic a"));
        if (!linkEl) continue;
        var link = absUrl(linkEl.attr("href"));
        var imgEl = safeFirst(e.select(".pic img"));
        var name = imgEl ? cleanText(imgEl.attr("alt")) : "";
        var cover = imgEl ? imgEl.attr("src") : "";
        var author = cleanText(e.select(".title span").text()).replace("作者：", "");
        var chapter = cleanText(e.select(".sys li a").text());
        if (!name || !link) continue;
        var description = author;
        if (chapter) description = description ? description + " - " + chapter : chapter;
        data.push({
            name: name,
            link: link,
            cover: cover || "",
            description: description,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.success([]);
    return Response.success(data, "");
}
