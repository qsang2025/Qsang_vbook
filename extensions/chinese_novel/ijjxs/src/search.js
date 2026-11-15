// search.js — Tim kiem theo tu khoa (execute(query, page) -> items).
//
// Form tim kiem tren trang chu (kiem chung live 2026-11-16):
// POST /e/search/index.php (field keyboard, show=title,writer,
// tbname=download, tempid=2, orderby=newstime, myorder=0, nut submit
// la <button type="submit">), class search. POST truc tiep tu VM treo
// (000 — tarpit IP datacenter), nen gui qua WebView cua app bang
// Engine.newBrowser() (tien le bixiange/jpxs123/ffxs8/sjks88 v2/
// powanjuan — API that: b.launch(url, ms), b.callJs(js, ms), b.html(ms),
// b.close(); KHONG co .get() tra Document — loi nay tung lam hong
// search.js cua sjks88 #94). Site dung UTF-8 nen form submit mac dinh
// da dung dinh dang (khong can accept-charset GBK nhu cac site GBK).
// Ket qua /e/search/result/index.php?page=<0-based>&searchid=<id>
// (kieu EmpireCMS); trang sau fetch truc tiep bang URL day du do
// nextPageHref() tra ve. Ket qua parse bang parseItemList() trong
// helper.js (.catalog .listbg truoc, roi cac dang du phong).
// LUU Y: tieu de trang ket qua CHUA kiem chung duoc tu VM (can WebView)
// nen vong poll khong phu thuoc rieng vao tieu de: break khi tieu de
// chua "搜索"/"信息提示" HOAC khi parseItemList() da thay muc — tranh
// lap lai loi sjks88 (tieu de that la "<kw> 搜索结果" chu khong phai
// "高级搜索"). Neu WebView tra 0 ket qua tren dien thoai that voi 2 tu
// khoa khac nhau thi cat search.js theo tien le jpxs123/tongrenshe.
//
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

function execute(query, page) {
    page = String(page || "");

    // Trang sau: page la URL day du (/e/search/result/index.php?...)
    // do lan goi truoc tra ve; fetch truc tiep (UTF-8, pacing).
    if (page !== "") {
        var r = fetchIjDoc(page);
        if (r.error) return Response.error(r.error);
        var items = parseItemList(r.doc);
        if (items.length === 0) {
            return Response.error("Không tìm thấy \"" + query + "\"");
        }
        var next = nextPageHref(r.doc);
        return Response.success(items, next);
    }

    // Trang 1: WebView mo trang chu roi submit form tim kiem bang JS
    // (tien le ffxs8/bixiange/sjks88 v2/powanjuan). Khong co Engine
    // (moi truong chay thu tu VM) thi bao loi ro rang.
    if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng)");
    }
    var b = Engine.newBrowser();
    var resultDoc = null;
    try {
        b.launch(BASE_URL + "/", 15000);
        b.callJs("(function(){var f=document.querySelector('form.search');if(!f){return 'NOFORM';}var i=f.querySelector('input[name=keyboard]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(query) + ";var btn=f.querySelector('input[type=submit],button[type=submit]');if(btn){btn.click();}else{HTMLFormElement.prototype.submit.call(f);}return 'SUBMITTED';})()", 8000);
        // Trang ket qua ve sau ~0.5-2s; trang "信息提示" tu chuyen ve
        // trang chu sau 3s, nen poll thay vi sleep co dinh dai.
        // Break khi tieu de chua "搜索"/"信息提示" HOAC khi da thay
        // muc ket qua (tieu de trang ket qua cua site nay chua duoc
        // kiem chung tu VM — khong duoc phu thuoc rieng vao tieu de).
        for (var t = 0; t < 10; t++) {
            sleep(600);
            resultDoc = b.html(6000);
            var ti = String(resultDoc.select("title").text() || "");
            if (ti.indexOf("搜索") !== -1 || ti.indexOf("信息提示") !== -1) break;
            if (parseItemList(resultDoc).length > 0) break;
        }
        if (resultDoc) {
            var title2 = String(resultDoc.select("title").text() || "");
            var body2 = String(resultDoc.select("body").text() || "");
            if (title2.indexOf("信息提示") !== -1) {
                var mb = body2.match(/([^ ]{4,40}搜索[^ ]{0,20})/);
                return Response.error("Tìm kiếm thất bại" + (mb ? ": " + cleanText(mb[1]) : "."));
            }
        }
    } catch (e4) {
        return Response.error("Lỗi trình duyệt tìm kiếm: " + e4);
    } finally {
        b.close();
    }
    if (!resultDoc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    var out = parseItemList(resultDoc);
    if (out.length === 0) {
        return Response.error("Không tìm thấy \"" + query + "\"");
    }
    var nextPage = nextPageHref(resultDoc);
    return Response.success(out, nextPage);
}
