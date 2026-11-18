// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua zhenhunxiaoshuo.com (WordPress, UTF-8):
//   Trang truyen: https://www.zhenhunxiaoshuo.com/<slug>/  (vd. /modaozushi/)
//     h1.focusbox-title            ten truyen (vd. "魔道祖师")
//     meta[name=description]      "魔道祖师小说，作者墨香铜臭，欢迎在线全文免费阅读..."
//     .excerpts article.excerpt a  danh sach chuong day du (toc.js dung lai)
//   Truyen 镇魂: muc luc nam o /lunhuigui/ (trang chu "/" chi la trang chu
//   site, khong co muc luc). Bang the loai cua site link 镇魂 ve "/" nen
//   detail.js tu doi "/" thanh /lunhuigui/.
//   Site KHONG co anh bia: detail khong co img nao ngoai logo -> cover "".
//   Trang the loai (/chunai/, /yanqing/...) cung co h1 nhung KHONG co
//   .excerpts -> bao loi ro rang thay vi tra chi tiet gia.
//   Tim kiem: site khong co tim kiem that (/chaxun.html chi doi huong ve
//   "/<tu-khoa>/" doan slug; ?s= tra ve trang chu) -> KHONG co search.js.
//   Trang thai hoan/đang ra: site khong ghi -> bo truong ongoing (app mac
//   dinh true), khong doan bua.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// Trang chu "/" cua site thuc chat la trang truyen 镇魂 nhung khong co muc
// luc; muc luc that nam o /lunhuigui/.
function resolveDetailUrl(url) {
    var u = normalizeUrl(url);
    var m = u.match(/^(https?:\/\/[^\/]+)(\/.*)$/);
    if (m && (m[2] === "/" || m[2] === "")) return siteOrigin() + "/lunhuigui/";
    return u;
}

// Tac gia nam trong meta description ("作者墨香铜臭，...") hoac dang
// "priest所著", hoac trong <title> dang "..._墨香铜臭著 - ...".
function parseAuthor(metaDesc, titleText) {
    var author = "";
    var m = String(metaDesc || "").match(/作者[:：]?\s*([^，,、\s]+)/);
    if (m) author = cleanText(m[1]);
    if (!author) {
        m = String(metaDesc || "").match(/([^\s，。,]+)所著/);
        if (m) author = cleanText(m[1]);
    }
    if (!author) {
        m = String(titleText || "").match(/_([^_]+)著[\s\-_]/);
        if (m) author = cleanText(m[1]);
    }
    return author;
}

function execute(url) {
    var target = resolveDetailUrl(url);
    rateLimitDelay("zhenhunxiaoshuo.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được trang truyện: " + target);

    // Trang the loai khong co .excerpts -> khong phai trang truyen.
    var excerptLinks = doc.select(".excerpts article.excerpt a[href]");
    if (excerptLinks.isEmpty()) {
        return Response.error("Đây không phải trang truyện (có thể là trang thể loại): " + target);
    }

    var name = cleanText(doc.select("h1.focusbox-title").text());
    if (!name) {
        var t = cleanText(doc.select("title").text());
        name = cleanText(t.split(/[\-_]/)[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện từ " + target);

    var metaDesc = String(doc.select("meta[name=description]").attr("content") || "");
    var titleText = cleanText(doc.select("title").text());
    var author = parseAuthor(metaDesc, titleText);
    var description = cleanText(metaDesc);

    // Dem so chuong that (bo muc "简介" dau danh sach).
    var chapterCount = 0;
    var i = 0;
    for (i = 0; i < excerptLinks.size(); i++) {
        var ti = cleanText(excerptLinks.get(i).text());
        if (ti.indexOf("简介") !== -1) continue;
        chapterCount++;
    }

    var detailParts = [];
    if (author) detailParts.push("作者：" + author);
    if (chapterCount > 0) detailParts.push("Số chương: " + chapterCount);
    detailParts.push("Nguồn: 镇魂小说网");

    // The loai that cua site (nav chinh); muc 作者 la chi muc tac gia, khong
    // phai bang truyen nen khong dua vao day.
    var genres = [
        { title: "纯爱小说", input: BASE_URL + "/chunai/", script: "book.js" },
        { title: "言情小说", input: BASE_URL + "/yanqing/", script: "book.js" },
        { title: "百合小说", input: BASE_URL + "/baihexiaoshuo/", script: "book.js" }
    ];

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: description,
        detail: detailParts.join("<br>"),
        url: target,
        type: "chinese_novel",
        format: "chinese_novel",
        genres: genres,
        suggests: []
    });
}
