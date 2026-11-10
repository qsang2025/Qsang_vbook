// detail.js — Chi tiet truyen Sang Tac Viet
load('config.js');
load('rate-limit.js');
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
        var blockedMsg = stvBlockedMessage();
        if (blockedMsg) return Response.error(blockedMsg);
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

    if (!response || !response.ok) {
        var gwMsg = stvGatewayErrorMessage(response ? response.status : 0);
        if (gwMsg) return Response.error(gwMsg);
        return Response.error("Không tải được trang truyện (HTTP " + (response ? response.status : 0) + ")");
    }
    var doc = Html.parse(text);

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";

    // Trang thai that cua truyen, doc tu meta og:novel:status cua site.
    // LUU Y (khao sat 10 truyen 10/11): og meta KHONG dang tin nhu
    // bookinfo.php — og "Hoàn thành" khop voi bookinfo "Tạm ngưng" 4/4
    // (faloo/1020583, faloo/1035593, qidian/1030529305, uukanshu/176266),
    // og "Còn tiếp" khop ca "Còn tiếp" (3), "Hoàn thành" (2) va
    // "Không xác định" (1). Nen: og "Hoàn thành" = TAM NGUNG (van ongoing,
    // ghi chu), khong phai hoan thanh; og "Còn tiếp" = ongoing (mo ho).
    // v7 khong co bookinfo nen khong the biet truyen nao that su hoan thanh
    // (biqubu/68918, uukanshu/176313 bi bao ongoing) — ghi ro gia tri goc
    // trong detail de nguoi doc tu doi chieu. Khong bao gio doan false.
    var ongoing = true;
    var statusNote = "";
    var statusMeta = doc.select("meta[property='og:novel:status']").first();
    if (statusMeta) {
        var statusText = (statusMeta.attr("content") || "").trim();
        if (statusText) {
            statusNote = statusText;
            if (statusText.indexOf("Hoàn thành") !== -1 || statusText.toLowerCase().indexOf("complete") !== -1) {
                statusNote = "Tạm ngưng (web ghi: " + statusText + ")";
            }
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
    if (cover && cover.indexOf("http://") === 0) cover = "https://" + cover.substring(7);

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
    if (statusNote) detail += "<br>Trạng thái: " + statusNote;

    var genres = [];
    var ogCat = doc.select("meta[property='og:novel:category']").first();
    if (ogCat) {
        var catText = (ogCat.attr("content") || "").trim().toLowerCase();
        if (catText) {
            for (var gi = 0; gi < GENRES.length; gi++) {
                if (catText.indexOf(GENRES[gi].title.toLowerCase()) !== -1) {
                    genres.push({ title: GENRES[gi].title, input: GENRES[gi].slug, script: "gen.js" });
                }
            }
        }
    }

    var commentConfig = {
        title: "Bình luận",
        input: url,
        script: "comment.js"
    };

    return Response.success({
        name: name,
        cover: cover,
        author: author || "Chưa rõ",
        description: description,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL,
        url: url,
        type: "novel",
        format: "novel",
        genres: genres,
        comment: commentConfig,
        comments: [commentConfig]
    });
}
