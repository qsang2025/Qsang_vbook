// toc.js — Muc luc chuong cua mot truyen AzTruyen.
//
// Trang chi tiet co 2 ul.chapters trong div#chapters (kiem chung live
// 2026-11-11): ul thu 1 la "Chương mới nhất" (5 muc, trung voi 5 muc
// cuoi cua danh sach day du), ul thu 2 la "Danh sách chương" — TOAN BO
// chuong theo dung thu tu doc. Chi lay ul thu 2, giu NGUYEN thu tu DOM,
// dedupe theo link (key = chapterId = cum so cuoi URL, hoac URL day du).
// TUYET DOI KHONG sap xep / dedupe theo so chuong N: truyen nhieu quyen
// danh so lai tu dau theo quyen (Q.1 - Chương 63 va Q.2 - Chương 63
// cung ton tai trong "Cạm bẫy hôn nhân"); sap theo N se xao tron thu
// tu doc. 2 muc "Thông báo" / "Giới thiệu truyện mới" trong danh sach
// khong phai chuong nen bi loc (URL khong chua chuong-/part-).
// URL chuong dang /chuong-N-<tieu-de>-<id>/, /part-N-<id>/,
// /q-N-chuong-N-...-<id>/, /quyen-N-...-chuong-N-...-<id>/.
// GIOI HAN CUA SITE: truyen rat dai chi liet ke 200 chuong moi nhat
// (VD 800 chuong chi hien 601–800); truyen 249 chuong hien du 249 muc.
// Khong co API hay trang phan trang nao lay duoc chuong cu hon nen
// KHONG can page.js; toc.js tra ve dung nhung gi site liet ke.
//
// Load: config.js, config-helpers.js, fetch-helpers.js, rate-limit.js,
// helper.js (theo thu tu nay — xem helper.js).
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var tocUrl = normalizeUrl(url);
    if (!tocUrl) return Response.error("Link mục lục không hợp lệ.");
    if (tocUrl.charAt(tocUrl.length - 1) !== "/") tocUrl = tocUrl + "/";

    var r = fetchAzDoc(tocUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var lists = doc.select("#chapters ul.chapters");
    var fullList = null;
    if (lists.size() >= 2) fullList = lists.get(1);
    else if (lists.size() === 1) fullList = lists.get(0);
    if (fullList === null) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);

    var chapters = [];
    var seen = {};
    fullList.select("li.listc a").forEach(function (el) {
        var href = el.attr("href") || "";
        var name = cleanText(el.text());
        if (!href || !name) return;
        if (href.indexOf("chuong-") === -1 && href.indexOf("part-") === -1) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    });

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện): " + tocUrl);
    return Response.success(chapters);
}
