// toc.js — Muc luc chuong Sang Tac Viet
load('config.js');
load('rate-limit.js');
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
        res = fetchWithMirrors(tocUrl, {
            method: "GET",
            headers: {
                "x-stv-transport": "web",
                "referer": BASE_URL + "/app.v2.php"
            }
        });
        if (res) rawText = String(res.text() || "");
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }

    if (!res || !res.ok || isCloudflareChallenge(rawText, res ? res.headers : null)) {
        var blockedMsg = stvBlockedMessage();
        if (blockedMsg) return Response.error(blockedMsg);
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

    if (!res || !res.ok) {
        var gwMsg = stvGatewayErrorMessage(res ? res.status : 0);
        if (gwMsg) return Response.error(gwMsg);
        return Response.error("Không tải được mục lục (HTTP " + (res ? res.status : 0) + ")");
    }
    var json = null;
    try {
        json = JSON.parse(rawText);
    } catch (eJson) {
        return Response.error("Máy chủ Sáng Tác Việt không trả danh sách chương hợp lệ (truyện có thể chưa có chương).");
    }
    if (!json || typeof json.data !== "string" || !json.data) {
        return Response.error("Không lấy được danh sách chương.");
    }

    var toc = json.data;
    var regex1 = /1-\/-(\d+)-\/-([^\/]+)/;
    var chapters = [];
    var parts = toc.split("-//-");
    var skipped = 0;

    for (var i = 0; i < parts.length; i++) {
        var item = parts[i];
        if (!item) continue;
        var m = item.match(regex1);
        if (m) {
            chapters.push({
                name: m[2].trim(),
                url: "/?bookid=" + bookId + "&c=" + m[1] + "&h=" + hostId,
                host: BASE_URL
            });
        } else {
            // Khong bo lang chuong parse loi: dem lai va ghi log ro
            // doan nao hong de sua sau, thay vi im lang mat chuong.
            skipped++;
            try {
                console.log("toc.js bo qua muc luc khong parse duoc (truyen " + bookId + "): " + item.substring(0, 80));
            } catch (eLog) {}
        }
    }

    if (chapters.length === 0) {
        return Response.error("Mục lục trống hoặc chưa có chương.");
    }
    if (skipped > 0) {
        try {
            console.log("toc.js truyen " + bookId + ": " + chapters.length + " chuong doc duoc, " + skipped + " muc loi da bo qua (xem log tren).");
        } catch (eLog2) {}
    }

    return Response.success(chapters);
}
