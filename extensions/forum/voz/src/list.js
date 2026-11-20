// list.js — danh sach thread cua VOZ Forum (XenForo). CHI DUYET DANH SACH,
// KHONG CO TIM KIEM TU KHOA (pattern aztruyen/17k, giong Otofun v4).
//
// Query la duong dan danh sach (bat dau bang "/" hoac "http", do tab
// home.js / muc genre.js truyen sang) thi GET trang do, doc cac
// .structItem.structItem--thread. Query rong thi mac dinh mo
// /whats-new/posts/ (bai viet moi). Phan trang danh sach dung ?page=N.
// Thread ghim (sticky) chi hien o trang 1 — tu trang 2 tro di bo qua
// de khoi trung lap (XenForo lap lai thread ghim tren moi trang).
//
// VOZ khac Otofun: muc (board) dung /s/<slug>.<id>/ (khong phai
// /forums/<slug>.<id>/); thread dung /t/<slug>.<id>/ (khong phai
// /threads/<slug>.<id>/). Selector chon ca hai dang de phong.
//
// Tim kiem tu khoa DA BO (giong Otofun v4, quyet dinh review vong 3
// task 112): XenForo bat POST kem cookie xf_csrf cua cung session;
// runtime vBook khong doc duoc cookie do (da thu 3 cach doc cookie
// ngay 20/11, tat ca deu tra HTTP 400 tren may that, trong khi curl
// kem cookie chay duoc). Go tu khoa thang se tra loi tieng Viet ro
// rang thay vi ket qua rong. Bam vao thread thi mo thang reader
// (posts.js), khong qua trang detail.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

var NO_KEYWORD_SEARCH_MSG = "VOZ Forum kh\u00f4ng h\u1ed7 tr\u1ee3 t\u00ecm ki\u1ebfm t\u1eeb kh\u00f3a: di\u1ec5n \u0111\u00e0n b\u1eaft cookie CSRF m\u00e0 app kh\u00f4ng \u0111\u1ecdc \u0111\u01b0\u1ee3c. H\u00e3y duy\u1ec7t b\u1eb1ng Trang ch\u1ee7 (M\u1edbi nh\u1ea5t / Chia s\u1ebb ki\u1ebfn th\u1ee9c) ho\u1eb7c Th\u1ec3 lo\u1ea1i \u0111\u1ec3 ch\u1ecdn board r\u1ed3i m\u1edf thread.";

function execute(query, page) {
    query = query || "";
    page = page || "1";

    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        return listThreads(query, page);
    }
    if (query === "") {
        return listThreads("/whats-new/posts/", page);
    }
    return Response.error(NO_KEYWORD_SEARCH_MSG);
}

// --- Duyet danh sach thread ---
function listThreads(query, page) {
    var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
    var url = base + (base.indexOf("?") === -1 ? "?" : "&") + "page=" + page;
    var response = fetch(url);
    if (!response.ok) return Response.error("Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c danh s\u00e1ch (HTTP " + response.status + ")");
    var doc = response.html();

    // Ten board (chi co khi duyet mot board /s/...; trang whats-new
    // khong co board rieng nen de trong).
    var boardName = "";
    if (url.indexOf("/s/") !== -1) {
        boardName = doc.select(".p-title-value").text();
    }

    var pageNum = parseInt(page);
    var items = [];
    doc.select(".structItem.structItem--thread").map(function (el) {
        var pinned = !el.select(".structItem-status--sticky").isEmpty();
        // Thread ghim lap lai tren moi trang — tu trang 2 bo qua.
        if (pageNum > 1 && pinned) return null;

        var titleLink = el.select(".structItem-title a[href*=\"/t/\"]");
        if (titleLink.isEmpty()) titleLink = el.select(".structItem-title a[href*=\"/threads/\"]");
        if (titleLink.isEmpty()) titleLink = el.select(".structItem-title a");
        var timeEl = el.select(".structItem-startDate time");
        var timeText = timeEl.attr("title");
        if (!timeText) timeText = timeEl.text();
        var author = el.select(".structItem-parts a.username").text();
        if (!author) author = el.attr("data-author");
        var meta = el.select(".structItem-cell--meta dl.pairs dd");

        items.push({
            name: titleLink.text(),
            link: toAbs(titleLink.attr("href")),
            author: author,
            time: timeText,
            replies: meta.first() ? meta.first().text() : "",
            views: meta.last() ? meta.last().text() : "",
            board: boardName,
            pinned: pinned,
            locked: !el.select(".structItem-status--locked").isEmpty()
        });
        return null;
    });

    var hasNext = !doc.select(".pageNav-page--later").isEmpty();
    return Response.success(items, hasNext ? String(pageNum + 1) : "");
}
