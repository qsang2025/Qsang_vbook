// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /book/<id>/ (kiem chung live 2026-11-16):
// - Ten: meta og:novel:book_name (fallback: <title> truoc "-").
// - Tac gia: meta og:novel:author (fallback: .tab "作者：...").
// - The loai: meta og:novel:category -> chip the loai (GENRES).
// - Trang thai: meta og:novel:status ("连载中" = dang ra,
//   "完结"/"已完结"/"完本" = hoan thanh).
// - Anh bia: meta og:image (fallback: .catalog1 .tu img).
// - Mo ta: og:description co dang "<ten>小说全文番外_<tacgia><ten>,<ten>\n
//   <tom tat that>" — lay phan sau dong dau tien; neu chi co dong spam
//   "各位书友要是觉得..." (vd. sach 1389) thi ghep dong thong tin tu meta.
// - Du lieu site ban: mot so sach ghi og:novel:book_name = ten + tac gia
//   (vd. sach 121 "人生何处不青山姐姐顾明澈") — cat hau to tac gia.
// - Chuong moi nhat: meta og:novel:latest_chapter_name + update_time.
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

// Gia tri meta THO (khong cleanText) — can cho og:description vi dau
// phan cach tom tat la ky tu xuong dong ma cleanText se gop mat.
function metaRaw(doc, property) {
    var el = safeFirst(doc.select("meta[property=\"" + property + "\"]"));
    if (el === null) return "";
    return String(el.attr("content") || "");
}

function execute(url) {
    url = normalizeIqUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchIqDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = metaContent(doc, "og:novel:book_name");
    if (!name) {
        var ti = String(doc.select("title").text() || "");
        name = cleanText(ti.split("最新章节")[0].split("-")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var author = metaContent(doc, "og:novel:author");
    if (!author) {
        var tabText = String(doc.select(".tab").text() || "");
        var am = tabText.match(/作者：\s*(\S+)/);
        if (am) author = cleanText(am[1]);
    }
    // Du lieu site ban: mot so sach ghi og:novel:book_name = ten + tac gia
    // (vd. "人生何处不青山姐姐顾明澈") — cat hau to tac gia neu khop.
    if (author && name.length > author.length && name.substring(name.length - author.length) === author) {
        name = name.substring(0, name.length - author.length).trim();
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
            genres.push({ title: category, input: BASE_URL + "/list/0/1.html", script: "gen.js" });
        }
    }

    var status = metaContent(doc, "og:novel:status");
    var ongoing = true;
    if (status === "完结" || status === "已完结" || status === "完本") ongoing = false;

    var cover = metaContent(doc, "og:image");
    if (!cover) {
        var covEl = safeFirst(doc.select(".catalog1 .tu img"));
        if (covEl !== null) cover = String(covEl.attr("src") || "");
    }
    if (cover.indexOf("nocover") !== -1 || cover.indexOf("defaultimg") !== -1) cover = "";
    if (cover && cover.indexOf("http") !== 0) cover = normalizeIqUrl(cover);

    var latest = metaContent(doc, "og:novel:latest_chapter_name");
    var updated = metaContent(doc, "og:novel:update_time");

    // Mo ta: og:description co dang "<ten>小说全文番外_<tacgia><ten>,<ten>\n<tom tat that>"
    // (vd. sach 121) — lay phan sau dong dau tien. Neu chi co dong spam
    // "各位书友要是觉得..." (vd. sach 1389) thi ghep dong thong tin tu meta.
    var desc = "";
    var rawDesc = metaRaw(doc, "og:description");
    var nl = rawDesc.indexOf("\n");
    if (nl !== -1) {
        var tail = cleanText(rawDesc.substring(nl + 1));
        if (tail && tail.indexOf("各位书友要是觉得") !== 0) desc = tail;
    }
    if (!desc) {
        var descParts = [];
        if (author) descParts.push("作者：" + author);
        if (category) descParts.push("分类：" + category);
        if (status) descParts.push("状态：" + status);
        if (latest) descParts.push("最新：" + latest);
        desc = descParts.join(" · ");
    }

    var detailParts = [];
    if (latest) {
        var lm = latest.match(/第(\d+)章/);
        if (lm) detailParts.push("Số chương ≈ " + lm[1]);
        detailParts.push("Chương mới nhất: " + latest);
    }
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
