// chap.js — doc noi dung mot chuong cua 思兔閱讀 (sto9.com).
//
// DAC THU CUA SITE (khao sat 2026-11-07, da kiem chung tren chuong that):
// - Tieu de: div.txtnav > h1 (vd "第1章 永夜", "第870章 夜州不是你想來就能來").
// - Noi dung: text node truc tiep trong div.txtnav, doan cach nhau
//   <br /><br />, thut dau dong &emsp;&emsp;, KHONG co the <p>.
// - Bo: h1 + div quang cao (div.txtright, div.txtad, div.txtcenter,
//   div#baocuo, script/style/ins) + div.page1 (dieu huong chuong).
// - PHAI loc 3 dong rac: "🍍sto9.com提醒您查看最新內容" (giua van ban),
//   "(還有更新耶)" (cuoi chuong), "閱讀更多內容，盡在𝐬𝐭𝐨𝟗.𝐜𝐨𝐦"
//   (ky tu 𝐬𝐭𝐨𝟗 in dam toan hoc). Loc theo doan tach boi <br />.
// - KHONG co chia nhieu trang chuong: trang chuong khong co link 下一页 /
//   下一頁 (chi co 下一章 = chuong ke trong div.page1) — da kiem tra
//   chuong 1 va chuong 870 ngay 2026-11-07, nen khong co nhanh theo
//   trang phu. Chuong 870 ~5.500 ky tu, doc du tren 1 trang.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function chapterTitle(doc) {
    var title = "";
    if (doc !== null) {
        var h1 = doc.select("div.txtnav h1").first();
        if (h1 === null) h1 = doc.select("h1").first();
        if (h1 !== null) title = cleanText(h1.text());
    }
    title = title.replace(/[\uff08\(]\s*\d+\s*\/\s*\d+\s*[\uff09\)]\s*$/, "");
    return title;
}

function contentHtml(doc) {
    var nav = doc.select("div.txtnav").first();
    if (nav === null) return "";
    nav.select("h1, div.txtright, div.txtad, div.txtcenter, div.page1, div#baocuo, script, style, ins").remove();
    var html = nav.html();
    // Loc 3 dong rac cua site: tach theo <br />, bo doan chua cum rac.
    var parts = html.split(/<br\s*\/?>/i);
    var kept = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var seg = parts[i];
        if (seg.indexOf("提醒您查看最新內容") !== -1) continue;
        if (seg.indexOf("還有更新耶") !== -1) continue;
        if (seg.indexOf("閱讀更多內容") !== -1) continue;
        kept.push(seg);
    }
    return kept.join("<br />");
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url);
    if (!doc) return Response.error("Không tải được chương: " + url);

    var title = chapterTitle(doc);
    var html = contentHtml(doc);
    if (!html) return Response.error("Không đọc được nội dung chương: " + url);
    var plain = html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&emsp;/g, "").replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương: " + url);

    return Response.success(html, title);
}
