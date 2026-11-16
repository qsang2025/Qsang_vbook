// chap.js — Noi dung 1 chuong qua API dich cua site (execute(url) ->
// html, tieu de chuong). URL chuong: /en/novel/<raw_id>/<slug>/chapter-<order>.
// Buoc 1: GET /api/chapters/<raw_id> de doi order -> chapter_id (+ tieu
// de + co khoa). Buoc 2: POST /api/reader/get {translate:"ai",
// language:"en", raw_id, chapter_no, chapter_id, retry:false,
// force_retry:false} — tra {success, data:{data:{body}}} hoac
// {content_url:"/api/v2/reader/content/..."} (co chu ky) thi GET them
// content_url lay body. Body la mang cac doan van (chuoi).
// Xu ly rieng: requireTurnstile -> loi tieng Viet, KHONG co vuot thu
// thach; CHAPTER_LOCKED / chuong khoa -> loi khoa, KHONG doc truoc noi
// dung; success nhung chi co tasks (chuong dang dich) -> thu lai toi da
// 3 lan theo dang retry cua site (retry:true, khong chapter_no), roi
// bao chuong dang dich.
// QUIRK: POST nay TREO tu VM (tarpit IP datacenter) nhung chay tot tren
// may that (probe 2026-11-16 ~09:05: success=true, content_url co body
// that). Khong retry khi POST treo — cho lau vo ich.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function extractBody(j) {
    if (!j) return null;
    var d = j.data || null;
    if (d) {
        if (d.body !== undefined && d.body !== null) return d.body;
        if (d.data && d.data.body !== undefined && d.data.body !== null) return d.data.body;
    }
    if (j.body !== undefined && j.body !== null) return j.body;
    return null;
}

function readerPost(rawId, order, chapterId, retry) {
    var body = {
        translate: "ai",
        language: "en",
        raw_id: Number(rawId),
        chapter_id: chapterId,
        retry: !!retry,
        force_retry: false
    };
    if (!retry) body.chapter_no = order;
    return postWtrJson(BASE_URL + "/api/reader/get", body, 30000);
}

function execute(url) {
    var parsed = parseChapterUrl(url);
    if (!parsed) return Response.error("Không đọc được đường dẫn chương.");
    var toc = fetchToc(parsed.rawId);
    if (toc.error) return Response.error(toc.error);
    var chs = toc.chapters;
    var chapter = null;
    var i = 0;
    for (i = 0; i < chs.length; i++) {
        if (Number(chs[i].order) === parsed.order) { chapter = chs[i]; break; }
    }
    if (!chapter) return Response.error("Không tìm thấy chương này trong mục lục.");
    if (chapter.locked) {
        return Response.error("Chương này đã bị khóa, cần mở khóa trên website mới đọc được.");
    }
    var title = htmlDecode(chapter.title || chapter.name || "");

    var r = readerPost(parsed.rawId, parsed.order, chapter.id, false);
    if (r.error) return Response.error(r.error);
    var j = r.json;

    var body = null;
    var contentUrl = "";
    var tasks = null;
    var tries = 0;
    while (tries < 4) {
        if (!j) break;
        if (j.requireTurnstile) {
            return Response.error("Website yêu cầu xác minh người thật (Turnstile), không đọc được chương. Hãy mở truyện trong trình duyệt của app để xác minh rồi thử lại.");
        }
        if (j.success === false) {
            var code = String(j.code || "");
            var errMsg = String(j.error || "");
            if (code === "CHAPTER_LOCKED" || errMsg.toLowerCase().indexOf("lock") !== -1) {
                return Response.error("Chương này đã bị khóa, cần mở khóa trên website mới đọc được.");
            }
            return Response.error("Không đọc được chương" + (errMsg ? ": " + errMsg : "."));
        }
        body = extractBody(j);
        if (body !== null && body !== "") break;
        if (j.content_url) contentUrl = String(j.content_url);
        if (contentUrl) {
            var cu = contentUrl;
            if (cu.indexOf("http") !== 0) cu = BASE_URL + (cu.charAt(0) === "/" ? "" : "/") + cu;
            var cr = fetchWtrJson(cu, 20000);
            if (!cr.error && cr.json) {
                body = extractBody(cr.json);
                if (body !== null && body !== "") break;
            }
            contentUrl = "";
        }
        tasks = (j.tasks instanceof Array) ? j.tasks : null;
        if (!tasks || tasks.length === 0) break;
        // Chi co tasks (chuong dang dich): doi roi goi lai theo dang retry
        // cua site, toi da 3 lan.
        tries++;
        if (tries >= 4) break;
        try { sleep(3000); } catch (e) {}
        var rr = readerPost(parsed.rawId, parsed.order, chapter.id, true);
        if (rr.error) return Response.error(rr.error);
        j = rr.json;
        body = null;
        contentUrl = "";
    }
    if (body === null || body === "") {
        if (tasks && tasks.length > 0) {
            return Response.error("Chương đang được dịch, hãy thử lại sau ít phút.");
        }
        return Response.error("Không đọc được nội dung chương.");
    }
    var html = bodyToHtml(body);
    var plain = stripTags(html).replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương.");
    return Response.success(html, title);
}
