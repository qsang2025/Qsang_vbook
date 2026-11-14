// list.js — danh sach truyen cho the loai / tac gia.
//
// Input: URL danh sach day du dang
//   https://isach.info/story.php?list=story&category=<slug>&order=story_id
//   https://isach.info/story.php?list=story&author=<slug>&order=story_id
// App goi execute(query, "2") cho trang 2 tro di (page la chuoi so).
//
// Parse: .story_content_list .ms_list_item (30 sach/trang). Moi muc:
//   .left_list_item: link download (href rong, bo qua) + link ten truyen
//   (lay <a> CUOI CUNG); .right_list_item: the loai - tac gia - so chuong.
// Phan trang: .pagination a co href &page=N (ca 2 khoi tren/duoi); token
// tiep = so trang nho nhat > trang hien tai, khong co thi "".
// Luu y: trang tim kiem khong co #motsach_content_body nen KHONG duoc
// gioi han selector vao body — dung .story_content_list truc tiep.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    url = url || "";
    var cur = 1;
    if (page) {
        cur = parseInt(page, 10);
        if (isNaN(cur) || cur < 1) cur = 1;
    }
    var u = url.replace(/&page=\d+/, "");
    if (u.indexOf("?") < 0) u += "?";
    u += "&page=" + cur;

    rateLimitDelay("isach.info");
    var response = fetch(u);
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");
    var doc = response.html();

    var el = doc.select(".story_content_list .ms_list_item");
    var data = [];
    for (var i = 0; i < el.size(); i++) {
        var item = parseListItem(el.get(i));
        if (item) data.push(item);
    }
    if (data.length === 0) return Response.error("Không tìm thấy truyện nào trong danh sách này.");

    return Response.success(data, nextPageToken(doc, cur));
}

function parseListItem(e) {
    var links = e.select(".left_list_item a");
    if (links.size() === 0) return null;
    var a = links.get(links.size() - 1);
    var name = a.text().replace(/^\s+|\s+$/g, "");
    var link = absUrl(a.attr("href"));
    if (!name || !link) return null;
    var slug = storySlug(link);
    var rightEl = safeFirst(e.select(".right_list_item"));
    var desc = "";
    if (rightEl) desc = rightEl.text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    return {
        name: name,
        link: link,
        cover: coverUrl(slug),
        description: desc,
        host: BASE_URL
    };
}

// Token trang tiep: so trang nho nhat > trang hien tai trong cac link
// phan trang; khong co thi "" (het danh sach).
function nextPageToken(doc, cur) {
    var links = doc.select(".pagination a");
    var best = 0;
    for (var i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/page=(\d+)/);
        if (!m) continue;
        var n = parseInt(m[1], 10);
        if (n > cur && (best === 0 || n < best)) best = n;
    }
    return best > 0 ? String(best) : "";
}
