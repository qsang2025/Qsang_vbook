// chap.js — Noi dung chuong: API
// /chapter/content/<articleid>/<chapterid>. Chu y: chapterid la ID that
// cua chuong (vd. chuong 1 cua 劍來 la 336327), KHONG phai so thu tu —
// toc.js da dung dung ID nay de tao URL chuong.
load("config.js");
load("rate-limit.js");
function execute(url) {
    url = normalizeUrl(url);
    var articleId = parseArticleId(url);
    var chapterId = parseChapterId(url);
    if (!articleId || !chapterId) return Response.error("Không đọc được ID từ URL");

    var r = fetchApi("/chapter/content/" + articleId + "/" + chapterId);
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200) return Response.error(json.msg || "Tải nội dung chương thất bại");

    var data = json.data;
    if (!data || !data.content) return Response.error("Nội dung chương trống — có thể chương này là chương VIP hoặc yêu cầu đăng nhập, extension không mở khóa chương trả phí.");

    return Response.success(textToHtml(data.content), data.chaptername || "");
}
