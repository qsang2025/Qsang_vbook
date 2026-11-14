// chap.js — Noi dung chuong cua TruyenCv.
//
// API: GET /story/{slug}/chapter-{n}/ tra JSON {id, title, number,
// content (text thuan, cac doan cach nhau bang dong trong), locked,
// lock, prev_number, next_number, last_chapter}.
//
// MO HINH KHOA (khao sat 2026-11-14): chuong co the bi khoa
// early-access co thoi han (mo bang ve/gold tren web, ban xem truoc
// 200 ky tu). KIEM TRA KHOA TRUOC: locked=true hoac co object lock thi
// tra Response.error tieng Viet ro rang — KHONG tra ban xem truoc lam
// noi dung, KHONG mo khoa.
load("config.js");
load("rate-limit.js");

var LOCK_ERROR = "Chương này đã bị khóa trên TruyenCv — tác giả khóa sớm, cần mở khóa bằng vé trên website tutien.pro. Extension không mở khóa chương bị khóa, bạn hãy mở khóa trên web rồi đọc tiếp.";

function escapeHtml(text) {
    return (text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function execute(url) {
    var chapUrl = resolveUrl(url);
    var parsed = extractChap(chapUrl);
    if (!parsed || !parsed.slug || !parsed.number) {
        return Response.error("Không xác định được chương");
    }

    var apiUrl = BASE_URL + "/story/" + encodeURIComponent(parsed.slug) + "/chapter-" + parsed.number + "/";
    var r = fetchTT(apiUrl, { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data) return Response.error("Không tải được nội dung chương");

    // Kiem tra khoa TRUOC khi lay noi dung.
    if (data.locked || data.lock) {
        return Response.error(LOCK_ERROR);
    }

    var title = (data.title || "").trim();
    var content = (data.content || "").trim();
    if (!content || content.length < 20) {
        return Response.error("Nội dung chương trống");
    }

    // Noi dung la text thuan, cac doan cach nhau bang dong trong (\n\n).
    var paras = content.split(/\n\s*\n/);
    var htmlParts = [];
    var i = 0;
    for (i = 0; i < paras.length; i++) {
        var p = paras[i].trim();
        if (!p) continue;
        htmlParts.push("<p>" + escapeHtml(p).replace(/\n/g, "<br/>") + "</p>");
    }
    var html = htmlParts.join("");
    if (!html || html.length < 50) return Response.error("Nội dung chương trống");

    return Response.success(html, title);
}
