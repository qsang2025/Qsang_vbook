// search.js — tim kiem sach.
//
// GET /search/story_result.php?search=<tu khoa>&page=N — cung cau truc
// danh sach .story_content_list .ms_list_item nhu list.js (30 ket qua/
// trang). Chu y: trang ket qua khong co #motsach_content_body nen phai
// dung selector .story_content_list truc tiep (giong list.js).
// Luu y ma hoa: trang ket qua khong khai bao charset trong meta — runtime
// doc theo charset header; test tren may that phai kiem tra tieng Viet
// hien dung ("10 nghề kiếm 30USD/h", khong mojibake).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(key, page) {
    key = key || "";
    if (!key) return Response.error("Nhập từ khóa để tìm truyện.");
    var cur = 1;
    if (page) {
        cur = parseInt(page, 10);
        if (isNaN(cur) || cur < 1) cur = 1;
    }

    rateLimitDelay("isach.info");
    var response = fetch(BASE_URL + "/search/story_result.php", { queries: { search: key, page: String(cur) } });
    if (!response.ok) return Response.error("Không tìm được truyện (HTTP " + response.status + ")");
    var doc = response.html();

    var el = doc.select(".story_content_list .ms_list_item");
    var data = [];
    for (var i = 0; i < el.size(); i++) {
        var item = parseListItem(el.get(i));
        if (item) data.push(item);
    }
    if (data.length === 0) return Response.error("Không tìm thấy truyện nào với từ khóa \"" + key + "\".");

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
// phan trang; khong co thi "" (het ket qua).
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
