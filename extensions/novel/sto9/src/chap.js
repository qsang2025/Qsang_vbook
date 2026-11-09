// chap.js — doc noi dung mot chuong cua 思兔閱讀 (sto9.com).
//
// DAC THU CUA SITE (khao sat 2026-11-07, da kiem chung tren chuong that):
// - Tieu de: div.txtnav > h1 (vd "第1章 永夜", "第870章 夜州不是你想來就能來").
// - Noi dung: text node truc tiep trong div.txtnav, doan cach nhau
//   <br /><br />, thut dau dong &emsp;&emsp;, KHONG co the <p>.
// - Bo: h1 + div quang cao (div.txtright, div.txtad, div.txtcenter,
//   div#baocuo, script/style/ins) + div.page1 (dieu huong chuong).
// - PHAI loc dong quang cao cua site (kiem chung live 2026-11-09):
//   cau quang cao DOI LIEN TUC va chen emoji/ky tu giua cac ky tu
//   cua ten mien de pha bo loc chuoi cung — vd ch1 "想獲取本書最新更新，
//   請訪問🍒sto9.com", ch2 "想看更多精彩章節，請訪問st☕o9.com", ch870
//   "sto9🍀.com提醒您查看最新內容". Dac diem chung duy nhat ben vung:
//   doan nao cung chua ten mien sto9 (duoi dang nao do). contentHtml()
//   chuan hoa doan (bo moi ky tu khong phai chu/so) roi tim "sto9" /
//   "o9com" — van ban truyen that khong bao gio nhac ten mien cua site,
//   nen khong loc nham noi dung that. 3 chuoi cu ("提醒您查看最新內容",
//   "還有更新耶", "閱讀更多內容") giu lai lam phong thu them.
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
    // Loc dong quang cao cua site: tach theo <br />, bo doan chua cum rac.
    // (1) Chuoi cu — cau quang cao doi theo thoi gian nen chi la phong thu
    // them, khong phai cho dua chinh. (2) Cho dua chinh: doan chua ten
    // mien sto9 duoi bat ky dang nao — chuan hoa doan bang cach bo moi ky
    // tu khong phai chu/so (loai ca emoji chen giua "st☕o9" hay "sto9🍀.com")
    // roi tim "sto9" / "o9com".
    var parts = html.split(/<br\s*\/?>/i);
    var kept = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var seg = parts[i];
        if (seg.indexOf("提醒您查看最新內容") !== -1) continue;
        if (seg.indexOf("還有更新耶") !== -1) continue;
        if (seg.indexOf("閱讀更多內容") !== -1) continue;
        var norm = seg.replace(/[^A-Za-z0-9]/g, "").toLowerCase();
        if (norm.indexOf("sto9") !== -1) continue;
        if (norm.indexOf("o9com") !== -1) continue;
        kept.push(seg);
    }
    return kept.join("<br />");
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương: " + url);

    var title = chapterTitle(doc);
    var html = contentHtml(doc);
    if (!html) return Response.error("Không đọc được nội dung chương: " + url);
    var plain = html.replace(/<[^>]*>/g, "").replace(/&nbsp;|&emsp;/g, "").replace(/\s+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương: " + url);

    return Response.success(html, title);
}
