// chap.js — doc noi dung mot chuong tren Tadu.
// Co che cua site (kiem chung live 2026-11-12):
//   1. Trang chuong co input#bookPartResourceUrl, gia tri dang
//      /getPartContentByCodeTable/<bid>/<so thu tu chuong>.
//   2. GET duong dan do tra JSON {"status":200,"data":{"content":
//      "<p data-limit=...>...</p>..."}} — noi dung la HTML don thuan,
//      KHONG ma hoa (khac xtruyen), khong can WebView.
//   3. Trong content co chen dong quang cao/watermark cua site —
//      cac doan <p> ngan dung rieng, vd. "原文&来~自于塔读小~说APP",
//      "首发&：塔>-读小说", "原文来自于塔&读小说~&",
//      "站点：塔^读小说,欢迎下载-^". Dang goc chua "塔读" (trong
//      van truyen khong bao gio xuat hien); bien the chen 0-3 ky
//      tu khong phai chu Han giua 塔 va 读 (vd. 塔&读, 塔^读,
//      塔>-读). Ham isWatermark chi xoa doan ngan (<= 40 ky tu)
//      khop mau watermark — doan truyen that khong khop.
// Ten chuong lay tu <title> trang chuong, dang
// "TenTruyen_第1章 ..._TheLoai_TacGia_小说阅读页 - 塔读小说网".
load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Tra true neu doan van la dong quang cao/watermark cua Tadu.
// Chi ap dung cho doan ngan (<= 40 ky tu sau trim): cac dong
// quang cao deu ngan va dung rieng; doan truyen that dai hon
// nhieu va khong chua cac cum quang cao nay.
function isWatermark(t) {
    if (!t) return false;
    // Dang goc chua "塔读" — xoa bat ke do dai (nhu v1). Chu y:
    // dong quang cao cuoi chuong dai toi 59 ky tu ("塔读小~。>说
    // —*.—免费*无广>告无*>弹窗，还>-.*能跟书~友们一起互>@动。")
    // cung chua "塔读" nguyen ven, nen phai kiem tra truoc khi
    // gioi han do dai o duoi.
    if (t.indexOf("塔读") !== -1) return true;
    if (t.length > 40) return false;
    // Ten site bi chen ky tu (ky tu khong phai chu Han) giua 塔
    // va 读, kem "小说" hoac cum quang cao — vd. 塔&读小说,
    // 塔^读小说, 塔>-读小说. Yeu cau kem cum quang cao de khong
    // xoa nham cau truyen that nhu "塔里传来读书声".
    if (/塔[^\u4e00-\u9fff]{0,3}读/.test(t)) {
        if (t.indexOf("小说") !== -1) return true;
        if (t.indexOf("首发") !== -1) return true;
        if (t.indexOf("原文来自于") !== -1) return true;
        if (t.indexOf("站点") !== -1) return true;
    }
    // Cum quang cao dung rieng trong doan ngan.
    if (t.indexOf("首发") !== -1) return true;
    if (t.indexOf("原文来自于") !== -1) return true;
    if (t.indexOf("站点：") !== -1) return true;
    return false;
}

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
        if (isWatermark(t)) continue;
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
