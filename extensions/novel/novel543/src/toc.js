// toc.js — muc luc cua 稷下書院 (novel543.com).
// URL nhan vao la URL trang chi tiet (https://www.novel543.com/<10 so>/);
// trang muc luc la /<book>/dir — chi 1 trang duy nhat ke ca sach 4.091
// chuong (khao sat 2026-11-10), nen KHONG can page.js.
// Link chuong: /<book>/<vol>_<seq>.html (vd /0609709217/8096_1.html).
// Trang gom: 12 chuong moi nhat lap lai o dau + toan bo chuong theo
// thu tu la (volume moi nhat desc, archive asc...) + 2 link footer
// (/site/privacy.html, /site/contact.html) — phai loc dung pattern,
// dedupe theo href, ROI SAP XEP THEO (vol, seq) TANG DAN moi ra dung
// thu tu doc (seq la so thu tu chuong toan cuc cua site; sach lon seq
// 1..4162, trong do volume moi nhat seq 4127..4162 = chuong 1..36 hien
// tren trang chi tiet).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('rate-limit.js');

function execute(url) {
    url = normalizeUrl(url);
    if (!url) return Response.error("URL truyện không hợp lệ");

    // Lay bookId (10 chu so) tu URL truyen de tao URL muc luc.
    var mBook = url.match(/(\d{10})/);
    if (!mBook) return Response.error("URL truyện không đúng định dạng novel543: " + url);
    var bookId = mBook[1];
    var tocUrl = BASE_URL + "/" + bookId + "/dir";

    rateLimitDelay("www.novel543.com");
    var doc = fetchDocWithFallback(tocUrl, MIRROR_LIST);
    if (!doc) return Response.error("Không tải được mục lục: " + tocUrl);

    var items = [];
    var seen = {};
    doc.select(".chaplist a").forEach(function (a) {
        var href = a.attr("href");
        if (!href) return;
        // Chi nhan link chuong dang /<book>/<vol>_<seq>.html.
        var m = href.match(/^\/\d{10}\/(\d+)_(\d+)\.html$/);
        if (!m) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        var name = cleanText(a.text());
        if (!name) return;
        items.push({
            name: htmlDecode(name),
            url: link,
            description: "",
            lock: false,
            pay: false,
            host: siteOrigin(),
            _vol: parseInt(m[1], 10),
            _seq: parseInt(m[2], 10)
        });
    });

    // Sap xep theo (vol, seq) tang dan = dung thu tu doc.
    items.sort(function (a, b) {
        if (a._vol !== b._vol) return a._vol - b._vol;
        return a._seq - b._seq;
    });

    var out = [];
    var i = 0;
    for (i = 0; i < items.length; i++) {
        out.push({
            name: items[i].name,
            url: items[i].url,
            description: "",
            lock: false,
            pay: false,
            host: items[i].host
        });
    }

    if (out.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + tocUrl);
    }

    return Response.success(out);
}
