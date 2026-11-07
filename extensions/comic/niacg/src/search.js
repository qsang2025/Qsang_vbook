// search.js — tim kiem theo tu khoa cua NiACG.
//
// Tim kiem cua site (EmpireCMS) la GET, theo tung muc (classid):
//   /e/search/?searchget=1&keyboard=<tu khoa>&show=title
// Khong truyen classid thi tra ve ket qua gallery (link moehome) — dung
// cho extension comic nay. Server 302 toi trang ket qua
//   /e/search/result/?searchid=<id>
// roi phan trang bang
//   /e/search/result/index.php?page=<N>&searchid=<id>
// (page tren URL bat dau tu 0; searchid do server cap, lay tu link phan
// trang tren trang ket qua). Token trang ke (data2) dang
// "SID:<searchid>|<so trang app>" de trang sau khong phai tim lai.
// Neu query la duong dan (/listinfo/... hoac /tags/... hoac URL day du)
// thi duyet thang trang do nhu mot tab danh sach (giong book.js).
// Ket qua chi giu item thuoc cac muc anh (IMAGE_CLASSES); bo item video
// (showinfo-19/20/21/23) vi extension comic khong phat duoc video.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Chi giu item thuoc muc anh (moehome luon la gallery; showinfo thi loc
// theo classid). Tra ve mang moi.
function filterImageItems(items) {
    var out = [];
    var i = 0;
    for (i = 0; i < items.length; i++) {
        var link = items[i].link || "";
        var cid = classIdOf(link);
        if (link.indexOf("/moehome-") !== -1) {
            out.push(items[i]);
        } else if (link.indexOf("/showinfo-") !== -1 && IMAGE_CLASSES.indexOf(cid) !== -1) {
            out.push(items[i]);
        }
    }
    return out;
}

// Trich searchid tu link phan trang tren trang ket qua tim kiem.
function extractSearchId(doc) {
    var links = doc.select("a[href*=\"searchid=\"]");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var href = String(links.get(i).attr("href") || "");
        var m = href.match(/searchid=(\d+)/);
        if (m) return m[1];
    }
    return "";
}

// Trang ket qua co phai trang "khong tim thay" khong.
function isNoResultPage(doc) {
    var title = "";
    try { title = cleanText(doc.select("title").text()); } catch (e) {}
    if (title === "信息提示") return true;
    var body = "";
    try { body = String(doc.select("body").text()); } catch (e2) {}
    return body.indexOf("没有搜索到相关的内容") !== -1;
}

// Trang cuoi cua ket qua tim kiem (tu link phan trang), tra ve so trang
// site (bat dau tu 0). -1 neu khong co phan trang (chi 1 trang).
function maxSearchPage(doc) {
    var max = -1;
    doc.select("a[href*=\"searchid=\"]").forEach(function (a) {
        var href = String(a.attr("href") || "");
        var m = href.match(/[?&]page=(\d+)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > max) max = p;
        }
    });
    return max;
}

function execute(query, page) {
    query = query || "";
    page = page || "1";

    // Duyet tab: query la duong dan danh sach hoac URL day du.
    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        var baseUrl = query.indexOf("http") === 0 ? query : BASE_URL + query;
        var url = listPageUrl(baseUrl, page);
        var doc = fetchDocWithFallback(url);
        if (!doc) return Response.error("Không tải được trang danh sách: " + url);
        var parsed = parseListPage(doc, page);
        if (parsed.items.length === 0) {
            return Response.error("Không đọc được danh sách (site có thể đã đổi giao diện): " + url);
        }
        return Response.success(filterImageItems(parsed.items), parsed.next);
    }

    // Tu khoa: phan tich token trang ke "SID:<searchid>|<so trang app>".
    var searchId = "";
    var appPage = 1;
    if (page.indexOf("SID:") === 0) {
        var parts = page.substring(4).split("|");
        searchId = parts[0] || "";
        appPage = parseInt(parts[1] || "1", 10);
        if (isNaN(appPage) || appPage < 1) appPage = 1;
    } else {
        appPage = parseInt(page, 10);
        if (isNaN(appPage) || appPage < 1) appPage = 1;
    }

    var resultDoc = null;
    var sitePage = appPage - 1;
    if (searchId) {
        // Trang ke: toi thang trang ket qua theo searchid.
        var pageUrl = BASE_URL + "/e/search/result/index.php?page=" + sitePage + "&searchid=" + searchId;
        resultDoc = fetchDocWithFallback(pageUrl);
        if (!resultDoc) return Response.error("Không tải được trang kết quả tìm kiếm: " + pageUrl);
    } else {
        // Trang dau: goi URL tim kiem, server 302 toi trang ket qua.
        var searchUrl = BASE_URL + "/e/search/?searchget=1&keyboard=" + encodeURIComponent(query) + "&show=title";
        resultDoc = fetchDocWithFallback(searchUrl);
        if (!resultDoc) return Response.error("Không tải được kết quả tìm kiếm: " + searchUrl);
        searchId = extractSearchId(resultDoc);
    }

    if (isNoResultPage(resultDoc)) {
        return Response.success([], "");
    }

    var result = parseListPage(resultDoc, String(appPage));
    var items = filterImageItems(result.items);
    if (items.length === 0 && result.items.length === 0) {
        return Response.error("Không đọc được kết quả tìm kiếm (site có thể đã đổi giao diện).");
    }

    // Token trang ke: uu tien searchid + so trang lon nhat tren trang.
    var next = "";
    if (searchId) {
        var maxPage = maxSearchPage(resultDoc);
        if (maxPage > sitePage) next = "SID:" + searchId + "|" + (appPage + 1);
    } else if (result.next) {
        next = result.next;
    }
    return Response.success(items, next);
}
