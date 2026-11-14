// detail.js — chi tiet truyen.
// Anh bia: site ma hoa AES moi anh cover (data-src tra ve byte ma hoa,
// khong phai anh that — kiem chung live 2026-11-14) nen cover "".
// Site la truyen nguoi lon nen detail gan nsfw: true (nhu manifest).
// The loai + tag deu dua vao genres (man hinh chi tiet chi hien genres).
//
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("banshanren.com");
    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được trang truyện (HTTP " + response.status + ")");
    var doc = response.html();

    var nameEl = safeFirst(doc.select(".novel_title_box h1"));
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) return Response.error("Không tìm thấy truyện");

    var authorEl = safeFirst(doc.select(".novel_title_box .info_box span.hl"));
    var author = authorEl ? cleanText(authorEl.text()) : "";

    var introEl = safeFirst(doc.select(".novel_intro_box.pc p"));
    var description = introEl ? introEl.text().trim() : "";

    var info = [];
    var summary = doc.select(".novel_summary_box.pc > div");
    for (var i = 0; i < summary.size(); i++) {
        var text = cleanText(summary.get(i).text());
        if (text) info.push(text);
    }

    var status = cleanText(doc.select(".novel_summary_box.pc .serializing").text());

    var genres = [];
    var seen = {};
    function addGenre(el) {
        var title = cleanText(el.text());
        var href = el.attr("href");
        if (!title || !href || isHiddenTag(title)) return;
        var input = absUrl(href);
        if (seen[input]) return;
        seen[input] = true;
        genres.push({ title: title, input: input, script: "list.js" });
    }
    var cats = doc.select(".category_list li a");
    for (var j = 0; j < cats.size(); j++) addGenre(cats.get(j));
    var tags = doc.select(".novel_tag_list.pc li a");
    for (var k = 0; k < tags.size(); k++) addGenre(tags.get(k));

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: info.join("<br>"),
        url: url,
        type: "chinese_novel",
        format: "novel",
        ongoing: status.indexOf("完结") === -1,
        nsfw: true,
        locale: "zh",
        genres: genres
    });
}
