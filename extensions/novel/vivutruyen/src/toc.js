// toc.js — Muc luc chuong cua VivuTruyen.
// Muc luc day du 1 lan tren trang chi tiet trong div.list cua
// ul.uk-switcher (a.chap-title, moi nhat truoc — dao nguoc ve chuong 1
// truoc khi tra). Khong co page.js (TOC khong phan trang).
// Luu y: so chuong tren site la that — truyen co chuong 6-17 thi chuong
// 1-5 tra 404, khong ton tai (kiem chung 2026-11-14), khong phai thieu.
// Nut "Bat Dau Doc" (id first_chap) tro ve chuong dau tien co that —
// khong nam trong div.list nen khong dinh vao danh sach.
// Neu item co marker VIP/lock thi danh dau pay/lock + tien to "[VIP] "
// (phong thu — hien site chua co chuong VIP nao, kiem chung 2026-11-14).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function extractChapterNumber(name) {
    var match = name.match(/Chương\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
    return null;
}

function execute(url) {
    var detailUrl = normalizeUrl(url).split("#")[0].split("?")[0];
    if (detailUrl.charAt(detailUrl.length - 1) !== "/") detailUrl += "/";

    var r = fetchVivuPage(detailUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var data = [];
    var seen = {};

    var chapters = doc.select("div.list a.chap-title");
    if (chapters.size() === 0) {
        chapters = doc.select("ul.uk-switcher a.chap-title");
    }
    if (chapters.size() === 0) {
        chapters = doc.select("a.chap-title");
    }

    for (var i = 0; i < chapters.size(); i++) {
        var chapter = chapters.get(i);
        var href = String(chapter.attr("href") || "").trim();
        var text = cleanText(chapter.text());
        if (!href || !text) continue;
        if (href.indexOf("/chuong-") === -1) continue;

        var absoluteUrl = normalizeUrl(href);
        var normalizedHref = absoluteUrl.replace(/\/$/, "").toLowerCase();
        if (seen[normalizedHref]) continue;
        seen[normalizedHref] = true;

        var isVip = text.toLowerCase().indexOf("vip") !== -1 ||
                    text.toLowerCase().indexOf("khóa") !== -1;
        data.push({
            name: isVip ? "[VIP] " + text : text,
            url: absoluteUrl,
            description: "",
            lock: isVip,
            pay: isVip,
            host: BASE_URL
        });
    }

    if (data.length === 0) {
        return Response.error("Không tải được mục lục — truyện này chưa có chương nào.");
    }

    if (data.length > 1) {
        var firstNum = extractChapterNumber(data[0].name);
        var lastNum = extractChapterNumber(data[data.length - 1].name);
        if (firstNum !== null && lastNum !== null && firstNum > lastNum) {
            data = data.reverse();
        }
    }

    return Response.success(data);
}
