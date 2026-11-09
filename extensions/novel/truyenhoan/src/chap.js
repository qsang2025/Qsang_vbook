// chap.js — Doc noi dung chuong Truyen Hoan
// KHONG doi host cua link goc (xem config.js). Chi lay dung #chapter-c:
// neu trang tra ve khong co khoi nay (vi du trang chu do sai link/host)
// thi bao loi tieng Viet chu khong gom rac tu trang do.
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v3, N1):
// fetch qua fetchPageDoc() (fetchDoc + kiem challenge, tra loi tieng Viet
// co huong dan khi gap Cloudflare/login).
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeSiteUrl(url);
    if (!chapUrl) {
        return Response.error("Link chương không thuộc truyenhoan.com hay wetruyen.com. Mã truyện khác nhau giữa các mirror nên không đọc chéo mirror được.");
    }

    var r = fetchPageDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = doc.select("#chapter-c").first();
    var content = "";

    if (contentEl && contentEl.html()) {
        contentEl.select("script, iframe, .ads, .quangcao, [style*='display:none']").remove();
        content = contentEl.html();
    }

    // Nguong noi dung theo TEXT THUAN (strip tag roi dem), khong theo do
    // dai HTML tho (C1, mau truyenc C2 v4): chuong rat ngan that (chi mot
    // cau) co HTML duoi 30 ky tu van la noi dung that. Duoi 10 ky tu text
    // thi coi nhu rong. Chuong mau deu > 5.000 ky tu HTML nen nguong 10
    // ky tu text la phong thu, chat hon nguong HTML 30 ky tu cu.
    var plainText = "";
    if (content) {
        plainText = content.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
    }
    if (!content || plainText.length < 10) {
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
