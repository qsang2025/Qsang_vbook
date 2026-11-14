// genre.js — danh sach the loai + tag, doc live tu trang /all/.
// Moi muc tro ve list.js voi duong dan /all/ tuong ung.
// 4 tag Incest/Netorare (乱伦 / 骨科 / NTR / NTL) khong hien theo tien
// le valvrareteam — dao nguoc duoc khi Anh noi (xem file config.js).
//
// Load: file config.js, file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');

function execute() {
    rateLimitDelay("banshanren.com");
    var response = fetch(BASE_URL + "/all/0-0-0-0-0-0-1-1/");
    if (!response.ok) return Response.error("Không tải được danh sách thể loại (HTTP " + response.status + ")");
    var doc = response.html();

    var genres = [];
    var seen = {};

    function add(el) {
        var href = el.attr("href");
        var title = cleanText(el.text());
        if (!href || !title || href.indexOf("/all/") !== 0) return;
        if (href === "/all/0-0-0-0-0-0-1-1/" || seen[href]) return;
        if (isHiddenTag(title)) return;
        seen[href] = true;
        genres.push({ title: title, input: href, script: "list.js" });
    }

    var categories = doc.select("#category_box li a");
    for (var i = 0; i < categories.size(); i++) add(categories.get(i));

    var tags = doc.select(".tag_filter_box .tag_box li a");
    for (var j = 0; j < tags.size(); j++) add(tags.get(j));

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
