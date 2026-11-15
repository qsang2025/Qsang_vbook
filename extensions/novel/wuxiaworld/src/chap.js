// chap.js — Noi dung chuong trong div#chapter-body (ban lite).
//
// Tieu de chuong: h1#chapter-title. Noi dung day du trong #chapter-body
// (moi doan p co data-uid); ghi chu dich trong div[id^=footnote-] sau
// body duoc ghep them (bo trung voi doan da co trong body).
//
// Mo hinh khoa — phat hien tai thoi diem mo chuong (khac nhau theo
// truyen, khong hardcode so chuong; kiem chung tu VM 2026-11-15):
// - Chuong yeu cau dang nhap: trang khong co #chapter-body ma co dong
//   "This chapter requires an account. Sign in to continue reading."
//   -> tra loi tieng Viet, KHONG vuot khoa.
// - Chuong xem truoc: body chi ~900 ky tu, cat giua cau, doan cuoi ket
//   bang "..." (vi du Beyond the Zenith ch.51-151). Tra ban xem truoc
//   KEM ghi chu ro rang day chi la ban xem truoc, toan bo chuong can
//   dang nhap/mo khoa tren WuxiaWorld (tien le medoctruyen).
// - Chuong day du: tra toan bo html nhu site tra ve.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    var rr = ttlFetchDoc(url);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var title = cleanText(doc.select("h1").text());

    // Chuong cao cap: yeu cau dang nhap, khong co noi dung.
    var pageText = cleanText(doc.select("body").text());
    if (pageText.indexOf("requires an account") !== -1) {
        return Response.error("Chương này yêu cầu đăng nhập tài khoản WuxiaWorld (chương trả trước/cao cấp). Mở trên web chính để đăng nhập/mở khóa — extension không vượt qua khóa trả phí.");
    }

    var body = selFirst(doc, "#chapter-body");
    if (!body) return Response.error("Không đọc được nội dung chương: " + url);
    body.select("script").remove();
    var html = body.html() || "";
    var plain = cleanText(body.text());
    if (!plain) return Response.error("Nội dung chương trống: " + url);

    // Ghep ghi chu dich (div[id^=footnote-]) chua co trong body.
    var notes = doc.select("div[id^=footnote-]");
    for (var i = 0; i < notes.size(); i++) {
        var noteHtml = notes.get(i).html() || "";
        var noteText = cleanText(notes.get(i).text());
        if (!noteText) continue;
        var head = noteText.substring(0, 80);
        if (plain.indexOf(head) === -1) {
            html += noteHtml;
            plain += " " + noteText;
        }
    }

    // Phat hien ban xem truoc: ngan (< 3000 ky tu) va doan cuoi ket bang
    // "..." giua cau. Chuong day du kiem chung deu > 9.000 ky tu.
    var paras = body.select("p");
    var lastText = "";
    for (var j = paras.size() - 1; j >= 0; j--) {
        var t = cleanText(paras.get(j).text());
        if (t) { lastText = t; break; }
    }
    var endsDots = false;
    if (lastText.length >= 3) {
        var tail = lastText.substring(lastText.length - 3);
        if (tail === "...") endsDots = true;
    }
    if (lastText.length >= 1 && lastText.charAt(lastText.length - 1) === "…") endsDots = true;
    if (plain.length < 3000 && endsDots) {
        html += "<p><i>— Đây chỉ là bản xem trước (phần đầu chương). Toàn bộ chương yêu cầu đăng nhập/mở khóa trên WuxiaWorld, extension không vượt qua khóa trả phí. —</i></p>";
    }

    return Response.success(html, title);
}
