// list.js — danh sach thread cua Tinhte Forum (XenForo co dien).
// CHI DUYET DANH SACH, KHONG CO TIM KIEM TU KHOA (pattern aztruyen/17k,
// giong Otofun v4 / VOZ).
//
// Query la duong dan danh sach (bat dau bang "/" hoac "http", do tab
// home.js / muc genre.js truyen sang) thi GET trang do, doc cac
// .discussionListItem. Query rong thi mac dinh mo board Smartphone -
// Tablet (/forums/smartphone-tablet.796/). Phan trang danh sach dung
// /page-N trong duong dan (KHONG dung ?page=N — day la XenForo 1.x).
// Thread ghim (sticky) chi hien o trang 1 — tu trang 2 tro di bo qua
// de khoi trung lap (XenForo lap lai thread ghim tren moi trang).
//
// Tim kiem tu khoa DA BO (giong Otofun v4 / VOZ, quyet dinh review
// vong 3 task 112): XenForo bat POST kem cookie xf_csrf cua cung
// session; runtime vBook khong doc duoc cookie do (da thu 3 cach doc
// cookie ngay 20/11, tat ca deu tra HTTP 400 tren may that, trong khi
// curl kem cookie chay duoc). Go tu khoa thang se tra loi tieng Viet
// ro rang thay vi ket qua rong. Bam vao thread thi mo thang reader
// (posts.js), khong qua trang detail.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

var NO_KEYWORD_SEARCH_MSG = "Tinhte Forum không hỗ trợ tìm kiếm từ khóa: diễn đàn bắt cookie CSRF mà app không đọc được. Hãy duyệt bằng Trang chủ (Smartphone - Tablet / Chuyện ngoài lề) hoặc Thể loại để chọn board rồi mở thread.";

function execute(query, page) {
    query = query || "";
    page = page || "1";

    if (query.indexOf("/") === 0 || query.indexOf("http") === 0) {
        return listThreads(query, page);
    }
    if (query === "") {
        return listThreads("/forums/smartphone-tablet.796/", page);
    }
    return Response.error(NO_KEYWORD_SEARCH_MSG);
}

// --- Duyet danh sach thread ---
function listThreads(query, page) {
    var base = query.indexOf("http") === 0 ? query : BASE_URL + query;
    // App cat dau "/" cuoi cua URL truoc khi truyen vao — noi lai de
    // ghep "page-N" cho trang > 1.
    if (base.charAt(base.length - 1) !== "/") base += "/";
    var pageNum = parseInt(page);
    var url = (pageNum <= 1) ? base : base + "page-" + pageNum;

    var response = fetch(url);
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    var doc = response.html();

    // Ten board (chi co khi duyet mot board /forums/...).
    var boardName = doc.select(".titleBar h1").text();

    var items = [];
    doc.select(".discussionListItem").map(function (el) {
        var cls = el.attr("class") || "";
        var pinned = cls.indexOf("sticky") !== -1;
        // Thread ghim lap lai tren moi trang — tu trang 2 bo qua.
        if (pageNum > 1 && pinned) return null;

        var titleLink = el.select("h3.title a.PreviewTooltip");
        if (titleLink.isEmpty()) titleLink = el.select("h3.title a[href*=\"thread/\"]");
        if (titleLink.isEmpty()) titleLink = el.select("h3.title a");
        // Ngay bat dau: abbr.DateTime (thread moi) hoac span.DateTime
        // (thread rat cu, vd. 2006/2008, chi co text "9/5/06").
        var timeEl = el.select(".posterDate .DateTime");
        var timeText = timeEl.text();
        if (!timeText) timeText = timeEl.attr("data-datestring") + " " + timeEl.attr("data-timestring");
        var author = el.attr("data-author");
        if (!author) author = el.select(".posterDate a.username").text();

        items.push({
            name: titleLink.text(),
            link: toAbs(titleLink.attr("href")),
            author: author,
            time: timeText,
            replies: el.select(".stats dl.major dd").text(),
            views: el.select(".stats dl.minor dd").text(),
            board: boardName,
            pinned: pinned,
            locked: cls.indexOf("locked") !== -1
        });
        return null;
    });

    // Link "Sau >" (a.text trong PageNav) chi co khi con trang sau.
    var hasNext = !doc.select(".PageNav a.text").isEmpty();
    return Response.success(items, hasNext ? String(pageNum + 1) : "");
}
