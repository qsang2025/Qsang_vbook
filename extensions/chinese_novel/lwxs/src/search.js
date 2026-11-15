// search.js — tim kiem theo ten truyen / tac gia tren 乐文小说.
// Form cua site (xac nhan tu trang chu live 2026-11-15): POST /search.html,
// tham so searchkey + searchtype=all (hidden) + Submit (nut submit),
// application/x-www-form-urlencoded. Ket qua DU DOAN cung cau truc #alistbox
// nhu trang the loai (50 ket qua/trang) — chua kiem chung, test tren may
// se quyet dinh (xem ham chan doan ben duoi).
// FIX 2026-11-15 — NGUYEN NHAN GOC: ban v1 goi fetchPage(url, {method:
// "POST", body: ...}) nhung fetchPage (fetch-helpers.js) HOAN TOAN BO QUA
// options.method/body, chi gui GET (fetch(url, {headers})). GET /search.html
// tra ve trang dich tim kiem (200, 3,1 KB, khong co #alistbox, khong co form)
// nen parse ra 0 ket qua — dung nhu log test may 14:50 (code 0, data []).
// Ban nay dung pacedFetch (rate-limit.js) — wrapper DUY NHAT ho tro
// method/body that — de gui POST that. Tu VM, POST /search.html tra HTTP 500
// (ca UTF-8 lan GBK) nen chua phan biet duoc la backend hong hay chi chan IP
// datacenter; test tren may se quyet dinh. Neu tren may POST cung 500 thi bo
// search.js theo tien le readernovel/aztruyen, giu lai toc/chap.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function safeString(value) {
    if (value === undefined || value === null) return "";
    return String(value).replace(/^\s+|\s+$/g, "");
}

// Chan doan khi parse ra 0 ket qua: tra ve chuoi de parent doc tu log test
// tren may — trang tra ve la trang ket qua that hay trang dich/form, co
// #alistbox khong, tu khoa co xuat hien trong trang khong.
function searchDiagnosis(doc, query, status) {
    var boxCount = 0;
    var rows = 0;
    var pics = 0;
    try { boxCount = doc.select("#alistbox").size(); } catch (e1) {}
    try { rows = doc.select("#alistbox > div").size(); } catch (e2) {}
    try { pics = doc.select("#alistbox .pic a").size(); } catch (e3) {}
    var bodyText = "";
    try { bodyText = cleanText(doc.select("body").text()); } catch (e4) {}
    var hasQuery = bodyText.indexOf(query) !== -1 ? "co" : "khong";
    var sample = bodyText.substring(0, 300);
    return "Chan doan tim kiem '" + query + "': HTTP " + status +
        "; #alistbox: " + (boxCount > 0 ? "co" : "khong") +
        " (" + rows + " hang, " + pics + " link .pic a)" +
        "; tu khoa trong trang: " + hasQuery +
        "; dau trang: " + sample;
}

function execute(query, page) {
    query = safeString(query);
    if (!query) return Response.success([]);
    // POST that qua pacedFetch (fetchPage khong gui duoc method/body).
    var pf = pacedFetch(BASE_URL + "/search.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "searchkey=" + encodeURIComponent(query) + "&searchtype=all&Submit="
    });
    if (!pf.ok) {
        if (pf.error === "cooldown") {
            return Response.error(rateLimitErrorMessage("乐文小说", pacedHostOf(BASE_URL + "/search.html"), pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được kết quả tìm kiếm (HTTP " + pf.status + ")");
    }
    var doc = null;
    try { doc = pf.res.html(); } catch (e) { doc = null; }
    if (!doc) return Response.error("Không đọc được kết quả tìm kiếm");
    var data = [];
    var rows = doc.select("#alistbox > div");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var e = rows.get(i);
        var linkEl = safeFirst(e.select(".pic a"));
        if (!linkEl) continue;
        var link = absUrl(linkEl.attr("href"));
        var imgEl = safeFirst(e.select(".pic img"));
        var name = imgEl ? cleanText(imgEl.attr("alt")) : "";
        var cover = imgEl ? imgEl.attr("src") : "";
        var author = cleanText(e.select(".title span").text()).replace("作者：", "");
        var chapter = cleanText(e.select(".sys li a").text());
        if (!name || !link) continue;
        var description = author;
        if (chapter) description = description ? description + " - " + chapter : chapter;
        data.push({
            name: name,
            link: link,
            cover: cover || "",
            description: description,
            host: BASE_URL
        });
    }
    // 0 ket qua: khong tra mang rong nua — tra loi chan doan de test tren
    // may cho biet trang tra ve la gi (xem searchDiagnosis). Chi bo
    // search.js khi test tren may chung minh backend khong tra ket qua
    // cho moi tu khoa (tien le readernovel/aztruyen).
    if (data.length === 0) return Response.error(searchDiagnosis(doc, query, pf.status));
    return Response.success(data, "");
}
