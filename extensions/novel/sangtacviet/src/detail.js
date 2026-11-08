// detail.js — Chi tiet truyen Sang Tac Viet
load('config.js');
load('challenge-handler.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';

    var response = null;
    var text = "";
    try {
        response = fetch(url);
        if (response) {
            text = String(response.text() || "");
        }
    } catch (e) {
    }

    if (!response || !response.ok || isCloudflareChallenge(text, response ? response.headers : null)) {
        var browserDoc = fetchViaBrowser(url);
        if (browserDoc) {
            try {
                var bHtml = String(browserDoc.html() || "");
                if (bHtml && !isCloudflareChallenge(bHtml, null)) {
                    text = bHtml;
                }
            } catch (e2) {}
        }
    }

    if (isCloudflareChallenge(text, response ? response.headers : null)) {
        return Response.error(formatChallengeError("Sáng Tác Việt", url));
    }

    if (!response || !response.ok) return Response.error("HTTP Error: " + (response ? response.status : 0));
    var doc = Html.parse(text);

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";

    var regex = /var\s+bookinfo\s*=\s*(\{[\s\S]*?\});/;
    var match = text.match(regex);
    if (match) {
        try {
            var json = JSON.parse(match[1]);
            name = json.name || "";
            cover = json.thumb || "";
            author = json.author || "";
        } catch (e) {
        }
    }

    if (!name) {
        var h1 = doc.select("h1, .book-title").first();
        if (h1) name = h1.text().trim();
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    if (cover && cover.indexOf("//") === 0) cover = "https:" + cover;

    var desEl = doc.select(".blk:has(.fa-water) .blk-body, .intro, .desc").first();
    if (desEl) description = desEl.html();

    doc.select(".blk-body.ib-100").forEach(function(e) {
        detail += "<br>" + e.text().trim();
    });

    return Response.success({
        name: name,
        cover: cover,
        author: author || "Chưa rõ",
        description: description,
        detail: detail,
        ongoing: true,
        host: BASE_URL
    });
}
