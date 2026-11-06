// toc.js — muc luc chuong cua App Truyen Chu.
//
// GIOI HAN DA BIET (khao sat 2026-11-06, xem README cua extension):
// Danh sach chuong KHONG co trong HTML tai lan dau cua trang chi tiet —
// site tai no bang JavaScript phia client (API/Firebase an, chua tim ra
// duoc URL). Trong HTML chi co 2 link chuong: nut "Doc truyen" (chuong 1)
// va link "Chuong moi nhat" (chuong cuoi). Sitemap cua site cung chi liet
// ke 10 chuong dau moi truyen. Vi vay toc.js lam 3 lop:
//   1. Link chuong trong DOM: a[href*="/chuong-"].
//   2. Regex tren HTML tho (doc.html()): bat cac URL chuong co the nam
//      trong du lieu Next.js nhung (flight data) ma cay DOM khong thay.
//   3. Sap xep theo so chuong, bo trung (site render 2 ban mobile/desktop).
// Neu chi tim duoc chuong 1 + chuong moi nhat thi van tra ve chung (de doc
// duoc 2 dau moc) va ghi log canh bao so luong thieu so voi tong so chuong
// doc duoc tren trang. Khi nao tim ra API danh sach chuong cua site thi
// thay the ham nay bang ban goi API.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Ten chuong tu text cua link: uu tien phan "Chuong N: <ten>" neu co,
// neu khong thi "Chuong N".
function tocChapterName(url, linkText) {
    var n = chapterNumber(url);
    var t = dedupeTitle(cleanText(linkText || ""));
    var m = t.match(/Chương\s+\d+\s*:\s*[^…]+/);
    if (m) return cleanText(m[0]);
    if (n > 0) return "Chương " + n;
    return t || url;
}

function execute(url) {
    url = normalizeUrl(url);
    var doc = fetchDoc(url);
    if (!doc) return Response.error("Không tải được mục lục: " + url);

    var chapters = [];
    var seen = {};
    var slug = bookSlug(url);

    function addChapter(link, text) {
        if (!link) return;
        link = absUrl(link);
        if (seen[link]) return;
        var n = chapterNumber(link);
        if (n <= 0) return;
        seen[link] = true;
        chapters.push({
            name: tocChapterName(link, text),
            url: link,
            num: n,
            description: "",
            lock: false,
            pay: false
        });
    }

    // Lop 1: link chuong trong DOM.
    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href || href.indexOf("/chuong-") === -1) return;
        addChapter(href, el.text());
    });

    // Lop 2: regex tren HTML tho (du lieu Next.js nhung, neu co).
    try {
        var raw = String(doc.html());
        var re = new RegExp("/truyen/" + slug + "/chuong-(\\d+)(?:-[^\"'\\s<>]*)?", "g");
        var m = null;
        while ((m = re.exec(raw)) !== null) {
            addChapter("/truyen/" + slug + "/chuong-" + m[1], "");
        }
    } catch (e) {
        Console.log("toc regex HTML tho loi: " + e);
    }

    if (chapters.length === 0) {
        return Response.error("Không đọc được mục lục (danh sách chương của site tải bằng JavaScript, chưa lấy được): " + url);
    }

    // Sap xep theo so chuong tang dan.
    chapters.sort(function (a, b) { return a.num - b.num; });

    var total = totalChapters(cleanText(doc.text()));
    if (total > 0 && chapters.length < total) {
        Console.log("toc CHUA DU: chi tim duoc " + chapters.length + "/" + total + " chuong — danh sach day du can API cua site (xem README).");
    }

    var out = [];
    var i = 0;
    for (i = 0; i < chapters.length; i++) {
        out.push({
            name: chapters[i].name,
            url: chapters[i].url,
            description: "",
            lock: false,
            pay: false
        });
    }
    return Response.success(out);
}
