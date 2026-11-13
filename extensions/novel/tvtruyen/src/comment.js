// comment.js — Binh luan: QQ Comment Service.
// GET /api/comments?commentable_type=<data-model o #comment-wrapper>
// &commentable_id=<data-id>&page=N&direction=desc, tra
// {html, pagination:{current_page,last_page}} (kiem chung tu VM
// 2026-11-13: truyen Tu Hai Nhi 8 binh luan, last_page 1).
// Input la URL trang chi tiet (detail.js truyen url); page la so trang.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(input, page) {
    var url = normalizeUrl(input);
    if (!url) return Response.success([], "");
    var currentPage = page ? String(page) : "1";

    // Buoc 1: lay data-model / data-id tu #comment-wrapper tren trang chi tiet
    var r = fetchTvPage(url);
    if (r.error) return Response.error(r.error);
    var wrapper = safeFirst(r.doc.select("#comment-wrapper"));
    if (!wrapper) return Response.success([], "");
    var modelType = String(wrapper.attr("data-model") || "").trim();
    var modelId = String(wrapper.attr("data-id") || "").trim();
    if (!modelType || !modelId) return Response.success([], "");

    // Buoc 2: goi API binh luan
    var apiUrl = BASE_URL + "/api/comments?commentable_type=" + encodeURIComponent(modelType) +
                 "&commentable_id=" + encodeURIComponent(modelId) +
                 "&page=" + encodeURIComponent(currentPage) + "&direction=desc";
    var resp = null;
    try {
        resp = pacedFetch(apiUrl, {
            headers: { "X-Requested-With": "XMLHttpRequest", "Accept": "application/json, text/javascript, */*; q=0.01" }
        });
    } catch (e) {
        return Response.error("Không tải được bình luận (lỗi mạng).");
    }
    if (!resp) return Response.error("Không tải được bình luận.");
    if (resp.error === "cooldown") {
        return Response.error(rateLimitErrorMessage("TruyenTV", pacedHostOf(apiUrl), resp.cooldownRemainingMs));
    }
    if (!resp.ok) return Response.error("Không tải được bình luận (HTTP " + (resp.status || 0) + ").");

    var raw = "";
    try {
        raw = resp.res.text();
    } catch (e2) {
        return Response.success([], "");
    }
    if (!raw) return Response.success([], "");

    var j = null;
    try {
        j = JSON.parse(raw);
    } catch (e3) {
        return Response.success([], "");
    }
    var html = (j && j.html) || "";
    var pagination = (j && j.pagination) || null;
    if (!html) return Response.success([], "");

    var cdoc = Html.parse(html);
    if (!cdoc) return Response.success([], "");

    var comments = [];
    var seen = {};
    var items = cdoc.select(".comment-item");
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var nameEl = safeFirst(item.select(".comment-info .title h4.name, .comment-info h4.name, h4.name"));
        var name = nameEl ? cleanText(nameEl.text()) : "Ẩn danh";
        var timeEl = safeFirst(item.select(".comment-info .title span.time, .comment-info span.time, span.time"));
        var timeText = timeEl ? cleanText(timeEl.text()) : "";
        var contentEl = safeFirst(item.select(".comment-des"));
        var content = contentEl ? cleanText(contentEl.text()) : "";
        if (!content) continue;
        var key = name + "|" + content + "|" + timeText;
        if (seen[key]) continue;
        seen[key] = true;
        comments.push({ name: name, content: content, avatar: "", description: timeText });
    }

    var nextPage = "";
    if (pagination) {
        var curr = parseInt(pagination.current_page, 10) || 1;
        var last = parseInt(pagination.last_page, 10) || curr;
        if (curr < last) nextPage = String(curr + 1);
    }
    return Response.success(comments, nextPage);
}
