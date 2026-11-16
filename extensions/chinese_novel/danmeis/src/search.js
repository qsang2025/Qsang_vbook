// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Form tim kiem (kiem chung live 2026-11-16, tu VM + probe may that):
// POST /search.html, form id searchForm, field searchkey, nut
// button#submit[type=submit]. POST truc tiep tu VM treo (tarpit IP
// datacenter — giong sjks88/qbtr) nen gui qua WebView cua app bang
// Engine.newBrowser() (tien le ffxs8/sjks88/qbtr): b.launch trang form
// -> b.callJs dien tu khoa + submit -> poll b.html.
//
// HAI DANG TRANG KET QUA (probe 2026-11-16 tren may that):
// (1) Nhieu ket qua: title "搜索关键词"XXX"-..." (co chu 搜索), bo cuc
//     RIENG ul.ser-ret li (20 sach/trang, KHONG phai ul.j_bookList —
//     tien le qbtr #100), #pagestats "N/M", #pagelink dan toi GET
//     /modules/article/search.php?searchkey=<urlencode>&searchtype=
//     articlename&page=<n> (GET truc tiep duoc, kiem chung tu VM).
// (2) CHI 1 SACH KHOP (vd. "大至尊"): site redirect thang ve trang chi
//     tiet cua sach do — title "TenSach-TacGia-..." (KHONG co chu 搜索),
//     khong co ul.ser-ret, khong co #pagelink. Truong hop nay lay 1 muc
//     tu meta og:novel:* + og:url tren trang chi tiet.
// VI VAY poll KHONG duoc break chi theo title "搜索" (loi cu lam p1
// bao "Tìm kiếm thất bại." du ket qua da ve): break khi co item
// ul.ser-ret, hoac title DOI so voi title trang form, hoac gap
// "信息提示". Trang sau: URL trang ke luu vao localStorage o trang 1,
// fetch truc tiep (UTF-8, pacing) thay vi WebView.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

var SEARCH_NEXT_KEY = "danmeis_search_next";

// Doc content cua 1 meta property (vd. og:novel:book_name), "" khi thieu.
function searchMeta(doc, property) {
    var el = safeFirst(doc.select("meta[property=\"" + property + "\"]"));
    if (el === null) return "";
    return cleanText(el.attr("content") || "");
}

// Link truyen duy nhat khi tim kiem chi tra ve 1 sach (site redirect
// ve trang chi tiet): uu tien og:url, roi URL hien tai cua trinh duyet,
// roi link /book/ dau tien tren trang. Tra "" khi khong tim duoc.
function singleBookLink(doc, locHref) {
    var id = bookId(searchMeta(doc, "og:url"));
    if (id) return BASE_URL + "/book/" + id + ".html";
    id = bookId(locHref);
    if (id) return BASE_URL + "/book/" + id + ".html";
    var as = doc.select("a[href*=\"/book/\"]");
    for (var i = 0; i < as.size(); i++) {
        id = bookId(String(as.get(i).attr("href") || ""));
        if (id) return BASE_URL + "/book/" + id + ".html";
    }
    return "";
}

// Tim URL trang ke trong #pagelink: link co so trang = trang hien tai + 1.
// So trang hien tai doc tu #pagestats "N/M" (fallback: the <strong>).
// Tra URL tuyet doi, "" khi het.
function searchNextUrl(doc) {
    var cur = 1;
    var stats = safeFirst(doc.select("#pagestats"));
    if (stats !== null) {
        var m = cleanText(stats.text()).match(/(\d+)\s*\/\s*(\d+)/);
        if (m) cur = parseInt(m[1], 10);
    } else {
        var strong = safeFirst(doc.select("#pagelink strong"));
        if (strong !== null) {
            var c = parseInt(cleanText(strong.text()), 10);
            if (!isNaN(c)) cur = c;
        }
    }
    var want = cur + 1;
    var links = doc.select("#pagelink a");
    for (var i = 0; i < links.size(); i++) {
        var h = String(links.get(i).attr("href") || "");
        var mm = h.match(/[?&]page=(\d+)/);
        if (!mm) mm = h.match(/\/(\d+)\.html$/);
        if (mm && parseInt(mm[1], 10) === want) {
            if (h.indexOf("http") === 0) return normalizeDmUrl(h);
            if (h.charAt(0) === "/") return BASE_URL + h;
            return BASE_URL + "/" + h;
        }
    }
    return "";
}

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Hãy nhập từ khóa tìm kiếm.");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;

    var doc = null;
    var locHref = "";

    if (pn > 1) {
        // Trang sau: lay URL trang ke da luu tu trang 1, fetch truc tiep.
        var nextUrl = "";
        try { nextUrl = localStorage.getItem(SEARCH_NEXT_KEY) + ""; } catch (e) { nextUrl = ""; }
        if (!nextUrl || nextUrl === "null" || nextUrl === "undefined") {
            return Response.error("Hết phiên tìm kiếm, hãy tìm lại từ trang 1.");
        }
        var r = fetchDmDoc(nextUrl);
        if (r.error) return Response.error(r.error);
        doc = r.doc;
    } else {
        // Trang 1: submit form tim kiem qua WebView cua app.
        if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
            return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
        }
        var b = Engine.newBrowser();
        try {
            b.launch(BASE_URL + "/search.html", 15000);
            var d0 = b.html(2000);
            var title0 = "";
            if (d0) title0 = String(d0.select("title").text() || "");
            var subEl = b.callJs("(function(){var f=document.querySelector('form#searchForm')||document.querySelector('form[action*=\"search.html\"]');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=searchkey]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";var btn=f.querySelector('button#submit,button[type=submit],input[type=submit]');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
            var subText = "";
            try { if (subEl) subText = String(subEl.text() || ""); } catch (e0) { subText = ""; }
            if (subText === "NOFORM") return Response.error("Không mở được form tìm kiếm trên trang.");
            if (subText === "NOINPUT") return Response.error("Không tìm thấy ô nhập từ khóa tìm kiếm.");
            for (var t = 0; t < 12; t++) {
                sleep(600);
                doc = b.html(6000);
                if (!doc) continue;
                var ti = String(doc.select("title").text() || "");
                if (ti.indexOf("信息提示") !== -1) break;
                if (doc.select("ul.ser-ret li").size() > 0) break;
                if (title0 && ti !== title0) break;
            }
            if (doc) {
                var title2 = String(doc.select("title").text() || "");
                var body2 = String(doc.select("body").text() || "");
                if (title2.indexOf("信息提示") !== -1) {
                    var mb = body2.match(/([^ ]{4,40}搜索[^ ]{0,20})/);
                    return Response.error("Tìm kiếm thất bại" + (mb ? ": " + cleanText(mb[1]) : "."));
                }
            }
            try {
                var locEl = b.callJs("location.href", 5000);
                if (locEl) locHref = String(locEl.text() || "");
            } catch (e6) { locHref = ""; }
        } catch (e4) {
            return Response.error("Lỗi trình duyệt tìm kiếm: " + e4);
        } finally {
            try { b.close(); } catch (e7) {}
        }
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    var data = parseSearchList(doc);
    if (data.length === 0) {
        // Truong hop 1 sach: site redirect ve trang chi tiet cua sach
        // (khong co ul.ser-ret). Lay 1 muc tu meta og:novel:* + og:url.
        var oneName = searchMeta(doc, "og:novel:book_name");
        var oneLink = singleBookLink(doc, locHref);
        if (oneName && oneLink) {
            var oneAuthor = searchMeta(doc, "og:novel:author");
            var oneCat = searchMeta(doc, "og:novel:category");
            var oneCover = "";
            var covEl = safeFirst(doc.select("img.book-cover-blur"));
            if (covEl !== null) oneCover = String(covEl.attr("src") || "");
            if (!oneCover) oneCover = searchMeta(doc, "og:image");
            if (oneCover.indexOf("nocover") !== -1) oneCover = "";
            if (oneCover && oneCover.indexOf("http") !== 0) oneCover = normalizeDmUrl(oneCover);
            var oneDesc = [];
            if (oneAuthor) oneDesc.push(oneAuthor);
            if (oneCat) oneDesc.push(oneCat);
            data = [{ name: oneName, cover: oneCover, link: oneLink, description: oneDesc.join(" | ") }];
        }
    }
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");

    var next = "";
    var nurl = searchNextUrl(doc);
    if (nurl) {
        try { localStorage.setItem(SEARCH_NEXT_KEY, nurl); } catch (e5) {}
        next = String(pn + 1);
    }
    return Response.success(data, next);
}
