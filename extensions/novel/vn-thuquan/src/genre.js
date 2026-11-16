// genre.js — Danh sach the loai (quet tu sidebar trang danh sach).
//
// Khoi "Thể loại" o sidebar: span.button_theloai > a[href^="/Truyen/
// Theloai/"] (kiem chung live 2026-11-16: 28 muc, vd. "Lịch sử, Dã sử"
// -> /Truyen/Theloai/Lich-su,-Da-su). Ten the loai lay tu text cua link;
// URL the loai giu nguyen dang ten hien thi (co dau phay, chu hoa) vi
// site phan biet dang nay — khong tu slug hoa.
//
// Thu tu nap file: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute() {
    var r = fetchVntqDoc(BASE_URL + "/Truyen/moinhat/Trang-1");
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var genres = [];
    var seen = {};
    var links = doc.select("span.button_theloai a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = String(a.attr("href") || "");
        if (href.indexOf("/Truyen/Theloai/") !== 0 && href.indexOf("/truyen/Theloai/") !== 0) continue;
        var title = cleanText(a.text());
        if (!title) continue;
        var input = normalizeVntqUrl(href);
        if (seen[input]) continue;
        seen[input] = 1;
        genres.push({ title: title, input: input, script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(genres);
}
