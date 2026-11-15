// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Noi dung o .readcontent (kiem chung live 2026-11-15): van ban that,
// cac doan tach bang </p><br/><br/> (mo <p> thieu — giu nguyen HTML goc).
// Chuong chia trang: a#linkNext chu "下一页" -> trang ke dang "<N>_<M>.html"
// (vd 1.html -> 1_2.html); trang cuoi cung a#linkNext la "下一章" thi dung.
// Noi tat ca cac trang chia thanh 1 chuong day du (toi da 10 trang).
// Loai khoi quang cao/dan site: .readmiddle, .kongwen, .text-danger.
// Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// Lay HTML sach cua .readcontent tren 1 trang chuong (da loai rac).
// Tra "" khi khong co noi dung.
function readPageContent(doc) {
    var contentEl = safeFirst(doc.select(".readcontent"));
    if (contentEl === null) return "";
    contentEl.select(".readmiddle").remove();
    contentEl.select(".kongwen").remove();
    contentEl.select(".text-danger").remove();
    return contentEl.html() || "";
}

// Ten chuong tu <title> dang "<truyen>_ <chuong>(1/2)_笔趣阁".
function chapterTitle(doc) {
    var t = cleanText(doc.select("title").text());
    t = t.replace(/_笔趣阁\s*$/, "").replace(/\(\d+\/\d+\)\s*$/, "");
    var idx = t.indexOf("_");
    if (idx !== -1) t = cleanText(t.substring(idx + 1));
    return t;
}

function execute(url) {
    // normalizeUrl() KHONG xu ly URL chi co path (vd "/go/1/1.html" —
    // regex doi co host): no tra nguyen chuoi, fetch nhan URL tuong doi
    // thi tra fake 504 (kiem chung tren may that 2026-11-15: chap
    // "/go/1/1.html" code 1 HTTP 504, cung chuong URL tuyet doi code 0).
    // absUrl() ghep ve siteOrigin cho moi dang URL (tuyet doi / "/..."
    // / tuong doi) nen dung no o day.
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var dirUrl = chapUrl.substring(0, chapUrl.lastIndexOf("/") + 1);

    var r = fetchBqDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var content = readPageContent(doc);
    var title = chapterTitle(doc);
    if (!content) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("登录") !== -1 || fullText.indexOf("登入") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }

    // Noi cac trang chia: theo a#linkNext khi chu la "下一页".
    var pages = 1;
    while (pages < 10) {
        var nextEls = doc.select("a#linkNext");
        if (nextEls.size() === 0) break;
        var nextEl = nextEls.get(nextEls.size() - 1);
        if (cleanText(nextEl.text()) !== "下一页") break;
        var href = nextEl.attr("href");
        if (!href) break;
        var nextUrl = href.charAt(0) === "/" ? siteOrigin() + href : dirUrl + href;
        var r2 = fetchBqDoc(nextUrl);
        if (r2.error) break;
        var more = readPageContent(r2.doc);
        if (!more) break;
        content += more;
        doc = r2.doc;
        pages++;
    }

    content = content.replace(/<p><\/p>/g, "").replace(/&nbsp;/g, "");
    // Dau "chua het chuong, bam trang ke de doc tiep" site chen o cuoi
    // moi trang chia (khong phai noi dung truyen).
    content = content.replace(/本章未完，点击下一页继续阅读/g, "");
    if (!content) return Response.error("Không tìm thấy nội dung chương.");
    return Response.success(content, title);
}
