// chap.js — Noi dung chuong (execute(url) -> html, title).
//
// Trang /chapter/<id> (kiem chung live 2026-11-16, ch.1 sach mau):
// #J_BookRead chua cac <p class='chapter'> KHONG co the dong </p>
// (jsoup tu dong dong the). Moi doan co <span>TOKEN 6 ky tu</span>
// (watermark chong scrape, khac nhau moi chuong — vd. 1B8Vaj) va
// <a class='num-link'> link binh luan doan — xoa ca hai truoc khi
// tra HTML (tien le hetushu: cat the watermark lan noi dung).
// Tieu de chuong: <h1> (vd. "序幕：历史的微小变化"), fallback tach tu
// <title> dang "Ten chuong - Ten truyen - 刺猬猫".
// Chuong khoa: tra HTTP 303 redirect ve wap. roi ve trang dang nhap
// (title "登录-刺猬猫" neu theo redirect); chap.js doc ma HTTP truoc
// (3xx = chuong khoa) roi moi parse — bao loi tieng Viet ro rang,
// khong bypass, khong dang nhap (tien le metruyensangtac).
// Chuong doc du 1 trang, khong phan trang trong chuong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeStoryUrl(url);
    if (!url) return Response.error("URL chương không hợp lệ");

    // Chuong khoa khong tra 200 ma redirect 303 ve wap. roi ve trang dang
    // nhap (kiem chung live 2026-11-16: chuong cuoi sach mau tra 303
    // Location: wap.ciweimao.com/chapter/<id>); fetch thuong khong theo
    // redirect nen phai doc ma HTTP qua pacedFetch truoc — 3xx o day
    // chinh la dau hieu chuong khoa, khong phai loi mang.
    var pf = pacedFetch(url, { maxRetries: 0 });
    if (pf && pf.status >= 300 && pf.status < 400) {
        return Response.error("Chương này yêu cầu đăng nhập tài khoản 刺猬猫 nên không đọc được miễn phí. Hãy thử chương khác, hoặc đăng nhập trong trình duyệt của app rồi thử lại.");
    }
    if (!pf || !pf.ok) {
        return Response.error("Không tải được chương (HTTP " + (pf ? pf.status : 0) + "): " + url);
    }
    var doc = null;
    try {
        doc = pf.res.html();
    } catch (e) {
        return Response.error("Không đọc được chương: " + url);
    }
    if (!doc) return Response.error("Không đọc được chương: " + url);

    var title = String(doc.select("title").text() || "");
    if (title.indexOf("登录") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập tài khoản 刺猬猫 nên không đọc được miễn phí. Hãy thử chương khác, hoặc đăng nhập trong trình duyệt của app rồi thử lại.");
    }

    var body = safeFirst(doc.select("#J_BookRead"));
    if (!body) {
        return Response.error("Không lấy được nội dung chương (có thể chương này yêu cầu đăng nhập): " + url);
    }

    // Tieu de chuong: <h1>. Trong h1 co <a class='num-link'><i>5</i></a>
    // la so binh luan doan — xoa truoc khi doc text, neu khong tieu de
    // se dinh them so le ("序幕：历史的微小变化 5"). Fallback tach tu <title>.
    var chapterTitle = "";
    var h1 = safeFirst(doc.select("h1"));
    if (h1) {
        h1.select("a").remove();
        chapterTitle = cleanText(h1.text());
    }
    if (!chapterTitle && title) {
        var m = title.match(/^(.+?)\s*-\s*.+?\s*-\s*刺猬猫/);
        if (m) chapterTitle = cleanText(m[1]);
        else chapterTitle = cleanText(title.split(" - ")[0]);
    }

    // Xoa watermark <span>TOKEN 6 ky tu</span> o cuoi moi doan va
    // link binh luan doan <a class='num-link'> (ke ca so dem <i> ben
    // trong). Anh minh hoa <img> trong doan duoc giu lai.
    body.select("span").remove();
    body.select("a.num-link").remove();
    body.select("a").remove();

    var html = body.html();
    if (!html) {
        return Response.error("Không lấy được nội dung chương: " + url);
    }
    html = html.replace(/&nbsp;/g, "");
    html = html.replace(/<p class=['"]chapter['"]>/gi, "<p>");
    var clean = cleanHtml(html);
    if (!clean) {
        return Response.error("Không lấy được nội dung chương: " + url);
    }
    return Response.success(clean, chapterTitle);
}
