// detail.js — Chi tiet 1 truyen Truyen Kim Dung (truyenkimdung.net).
//
// Trang chi tiet `/truyen/<slug>` (HTML tinh, kiem chung live 2026-11-19):
// - Ten: h1.story-title (du phong og:title / the title).
// - Bia: .story-hero .cover img (og:image la anh chung cua site nen chi
//   dung lam du phong cuoi cung).
// - Mo ta: p.story-description (du phong og:description).
// - Tac gia: Kim Dung (JSON-LD author cua site; khong co the tac gia
//   rieng tren trang nen mac dinh "Kim Dung").
// - Cac nhan .pill trong .story-overview .meta: trang thai ("Hoan thanh"),
//   phien ban ("Ban cu" / "Tan tu" / "Truyen ngan"), so chuong ("20 chuong"),
//   luot doc. So chuong dem lai tu muc luc (.chapter-items li a) de chac.
// execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeUrl(url);
    if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

    var r = fetchTkDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select("h1.story-title"));
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) name = cleanText(doc.select("meta[property='og:title']").attr("content"));
    if (!name) name = cleanText(doc.select("head > title").text()).replace(/\s*-\s*Truyện Kim Dung\s*$/, "");
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = "";
    var coverImg = safeFirst(doc.select(".story-hero .cover img"));
    if (coverImg !== null) cover = absUrl(coverImg.attr("src") || "");
    if (!cover) cover = absUrl(doc.select("meta[property='og:image']").attr("content") || "");

    var description = "";
    var descEl = safeFirst(doc.select("p.story-description"));
    if (descEl !== null) description = cleanText(descEl.text());
    if (!description) {
        description = cleanText(doc.select("meta[property='og:description']").attr("content"));
    }

    // Cac nhan .pill: trang thai / phien ban / so chuong / luot doc.
    var statusText = "";
    var versionText = "";
    var viewsText = "";
    var versions = { "Bản cũ": true, "Truyện ngắn": true, "Tân tu": true };
    doc.select(".story-overview .meta .pill").forEach(function (el) {
        var t = cleanText(el.text());
        if (!t) return;
        if (versions[t]) {
            versionText = t;
        } else if (t.indexOf("lượt đọc") !== -1) {
            viewsText = t;
        } else if (t.indexOf("chương") === -1) {
            statusText = t;
        }
    });
    var ongoing = statusText.indexOf("Hoàn thành") === -1;
    if (!statusText) statusText = ongoing ? "Đang ra" : "Hoàn thành";

    // So chuong: dem link chuong duy nhat trong muc luc tren trang.
    var chapterCount = 0;
    var seenCh = {};
    doc.select(".chapter-items li a").forEach(function (el) {
        var href = el.attr("href") || "";
        if (href && href.indexOf("/hoi-") !== -1 && !seenCh[href]) {
            seenCh[href] = true;
            chapterCount++;
        }
    });

    // "The loai" cua site = phien ban.
    var genres = [];
    if (versionText) {
        genres.push({
            title: versionText,
            input: "/?version=" + encodeURIComponent(versionText) + "&pageSize=20",
            script: "gen.js"
        });
    }

    var detailParts = [];
    detailParts.push("Tác giả: Kim Dung");
    if (versionText) detailParts.push("Phiên bản: " + versionText);
    detailParts.push("Trạng thái: " + statusText);
    if (chapterCount > 0) detailParts.push("Số chương: " + chapterCount + " chương");
    if (viewsText) detailParts.push(viewsText);

    var suggests = [];
    suggests.push({
        title: "Tất cả truyện Kim Dung",
        input: "/?pageSize=20",
        script: "gen.js"
    });
    if (versionText) {
        suggests.push({
            title: "Truyện cùng phiên bản " + versionText,
            input: "/?version=" + encodeURIComponent(versionText) + "&pageSize=20",
            script: "gen.js"
        });
    }

    return Response.success({
        name: name,
        author: "Kim Dung",
        cover: cover,
        description: description,
        detail: detailParts.join(" • "),
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        host: siteOrigin()
    });
}
