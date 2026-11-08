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
        response = fetchWithMirrors(url);
        if (response) {
            text = String(response.text() || "");
        }
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
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

    if (!response || !response.ok) return Response.error("Không tải được trang truyện (HTTP " + (response ? response.status : 0) + ")");
    var doc = Html.parse(text);

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";

    // Trang thai that cua truyen, doc tu meta og:novel:status cua site
    // (da kiem chung: "Còn tiếp" / "Hoàn thành" / "Tạm ngưng").
    // ongoing = true tru khi site bao "Hoàn thành".
    var ongoing = true;
    var statusMeta = doc.select("meta[property='og:novel:status']").first();
    if (statusMeta) {
        var statusText = (statusMeta.attr("content") || "").trim();
        if (statusText.indexOf("Hoàn thành") !== -1 || statusText.toLowerCase().indexOf("complete") !== -1) {
            ongoing = false;
        }
    }

    var regex = /var\s+bookinfo\s*=\s*(\{[\s\S]*?\});/;
    var match = text.match(regex);
    if (match) {
        try {
            var json = JSON.parse(match[1]);
            // bookinfo.name la ten goc tieng Trung; bookinfo.namevi moi la
            // ten hien thi tieng Viet nhu site (h1 / <title> / og:title)
            // va nhu ket qua search.js — uu tien namevi de ten nhat quan.
            name = (json.namevi || "").trim() || json.name || "";
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

    // Tac gia: og:novel:author la ten da chuyen sang tieng Viet (vi du
    // "Ngã thị tiểu phi phi"), khop voi ten hien thi tren site; chi dung
    // ten goc tieng Trung trong bookinfo khi khong co og author.
    var ogAuthor = doc.select("meta[property='og:novel:author']").first();
    if (ogAuthor && (ogAuthor.attr("content") || "").trim()) {
        author = ogAuthor.attr("content").trim();
    }

    if (cover && cover.indexOf("//") === 0) cover = "https:" + cover;

    // Selector :has() da kiem chung chay duoc trong jsoup cua runtime
    // (trang chi tiet that co .blk chua .fa-water va .blk-body).
    var desEl = doc.select(".blk:has(.fa-water) .blk-body, .intro, .desc").first();
    if (desEl) description = desEl.html();
    if (!description) {
        var ogDesc = doc.select("meta[property='og:description']").first();
        if (ogDesc) description = (ogDesc.attr("content") || "").trim();
    }

    doc.select(".blk-body.ib-100").forEach(function(e) {
        detail += "<br>" + e.text().trim();
    });

    return Response.success({
        name: name,
        cover: cover,
        author: author || "Chưa rõ",
        description: description,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL
    });
}
