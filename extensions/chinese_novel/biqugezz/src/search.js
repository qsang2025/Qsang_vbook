// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, next).
//
// Site luu moi thu bang GBK, nen tu khoa phai encode GBK thi backend moi
// khop (kiem chung live 2026-11-15: POST UTF-8 cho 凡骨 tra trang rong,
// 0 ket qua; POST GBK + action=login tra dung; GET voi searchkey
// percent-encode GBK cung tra dung 30 ket qua). WebView encode form body
// theo charset cua document, nen tim qua form tim kiem cua chinh site bang
// Engine.newBrowser() (tien le bixiange, cung van de GBK).
// - 1 ket qua duy nhat: site 302 thang ve trang chi tiet — doc tra ve la
//   trang chi tiet (nhan biet bang meta og:novel:book_name), tra 1 muc.
// - Nhieu ket qua: #fengtui .bookbox, 30 muc, khong thay phan trang
//   nen luon tra next = "".
// - 0 ket qua: #fengtui rong -> bao loi tieng Viet ro rang.
//
// LOI TREN MAY THAT (test 2026-11-15 17:27): ca 2 tu khoa "重生" / "凡骨"
// deu code 1 "Không tìm thấy". Test tu VM: POST UTF-8 cung tra trang ket
// qua co title chua "有关的小说" nhung 0 bookbox — dung dang loi do:
// WebView tren may da submit form nhung body encode UTF-8 thay vi GBK
// (document ma WebView thay co the khong phai GBK). FIX v2: truoc khi
// submit, gan accept-charset="gbk" cho form (ca attribute lan property)
// de buoc WebView encode GBK bat ke document charset la gi; dong thoi
// doc ket qua callJs (document.characterSet, form tim thay khong, da
// submit khong) va kiem tra b.urls() xem search.php co duoc goi khong.
// Khi van 0 ket qua, loi tra ve kem chan doan day du (charset, submit,
// search.php, title cuoi, so bookbox, 300 ky tu dau body) de biet chinh
// xac buoc nao hong thay vi doan mo.
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

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm.");

    if (typeof Engine === "undefined") {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
    }
    var b = Engine.newBrowser();
    var doc = null;
    // Chan doan de lai trong loi khi that bai (thay vi doan mo).
    var jsOut = "?";
    var hitSearch = false;
    var homeTitle = "";
    try {
        var homeDoc = b.launch(BASE_URL + "/", 15000);
        try { homeTitle = String(homeDoc.select("title").text() || ""); } catch (eH) {}
        // callJs tra ve HtmlElement — doc .text() de lay chuoi ket qua
        // (v1 bo qua gia tri nay nen khong biet form co submit khong).
        // IIFE tra ve: SUBMITTED|charset=GBK, hoac NOFORM|... / NOINPUT|...
        // GOC LOI (test 2026-11-15 17:39, chan doan v2): submit=?,
        // search.php CHUA goi, doc dung yen trang chu — f.submit() KHONG
        // chay. Nguyen nhan: nut submit cua form co name="submit"
        // (<button type="submit" name="submit">) nen no CHE PHUONG
        // THUC form.submit (named control shadow method) — goi f.submit()
        // nem TypeError trong IIFE, callJs tra ve rong, form khong submit.
        // FIX v3: click nut submit that (duong submit tu nhien, kem
        // validation); neu khong co nut thi dung
        // HTMLFormElement.prototype.submit.call(f) de vuot shadow.
        var jsEl = b.callJs("(function(){var cs='?';try{cs=document.characterSet||document.charset||'?';}catch(e0){}var f=document.querySelector('form[name=articlesearch]');if(!f){return 'NOFORM|charset='+cs;}var i=f.querySelector('input[name=searchkey]');if(!i){return 'NOINPUT|charset='+cs;}try{f.setAttribute('accept-charset','gbk');}catch(e1){}try{f.acceptCharset='gbk';}catch(e2){}i.value=" + JSON.stringify(k) + ";var ok=false;try{var btn=f.querySelector('button[type=submit],input[type=submit]');if(btn){btn.click();ok=true;}}catch(e3){}if(!ok){try{HTMLFormElement.prototype.submit.call(f);ok=true;}catch(e4){}}return (ok?'SUBMITTED':'SUBMITFAIL')+'|charset='+cs;})()", 8000);
        try { jsOut = String(jsEl ? jsEl.text() : ""); } catch (eJ) { jsOut = "ERR:" + eJ; }
        if (!jsOut) jsOut = "?";
        // Trang ket qua ve sau ~0.5-2s; poll thay vi sleep co dinh dai.
        for (var t = 0; t < 12; t++) {
            sleep(600);
            doc = b.html(6000);
            var ti = String(doc.select("title").text() || "");
            if (ti.indexOf("有关的小说") !== -1) break;
            if (ti.indexOf("最新章节") !== -1) break;
            // Tieu de ket qua bat ngo: van la trang ket qua neu da roi
            // khoi trang chu va tieu de co chua tu khoa.
            if (homeTitle && ti !== homeTitle && ti.indexOf(k) !== -1) break;
        }
        // search.php co duoc goi that khong (phan biet "form khong submit"
        // voi "submit roi nhung backend tra 0 ket qua").
        try {
            var reqUrls = b.urls() || [];
            for (var u = 0; u < reqUrls.length; u++) {
                if (String(reqUrls[u]).indexOf("search.php") !== -1) { hitSearch = true; break; }
            }
        } catch (eU) {}
    } catch (e) {
        return Response.error("Lỗi trình duyệt tìm kiếm: " + e);
    } finally {
        try { b.close(); } catch (e2) {}
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");

    // 1 ket qua duy nhat: site 302 thang ve trang chi tiet.
    var bookName = cleanText(doc.select('meta[property="og:novel:book_name"]').attr("content"));
    if (bookName) {
        var link = doc.select('meta[property="og:url"]').attr("content") || "";
        var author = cleanText(doc.select('meta[property="og:novel:author"]').attr("content"));
        var cover = doc.select('meta[property="og:image"]').attr("content") || "";
        if (!link) return Response.error("Không đọc được link truyện.");
        return Response.success([{
            name: bookName,
            cover: cover,
            link: link,
            description: author,
            host: siteOrigin()
        }], "");
    }

    var items = parseBookBoxes(doc);
    if (items.length === 0) {
        var finalTitle = "";
        try { finalTitle = String(doc.select("title").text() || ""); } catch (eT) {}
        var boxCount = 0;
        try { boxCount = doc.select("#fengtui .bookbox").size(); } catch (eB) {}
        var bodySample = "";
        try { bodySample = cleanText(doc.select("body").text() || "").substring(0, 300); } catch (eC) {}
        return Response.error("Không tìm thấy \"" + k + "\" [chẩn đoán: submit=" + jsOut + ", search.php " + (hitSearch ? "đã gọi" : "CHƯA gọi") + ", title=\"" + finalTitle + "\", bookbox=" + boxCount + ", body: " + bodySample + "]");
    }
    return Response.success(items, "");
}
