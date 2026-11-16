// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /book/<id>.html (kiem chung live 2026-11-16):
// - Ten: meta og:novel:book_name (fallback: h1 thu 2 — h1 dau la logo
//   "海棠文学" an).
// - Tac gia: meta og:novel:author (fallback: strong.mr15.ttl > span).
// - The loai: meta og:novel:category -> link danh muc tuong ung.
// - Trang thai: meta og:novel:status ("连载" = dang ra, "完结"/"已完结"
//   = hoan thanh). Mac dinh ongoing true khi khong doc duoc.
// - Anh bia: img.book-cover-blur src (tuyet doi, img.danmeis.com).
// - Mo ta: .det-abt (ngat <br/>).
// - So chuong: dem #chapterList li.w33p (cung trang).
// - Ngay cap nhat: meta og:novel:update_time.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function metaContent(doc, property) {
    var el = safeFirst(doc.select("meta[property=\"" + property + "\"]"));
    if (el === null) return "";
    return cleanText(el.attr("content") || "");
}

function execute(url) {
    url = normalizeDmUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchDmDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = metaContent(doc, "og:novel:book_name");
    if (!name) {
        var h1s = doc.select("h1");
        for (var hi = 0; hi < h1s.size(); hi++) {
            var t = cleanText(h1s.get(hi).text());
            if (t && t !== "海棠文学") { name = t; break; }
        }
    }
    if (!name) {
        var ti = String(doc.select("title").text() || "");
        name = cleanText(ti.split("-")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var author = metaContent(doc, "og:novel:author");
    if (!author) {
        var auEl = safeFirst(doc.select("strong.mr15.ttl span"));
        if (auEl !== null) author = cleanText(auEl.text());
    }

    var category = metaContent(doc, "og:novel:category");
    var genres = [];
    if (category) {
        var i = 0;
        for (i = 0; i < GENRES.length; i++) {
            if (GENRES[i].title === category) {
                genres.push({ title: GENRES[i].title, input: GENRES[i].input, script: "gen.js" });
                break;
            }
        }
        if (genres.length === 0) {
            genres.push({ title: category, input: BASE_URL + "/xuanhuan", script: "gen.js" });
        }
    }

    var status = metaContent(doc, "og:novel:status");
    var ongoing = true;
    if (status === "完结" || status === "已完结" || status === "完本") ongoing = false;

    var cover = "";
    var covEl = safeFirst(doc.select("img.book-cover-blur"));
    if (covEl !== null) {
        cover = String(covEl.attr("src") || "");
        if (cover.indexOf("nocover") !== -1) cover = "";
        if (cover && cover.indexOf("http") !== 0) cover = normalizeDmUrl(cover);
    }

    var desc = "";
    var deEl = safeFirst(doc.select(".det-abt"));
    if (deEl !== null) desc = cleanText(deEl.text());

    var chapCount = doc.select("#chapterList li.w33p").size();
    var updated = metaContent(doc, "og:novel:update_time");
    var detailParts = [];
    if (chapCount > 0) detailParts.push("Số chương: " + chapCount);
    if (updated) detailParts.push("Cập nhật: " + updated);
    if (status) detailParts.push("Trạng thái: " + status);

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: desc,
        detail: detailParts.join(" | "),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
