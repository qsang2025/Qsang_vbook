// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Form tim kiem tren trang chu (kiem chung live 2026-11-16, ca UA mobile):
// POST /e/search/index.php, form class formSearch, field keyboard +
// hidden show=title, classid=0, nut <button class="search-submit">.
// POST truc tiep tu VM treo (tarpit IP datacenter — giong sjks88) nen
// gui qua WebView cua app bang Engine.newBrowser() (tien le trxs/sjks88):
// b.launch -> b.callJs submit form -> poll b.html. WebView encode form
// body theo charset cua document (GBK) nen tu khoa gui dung dinh dang;
// dat them accept-charset="gbk" cho chac (tien le jpxs123).
// Poll CHI break theo TITLE ("搜索" hoac "信息提示") — bai hoc ijjxs #96:
// break som theo "tim thay item" rat nguy hiem vi trang mo dau (trang
// chu) da co san item. Trang ket qua cap searchid; cac trang sau la URL
// ASCII thuan /e/search/result/index.php?page=<0-based>&searchid=<id>
// nen fetch truc tiep (GBK, pacing) thay vi WebView.
// LUU Y: site chi cho 1 lan tim / 60 giay (cung ho EmpireCMS nhu trxs) —
// tim lai qua nhanh se bi trang "信息提示" chan; loi tra ve hien ro
// thong bao do.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

// So trang lon nhat ma pager ket qua tim kiem quang cao (page param 0-based).
function searchMaxPage(doc) {
    var sel = doc.select(".page a[href*=\"searchid=\"]");
    var best = 0;
    for (var i = 0; i < sel.size(); i++) {
        var h = String(sel.get(i).attr("href") || "");
        var m = h.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    return best;
}

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Hãy nhập từ khóa tìm kiếm.");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;

    var doc = null;
    var searchId = "";

    if (pn > 1) {
        // Trang sau: lay searchid da luu tu trang 1, fetch truc tiep.
        try { searchId = localStorage.getItem("qbtr_searchid") + ""; } catch (e) { searchId = ""; }
        if (!searchId || searchId === "null" || searchId === "undefined") {
            return Response.error("Hết phiên tìm kiếm, hãy tìm lại từ trang 1.");
        }
        var r = fetchQbDoc(BASE_URL + "/e/search/result/index.php?page=" + (pn - 1) + "&searchid=" + searchId);
        if (r.error) return Response.error(r.error);
        doc = r.doc;
    } else {
        // Trang 1: submit form tim kiem qua WebView cua app.
        if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
            return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
        }
        var b = Engine.newBrowser();
        try {
            b.launch(BASE_URL + "/", 15000);
            b.callJs("(function(){var f=document.querySelector('form.formSearch');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=keyboard]');if(!i){return 'NOINPUT';}try{f.setAttribute('accept-charset','gbk');}catch(e){}i.value=" + JSON.stringify(k) + ";var btn=f.querySelector('button[type=submit],input[type=submit]');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
            // Trang ket qua ve sau ~0.5-2s; trang "信息提示" tu chuyen ve
            // trang chu sau 3s, nen poll thay vi sleep co dinh dai.
            for (var t = 0; t < 10; t++) {
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
                var html2 = doc.html() + "";
                var ms = html2.match(/searchid=(\d+)/);
                if (ms) {
                    searchId = ms[1];
                    try { localStorage.setItem("qbtr_searchid", searchId); } catch (e3) {}
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
    var mp = searchMaxPage(doc);
    // page param tren URL ket qua la 0-based: trang 1 cua app == index 0.
    if (pn <= mp) next = String(pn + 1);
    return Response.success(data, next);
}
