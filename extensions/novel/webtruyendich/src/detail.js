// detail.js — chi tiet truyen.
// Selector da kiem chung tren trang that 2026-11-12 (mau: Cẩu Tại Võ Đạo
// Thế Giới Thành Thánh):
// - Ten: h1 (co tien to "Truyện " can cat bo), tac gia: meta book:author,
//   bia: meta og:image, mo ta: div.novel-description-content.
// - Trang thai: badge span.bg-emerald-500/10 (base cu dung .bg-green-100
//   la sai — khong co class nay tren trang); du phong: dong <li> "Trạng
//   Thái:".
// - So chuong: so dau tien trong hang thong ke p.text-xl.sm:text-2xl
//   (base cu lay .text-xl.font-bold — do la tieu de "Đề cử truyện", SAI);
//   du phong: regex "Với N chương" trong HTML.
// - The loai: link /the-loai/ trong khoi .flex.flex-wrap.gap-2.
// - Chuong moi nhat: #latest-chapters-list a[href*="/chuong-"].
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

load("config.js");
load("rate-limit.js");

function execute(url) {
    url = normalizeUrl(url);
    var res = fetchPage(url);
    if (!res || !res.ok) {
        if (res && (res.status === 429 || res.status === 405)) {
            return Response.error(rateLimitErrorMessage("Web Truyện Dịch", pacedHostOf(url), cooldownRemainingMs(pacedHostOf(url))));
        }
        if (res && res.status === 403) {
            return Response.error("Trang truyện bị Cloudflare chặn (HTTP 403). Mở truyện trong trình duyệt của app một lần để qua xác minh rồi thử lại.");
        }
        if (res && res.status) return Response.error("Không tải được trang truyện (HTTP " + res.status + ").");
        return Response.error("Không tải được trang truyện (lỗi mạng).");
    }
    var doc = res.html();
    if (!doc) return Response.error("Không đọc được trang truyện.");

    var h1El = safeFirst(doc.select("h1"));
    var name = h1El ? cleanText(h1El.text() + "") : "";
    name = name.replace(/^Truyện\s+/i, "");
    if (!name) return Response.error("Không tìm thấy tên truyện.");

    var cover = normalizeCoverUrl(doc.select("meta[property='og:image']").attr("content") + "");

    var author = cleanText(doc.select("meta[property='book:author']").attr("content") + "");
    if (!author) author = "Đang cập nhật";

    var descEl = safeFirst(doc.select("div.novel-description-content"));
    var description = descEl ? (descEl.html() + "") : "";

    var status = "";
    var statusEl = safeFirst(doc.select("span.bg-emerald-500\\/10"));
    if (statusEl) status = cleanText(statusEl.text() + "");
    if (!status) {
        doc.select("li").forEach(function (liEl) {
            if (status) return;
            var t = cleanText(liEl.text() + "");
            if (t.indexOf("Trạng Thái:") === 0) {
                status = t.substring("Trạng Thái:".length).trim();
            }
        });
    }
    if (!status) status = "Đang ra";

    var totalChapters = "";
    var statEl = safeFirst(doc.select("p.text-xl.sm\\:text-2xl"));
    if (statEl) totalChapters = cleanText(statEl.text() + "");
    if (!totalChapters) {
        var htmlStr = doc.html() + "";
        var m = htmlStr.match(/Với\s+([\d,\.]+)\s+chương/);
        if (m) totalChapters = m[1];
    }

    var originalName = "";
    doc.select("p").forEach(function (p) {
        var t = cleanText(p.text() + "");
        if (t.indexOf("Tên gốc:") === 0 && !originalName) {
            originalName = t.substring("Tên gốc:".length).trim();
        }
    });

    var genres = [];
    var gapEl = safeFirst(doc.select(".flex.flex-wrap.gap-2"));
    if (gapEl) {
        gapEl.select("a").forEach(function (a) {
            var href = a.attr("href") + "";
            if (href.indexOf("/the-loai/") < 0) return;
            var title = cleanText(a.text() + "");
            if (!title) return;
            genres.push({ title: title, input: toAbs(href), script: "gen.js" });
        });
    }

    var lastChEl = safeFirst(doc.select("#latest-chapters-list a[href*='/chuong-']"));
    var lastChapter = lastChEl ? cleanText(lastChEl.text() + "") : "";

    if (author && author !== "Đang cập nhật") {
        genres.unshift({
            title: author,
            input: BASE_URL + "/api/search-novels?keyword=" + encodeURIComponent(author) + "&page=1",
            script: "gen.js"
        });
    }

    var categoryText = genres.map(function (g) { return g.title; }).join(", ");
    var detailHtml = "<div>"
        + "<p>Tác giả: " + author + "</p>"
        + (originalName ? "<p>Tên gốc: " + originalName + "</p>" : "")
        + (categoryText ? "<p>Thể loại: " + categoryText + "</p>" : "")
        + "<p>Tình trạng: " + status + "</p>"
        + (totalChapters ? "<p>Số chương: " + totalChapters + "</p>" : "")
        + (lastChapter ? "<p>Chương mới: " + lastChapter + "</p>" : "")
        + "</div>";

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailHtml,
        url: url,
        type: "novel",
        format: "novel",
        ongoing: status.indexOf("Đang ra") >= 0,
        genres: genres,
        host: BASE_URL
    });
}
