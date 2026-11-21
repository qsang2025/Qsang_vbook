// genre.js — danh sach the loai phim cua HHTQ IO (hhtq.io).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute() {
    var list = [];
    var seen = {};
    var doc = fetchDocWithFallback(BASE_URL + "/", MIRROR_LIST);
    if (doc) {
        var opts = doc.select("select[name=genre] option");
        var i = 0;
        for (i = 0; i < opts.size(); i++) {
            var opt = opts.get(i);
            var val = String(opt.attr("value") || "").trim();
            var title = cleanText(opt.text());
            if (!val || !title || seen[val]) continue;
            seen[val] = true;
            list.push({ title: title, input: "/?genre=" + encodeURIComponent(val), script: "search.js" });
        }
    }
    if (list.length === 0) {
        list = [
            { title: "Tập Mới Hôm Nay", input: "/?today=1", script: "search.js" },
            { title: "Đang Cập Nhật", input: "/?status=ongoing", script: "search.js" },
            { title: "Hoàn Thành", input: "/?status=completed", script: "search.js" },
            { title: "Lịch Phim", input: "/lich-phim", script: "search.js" }
        ];
    }
    return Response.success(list);
}
