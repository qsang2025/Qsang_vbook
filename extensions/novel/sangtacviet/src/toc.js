// toc.js — Muc luc chuong Sang Tac Viet
load('config.js');
load('challenge-handler.js');

function execute(url) {
    var regex = /truyen\/([^\/]+)\/\d+\/(\d+)\/?/;
    var input = url.match(regex);
    if (!input) {
        return Response.error("URL truyện không đúng định dạng Sáng Tác Việt: " + url);
    }
    var hostId = input[1];
    var bookId = input[2];
    var tocUrl = BASE_URL + "/index.php?ngmar=chapterlist&sajax=getchapterlist&h=" + hostId + "&bookid=" + bookId;

    var res = null;
    var rawText = "";
    try {
        res = fetch(tocUrl, {
            method: "GET",
            headers: {
                "x-stv-transport": "web",
                "referer": BASE_URL + "/app.v2.php"
            }
        });
        if (res) rawText = String(res.text() || "");
    } catch (e) {
    }

    if (!res || !res.ok || isCloudflareChallenge(rawText, res ? res.headers : null)) {
        var browserDoc = fetchViaBrowser(tocUrl);
        if (browserDoc) {
            try {
                var bText = String(browserDoc.html() || "");
                if (bText && !isCloudflareChallenge(bText, null)) {
                    rawText = bText;
                }
            } catch (e2) {}
        }
    }

    if (isCloudflareChallenge(rawText, res ? res.headers : null)) {
        return Response.error(formatChallengeError("Sáng Tác Việt", BASE_URL + "/truyen/" + hostId + "/1/" + bookId + "/"));
    }

    if (!res || !res.ok) return Response.error("HTTP Error: " + (res ? res.status : 0));
    var json = null;
    try {
        json = JSON.parse(rawText);
    } catch (eJson) {}
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
