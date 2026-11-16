// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Form tim kiem (kiem chung live 2026-11-16, tu VM):
// POST /search.html, form id searchForm, field searchkey, nut
// button#submit[type=submit]. POST truc tiep tu VM treo (tarpit IP
// datacenter — giong sjks88/qbtr) nen gui qua WebView cua app bang
// Engine.newBrowser() (tien le ffxs8/sjks88/qbtr): b.launch trang form
// -> b.callJs dien tu khoa + submit -> poll b.html.
// Poll CHI break theo TITLE ("搜索" hoac "信息提示") — bai hoc ijjxs #96:
// break som theo "tim thay item" rat nguy hiem vi trang mo dau (trang
// form) da co san item.
// CHUA KIEM CHUNG TU VM (POST treo): tieu de trang ket qua + bo cuc
// ket qua + dang URL phan trang. Gia dinh: ket qua dung cung bo cuc
// ul.j_bookList nhu trang the loai (mau chung cua site); phan trang doc
// tu #pagelink (link co so trang = trang hien tai + 1, bat ke dang URL).
// Device test tren may that se xac nhan; neu sai thi sua theo probe tam
// (tien le qbtr #100: parseSearchList rieng cho trang ket qua).
// Trang sau: URL trang ke luu vao localStorage o trang 1, fetch truc
// tiep (UTF-8, pacing) thay vi WebView.
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
            b.callJs("(function(){var f=document.querySelector('form#searchForm')||document.querySelector('form[action*=\"search.html\"]');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=searchkey]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";var btn=f.querySelector('button#submit,button[type=submit],input[type=submit]');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
            for (var t = 0; t < 12; t++) {
                sleep(600);
                doc = b.html(6000);
                var ti = String(doc.select("title").text() || "");
                if (ti.indexOf("搜索") !== -1 || ti.indexOf("信息提示") !== -1) break;
            }
            if (doc) {
                var title2 = String(doc.select("title").text() || "");
                var body2 = String(doc.select("body").text() || "");
                if (title2.indexOf("信息提示") !== -1) {
                    var mb = body2.match(/([^ ]{4,40}搜索[^ ]{0,20})/);
                    return Response.error("Tìm kiếm thất bại" + (mb ? ": " + cleanText(mb[1]) : "."));
                }
                if (title2.indexOf("搜索") === -1) {
                    return Response.error("Tìm kiếm thất bại.");
                }
            }
        } catch (e4) {
            return Response.error("Lỗi trình duyệt tìm kiếm: " + e4);
        } finally {
            b.close();
        }
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    var data = parseListItems(doc);
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");

    var next = "";
    var nurl = searchNextUrl(doc);
    if (nurl) {
        try { localStorage.setItem(SEARCH_NEXT_KEY, nurl); } catch (e5) {}
        next = String(pn + 1);
    }
    return Response.success(data, next);
}
