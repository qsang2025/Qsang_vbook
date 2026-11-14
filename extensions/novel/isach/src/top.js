// top.js — bang xep hang trang chu (most_reading.php).
//
// Input: https://isach.info/most_reading.php?sort=last_update_date |
//   ?sort=page_view | ?sort=download (3 tab cua home.js).
// Parse: #motsach_content_body .ms_list_item — muc DAU TIEN la hang tieu
// de ("Truyen" + link Sort by) nen bo qua; cac muc sau moi la sach
// (dang "1. <a href=/story.php?story=...>Ten</a>"). Trang top liet ke
// 100 sach, 1 trang duy nhat — token tiep luon "".
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    url = url || "";

    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được bảng xếp hạng (HTTP " + response.status + ")");
    var doc = response.html();

    var el = doc.select("#motsach_content_body .ms_list_item");
    var data = [];
    for (var i = 1; i < el.size(); i++) {
        var a = safeFirst(el.get(i).select(".left_list_item a"));
        if (!a) continue;
        var name = a.text().replace(/^\s+|\s+$/g, "");
        var link = absUrl(a.attr("href"));
        if (!name || !link) continue;
        var slug = storySlug(link);
        var rightEl = safeFirst(el.get(i).select(".right_list_item"));
        var desc = "";
        if (rightEl) desc = rightEl.text().replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
        data.push({
            name: name,
            link: link,
            cover: coverUrl(slug),
            description: desc,
            host: BASE_URL
        });
    }
    if (data.length === 0) return Response.error("Không tải được bảng xếp hạng.");

    return Response.success(data, "");
}
