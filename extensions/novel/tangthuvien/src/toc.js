// toc.js — Muc luc chuong cua Tang Thu Vien.
//
// Cach site lay danh sach chuong (tim ra nho phan tich code JS cua site,
// xac minh tu chunk 2026-11-13): Next.js Server Action
// actionGetChaptersOfBook.
//   1. Lay bookId (24 ky tu hex) + tong so chuong tu tham so URL trang
//      muc luc (page.js ghi vao URL); neu thieu thi tai lai trang chi
//      tiet va trich tu HTML.
//   2. POST ve URL truyen voi header Next-Action = ID cua action,
//      body JSON [{"bookId":"...","page":N,"limit":100,"isNewest":false}].
//   3. Response la stream Server Action; dong JSON chua {"data":[...]}.
//      URL chuong = /<slug>/<number>.
// Next-Action ID la hash sinh luc build website (co dinh hien tai); neu
// site deploy ban moi va doi ID thi toc.js TU TRICH ID moi tu file chunk
// JS chua chuoi "actionGetChaptersOfBook" (xem findFreshActionId) roi
// POST lai 1 lan.
// Neu Server Action that bai (POST bi chan/trao, het bookId, response
// khong co data) thi FALLBACK sinh chuong 1..tong: ten lay tu 5 chuong
// moi nhat trong RSC neu co, con lai "Chuong N" — URL chuong cua site
// la /<slug>/<n> nen fallback van doc du chuong that, chi thieu ten
// chuong day du.
//
// Load: build se copy config.js, fetch-helpers.js, rate-limit.js,
// safe-first.js, helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// ID cua Next.js Server Action actionGetChaptersOfBook (hash build-time
// cua website; xac minh 2026-11-13 tu chunk JS cua site).
var CHAPTER_ACTION_ID = "c05deb810402fe1998675d59adb521ecd6cf5592f2";

// Trich tham so query tu URL (tocpage, bookId, total).
function queryParam(url, key) {
    var q = String(url || "").split("?")[1] || "";
    q = q.split("#")[0];
    var parts = q.split("&");
    for (var i = 0; i < parts.length; i++) {
        var kv = parts[i].split("=");
        if (kv[0] === key) return kv[1] || "";
    }
    return "";
}

// Trich mang chuong tu response cua Server Action.
// Thu theo thu tu: (1) parse tung dong "N:<json>" — dong tra ve mang
// hoac object {data:[...]}; (2) tim "\"data\":[" roi cat mang JSON theo
// can bang ngoac (nhay chuoi dung).
function parseActionChapters(text) {
    var t = String(text || "");
    var lines = t.split("\n");
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        var line = lines[i];
        var m = line.match(/^\d+:(.*)$/);
        if (!m) continue;
        var payload = m[1];
        if (payload.indexOf("[") !== 0 && payload.indexOf("{") !== 0) continue;
        try {
            var parsed = JSON.parse(payload);
            if (parsed instanceof Array) return parsed;
            if (parsed && parsed.data instanceof Array) return parsed.data;
        } catch (e) {
        }
    }
    var idx = t.indexOf('"data":[');
    if (idx >= 0) {
        var start = t.indexOf("[", idx);
        var depth = 0;
        var inStr = false;
        var esc = false;
        var j = 0;
        for (j = start; j < t.length; j++) {
            var ch = t.charAt(j);
            if (inStr) {
                if (esc) esc = false;
                else if (ch === "\\") esc = true;
                else if (ch === "\"") inStr = false;
            } else {
                if (ch === "\"") inStr = true;
                else if (ch === "[") depth++;
                else if (ch === "]") {
                    depth--;
                    if (depth === 0) {
                        try {
                            var arr = JSON.parse(t.substring(start, j + 1));
                            if (arr instanceof Array) return arr;
                        } catch (e2) {
                        }
                        return null;
                    }
                }
            }
        }
    }
    return null;
}

// Goi Server Action actionGetChaptersOfBook voi actionId cho truoc, tra
// ve mang chuong tho [{number, name, isLock, price}] hoac null neu that bai.
function fetchChaptersViaAction(bookUrl, bookId, pageNum, actionId) {
    var res = null;
    try {
        res = pacedFetch(bookUrl, {
            method: "POST",
            headers: {
                "Next-Action": actionId,
                "Content-Type": "text/plain;charset=UTF-8",
                "Accept": "text/x-component"
            },
            body: JSON.stringify([{ bookId: bookId, page: pageNum, limit: 100, isNewest: false }])
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
        text = String(res.res.text());
    } catch (e2) {
        console.log("toc doc response Server Action loi: " + e2);
        return null;
    }
    var data = parseActionChapters(text);
    if (!data) console.log("toc: response Server Action khong co mang data");
    return data;
}

// Trich Server Action ID moi tu noi dung 1 file chunk JS.
// Dang that trong chunk (kiem chung bang curl 2026-11-13):
//   (0,l.createServerReference)("c05deb81...f2",l.callServer,void 0,
//   l.findSourceMapURL,"actionGetChaptersOfBook")
// ID la 44 ky tu hex — regex phai lay [a-f0-9]{32,64} (lay {40} se cat
// cut ID) va phai khop ")(" giua createServerReference va dau ngoac mo
// cua ID. Tra ve "" neu khong tim thay.
function extractActionIdFromChunk(jsText) {
    var m = String(jsText || "").match(/createServerReference\)\("([a-f0-9]{32,64})"[^)]*"actionGetChaptersOfBook"/);
    if (m) return m[1];
    return "";
}

// Tu phuc hoi khi CHAPTER_ACTION_ID het han: quet cac file chunk JS
// trong HTML trang chi tiet (toi da 10 file, dung khi gap chuoi
// "actionGetChaptersOfBook"), trich ID moi. Chi chay khi POST voi ID cu
// that bai nen khong ton them request o duong chay thuong. Tra ve ""
// neu khong trich duoc.
function findFreshActionId(raw) {
    var re = /src="(\/_next\/static\/chunks\/[^"]+\.js)"/g;
    var m = null;
    var seen = {};
    var tried = 0;
    while ((m = re.exec(String(raw || ""))) !== null) {
        var src = m[1];
        if (seen[src]) continue;
        seen[src] = true;
        if (tried >= 10) break;
        tried++;
        try {
            var res = fetch(BASE_URL + src);
            if (!res || !res.ok) continue;
            var id = extractActionIdFromChunk(res.text());
            if (id) return id;
        } catch (e) {
            console.log("toc doc chunk " + src + " loi: " + e);
        }
    }
    return "";
}

// Sinh chuong cho 1 trang muc luc tu tong so chuong (duong fallback):
// so 1..tong, ten lay tu map ten chuong moi nhat neu co, con lai
// "Chuong N". URL chuong cua site la /<slug>/<n>.
// LUU Y: Server Action tra 50 chuong/trang (kiem chung tren may that
// 2026-11-13: trang 1 = ch.1-50, trang 11 = ch.501-550) du toc.js gui
// limit=100 — fallback phai chia 50 chuong/trang cho khop page.js.
function generateChapters(slug, pageNum, total, nameMap) {
    var from = (pageNum - 1) * 50 + 1;
    var to = Math.min(pageNum * 50, total);
    var out = [];
    for (var n = from; n <= to; n++) {
        var nm = (nameMap && nameMap[n]) ? nameMap[n] : ("Chương " + n);
        out.push({
            name: nm,
            url: BASE_URL + "/" + slug + "/" + n,
            description: "",
            lock: false,
            pay: false
        });
    }
    return out;
}

function execute(url) {
    url = normalizeUrl(url);
    var baseUrl = String(url).split("?")[0].split("#")[0];
    var slug = baseUrl.replace(BASE_URL, "").replace(/^\//, "");
    var pageNum = parseInt(queryParam(url, "tocpage") || "1", 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var bookId = queryParam(url, "bookId");
    var total = parseInt(queryParam(url, "total") || "0", 10);
    if (isNaN(total)) total = 0;

    var raw = "";
    var nameMap = {};
    if (!bookId || total <= 0) {
        // Tai HTML tho cua trang chi tiet de trich bookId + tong chuong.
        var r = fetchTtvPage(baseUrl);
        if (r.error) return Response.error(r.error);
        raw = r.rawHtml;
        if (!bookId) bookId = extractBookId(raw);
        if (total <= 0) total = extractTotalChapters(r.doc);
        nameMap = extractNewestChapterNames(raw);
    }

    if (!bookId) {
        if (total > 0) {
            console.log("toc: khong tim duoc bookId, dung fallback sinh chuong");
            return Response.success(generateChapters(slug, pageNum, total, nameMap));
        }
        return Response.error("Không đọc được mã truyện (bookId) trên trang chi tiết.");
    }

    // Duong chinh: Server Action actionGetChaptersOfBook.
    var data = fetchChaptersViaAction(baseUrl, bookId, pageNum, CHAPTER_ACTION_ID);
    if (!data) {
        // ID cu co the het han (site deploy ban moi): tu trich ID moi
        // tu chunk JS roi POST lai 1 lan.
        if (!raw) {
            var rr = fetchTtvPage(baseUrl);
            if (!rr.error) {
                raw = rr.rawHtml;
                nameMap = extractNewestChapterNames(raw);
            }
        }
        if (raw) {
            var freshId = findFreshActionId(raw);
            if (freshId && freshId !== CHAPTER_ACTION_ID) {
                console.log("toc Action ID moi: " + freshId + " — cap nhat CHAPTER_ACTION_ID trong toc.js");
                data = fetchChaptersViaAction(baseUrl, bookId, pageNum, freshId);
            }
        }
    }
    if (data && data.length > 0) {
        var chapters = [];
        var i = 0;
        for (i = 0; i < data.length; i++) {
            var item = data[i];
            if (!item || !item.number) continue;
            chapters.push({
                name: cleanText(item.name || ("Chương " + item.number)),
                url: BASE_URL + "/" + slug + "/" + item.number,
                description: "",
                lock: !!item.isLock,
                pay: !!(item.price && item.price > 0)
            });
        }
        chapters.sort(function (a, b) {
            var na = parseInt(String(a.url).match(/\/(\d+)$/)[1], 10);
            var nb = parseInt(String(b.url).match(/\/(\d+)$/)[1], 10);
            return na - nb;
        });
        console.log("toc Server Action: " + chapters.length + " chuong (trang " + pageNum + ")");
        return Response.success(chapters);
    }

    // Duong fallback: sinh chuong 1..tong tu so chuong tren trang chi
    // tiet (URL chuong cua site la /<slug>/<n>).
    if (total > 0) {
        console.log("toc Server Action that bai, dung fallback sinh chuong (trang " + pageNum + ")");
        return Response.success(generateChapters(slug, pageNum, total, nameMap));
    }
    return Response.error("Không đọc được mục lục (Server Action lỗi và không có tổng số chương): " + url);
}
