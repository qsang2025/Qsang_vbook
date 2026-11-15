// detail.js — Trang chi tiet truyen (execute(url) -> novel).
//
// Trang /book/<id> (kiem chung live 2026-11-16, sach mau 高达，重力挽歌):
// .info h3.book ten, .cover mip-img bia, .author "Tac gia 著 / The loai",
// .info p (so chu / 连载中 hoac 已完结 / cap nhat), .desc-cnt mo ta.
// The loai tra ve dang genres[] de app mo duoc trang the loai (input la
// id so cua API — bang doi trong helper.js).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeStoryUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");
    var r = fetchCwDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select(".info h3.book"));
    var name = nameEl ? cleanBookName(nameEl.text()) : "";
    if (!name) {
        var t = String(doc.select("title").text() || "");
        // Title dang "TenTruyen最新章节(TacGia),...-刺猬猫" — lay phan truoc "最新".
        var m = t.match(/^(.+?)最新/);
        if (m) name = cleanBookName(m[1]);
    }
    if (!name) return Response.error("Không đọc được thông tin truyện: " + url);

    var cover = "";
    var coverEl = safeFirst(doc.select(".cover mip-img"));
    if (coverEl) cover = coverEl.attr("src") || "";
    if (cover.indexOf("notimg") !== -1) cover = "";

    // ".author" dang "红雀咸鱼 著 / 科幻无限" — tach tac gia va the loai.
    var authorLine = "";
    var authorEl = safeFirst(doc.select(".author"));
    if (authorEl) authorLine = cleanText(authorEl.text());
    var author = authorLine;
    var genreName = "";
    var parts = authorLine.split(" 著 / ");
    if (parts.length >= 2) {
        author = cleanText(parts[0]);
        genreName = cleanText(parts[1]);
    } else {
        var parts2 = authorLine.split(" 著 ");
        if (parts2.length >= 2) author = cleanText(parts2[0]);
    }

    var infoLines = [];
    var infoPs = doc.select(".info p");
    var i = 0;
    for (i = 0; i < infoPs.size(); i++) {
        var line = cleanText(infoPs.get(i).text());
        if (line && infoLines.indexOf(line) === -1) infoLines.push(line);
    }
    var detailText = infoLines.join(" / ");

    var desc = "";
    var descEl = safeFirst(doc.select(".desc-cnt"));
    if (descEl) desc = cleanText(descEl.text());

    var ongoing = true;
    if (detailText.indexOf("已完结") !== -1 || detailText.indexOf("完本") !== -1) ongoing = false;

    var genres = [];
    if (genreName) {
        var gid = categoryIdByName(genreName);
        if (gid) genres.push({ title: genreName, input: gid, script: "gen.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailText,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
