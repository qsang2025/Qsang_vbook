// chap.js — doc noi dung mot chuong cua 小說狂人 (czbooks.net).
//
// DAC THU CUA SITE (khao sat 2026-11-07, da kiem chung tren chuong that):
// - Tieu de: div.chapter-detail > h1.name, dang 《書名》章名 — ten chuong
//   la phan sau 《書名》 (vd 《誰讓他修仙的！》第1章 今日宜出行，不宜作弊
//   -> 第1章 今日宜出行，不宜作弊; 《誰讓他修仙的！》番外三 -> 番外三).
// - Noi dung: div.chapter-detail > div.content — chi text + <br />,
//   khong script/quang cao, doan tach bang <br /><br />, dau doan thut
//   2 ky tu toan giac (U+2003). Khong phan trang chuong.
// - Loc: bo dong dau CHI KHI no trung dung ten chuong (khong phai luc
//   nao cung co — chuong 1 va 番外三 deu co); strip (本章完) o cuoi
//   neu co.
// - Nav: ul.nav.chapter-nav.reader-navigation (a.prev-chapter[rel=prev],
//   a.next-chapter[rel=next]; chuong dau/cuoi thi nut thanh
//   span.reader-nav-disabled) — khong can cho chap.js.
// Vi du: /n/s6pbed/s6lc7698 (第1章, mo dau "農歷二月初二，宜出行。"),
// /n/s6pbed/bliod (番外三, mo dau "六月初一，地府。").
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Ten chuong tu h1.name: cat tien to 《書名》.
function chapterTitle(doc) {
    var title = "";
    var h1 = doc.select("div.chapter-detail h1.name").first();
    if (h1 === null) h1 = doc.select("h1.name").first();
    if (h1 === null) h1 = doc.select("h1").first();
    if (h1 !== null) title = cleanText(h1.text());
    title = title.replace(/^《[^》]*》/, "");
    return cleanText(title);
}

// Chi cat khoang trang ASCII o hai dau (giu nguyen ky tu thut dau doan
// U+2003/U+3000 — String trim() mac dinh se xoa ca chung).
function trimAscii(s) {
    return String(s).replace(/^[ \t\r\n]+/, "").replace(/[ \t\r\n]+$/, "");
}

// So sanh 2 chuoi sau khi bo het khoang trang (de doi chieu dong dau
// noi dung voi ten chuong).
function squashSpace(s) {
    return String(s).replace(/[\s\u2003\u3000]+/g, "");
}

function contentHtml(doc, title) {
    var content = doc.select("div.chapter-detail div.content").first();
    if (content === null) content = doc.select("div.content").first();
    if (content === null) return "";
    content.select("script, style, ins").remove();
    var html = content.html();
    // Tach theo <br />, loc dong dau trung ten chuong va (本章完) o cuoi.
    var parts = html.split(/<br\s*\/?>/i);
    var kept = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var seg = trimAscii(parts[i]);
        if (!seg) continue;
        // Dong dau trung dung ten chuong -> bo.
        if (kept.length === 0 && title && squashSpace(seg) === squashSpace(title)) continue;
        // (本章完) o cuoi chuong -> bo.
        if (squashSpace(seg) === "(本章完)") continue;
        kept.push(seg);
    }
    // Phong truong hop (本章完) dinh lien cuoi doan cuoi.
    if (kept.length > 0) {
        var last = kept[kept.length - 1];
        last = last.replace(/\(本章完\)\s*$/, "");
        kept[kept.length - 1] = trimAscii(last);
    }
    return kept.join("<br />");
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được chương: " + url);

    var title = chapterTitle(doc);
    var html = contentHtml(doc, title);
    if (!html) return Response.error("Không đọc được nội dung chương: " + url);
    var plain = html.replace(/<[^>]*>/g, "").replace(/[\s\u2003\u3000]+/g, "");
    if (!plain) return Response.error("Không đọc được nội dung chương: " + url);

    return Response.success(html, title);
}
