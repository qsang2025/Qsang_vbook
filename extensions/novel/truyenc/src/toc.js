// toc.js — Danh sach chuong tren TruyenC
//
// Site co API danh sach chuong chinh thuc (frontend cua site dung no):
//   GET /api/stories/{slug}/chapters?page=N&limit=100
//   -> { data: [{ chapter_number, title, ... }], meta: { total_items, total_pages } }
// (kiem chung bang curl 2026-11-08: Linh Kiem Ton total_items=5418,
// total_pages=55, limit toi da 100; trang 56 tra data rong — khong co
// chuong ma.) API tra TIEU DE THAT cua moi chuong — bat buoc phai dung vi
// so chuong trong URL LECH voi so chuong hien thi (chuong URL 5418 co
// tieu de that "Chuong 5424: Dai ket cuc (ha)"; do lech tang dan theo
// truyen: ch.100 lech 0, ch.2700 lech +2, ch.5000 lech +3, ch.5418 lech
// +6) nen khong the tu che ten "Chuong N" hay cong hang so.
//
// Luong chinh: lay tung trang API (limit=100), ghep theo chapter_number.
// Tong so lay tu meta.total_items (neo that) — danh sach cuoi luon dung
// total muc, khong thua (chuong ma) khong thieu (danh sach cut): trang
// API nao loi thi bu bang muc tu che "Chuong N" (URL van dung) roi di
// tiep. Gioi han an toan 120 trang API (12.000 chuong): vuot qua thi
// tu che phan con lai thay vi goi them request.
// Du phong: neu API hong hoan toan thi doc trang chi tiet HTML — tong so
// tu neo that ("numberOfPages", "chapters":N, "Xem tat ca (N chuong)"),
// tieu de that cua 4 chuong moi nhat tu link /chuong- tren trang, con
// lai tu che "Chuong N" theo dung tong so.
load('config.js');
load('fetch-helpers.js');

var TOC_PAGE_SIZE = 100;
var TOC_MAX_API_PAGES = 120;

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn truyện.");
    url = normalizeUrl(url);
    var slug = extractSlug(url);
    if (!slug) return Response.error("Không đọc được đường dẫn truyện: " + url);

    var first = fetchChaptersPage(slug, 1);
    if (first && first.meta && first.meta.total_items > 0) {
        return buildFromApi(slug, first);
    }
    return buildFromHtml(url, slug);
}

function extractSlug(url) {
    var m = String(url).match(/\/truyen\/([^\/\?#]+)/);
    if (m) return m[1];
    return "";
}

// Lay 1 trang danh sach chuong tu API, thu lan luot domain chinh roi
// mirror. Tra ve object JSON hoac null.
function fetchChaptersPage(slug, page) {
    var origins = [BASE_URL].concat(MIRROR_LIST);
    for (var i = 0; i < origins.length; i++) {
        var apiUrl = origins[i] + "/api/stories/" + slug + "/chapters?page=" + page + "&limit=" + TOC_PAGE_SIZE;
        var data = fetchJson(apiUrl);
        if (data) return data;
    }
    return null;
}

function apiChapterItem(slug, c) {
    return {
        name: c.title || ("Chương " + c.chapter_number),
        url: BASE_URL + "/truyen/" + slug + "/chuong-" + c.chapter_number,
        host: BASE_URL
    };
}

function synthChapter(slug, n, realTitles) {
    var name = "Chương " + n;
    if (realTitles && realTitles[n]) name = realTitles[n];
    return {
        name: name,
        url: BASE_URL + "/truyen/" + slug + "/chuong-" + n,
        host: BASE_URL
    };
}

function buildFromApi(slug, first) {
    var total = first.meta.total_items;
    var totalPages = first.meta.total_pages;
    if (!totalPages || totalPages < 1) {
        totalPages = Math.ceil(total / TOC_PAGE_SIZE);
    }
    var byNumber = {};
    var p = 0;
    var i = 0;
    var pagesToFetch = totalPages;
    if (pagesToFetch > TOC_MAX_API_PAGES) pagesToFetch = TOC_MAX_API_PAGES;

    collectPage(first, byNumber, slug);
    for (p = 2; p <= pagesToFetch; p++) {
        var data = fetchChaptersPage(slug, p);
        if (data && data.data) {
            collectPage(data, byNumber, slug);
        } else {
            console.log("toc: API trang " + p + " loi, bu muc tu che: " + slug);
        }
    }

    var chapters = [];
    for (i = 1; i <= total; i++) {
        if (byNumber[i]) {
            chapters.push(byNumber[i]);
        } else {
            chapters.push(synthChapter(slug, i, null));
        }
    }
    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách chương.");
    }
    return Response.success(chapters);
}

function collectPage(data, byNumber, slug) {
    for (var i = 0; i < data.data.length; i++) {
        var c = data.data[i];
        if (!c || !c.chapter_number) continue;
        var n = parseInt(c.chapter_number, 10);
        if (isNaN(n) || n < 1) continue;
        if (!byNumber[n]) byNumber[n] = apiChapterItem(slug, c);
    }
}

// Du phong HTML: tong so tu neo that, tieu de that cua cac chuong moi
// nhat co link tren trang chi tiet, con lai tu che theo dung tong so.
function buildFromHtml(url, slug) {
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được danh sách chương: " + url);

    var html = "";
    try { html = doc.html(); } catch (e) { html = ""; }
    var total = 0;
    var npMatch = html.match(/"numberOfPages"\s*:\s*(\d+)/);
    if (npMatch) {
        total = parseInt(npMatch[1], 10);
    } else {
        var chMatch = html.match(/chapters[^0-9]{0,10}(\d+)/);
        if (chMatch) {
            total = parseInt(chMatch[1], 10);
        } else {
            var allMatch = doc.text().match(/\(\s*(\d+)\s*chương\s*\)/);
            if (allMatch) {
                total = parseInt(allMatch[1], 10);
            } else {
                var badgeMatch = doc.text().match(/Danh sách chương\s*(\d+)/);
                if (badgeMatch) total = parseInt(badgeMatch[1], 10);
            }
        }
    }
    if (!total || total < 1) {
        return Response.error("Không đọc được tổng số chương của truyện.");
    }

    var realTitles = {};
    var links = doc.select("a[href*='/chuong-']");
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var nm = href.match(/\/chuong-(\d+)/);
        if (!nm) continue;
        var n = parseInt(nm[1], 10);
        if (isNaN(n) || n < 1 || n > total) continue;
        // Text link dang: "Chuong 5418  10/10/2026  Chuong 5424: Dai ket
        // cuc (ha)" — tieu de that la doan "Chuong N: ..." CUOI CUNG.
        var text = links.get(i).text().replace(/\s+/g, " ").trim();
        var tm = text.match(/(Chương \d+: .+)$/);
        if (tm) realTitles[n] = tm[1];
    }

    var chapters = [];
    for (var k = 1; k <= total; k++) {
        chapters.push(synthChapter(slug, k, realTitles));
    }
    return Response.success(chapters);
}
