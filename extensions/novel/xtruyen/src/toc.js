// toc.js — muc luc chuong cua mot truyen tren XTruyen.
//
// Site khong liet ke chuong trong HTML trang chi tiet; lay qua API rieng:
//   POST {BASE_URL}/api/api-chapters.php
//   header X-Custom-Auth: abC0000011111 (khoa tinh cua site, giong frontend
//   cua chinh site gui), Content-Type application/x-www-form-urlencoded
//   body: manga_id=<id>&from=<dau>&to=<cuoi>&vol=
// Tra ve JSON mang [{s: slug chuong, n: ten chuong, e: mo ta them}].
// Lay tung khoang 100 chuong, dung khi khoang tra it hon 100 hoac rong.
// Ma truyen (manga_id) doc tu data-post="..." trong HTML trang chi tiet.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('challenge-handler.js');

// Goi API chuong mot khoang. Tra ve mang JSON, null khi loi/challenge.
function postChapterRange(mangaId, from, to) {
    rateLimitDelay("xtruyen.vn");
    var body = "manga_id=" + encodeURIComponent(mangaId) +
        "&from=" + encodeURIComponent(String(from)) +
        "&to=" + encodeURIComponent(String(to)) + "&vol=";
    var res = null;
    try {
        res = fetch(BASE_URL + "/api/api-chapters.php", {
            method: "POST",
            headers: {
                "X-Custom-Auth": "abC0000011111",
                "Content-Type": "application/x-www-form-urlencoded",
                "Referer": BASE_URL + "/"
            },
            body: body
        });
    } catch (e) {
        console.log("toc POST loi: " + e);
        return null;
    }
    if (!res || !res.ok) {
        console.log("toc POST HTTP " + (res ? res.status : 0) + ": manga " + mangaId + " " + from + "-" + to);
        return null;
    }
    var text = "";
    try {
        text = res.text();
    } catch (e2) {
        console.log("toc .text() loi: " + e2);
        return null;
    }
    if (isChallengeText(text)) {
        console.log("toc: trang challenge Cloudflare tu API chuong");
        return null;
    }
    var json = null;
    try {
        json = JSON.parse(text);
    } catch (e3) {
        console.log("toc JSON loi: " + e3);
        return null;
    }
    if (!json || !(json instanceof Array)) return null;
    return json;
}

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("xtruyen.vn");
    var doc = fetchDoc(url);
    if (!doc) return Response.error(formatChallengeError("XTruyện", url));

    var html = doc.html();
    var mangaIdMatch = html.match(/data-post=["'](\d+)["']/);
    if (!mangaIdMatch) mangaIdMatch = html.match(/manga_id["']?\s*[:=]\s*["']?(\d+)/);
    if (!mangaIdMatch) return Response.error("Không đọc được mã truyện trên trang chi tiết (site có thể đã đổi giao diện): " + url);
    var mangaId = mangaIdMatch[1];

    var storySlug = url.replace(BASE_URL + "/truyen/", "").replace(/\/$/, "");
    storySlug = storySlug.replace(/\/.*$/, "");

    var data = [];
    var seen = {};
    var from = 1;
    var maxFrom = 2000;
    while (from <= maxFrom) {
        var to = from + 99;
        var json = postChapterRange(mangaId, from, to);
        if (!json || json.length === 0) break;
        var before = data.length;
        for (var j = 0; j < json.length; j++) {
            var ch = json[j];
            var slug = ch.s || ch["0"];
            var name = ch.n || ch["1"];
            var extra = ch.e || ch["2"] || "";
            if (extra) name = name + " - " + String(extra).trim();
            if (slug && name && !seen[slug]) {
                seen[slug] = true;
                data.push({
                    name: cleanText(name),
                    url: BASE_URL + "/truyen/" + storySlug + "/" + slug + "/",
                    host: BASE_URL
                });
            }
        }
        if (data.length === before) break;
        if (json.length < 100) break;
        from = to + 1;
    }

    if (data.length === 0) return Response.error("Không đọc được mục lục (API chương không trả dữ liệu): " + url);
    return Response.success(data);
}
