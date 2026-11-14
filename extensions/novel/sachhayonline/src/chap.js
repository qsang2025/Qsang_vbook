// chap.js — noi dung 1 chuong.
//
// GET <url chuong> dang /tua-sach/<slug>/<chuong|hoi>-<so>/<id> — noi
// dung trong #ftn3 .chapter-content article.reading-white (moi doan 1
// <p>; chuong 1 Tam quoc dien nghia 131 doan). Tieu de chuong: option
// dang chon trong select[name=chap] ("Chương XXI"); fallback suy tu
// doan URL (vd. /chuong-xxi/ -> "Chương XXI", /hoi-1/ -> "Hồi 1").
// Doan chi co khoang trang (vd. doan cuoi chuong) thi bo qua.
// Luu y: base cu cong them ".html" vao URL chuong — URL that khong co
// ".html", khong duoc cong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";

    var r = fetchDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var body = safeFirst(doc.select("#ftn3"));
    if (!body) return Response.error("Không tải được nội dung chương.");

    var title = "";
    var sel = safeFirst(body.select("select[name=chap] option[selected]"));
    if (sel) title = cleanText(sel.text());
    if (!title) title = titleFromUrl(url);

    var paras = body.select("p");
    var out = [];
    for (var i = 0; i < paras.size(); i++) {
        var h = paras.get(i).html();
        h = h.replace(/^\s+|\s+$/g, "");
        // Doan chi co khoang trang / &nbsp; (vd. doan cuoi chuong) thi bo qua.
        var textOnly = h.replace(/&nbsp;/g, "").replace(/<[^>]+>/g, "").replace(/^\s+|\s+$/g, "");
        if (textOnly) out.push("<p>" + h + "</p>");
    }
    if (out.length === 0) return Response.error("Không tải được nội dung chương (có thể sách yêu cầu đăng nhập).");

    return Response.success(out.join("\n"), title);
}

// Suy tieu de chuong tu URL: /.../chuong-xxi/847 -> "Chương XXI";
// /.../hoi-1/347 -> "Hồi 1". Khong suy duoc thi tra "".
function titleFromUrl(url) {
    var m = String(url || "").match(/\/(chuong|hoi)-([^\/]+)\//);
    if (!m) return "";
    var kind = m[1] === "hoi" ? "Hồi" : "Chương";
    var num = m[2].toUpperCase();
    return kind + " " + num;
}
