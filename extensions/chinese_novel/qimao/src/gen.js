// gen.js — Phân trang danh sách truyện theo chuyên mục / thể loại của Qimao (七猫免费小说)
load('config.js');

function execute(url, page) {
    if (!page) page = "1";

    var parts = (url || "").split("-");
    var channel = parts[0] || "a";
    var cat1 = parts[1] || "a";
    var cat2 = parts[2] || "a";
    var words = parts[3] || "a";
    var updateTime = parts[4] || "a";
    var isVip = parts[5] || "a";
    var isOver = parts[6] || "a";
    var order = parts[7] || "click";

    var shukuUrl = BASE_URL + "/shuku/" + channel + "-" + cat1 + "-" + cat2 + "-" + words + "-" + updateTime + "-" + isVip + "-" + isOver + "-" + order + "-" + page + "/";

    var response = fetch(shukuUrl);
    if (!response.ok) {
        return Response.error("Không thể tải danh sách truyện từ 七猫 (HTTP " + response.status + ")");
    }

    var html = response.text();
    var itemRegex = /<li[^>]*class="qm-cover-text-item[\s\S]*?<\/li>/g;
    var items = html.match(itemRegex);

    if (!items || items.length === 0) {
        return Response.success([]);
    }

    var data = [];
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var linkMatch = it.match(/href="[^"]*\/shuku\/(\d+)(?:_\d+)?\/?"/);
        var titleMatch = it.match(/class="s-tit"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
        var coverMatch = it.match(/class="book-cover-src"[^>]*src="([^"]+)"/) || it.match(/<img[^>]*src="([^"]+)"[^>]*class="book-cover-src"/);
        var authorMatch = it.match(/class="s-author"[^>]*>([^<]+)<\/a>/);
        var descMatch = it.match(/class="s-desc"[^>]*>([\s\S]*?)<\/span>/);

        var name = titleMatch ? cleanText(titleMatch[1]) : "";
        var bookId = linkMatch ? linkMatch[1] : "";
        var link = bookId ? BASE_URL + "/shuku/" + bookId + "/" : "";
        var cover = coverMatch ? coverMatch[1] : "";
        var author = authorMatch ? cleanText(authorMatch[1]) : "";
        var desc = descMatch ? cleanText(descMatch[1].replace(/[\r\n\t]+/g, " ")) : "";

        if (name && link) {
            data.push({
                name: name,
                link: link,
                cover: cover,
                description: author ? "Tác giả: " + author : desc,
                author: author,
                host: BASE_URL
            });
        }
    }

    var curPageNum = parseInt(page, 10) || 1;
    var next = "";
    var nextPageStr = (curPageNum + 1) + "";
    var nextPagePattern = new RegExp('class="page-btn num"[^>]*>' + nextPageStr + '<\\/span>');
    if (nextPagePattern.test(html) && data.length > 0) {
        next = nextPageStr;
    }

    return Response.success(data, next);
}
