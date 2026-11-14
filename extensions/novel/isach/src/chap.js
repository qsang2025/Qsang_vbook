// chap.js — noi dung 1 chuong.
//
// GET <url chuong> dang story.php?story=<slug>&chapter=NNNN — noi dung
// trong #motsach_content_body div.ms_text (moi doan 1 div; chuong 1
// sach mau 321 doan). Tieu de chuong: div.ms_chapter dau tien trong
// body ("Chương N - Ten chuong"), tra ve lam data2.
//
// Dropcap: doan dau co dang <div class='ms_text'><div id='dropcap'
// ...><span class='hidden'>T</span></div>hang ba. ... — chu cai dau
// nam trong span hidden; giu nguyen span thi app co the an mat chu,
// bo ca div thi mat chu. Xu ly: thay div dropcap bang dung chu trong
// span (regex tren HTML cua tung doan; jsoup tra HTML voi ngoac kep).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = url || "";

    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
    var doc = response.html();
    var body = safeFirst(doc.select("#motsach_content_body"));
    if (!body) return Response.error("Không tải được nội dung chương.");

    var titleEl = safeFirst(body.select("div.ms_chapter"));
    var title = titleEl ? titleEl.text().replace(/^\s+|\s+$/g, "") : "";

    var paras = body.select("div.ms_text");
    var out = [];
    for (var i = 0; i < paras.size(); i++) {
        var h = paras.get(i).html();
        // Span an trong dropcap: giu lai chu cai, bo the span.
        h = h.replace(/<span class=["']hidden["']>([^<]*)<\/span>/g, "$1");
        // Div dropcap con lai chi chua chu cai (+ khoang trang do jsoup
        // pretty-print chen vao): thay ca div bang chu cai, an luon
        // khoang trang 2 dau de duoc "Thang ba." chu khong phai "T hang ba.".
        h = h.replace(/<div id=["']dropcap["'][^>]*>\s*([^<]*?)\s*<\/div>\s*/g, "$1");
        h = h.replace(/^\s+|\s+$/g, "");
        if (h) out.push("<p>" + h + "</p>");
    }
    if (out.length === 0) return Response.error("Không tải được nội dung chương (có thể sách yêu cầu đăng nhập).");

    return Response.success(out.join("\n"), title);
}
