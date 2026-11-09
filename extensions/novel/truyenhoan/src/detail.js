// detail.js — Thong tin chi tiet mot truyen Truyen Hoan
// KHONG doi host cua link goc: ma truyen khac nhau giua cac mirror nen
// truyen tim duoc o host nao thi chi doc tren host do (xem config.js).
// Trang detail cua site khong expose the loai rieng cua truyen nen khong
// tra genres/suggests.
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v3, N1):
// fetch qua fetchPageDoc() (fetchDoc + kiem challenge, tra loi tieng Viet
// co huong dan khi gap Cloudflare/login).
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    var detailUrl = normalizeSiteUrl(url);
    if (!detailUrl) {
        return Response.error("Link truyện không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl = detailUrl + "/";

    var r = fetchPageDoc(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var name = doc.select("div.col-info-desc h1.title[itemprop=name]").text().trim();
    if (!name) {
        name = doc.select("div.col-info-desc h1.title").text().trim();
    }
    if (!name) {
        name = doc.select("h1.title").text().trim();
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + detailUrl);

    var cover = doc.select("div.info-holder img[itemprop=image]").attr("src") || "";
    if (!cover) {
        cover = doc.select("div.book img").attr("src") || "";
    }
    if (cover.indexOf("//") === 0) cover = "https:" + cover;

    var author = doc.select("div.info a[itemprop=author]").first();
    var authorText = author ? author.text().trim() : "";
    if (!authorText) {
        var authDiv = doc.select("div.info div").first();
        if (authDiv) authorText = authDiv.text().replace(/Tác giả:\s*/i, "").trim();
    }

    // Trang thai: duyet .info > div tim h3 "Trạng thái" (C2, GIU NGUYEN
    // theo de xuat review — khong sua mu). Da kiem chung live 2026-11-09
    // tren /pham-nhan-tu-tien.14/: khoi <div><h3>Trạng thái:</h3><span
    // class="text-success">Full</span></div>; fallback .info
    // span.text-success. Neu trang thai sai tren truyen nao thi kiem tra
    // selector nay dau tien.
    var statusText = "";
    doc.select(".info > div").forEach(function(div) {
        var h3 = div.select("h3");
        if (h3.size() > 0 && h3.text().indexOf("Trạng thái") >= 0) {
            var sp = div.select("span").first();
            if (sp) statusText = sp.text().trim();
        }
    });
    if (!statusText) {
        var spStatus = doc.select(".info span.text-success").first();
        if (spStatus) statusText = spStatus.text().trim();
    }

    var stLower = statusText.toLowerCase();
    var ongoing = true;
    if (
        stLower.indexOf("full") >= 0 ||
        stLower.indexOf("hoàn") >= 0 ||
        stLower.indexOf("đã hoàn") >= 0 ||
        stLower.indexOf("complete") >= 0
    ) {
        ongoing = false;
    }

    var descEl = doc.select("div.desc-text.desc-text-full[itemprop=description]").first();
    if (!descEl) {
        descEl = doc.select("div.desc-text[itemprop=description]").first();
    }
    if (!descEl) {
        descEl = doc.select("div.desc-text").first();
    }
    var descriptionHtml = descEl ? descEl.html() : "";

    var detail =
        "<p><strong>Tên truyện:</strong> " +
        name +
        "</p>" +
        "<p><strong>Tác giả:</strong> " +
        authorText +
        "</p>" +
        "<p><strong>Trạng thái:</strong> " +
        (statusText || (ongoing ? "Đang ra" : "Hoàn thành")) +
        "</p>";

    return Response.success({
        name: name,
        cover: cover,
        host: siteOrigin(detailUrl),
        author: authorText,
        description: descriptionHtml,
        detail: detail,
        url: detailUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing
    });
}
