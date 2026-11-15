// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Site luu moi thu bang GBK, nen tu khoa phai encode GBK thi backend moi
// khop (kiem chung live 2026-11-15: POST GBK tra dung — 1 ket qua duy nhat
// 302 thang ve trang chi tiet, "九重天" tra 7 muc; POST UTF-8 tra 0 ket
// qua, tien le biqugezz/bixiange). WebView encode form body theo charset
// cua document, nen tim qua form tim kiem cua chinh site bang
// Engine.newBrowser().
// - 1 ket qua duy nhat: site 302 thang ve trang chi tiet — doc tra ve la
//   trang chi tiet (nhan biet bang URL /bookinfo/), tra 1 muc.
// - Nhieu ket qua: trang "搜索结果", bang table.grid nhu trang the loai
//   (parseGridRows trong helper.js); phan trang bang link
//   search.php?searchkey=<GBK percent>&searchtype=articlename&page=N
//   (lay nguyen href lam token, GET truc tiep duoc vi searchkey da encode
//   san trong URL).
// - 0 ket qua: table.grid rong -> bao loi tieng Viet kem chan doan.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('helper.js');

// Trang ke cua ket qua tim kiem: page la URL phan trang day du
// (/modules/article/search.php?searchkey=...&page=N), GET truc tiep.
function searchPage(page) {
    var url = String(page);
    if (url.indexOf("http") !== 0) url = siteOrigin() + (url.charAt(0) === "/" ? url : "/" + url);
    var r = fetchPtDoc(url);
    if (r.error) return Response.error(r.error);
    return searchDoc(r.doc, url);
}

// Parse 1 trang ket qua tim kiem (da co Document): tra items + next.
function searchDoc(doc, finalUrl) {
    // 1 ket qua duy nhat: da redirect ve trang chi tiet.
    if (String(finalUrl || "").indexOf("/bookinfo/") !== -1) {
        var nameEl = safeFirst(doc.select("#centerm h1"));
        var name = nameEl === null ? "" : cleanText(nameEl.text());
        if (!name) return Response.error("Không đọc được tên truyện ở trang kết quả.");
        var author = "";
        var tds = doc.select("#centerm td");
        var i = 0;
        for (i = 0; i < tds.size(); i++) {
            if (tds.get(i).select("table").size() > 0) continue;
            var m = cleanText(tds.get(i).text()).match(/作\s*者：(.+)$/);
            if (m) { author = cleanText(m[1]); break; }
        }
        return Response.success([{
            name: name,
            cover: coverFromBookUrl(finalUrl),
            link: finalUrl,
            author: author,
            description: "",
            host: siteOrigin()
        }], "");
    }
    var items = parseGridRows(doc);
    if (items.length === 0) {
        return Response.error("Không tìm thấy truyện nào khớp từ khoá.");
    }
    // Token trang ke: link ">" trong pager (giu nguyen query GBK).
    var next = "";
    var pager = doc.select("a");
    var j = 0;
    for (j = 0; j < pager.size(); j++) {
        var a = pager.get(j);
        if (cleanText(a.text()) === ">") {
            var href = a.attr("href");
            if (href && href.indexOf("search.php") !== -1) next = href;
            break;
        }
    }
    return Response.success(items, next);
}

function execute(key, page) {
    if (page) return searchPage(page);
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm.");

    if (typeof Engine === "undefined") {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
    }
    var b = Engine.newBrowser();
    var doc = null;
    var finalUrl = "";
    var jsOut = "?";
    var hitSearch = false;
    var homeTitle = "";
    try {
        var homeDoc = b.launch(BASE_URL + "/", 15000);
        try { homeTitle = String(homeDoc.select("title").text() || ""); } catch (eH) {}
        // IIFE tra ve: SUBMITTED|charset=GBK, hoac NOFORM|... / NOINPUT|...
        // - Bo target="_blank" cua form de WebView dieu huong ngay trong
        //   cung trinh duyet (form goc co target="_blank").
        // - Gan accept-charset="gbk" (ca attribute lan property) de buoc
        //   WebView encode GBK bat ke document charset la gi (tien le
        //   biqugezz v2/v3).
        // - Chon chac radio searchtype=articlename (tim theo ten truyen).
        // - Click nut submit that (duong submit tu nhien); neu khong co
        //   nut thi dung HTMLFormElement.prototype.submit.call(f) de vuot
        //   shadow (nut submit cua site co name="Submit").
        var jsEl = b.callJs("(function(){var cs='?';try{cs=document.characterSet||document.charset||'?';}catch(e0){}var f=document.querySelector('form[name=articlesearch]');if(!f){return 'NOFORM|charset='+cs;}var i=f.querySelector('input[name=searchkey]');if(!i){return 'NOINPUT|charset='+cs;}try{f.removeAttribute('target');}catch(eT){}try{f.setAttribute('accept-charset','gbk');}catch(e1){}try{f.acceptCharset='gbk';}catch(e2){}try{var r0=f.querySelector('input[name=searchtype][value=articlename]');if(r0){r0.checked=true;}}catch(eR){}i.value=" + JSON.stringify(k) + ";var ok=false;try{var btn=f.querySelector('input[type=submit],button[type=submit]');if(btn){btn.click();ok=true;}}catch(e3){}if(!ok){try{HTMLFormElement.prototype.submit.call(f);ok=true;}catch(e4){}}return (ok?'SUBMITTED':'SUBMITFAIL')+'|charset='+cs;})()", 8000);
        try { jsOut = String(jsEl ? jsEl.text() : ""); } catch (eJ) { jsOut = "ERR:" + eJ; }
        if (!jsOut) jsOut = "?";
        // Trang ket qua ve sau ~0.5-2s; poll thay vi sleep co dinh dai.
        for (var t = 0; t < 12; t++) {
            sleep(600);
            doc = b.html(6000);
            var ti = String(doc.select("title").text() || "");
            if (ti.indexOf("搜索结果") !== -1) break;
            if (ti.indexOf("最新章节") !== -1) break;
        }
        // URL cuoi cung (phan biet trang ket qua voi trang chi tiet sau 302).
        try {
            var reqUrls = b.urls() || [];
            var u = 0;
            for (u = 0; u < reqUrls.length; u++) {
                var s = String(reqUrls[u]);
                if (s.indexOf("search.php") !== -1) { hitSearch = true; finalUrl = s; }
                if (s.indexOf("/bookinfo/") !== -1) { finalUrl = s; }
            }
        } catch (eU) {}
    } catch (e) {
        return Response.error("Lỗi trình duyệt tìm kiếm: " + e);
    } finally {
        try { b.close(); } catch (e2) {}
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    if (!hitSearch && !finalUrl) {
        var finalTitle = "";
        try { finalTitle = String(doc.select("title").text() || ""); } catch (eT) {}
        return Response.error("Không tìm thấy \"" + k + "\" [chẩn đoán: submit=" + jsOut + ", search.php CHƯA gọi, title=\"" + finalTitle + "\"]");
    }
    return searchDoc(doc, finalUrl);
}
