// chap.js — Doc noi dung chuong Sang Tac Viet
load('config.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);

    var res = fetch(url, {
        method: "GET",
        headers: {
            "x-stv-transport": "web",
            "referer": BASE_URL + "/app.v2.php"
        }
    });

    if (!res.ok) return Response.error("HTTP Error: " + res.status);
    var text = res.text();

    var match = text.match(/\{[\s\S]*\}/);
    if (match) {
        try {
            var books = JSON.parse(match[0]);
            if (books && books.data) {
                var content = books.data
                    .replace(/<i([^>]*)t='(.*?)'([^>]*)>(.*?)<\/i>/g, "<i$1t='$2'$3>$2</i>")
                    .replace(/\n\t/g, "</p><p>\t");
                return Response.success(content);
            }
            if (books && books.err) {
                return Response.error(books.err);
            }
        } catch (e) {
        }
    }

    var doc = Html.parse(text);
    var contentEl = doc.select("#content-container, .content, .reading-content").first();
    if (contentEl) {
        contentEl.select("script, iframe, .ads").remove();
        return Response.success(contentEl.html());
    }

    return Response.error("Không tải được nội dung chương.");
}
