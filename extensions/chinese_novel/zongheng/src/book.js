// book.js — Script danh sach dung chung cho tab home (Zongheng).
// Contract: execute(input, page) -> [{ name*, link*, cover?, description?, host? }], nextPage?
// Hai nhanh:
//  1. URL /rank?... — bang xep hang. Trang /rank la Nuxt SSR: du lieu nam
//     trong payload window.__NUXT__ dang (function(a,b,...){return {...}})
//     (args truyen theo vi tri). Parser duoi day boc param -> gia tri,
//     roi boc danh sach theo khoa ung voi rankType (kiem chung 2026-11-11:
//     moi trang /rank nao cung chua du 6 danh sach, moi danh sach top 10).
//  2. URL /store/... — trang store (50 truyen/trang, selector .bookbox
//     con nguyen). Luu y: tham so loc the loai `c` cua store hien bi site
//     bo qua (c1/c3/c6/c9 deu tra cung 50 truyen) nen chi dung lam danh
//     sach "Moi cap nhat", khong dung lam loc the loai — xem PROGRESS.
// Load: file rate-limit.js (pacing + retry). Build se inline file lib
// nay vao zip; test tren may doc truc tiep tu src/ tren dia.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

var RANK_LIST_BY_TYPE = {
    "1": "monthTicketRankList",
    "4": "newBookRankList",
    "5": "clickRankList",
    "6": "recommendRankList",
    "9": "newOrderRankList"
};

function rankKeyFor(url) {
    var m = String(url).match(/rankType=(\d+)/);
    if (m && RANK_LIST_BY_TYPE[m[1]]) return RANK_LIST_BY_TYPE[m[1]];
    return "popularRankList";
}

// Boc payload __NUXT__: tra ve { map: {param: gia tri}, text: phan template }
// hoac null neu khong boc duoc.
function nuxtPayload(text) {
    var marker = "window.__NUXT__=(function(";
    var start = text.indexOf(marker);
    if (start < 0) return null;
    var pStart = start + marker.length;
    var pEnd = text.indexOf("){return", pStart);
    if (pEnd < 0) return null;
    var params = text.substring(pStart, pEnd).split(",");
    // Tim dau dong cua object return { ... } bang cach dem ngoac { }
    // (bo qua chuoi "..." va escape).
    var objStart = text.indexOf("{", pEnd);
    if (objStart < 0) return null;
    var depth = 0;
    var inStr = false;
    var esc = false;
    var end = -1;
    var n = 0;
    for (n = objStart; n < text.length; n++) {
        var ch = text.charAt(n);
        if (inStr) {
            if (esc) esc = false;
            else if (ch === "\\") esc = true;
            else if (ch === '"') inStr = false;
        } else {
            if (ch === '"') inStr = true;
            else if (ch === "{") depth++;
            else if (ch === "}") {
                depth--;
                if (depth === 0) { end = n; break; }
            }
        }
    }
    if (end < 0) return null;
    // Sau dong object la ")(" mo danh sach args; args ket thuc bang "));"
    // truoc </script> (da kiem chung tren trang /rank that).
    var scriptEnd = text.indexOf("</script>", end);
    if (scriptEnd < 0) scriptEnd = text.length;
    var tail = text.substring(end + 2, scriptEnd);
    var cut = tail.lastIndexOf("));");
    if (cut < 0) return null;
    var args = null;
    try {
        args = JSON.parse("[" + tail.substring(0, cut) + "]");
    } catch (e) {
        return null;
    }
    if (!args || args.length !== params.length) return null;
    var map = {};
    var i = 0;
    for (i = 0; i < params.length; i++) map[params[i]] = args[i];
    return { map: map, text: text.substring(objStart, end + 1) };
}

// Giai mot token trong template: chuoi JSON "..." -> gia tri that;
// ten bien -> gia tri trong map; so -> so.
function nuxtResolve(map, tok) {
    tok = String(tok).replace(/^\s+|\s+$/g, "");
    if (!tok) return "";
    if (tok.charAt(0) === '"') {
        try { return JSON.parse(tok); } catch (e) { return tok; }
    }
    if (tok in map) return map[tok];
    if (/^-?\d+$/.test(tok)) return parseInt(tok, 10);
    return tok;
}

// Tim noi dung mang KEY:[ ... ] trong template (dem ngoac [ ]).
function nuxtListSpan(template, key) {
    var at = template.indexOf(key + ":[");
    if (at < 0) return "";
    var start = template.indexOf("[", at);
    if (start < 0) return "";
    var depth = 0;
    var inStr = false;
    var esc = false;
    var n = 0;
    for (n = start; n < template.length; n++) {
        var ch = template.charAt(n);
        if (inStr) {
            if (esc) esc = false;
            else if (ch === "\\") esc = true;
            else if (ch === '"') inStr = false;
        } else {
            if (ch === '"') inStr = true;
            else if (ch === "[") depth++;
            else if (ch === "]") {
                depth--;
                if (depth === 0) return template.substring(start + 1, n);
            }
        }
    }
    return "";
}

function rankItems(payload, key) {
    var span = nuxtListSpan(payload.text, key);
    if (!span) return [];
    var re = /\{bookId:([^,]+),bookName:([^,]+),authorId:([^,]+),authorName:([^,]+),imageUrl:([^,]+),description:([^,]+),serialStatus:([^,]+),totalWords:([^,]+),number:([^,]+),numberDesc:([^,]+),rankNo:([^,]+),cateName:([^,]+),cateFineId:([^,]+),cateFineName:([^}]+)\}/g;
    var items = [];
    var seen = {};
    var m = null;
    while ((m = re.exec(span)) !== null) {
        var bookId = nuxtResolve(payload.map, m[1]);
        if (!bookId || seen[bookId]) continue;
        seen[bookId] = true;
        var cover = nuxtResolve(payload.map, m[5]);
        cover = cover ? String(cover) : "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        var words = nuxtResolve(payload.map, m[8]);
        items.push({
            name: String(nuxtResolve(payload.map, m[2])),
            link: "https://www.zongheng.com/detail/" + bookId,
            cover: cover,
            description: String(nuxtResolve(payload.map, m[4])) + " • " + words + "字",
            host: BASE_URL
        });
    }
    return items;
}

function storeItems(doc, pageUrl) {
    var items = [];
    var seen = {};
    doc.select(".store_list_wrap .bookbox").forEach(function (el) {
        var nameEl = zhFirst(el.select(".bookname > a"));
        if (!nameEl) return;
        var link = zhResolve(nameEl.attr("href"), pageUrl);
        if (!link || seen[link]) return;
        seen[link] = true;
        var imgEl = zhFirst(el.select(".bookimg img"));
        var cover = imgEl ? ((imgEl.attr("src") || "") + "") : "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        var descEl = zhFirst(el.select(".bookupdate > a"));
        var desc = descEl ? zhCleanText(descEl.text()).replace(/^最新章节：/, "") : "";
        items.push({
            name: zhCleanText(nameEl.text()),
            link: link,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    });
    return items;
}

// ---- API cong khai cua app Zongheng (v2 hybrid) ----
// Chi dung 2 endpoint da kiem chung goi duoc an danh (code 200,
// 2026-11-11): POST /api/catefine/search va POST /api/rank/list
// tren api2.zongheng.com. Ca hai deu POST + JSON body (GET tra 404;
// tham so sai kieu tra 500 loi Go unmarshal — cateFineId/rankType
// phai la so nguyen). Cac endpoint noi dung cua app (search/books,
// chapter/list, chapter/so/download...) deu tra 602 Unauthorized
// nen KHONG dung o day, duong doc chinh van la web v1.
var ZH_API2 = "https://api2.zongheng.com";

function zhApiPost(path, bodyObj) {
    var pf = pacedFetch(ZH_API2 + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(bodyObj)
    });
    if (!pf.ok) return { ok: false, status: pf.status, error: pf.error, cooldownRemainingMs: pf.cooldownRemainingMs };
    var json = null;
    try { json = pf.res.json(); } catch (e) { json = null; }
    if (!json || json.code !== 200 || !json.result) {
        return { ok: false, status: pf.status, error: "bad-json", cooldownRemainingMs: 0 };
    }
    return { ok: true, status: pf.status, result: json.result };
}

// Map 1 muc truyen tu API app (catefine/search bookList, rank/list
// rankDatas) ve item chuan cua vBook. Ca hai dang deu co bookId,
// name, picUrl, authorName, totalWord, categoryName.
function zhApiBookItem(b) {
    if (!b || !b.bookId || !b.name) return null;
    var cover = b.picUrl ? String(b.picUrl) : "";
    if (cover.indexOf("//") === 0) cover = "https:" + cover;
    var desc = String(b.authorName || "");
    if (b.totalWord) desc += (desc ? " • " : "") + b.totalWord;
    if (b.categoryName) desc += (desc ? " • " : "") + String(b.categoryName);
    if (b.serialStatus === 1) desc += (desc ? " • " : "") + "已完结";
    else if (b.serialStatus === 0) desc += (desc ? " • " : "") + "连载中";
    return {
        name: String(b.name),
        link: "https://www.zongheng.com/detail/" + b.bookId,
        cover: cover,
        description: desc,
        host: BASE_URL
    };
}

// Nhanh the loai: POST /api/catefine/search — 20 truyen/trang, tra
// bookList + hasNext. CHU Y: ten tham so NGUOC voi y nghia (kiem
// chung truc tiep 2026-11-11): server BO QUA pageNo, va dung
// pageNum lam SO TRANG (1-based): pageNum=1..39 moi trang 20 truyen
// khac nhau, khong trung lap (0/20); trang 39 chi 2 truyen,
// hasNext false; pageNum=40 rong. Vi vay gui pageNum = so trang
// yeu cau, pageNo = 1 (vo nghia — da kiem chung pageNo=3/pageNum=1
// tra giong het pageNo=1/pageNum=1, pageNo=99/pageNum=2 giong het
// pageNo=1/pageNum=2). Co dinh 20 truyen/trang do server tra.
function zhCatefineItems(cateFineId, pageNo) {
    var r = zhApiPost("/api/catefine/search", {
        cateFineId: cateFineId,
        pageNo: 1,
        pageNum: pageNo
    });
    if (!r.ok) return { error: r };
    var list = r.result.bookList || [];
    var items = [];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var it = zhApiBookItem(list[i]);
        if (it) items.push(it);
    }
    var next = "";
    if (r.result.hasNext) next = String(pageNo + 1);
    return { items: items, next: next };
}

// Nhanh bang xep hang: POST /api/rank/list {rankType} — tra toi da
// 10 muc (rankType 2 chi 6 muc); API khong phan trang theo pageNo
// (pageNo khac nhau van tra 10 muc) nen chi lay trang 1, next "".
// Mapping rankType (app) <-> rt (web) — DOI CHIEU 2026-11-11:
//   rankType 3 (doanh so) ~ rt=3 24h畅销榜; rankType 8 (打赏) ~ rt=7
//   捧场榜; rankType 7 la phieu de cu (web rt=6 推荐榜 da co o v1).
//   rt=8 完结榜 va rt=10 24h更新榜 KHONG co tuong duong trong app:
//   rankType 10 tra HTTP 500, khong co bang nao loc theo hoan thanh
//   hay cap nhat 24h — nen v2 khong them 2 bang nay.
function zhRankListItems(rankType) {
    var r = zhApiPost("/api/rank/list", { rankType: rankType });
    if (!r.ok) return { error: r };
    var list = r.result.rankDatas || [];
    var items = [];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var it = zhApiBookItem(list[i]);
        if (it) items.push(it);
    }
    return { items: items, next: "" };
}

function zhApiError(r) {
    if (!r) return Response.error("Không tải được danh sách (API app Zongheng tạm lỗi, thử lại sau).");
    if (r.error === "cooldown" || r.status === 405 || r.status === 429) {
        return Response.error(rateLimitErrorMessage("Zongheng", "api2.zongheng.com", r.cooldownRemainingMs));
    }
    return Response.error("Không tải được danh sách từ API app Zongheng (HTTP " + r.status + "), thử lại sau.");
}

function execute(input, page) {
    page = page || "1";
    var url = zhNormalizeUrl(input);
    // Nhanh API app (v2): phai dat TRUOC nhanh /rank? cua web vi
    // "/api/rank/list" cung chua chuoi "/rank/".
    if (url.indexOf("/api/catefine/search") > -1) {
        var cm = String(url).match(/cateFineId=(\d+)/);
        if (!cm) return Response.error("Thiếu mã thể loại (cateFineId) trong đường dẫn thể loại Zongheng.");
        var pageNo = parseInt(page, 10);
        if (isNaN(pageNo) || pageNo < 1) pageNo = 1;
        var cat = zhCatefineItems(parseInt(cm[1], 10), pageNo);
        if (cat.error) return zhApiError(cat.error);
        if (cat.items.length === 0) return Response.error("Thể loại này chưa có truyện (hoặc API app tạm lỗi).");
        return Response.success(cat.items, cat.next);
    }
    if (url.indexOf("/api/rank/list") > -1) {
        var rm = String(url).match(/rankType=(\d+)/);
        if (!rm) return Response.error("Thiếu mã bảng xếp hạng (rankType) trong đường dẫn bảng Zongheng.");
        var rk = zhRankListItems(parseInt(rm[1], 10));
        if (rk.error) return zhApiError(rk.error);
        if (rk.items.length === 0) return Response.error("Bảng xếp hạng trống (API app tạm lỗi, thử lại sau).");
        return Response.success(rk.items, rk.next);
    }
    var pf = pacedFetch(url, { headers: zhHeaders(url) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Zongheng", "zongheng.com", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được danh sách (HTTP " + pf.status + "): " + url);
    }
    var res = pf.res;
    if (url.indexOf("/rank?") > -1 || url.indexOf("/rank/") > -1) {
        var text = "";
        try { text = res.text(); } catch (e) { text = ""; }
        if (!text) return Response.error("Không đọc được trang bảng xếp hạng: " + url);
        var payload = nuxtPayload(text);
        if (!payload) return Response.error("Không bóc được dữ liệu bảng xếp hạng (site có thể đã đổi giao diện): " + url);
        var items = rankItems(payload, rankKeyFor(url));
        if (items.length === 0) return Response.error("Bảng xếp hạng trống (site có thể đã đổi giao diện): " + url);
        return Response.success(items, "");
    }
    // Trang store: thay so trang pN trong URL theo page.
    if (url.indexOf("/store/") > -1 && page !== "1") {
        var paged = url.replace(/\/p\d+\//, "/p" + page + "/");
        if (paged !== url) {
            var pf2 = pacedFetch(paged, { headers: zhHeaders(paged) });
            if (!pf2.ok) return Response.error("Không tải được trang danh sách (HTTP " + pf2.status + "): " + paged);
            res = pf2.res;
            url = paged;
        }
    }
    var doc = res.html();
    var list = storeItems(doc, url);
    if (list.length === 0) return Response.error("Không đọc được danh sách (site có thể đã đổi giao diện): " + url);
    var next = "";
    var nextEl = zhFirst(doc.select(".pagebox a.active + a"));
    if (nextEl) {
        var t = zhCleanText(nextEl.text());
        if (/^\d+$/.test(t) && parseInt(t, 10) > parseInt(page, 10)) next = t;
    }
    return Response.success(list, next);
}
