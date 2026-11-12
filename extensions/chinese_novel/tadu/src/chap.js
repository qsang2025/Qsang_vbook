// chap.js — doc noi dung mot chuong tren Tadu.
// Co che cua site (kiem chung live 2026-11-12):
//   1. Trang chuong co input#bookPartResourceUrl, gia tri dang
//      /getPartContentByCodeTable/<bid>/<so thu tu chuong>.
//   2. GET duong dan do tra JSON {"status":200,"data":{"content":
//      "<p data-limit=...>...</p>..."}} — noi dung la HTML don thuan,
//      KHONG ma hoa (khac xtruyen), khong can WebView.
//   3. Trong content co chen dong quang cao/watermark cua site (vd.
//      "原文&来~自于塔读小~说APP...") — nhan dien bang chu "塔读"
//      (trong van truyen khong bao gio xuat hien) va loai bo.
// Ten chuong lay tu <title> trang chuong, dang
// "TenTruyen_第1章 ..._TheLoai_TacGia_小说阅读页 - 塔读小说网".
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = toWww(url);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được trang chương (HTTP " + response.status + ")");

    var doc = response.html();
    var resEl = safeFirst(doc.select("input#bookPartResourceUrl"));
    var resource = resEl ? safeString(resEl.attr("value")) : "";
    if (!resource) return Response.error("Không tìm thấy nội dung chương (có thể là chương VIP cần đăng nhập).");

    var res = fetchPage(buildAbsoluteUrl(resource), { headers: { Referer: url } });
    if (!res.ok) return Response.error("Không tải được nội dung chương (HTTP " + res.status + ")");

    var text = "";
    try { text = res.text(); } catch (e) { text = ""; }
    var json = null;
    try { json = JSON.parse(text); } catch (e2) { json = null; }
    if (!json || json.status !== 200 || !json.data || !json.data.content) {
        var msg = json && json.msg ? String(json.msg) : "";
        return Response.error("Không đọc được nội dung chương" + (msg ? " (" + msg + ")" : "") + ".");
    }

    var content = String(json.data.content);
    var cdoc = Html.parse(content);
    var paras = cdoc.select("p");
    var kept = [];
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        var p = paras.get(i);
        var t = cleanText(p.text());
        if (!t) continue;
        if (t.indexOf("塔读") !== -1) continue;
        kept.push("<p>" + p.html().replace(/ data-limit="[^"]*"/g, "") + "</p>");
    }
    if (kept.length === 0) return Response.error("Không đọc được nội dung chương.");

    var title = "";
    var titleEl = safeFirst(doc.select("title"));
    if (titleEl) {
        var parts = cleanText(titleEl.text()).split("_");
        if (parts.length > 1) title = parts[1];
    }
    return Response.success(kept.join(""), title);
}
