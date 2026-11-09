// chap.js — doc noi dung mot chuong cua 爱下电子书 (ixdzs8.com).
// Trang chuong /read/<id>/p<N>.html (khao sat 2026-11-09):
//   <h1 class="page-d-name">第51章</h1> = ten chuong that (co the la so
//   chu Han: 第一章 惊蛰 — tra nguyen van lam data2, khong doi sang so).
//   <article class="page-content"><h3>第51章</h3><section><p>...
//   </p></section></article> = noi dung, sach, khong quang cao trong
//   article (da kiem chung: 0 <a>, 0 marker quang cao trong article;
//   quang cao chi nam NGOAI article — #bg-ssp-*, cuefate).
//   Nav: a.chapter-next / a.chapter-pre (title = ten chuong ke/truoc).
//   Vuot trang cuoi (vd p154 cua truyen chi co 153 trang) -> HTTP 301
//   ve trang sach (khong co article) -> bao loi tieng Viet ro rang.
// Ten chuong trong <h1> co the lech so trang (p50 = 第51章, p5 = 第6章
// vi 第5章 khong co trang) — chap.js tra dung noi dung cua URL duoc
// goi + data2 = ten <h1> that, khong tu suy ra so chuong.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

    var title = cleanText(doc.select("h1.page-d-name").text());
    if (!title) title = cleanText(doc.select("h1").text());

    var article = doc.select("article.page-content").first();
    if (article === null) {
        return Response.error("Không đọc được nội dung chương (chương có thể không tồn tại hoặc đã bị gỡ): " + url);
    }
    var html = article.html();
    // Bo <h3> ten chuong lap lai trong article (ten da tra qua data2),
    // bo vo <section> thua; giu nguyen cac <p> noi dung.
    html = html.replace(/<h3[^>]*>[\s\S]*?<\/h3>/gi, "");
    html = html.replace(/<\/?section[^>]*>/gi, "");
    var content = cleanHtml(html);
    if (!content) return Response.error("Không đọc được nội dung chương (trang rỗng): " + url);

    if (title) return Response.success(content, title);
    return Response.success(content);
}
