// chap.js — noi dung chuong cua Bqgoo (bqgoo.cc).
// URL chuong: /shu/<id>/<chapterid>.html (vd /shu/1985/1.html).
// Chi chuong moi can token; cac endpoint khac goi tran van 200.
//
// Token (giai ma tu JS cong khai cua site, da kiem chung bang node:
// token tu tinh === token cua site, GET URL token tra 200 full text):
//   code = MD5("book@token.html")
//        = 394c2c3202da6270a3dc22cf70418a51 (hang so)
//   iv = UTF-8 cua 16 ky tu dau code ("394c2c3202da6270")
//   key = UTF-8 cua 16 ky tu cuoi code ("a3dc22cf70418a51")
//   token = base64(AES-CBC/PKCS7 encrypt JSON.stringify({id, chapterid}))
//   GET BASE_URL + "/api/chapter?token=" + encodeURIComponent(token)
// Key/iv suy ra tu chuoi cong khai trong JS cong khai cua site, khong
// phai credential nguoi dung; hardcode 2 chuoi hex tren, khong can
// tinh MD5 luc chay. Dung CryptoJS trong file crypto.js.
// Tra ve {id,chapterid,dirid,title,author,chaptername,cs,ck,txt} —
// txt la text thuan, \n ngan doan; tach theo \n roi boc <p>.
// Tieu de chuong tra qua data2 (chaptername), cs = tong so chuong.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// cleanHtml.js, crypto.js, rate-limit.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('cleanHtml.js');
load('crypto.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var m = String(url || "").match(/\/shu\/(\d+)\/(\d+)\.html/);
    if (!m) return Response.error("Link chương không đúng định dạng /shu/<sách>/<chương>.html: " + url);
    var bookId = parseInt(m[1], 10);
    var chapterId = parseInt(m[2], 10);

    var iv = CryptoJS.enc.Utf8.parse("394c2c3202da6270");
    var key = CryptoJS.enc.Utf8.parse("a3dc22cf70418a51");
    var payload = JSON.stringify({ id: bookId, chapterid: chapterId });
    var token = CryptoJS.AES.encrypt(payload, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    }).toString();
    var apiPath = "/api/chapter?token=" + encodeURIComponent(token);

    rateLimitDelay("apibi.cc");
    var j = fetchJsonWithFallback(apiPath);
    if (!j) return Response.error("Không tải được chương: " + url);

    var txt = j.txt || "";
    if (!txt) return Response.error("Chương trống, không đọc được nội dung: " + url);

    var content = plainToHtml(txt);
    if (!content) return Response.error("Không đọc được nội dung chương: " + url);

    var title = cleanText(j.chaptername || "");
    if (!title) title = url;

    return Response.success(content, title);
}
