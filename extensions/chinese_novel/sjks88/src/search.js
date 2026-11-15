// search.js — Tim kiem theo tu khoa (execute(query, page) -> items).
//
// Form tim kiem tren trang chu (kiem chung live 2026-11-16):
// POST /e/search/indexsearch.php (field keyboard, show=title,
// classid=0, button submit). POST truc tiep tu VM treo (000 — tarpit
// IP datacenter), nen gui qua WebView: tao form trong trang chu roi
// submit (giong bixiange/jpxs123/ffxs8). Ket qua
// /e/search/result/index.php?page=<0-based>&searchid=<id> (kieu
// EmpireCMS). Searchid luu vao localStorage de dung cho trang sau.
// Trang 1 la page token "" (page=1), cac trang sau luu URL day du.
//
// Luu y: /e/search/indexsearch.php chi ton tai tren trang chu (form
// tren trang chi tiet dung /e/search/index.php); luon lay form tu
// trang chu. Ket qua tim kiem co the dung bo cuc ul.list li (giong
// trang danh sach) hoac bo cuc khac — parseItemList() trong helper.js
// thu ca hai (ul.list li roi moi a.title). Neu WebView tra 0 ket qua
// tren dien thoai that voi 2 tu khoa khac nhau thi cat search.js theo
// tien le jpxs123/tongrenshe (khong bao gio giu mot o tim kiem chet).
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

function execute(query, page) {
    page = String(page || "");

    // Trang sau: page la URL day du (/e/search/result/index.php?...)
    // do lan goi truoc tra ve; fetch truc tiep (GBK, pacing).
    if (page !== "") {
        var r = fetchSjDoc(page);
        if (r.error) return Response.error(r.error);
        var items = parseItemList(r.doc);
        if (items.length === 0) {
            return Response.error("Không tìm thấy \"" + query + "\"");
        }
        var next = nextPageHref(r.doc);
        return Response.success(items, next);
    }

    // Trang 1: WebView GET trang chu (la form search "formSearch" o day)
    // roi tao form moi tro toi /e/search/indexsearch.php, do tu khoa
    // (ma hoa GBK, giong cach nguoi dung go vao o tim kiem), submit.
    // Khong co Engine (moi truong chay thu tu VM) thi bao loi ro rang.
    if (typeof Engine === "undefined" || !Engine || !Engine.newBrowser) {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng)");
    }
    var raw = Engine.newBrowser().get(BASE_URL + "/");
    var homeDoc = raw.html("gbk");
    if (homeDoc === null || isChallengeDoc(homeDoc)) {
        return Response.error("Không tải được trang chủ (bị chặn hoặc lỗi mạng), thử lại sau");
    }
    var form = homeDoc.select("form[name='formSearch']");
    if (form.isEmpty()) {
        return Response.error("Không tìm thấy ô tìm kiếm (site có thể đã đổi giao diện)");
    }
    var f = form.first();

    // Xoa bo cac nut submit cu roi them cac field an cua form goc.
    f.select("input[type=submit]").remove();
    f.select("input[type=hidden]").forEach(function (h) {
        var name = h.attr("name");
        var value = h.attr("value");
        if (name) f.append("<input type='hidden' name='" + name + "' value='" + value + "'/>");
    });
    var kw = f.select("input[name='keyboard']");
    if (kw.isEmpty()) {
        return Response.error("Không tìm thấy ô nhập từ khóa (site có thể đã đổi giao diện)");
    }
    kw.first().val(query);

    // Kich hoat submit tren phien ban goc (bixiange: nut submit co name
    // "submit" che method submit() nen goi qua prototype).
    var submitBtn = f.select("input[type=submit]");
    if (!submitBtn.isEmpty()) {
        submitBtn.first().click();
    } else {
        try { f.submit(); } catch (e) {
            HTMLFormElement.prototype.submit.call(f);
        }
    }

    // Nhan lai doc sau khi WebView chuyen huong. Ket qua quyet dinh
    // bang noi dung that (ul.list li) thay vi searchid trong
    // localStorage: neu submit that bai, doc van la trang chu (portal,
    // khong co ul.list) nen parseItemList tra rong -> bao loi.
    var resultDoc = f.ownerDocument();
    var out = parseItemList(resultDoc);
    if (out.length === 0) {
        return Response.error("Không tìm thấy \"" + query + "\"");
    }
    var nextPage = nextPageHref(resultDoc);
    return Response.success(out, nextPage);
}
