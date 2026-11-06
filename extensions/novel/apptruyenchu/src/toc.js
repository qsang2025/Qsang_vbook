// toc.js — muc luc chuong cua App Truyen Chu.
//
// Cach site lay danh sach chuong (tim ra nho phan tich code JS cua site,
// xac minh bang curl 2026-11-06: HTTP 200, tra ve du 2.479 chuong cho
// truyen mau): Next.js Server Action fetchChaptersOfBook.
//   1. Lay bookId (24 ky tu hex) trong HTML trang chi tiet, dang
//      "bookId":"<24 hex>" (nam trong du lieu RSC nhung cua Next.js).
//   2. POST ve chinh URL truyen voi header Next-Action = ID cua action,
//      body JSON ["<bookId>"].
//   3. Response la stream Server Action; dong bat dau "1:[" la mang JSON
//      [{value, label, slugId, number, isLock}, ...]. URL chuong =
//      /truyen/<slug>/<slugId>.
// Next-Action ID la hash sinh luc build website (co dinh hien tai); neu
// site deploy ban moi va doi ID thi lay lai ID moi tu file chunk JS chua
// chuoi "fetchChaptersOfBook" (xem README cua extension).
// Neu Server Action that bai (het bookId, POST loi, response khong co
// dong 1:[) thi fallback ve link chuong trong DOM (chuong 1 + chuong moi
// nhat) thay vi bao loi ngay.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// ID cua Next.js Server Action fetchChaptersOfBook (hash build-time cua
// website; xac minh 2026-11-06).
var CHAPTER_ACTION_ID = "40846d9ab28025db6a72550e98f102a4cdecf4a9a7";

// Trich bookId (24 ky tu hex) tu HTML tho cua trang chi tiet.
// Trong flight data cua Next.js, gia tri nam dang \"bookId\":\"...\" (dau
// ngoac kep da escape) hoac "bookId":"..." (dau ngoac kep thuong) tuy cach
// doc HTML, nen thu ca hai mau.
function extractBookId(raw) {
    var m = raw.match(/bookId\\":\\"([a-f0-9]{24})\\"/);
    if (m) return m[1];
    m = raw.match(/["']bookId["']\s*:\s*["']([a-f0-9]{24})["']/i);
    if (m) return m[1];
    return "";
}

// Goi Server Action fetchChaptersOfBook, tra ve mang chuong tho
// [{label, slugId, number, isLock}] hoac null neu that bai.
function fetchChaptersViaAction(bookUrl, bookId) {
    var res = null;
    try {
        res = fetch(bookUrl, {
            method: "POST",
            headers: {
                "Next-Action": CHAPTER_ACTION_ID,
                "Content-Type": "text/plain;charset=UTF-8",
                "Accept": "text/x-component"
            },
            body: JSON.stringify([bookId])
        });
    } catch (e) {
        console.log("toc POST Server Action loi: " + e);
        return null;
    }
    if (!res || !res.ok) {
        console.log("toc POST Server Action HTTP " + (res ? res.status : 0));
        return null;
    }
    var text = "";
    try {
        text = String(res.text());
    } catch (e2) {
        console.log("toc doc response Server Action loi: " + e2);
        return null;
    }
    var lines = text.split("\n");
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        if (lines[i].indexOf("1:[") === 0) {
            try {
                var arr = JSON.parse(lines[i].substring(2));
                if (arr instanceof Array) return arr;
            } catch (e3) {
                console.log("toc parse dong 1:[ loi: " + e3);
            }
            return null;
        }
    }
    console.log("toc: response Server Action khong co dong 1:[");
    return null;
}

// Ten chuong tu text cua link (dung cho duong fallback): uu tien phan
// "Chuong N: <ten>" neu co, neu khong thi "Chuong N".
function tocChapterName(url, linkText) {
    var n = chapterNumber(url);
    var t = dedupeTitle(cleanText(linkText || ""));
    var m = t.match(/Chương\s+\d+\s*:\s*[^…]+/);
    if (m) return cleanText(m[0]);
    if (n > 0) return "Chương " + n;
    return t || url;
}

// Duong fallback: gom link chuong trong DOM + regex tren HTML tho
// (chi tim duoc chuong 1 + chuong moi nhat vi danh sach day du khong co
// trong HTML). Tra ve mang chuong {name, url, description, lock, pay}.
function collectDomChapters(doc, raw, slug) {
    var chapters = [];
    var seen = {};

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

    doc.select("a[href]").forEach(function (el) {
        var href = el.attr("href");
        if (!href || href.indexOf("/chuong-") === -1) return;
        addChapter(href, el.text());
    });

    try {
        var re = new RegExp("/truyen/" + slug + "/chuong-(\\d+)(?:-[^\"'\\s<>]*)?", "g");
        var m = null;
        while ((m = re.exec(raw)) !== null) {
            addChapter("/truyen/" + slug + "/chuong-" + m[1], "");
        }
    } catch (e) {
        console.log("toc regex HTML tho loi: " + e);
    }

    chapters.sort(function (a, b) { return a.num - b.num; });
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
    return out;
}

function execute(url) {
    url = normalizeUrl(url);
    var slug = bookSlug(url);

    // Tai HTML tho cua trang chi tiet (1 lan duy nhat, dung cho ca 2 duong).
    var res = null;
    try {
        res = fetch(url);
    } catch (e) {
        return Response.error("Không tải được trang truyện: " + url);
    }
    if (!res || !res.ok) {
        return Response.error("Không tải được trang truyện (HTTP " + (res ? res.status : 0) + "): " + url);
    }
    var raw = "";
    try {
        raw = String(res.text());
    } catch (e2) {
        return Response.error("Không đọc được trang truyện: " + url);
    }
    var doc = Html.parse(raw);

    // Duong chinh: Server Action fetchChaptersOfBook.
    var bookId = extractBookId(raw);
    if (bookId) {
        var data = fetchChaptersViaAction(url, bookId);
        if (data && data.length > 0) {
            var chapters = [];
            var i = 0;
            for (i = 0; i < data.length; i++) {
                var item = data[i];
                if (!item || !item.slugId) continue;
                chapters.push({
                    name: cleanText(item.label || ("Chương " + item.number)),
                    url: absUrl("/truyen/" + slug + "/" + item.slugId),
                    num: item.number || 0,
                    description: "",
                    lock: !!item.isLock,
                    pay: false
                });
            }
            chapters.sort(function (a, b) { return a.num - b.num; });
            var out = [];
            var j = 0;
            for (j = 0; j < chapters.length; j++) {
                out.push({
                    name: chapters[j].name,
                    url: chapters[j].url,
                    description: "",
                    lock: chapters[j].lock,
                    pay: false
                });
            }
            console.log("toc Server Action: " + out.length + " chuong");
            return Response.success(out);
        }
        console.log("toc Server Action that bai, chuyen sang fallback DOM");
    } else {
        console.log("toc: khong tim duoc bookId trong HTML, chuyen sang fallback DOM");
    }

    // Duong fallback: link chuong trong DOM (chuong 1 + chuong moi nhat).
    var fallback = collectDomChapters(doc, raw, slug);
    if (fallback.length === 0) {
        return Response.error("Không đọc được mục lục (Server Action lỗi và trang không có link chương): " + url);
    }
    var total = totalChapters(cleanText(doc.text()));
    if (total > 0 && fallback.length < total) {
        console.log("toc CHUA DU: chi tim duoc " + fallback.length + "/" + total + " chuong — Server Action that bai, xem README.");
    }
    return Response.success(fallback);
}
