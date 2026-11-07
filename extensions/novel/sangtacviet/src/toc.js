// toc.js — Muc luc chuong Sang Tac Viet
load('config.js');

function execute(url) {
    var regex = /truyen\/([^\/]+)\/\d+\/(\d+)\/?/;
    var input = url.match(regex);
    if (!input) {
        return Response.error("URL truyện không đúng định dạng Sáng Tác Việt: " + url);
    }
    var hostId = input[1];
    var bookId = input[2];
    var tocUrl = BASE_URL + "/index.php?ngmar=chapterlist&sajax=getchapterlist&h=" + hostId + "&bookid=" + bookId;

    var res = fetch(tocUrl, {
        method: "GET",
        headers: {
            "x-stv-transport": "web",
            "referer": BASE_URL + "/app.v2.php"
        }
    });

    if (!res.ok) return Response.error("HTTP Error: " + res.status);
    var json = res.json();
    if (!json || !json.data) {
        return Response.error("Không lấy được danh sách chương.");
    }

    var toc = json.data;
    var regex1 = /1-\/-(\d+)-\/-([^\/]+)/;
    var chapters = [];
    var parts = toc.split("-//-");

    for (var i = 0; i < parts.length; i++) {
        var item = parts[i];
        if (!item) continue;
        var m = item.match(regex1);
        if (m) {
            chapters.push({
                name: m[2],
                url: "/?bookid=" + bookId + "&c=" + m[1] + "&h=" + hostId,
                host: BASE_URL
            });
        }
    }

    if (chapters.length === 0) {
        return Response.error("Mục lục trống hoặc chưa có chương.");
    }

    return Response.success(chapters);
}
