// detail.js — Thong tin truyen Truyen Hoang Dung (truyenhoangdung.xyz).
//
// - Ten: #chi_tiet .title (kem span "Dịch"/"Convert" — cat bo hau to
//   trung voi text cua span).
// - Bia: #chi_tiet .image-cover img (src tho co dau cach + dau tieng
//   Viet — ma hoa tung doan duong dan bang encodePath).
// - Thong tin: #chi_tiet .list .item theo label (Tên gốc / Tác giả /
//   Thể loại / Tình trạng / Độ tuổi / Lượt xem). Trang thai "Hoàn
//   Thành" => ongoing=false; "Đang tiếp diễn" => ongoing=true.
// - The loai: cac link a trong muc Thể loại -> {title, input, script}.
// - Mo ta: #noidung (html).
// - Goi y: .truyencv-detail-related a[href*="/truyen/"] ("Cùng tác
//   giả"), dedupe theo link.
// Truyen mau (kiem chung live 2026-11-14): Âm Dương Quỷ Đạo (Dịch) —
// Vô Song (无双), Đang tiếp diễn, 25 chương; Cổ Chân Nhân (Dịch) —
// Hoàn Thành, 3.813 chương.
load("config.js");
load("rate-limit.js");

function execute(url) {
    var full = normalizeUrl(url);
    if (!full) return Response.error("Link truyện không hợp lệ.");
    var r = thdFetchDoc(full);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var titleEl = selFirst(doc, "#chi_tiet .title");
    if (!titleEl) return Response.error("Không tìm thấy truyện");
    var name = cleanText(titleEl.text());
    var spanEl = selFirst(titleEl, "span");
    if (spanEl) {
        var spanText = cleanText(spanEl.text());
        if (spanText && name.length > spanText.length && name.substring(name.length - spanText.length) === spanText) {
            name = cleanText(name.substring(0, name.length - spanText.length));
        }
    }
    if (!name) return Response.error("Không tìm thấy truyện");

    var cover = "";
    var coverEl = selFirst(doc, "#chi_tiet .image-cover img");
    if (coverEl) cover = coverEl.attr("src") || "";
    if (cover) cover = encodePath(normalizeUrl(cover));

    var info = {};
    doc.select("#chi_tiet .list .item").forEach(function (el) {
        var labelEl = selFirst(el, ".item-label");
        var valueEl = selFirst(el, ".item-value");
        if (!labelEl || !valueEl) return;
        var label = cleanText(labelEl.text());
        if (label === "Tên gốc:") info.orig = cleanText(valueEl.text());
        else if (label === "Tác giả:") info.author = cleanText(valueEl.text());
        else if (label === "Tình trạng:") info.status = cleanText(valueEl.text());
        else if (label === "Lượt xem:") info.views = cleanText(valueEl.text());
    });
    var author = info.author || "";

    var genres = [];
    var genreValueEl = null;
    doc.select("#chi_tiet .list .item").forEach(function (el) {
        var labelEl = selFirst(el, ".item-label");
        if (labelEl && cleanText(labelEl.text()) === "Thể loại:") {
            genreValueEl = selFirst(el, ".item-value");
        }
    });
    if (genreValueEl) {
        genreValueEl.select("a[href*=\"/the-loai/\"]").forEach(function (el) {
            var href = el.attr("href") || "";
            var t = cleanText(el.text());
            if (!href || !t) return;
            genres.push({ title: t, input: href, script: "gen.js" });
        });
    }

    var descEl = selFirst(doc, "#noidung");
    var description = descEl ? descEl.html() : "";

    var details = [];
    if (info.orig) details.push("Tên gốc: " + info.orig);
    if (author) details.push("Tác giả: " + author);
    if (info.status) details.push("Tình trạng: " + info.status);
    if (info.views) details.push("Lượt xem: " + info.views);

    var suggests = [];
    var seenSug = {};
    doc.select(".truyencv-detail-related a[href*=\"/truyen/\"]").forEach(function (el) {
        var href = el.attr("href") || "";
        var t = cleanText(el.attr("title") || el.text());
        if (!href || !t || seenSug[href]) return;
        seenSug[href] = true;
        suggests.push({ title: t, input: normalizeUrl(href), script: "detail.js" });
    });

    var status = info.status || "";
    return Response.success({
        name: name,
        author: author || "Không rõ",
        cover: cover,
        description: description,
        detail: details.join("<br>"),
        url: full,
        type: "novel",
        format: "novel",
        ongoing: status.indexOf("Hoàn") < 0,
        genres: genres,
        suggests: suggests
    });
}
