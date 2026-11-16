// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Form tim kiem (kiem chung live 2026-11-16, tu VM + probe may that):
// POST /search.html, input name "s" (form viet bang document.write
// trong trang chu). POST truc tiep tu VM TREO (tarpit IP datacenter —
// giong wtr-lab #105 / danmeis #103) nen gui qua WebView cua app bang
// Engine.newBrowser() (tien le danmeis/fuxsb): b.launch trang form
// -> b.callJs dien tu khoa + submit -> poll b.html.
// Bo cuc trang ket qua CHUA KIEM CHUNG (POST khong chay du tu VM):
// gia dinh giong trang danh sach (.article .block li); co fallback
// quet moi link /book/<id>/ tren trang (parseSearchFallback).
// Phan trang: link "下一页" trong .sort_page_num (neu co) luu vao
// localStorage, trang sau fetch truc tiep.
// Truong hop 1 sach khop: site co the redirect ve trang chi tiet —
// lay 1 muc tu meta og:novel:* (tien le danmeis #103).
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

var SEARCH_NEXT_KEY = "iqushuwang_search_next";

function searchMeta(doc, property) {
    var el = safeFirst(doc.select("meta[property=\"" + property + "\"]"));
    if (el === null) return "";
    return cleanText(el.attr("content") || "");
}

function searchNextUrl(doc) {
    var links = doc.select(".sort_page_num a");
    for (var i = 0; i < links.size(); i++) {
        var t = cleanText(links.get(i).text());
        if (t === "下一页") {
            var h = String(links.get(i).attr("href") || "");
            if (!h) return "";
            return normalizeIqUrl(h);
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
        var nextUrl = "";
        try { nextUrl = localStorage.getItem(SEARCH_NEXT_KEY) + ""; } catch (e) { nextUrl = ""; }
        if (!nextUrl || nextUrl === "null" || nextUrl === "undefined") {
            return Response.error("Hết phiên tìm kiếm, hãy tìm lại từ trang 1.");
        }
        var r = fetchIqDoc(nextUrl);
        if (r.error) return Response.error(r.error);
        doc = r.doc;
    } else {
        if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
            return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
        }
        var b = Engine.newBrowser();
        try {
            b.launch(BASE_URL + "/search.html", 15000);
            var d0 = b.html(2000);
            var title0 = "";
            if (d0) title0 = String(d0.select("title").text() || "");
            var subEl = b.callJs("(function(){var f=document.querySelector('form[action*=\"search.html\"]')||document.querySelector('form');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=s]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";var btn=f.querySelector('input[type=submit]');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
            var subText = "";
            try { if (subEl) subText = String(subEl.text() || ""); } catch (e0) { subText = ""; }
            if (subText === "NOFORM") return Response.error("Không mở được form tìm kiếm trên trang.");
            if (subText === "NOINPUT") return Response.error("Không tìm thấy ô nhập từ khóa tìm kiếm.");
            for (var t = 0; t < 12; t++) {
                sleep(600);
                doc = b.html(6000);
                if (!doc) continue;
                var ti = String(doc.select("title").text() || "");
                var bodyT = String(doc.select("body").text() || "");
                if (ti.indexOf("信息提示") !== -1) break;
                if (bodyT.indexOf("没有找到") !== -1 || bodyT.indexOf("未找到") !== -1) break;
                if (doc.select(".article .block li a[href*=\"/book/\"]").size() > 0) break;
                if (searchMeta(doc, "og:novel:book_name")) break;
                if (title0 && ti !== title0) break;
            }
            if (doc) {
                var title2 = String(doc.select("title").text() || "");
                if (title2.indexOf("信息提示") !== -1) {
                    return Response.error("Tìm kiếm thất bại.");
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
    var data = parseListItems(doc);
    if (data.length === 0) data = parseSearchFallback(doc);
    if (data.length === 0) {
        var oneName = searchMeta(doc, "og:novel:book_name");
        var oneLink = "";
        var oneId = bookId(searchMeta(doc, "og:url"));
        if (oneId) oneLink = BASE_URL + "/book/" + oneId + "/";
        if (!oneLink) oneId = bookId(locHref);
        if (!oneId) {
            var as = doc.select("a[href*=\"/book/\"]");
            for (var i = 0; i < as.size(); i++) {
                oneId = bookId(String(as.get(i).attr("href") || ""));
                if (oneId) break;
            }
        }
        if (oneId) oneLink = BASE_URL + "/book/" + oneId + "/";
        if (oneName && oneLink) {
            var oneAuthor = searchMeta(doc, "og:novel:author");
            var oneCat = searchMeta(doc, "og:novel:category");
            var oneCover = searchMeta(doc, "og:image");
            if (oneCover.indexOf("nocover") !== -1 || oneCover.indexOf("defaultimg") !== -1) oneCover = "";
            if (oneCover && oneCover.indexOf("http") !== 0) oneCover = normalizeIqUrl(oneCover);
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
