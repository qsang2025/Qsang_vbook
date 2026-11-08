// chap.js — Doc noi dung chuong Truyen Hoan
// KHONG doi host cua link goc (xem config.js). Chi lay dung #chapter-c:
// neu trang tra ve khong co khoi nay (vi du trang chu do sai link/host)
// thi bao loi tieng Viet chu khong gom rac tu trang do.
load('config.js');

function execute(url) {
    var chapUrl = normalizeSiteUrl(url);
    if (!chapUrl) {
        return Response.error("Link chương không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }

    var response = safeFetch(chapUrl);
    if (!response) return Response.error("Không kết nối được tới trang chương.");
    if (!response.ok) return Response.error("HTTP Error: " + response.status);
    var doc = response.html();

    var contentEl = doc.select("#chapter-c").first();
    var content = "";

    if (contentEl && contentEl.html()) {
        contentEl.select("script, iframe, .ads, .quangcao, [style*='display:none']").remove();
        content = contentEl.html();
    }

    if (!content || content.length < 30) {
        return Response.error("Không tìm thấy nội dung chương.");
    }

    var chapterTitle = "";
    var titleEl = doc.select("a.chapter-title").first();
    if (titleEl) {
        chapterTitle = titleEl.text().trim();
    } else {
        var h1s = doc.select("h1");
        if (h1s.size() > 0) chapterTitle = h1s.last().text().trim();
    }

    return Response.success(content, chapterTitle);
}
