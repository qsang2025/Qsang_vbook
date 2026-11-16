// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Tim kiem EmpireCMS (kiem chung live 2026-11-16, tu VM):
// - GET /e/search/?searchget=1&keyboard=<kw>&show=title tra 302 ve
//   /e/search/result/?searchid=<id> (runtime fetch KHONG tu theo
//   redirect — doc header Location roi fetch tiep, nhu pacedFetch tra ve
//   {status: 302, headers}). Ket qua cung bo cuc .list_article nhu
//   danh muc nen dung chung parseFxList (file helper.js).
// - Cac trang sau: /e/search/result/index.php?page=<0-based>&searchid=<id>
//   (fetch truc tiep; searchid luu vao localStorage "fuxsb_searchid").
// - POST /e/search/index.php truc tiep tu VM TREO (tarpit IP datacenter
//   — giong sjks88/qbtr) nen chi dung WebView POST lam DU PHONG khi
//   GET that bai: form tren trang chu ten formsearch (khong co class),
//   field keyboard + hidden show/tempid/tbname, nut button.img_size;
//   poll CHI break theo TITLE ("搜索" hoac "信息提示") — bai hoc ijjxs #96:
//   break som theo "tim thay item" rat nguy hiem vi trang mo dau (trang
//   chu) da co san item.
// - Trang "信息提示" (tim qua nhanh / tu khoa rong) -> bao loi tieng
//   Viet ro rang thay vi tra danh sach gia.
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

// Tim kiem trang 1 qua WebView POST (du phong khi GET that bai).
// Tra ve Document ket qua hoac null.
function searchViaBrowser(k) {
    if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
        return null;
    }
    var b = Engine.newBrowser();
    var doc = null;
    try {
        b.launch(BASE_URL + "/", 15000);
        b.callJs("(function(){var f=document.querySelector('form[name=formsearch]');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=keyboard]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";var btn=f.querySelector('button[type=submit],input[type=submit],button.img_size');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
        for (var t = 0; t < 10; t++) {
            sleep(600);
            doc = b.html(6000);
            var ti = String(doc.select("title").text() || "");
            if (ti.indexOf("搜索") !== -1 || ti.indexOf("信息提示") !== -1) break;
        }
    } catch (e) {
        doc = null;
    } finally {
        try { b.close(); } catch (e2) {}
    }
    return doc;
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
        try { searchId = localStorage.getItem("fuxsb_searchid") + ""; } catch (e) { searchId = ""; }
        if (!searchId || searchId === "null" || searchId === "undefined") {
            return Response.error("Hết phiên tìm kiếm, hãy tìm lại từ trang 1.");
        }
        var r = fetchFxDoc(BASE_URL + "/e/search/result/index.php?page=" + (pn - 1) + "&searchid=" + searchId);
        if (r.error) return Response.error(r.error);
        doc = r.doc;
    } else {
        // Trang 1: GET search, tu theo redirect 302.
        var searchUrl = BASE_URL + "/e/search/?searchget=1&keyboard=" + encodeURIComponent(k) + "&show=title";
        var pr = null;
        try {
            pr = pacedFetch(searchUrl, {});
        } catch (e3) {
            pr = null;
        }
        if (pr && pr.ok && pr.res) {
            try { doc = pr.res.html(); } catch (e4) { doc = null; }
            if (doc && isChallengeDoc(doc)) {
                var bd = null;
                try { bd = fetchViaBrowser(searchUrl); } catch (e5) { bd = null; }
                doc = (bd && !isChallengeDoc(bd)) ? bd : null;
            }
        } else if (pr && (pr.status === 301 || pr.status === 302 || pr.status === 303)) {
            var loc = "";
            try {
                loc = pr.headers["Location"] || pr.headers["location"] || "";
            } catch (e6) { loc = ""; }
            if (loc) {
                var abs = absUrl(String(loc));
                var m = abs.match(/searchid=(\d+)/);
                if (m) searchId = m[1];
                var r2 = fetchFxDoc(abs);
                if (!r2.error) doc = r2.doc;
            }
        } else if (pr && pr.error === "cooldown") {
            return Response.error(rateLimitErrorMessage("fuxsb", pacedHostOf(searchUrl), pr.cooldownRemainingMs));
        }
        if (!doc) {
            // GET that bai (VD. CF chan duong dan /e/search/) -> thu
            // WebView POST (form EmpireCMS, tien le qbtr/sjks88).
            doc = searchViaBrowser(k);
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
            if (!searchId) searchId = searchIdFromDoc(doc);
            if (searchId) {
                try { localStorage.setItem("fuxsb_searchid", searchId); } catch (e7) {}
            }
        }
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    var data = parseFxList(doc);
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");

    var next = "";
    var mp = searchMaxPage(doc);
    // page param tren URL ket qua la 0-based: trang 1 cua app == index 0.
    if (pn <= mp) next = String(pn + 1);
    return Response.success(data, next);
}
