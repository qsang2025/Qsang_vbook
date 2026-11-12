// detail.js — chi tiet truyen alicesw (/novel/<id>.html).
// Tac gia + the loai doc tu .detail-box .info .fix p.xs-show;
// tag doc tu .tags .tg a (tro ve suggest1.js);
// anh bia that o .detail-box .imgbox img (img.321cdn.com).
// ongoing = khong co chu 已完结 trong khoi info.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được trang truyện (HTTP " + response.status + ")");
    var doc = response.html();
    var genres = [];
    var info = [];
    var author = "";
    var infoEls = doc.select(".detail-box .info .fix p.xs-show");
    for (var i = 0; i < infoEls.size(); i++) {
        var e = infoEls.get(i);
        var text = e.text();
        if (text.indexOf("作者") === 0) {
            var authorEl = safeFirst(e.select("a"));
            if (authorEl) author = authorEl.text();
            continue;
        }
        if (text.indexOf("分类") === 0) {
            var links = e.select("a");
            for (var j = 0; j < links.size(); j++) {
                var a = links.get(j);
                genres.push({
                    title: a.text(),
                    input: a.attr("href"),
                    script: "gen.js"
                });
            }
        }
        info.push(e.html());
    }

    var tagEls = doc.select(".tags .tg a");
    for (var k = 0; k < tagEls.size(); k++) {
        var t = tagEls.get(k);
        genres.push({
            title: t.text().replace("#", ""),
            input: BASE_URL + t.attr("href"),
            script: "suggest1.js"
        });
    }

    var nameEl = safeFirst(doc.select(".detail-box h1"));
    var name = nameEl ? nameEl.text().trim() : "";
    if (!name) return Response.error("Không đọc được tên truyện");
    var coverEl = safeFirst(doc.select(".detail-box .imgbox img"));
    var cover = "";
    if (coverEl) {
        cover = coverEl.attr("src");
        if (cover && cover.indexOf("/") === 0) cover = BASE_URL + cover;
    }
    var descEl = safeFirst(doc.select(".jianjie"));
    var infoText = "";
    var infoBox = safeFirst(doc.select(".detail-box .info"));
    if (infoBox) infoText = infoBox.text();

    // Id truyen lay tu URL chi tiet /novel/<id>.html — dung cho endpoint binh luan.
    var idMatch = url.match(/\/novel\/(\d+)\.html/);
    var comments = [];
    if (idMatch) {
        comments.push({
            title: "Bình luận",
            input: BASE_URL + "/index.php?s=/Home/comment/lists/id/" + idMatch[1] + "/type/novel/limit/5/size/12",
            script: "comment.js"
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: descEl ? descEl.text().trim() : "",
        detail: "书名：" + name + "<br>作者：" + (author || "未知") + "<br>" + info.join("<br>"),
        ongoing: infoText.indexOf("已完结") < 0,
        genres: genres,
        comments: comments,
        host: BASE_URL
    });
}
