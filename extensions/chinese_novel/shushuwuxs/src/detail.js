// detail.js — thong tin chi tiet mot truyen (execute(url) -> object).
//
// Layout da kiem chung cua shushuwuxs.com (SSR, UTF-8):
//   Trang truyen: https://www.shushuwuxs.com/new_<id>.html
//     .tabstit a[1]        the loai (vd. /youxi/ 游戏竞技)
//     #bookimg img          anh bia (tupianxs.com/<id>/...jpg)
//     .booktitle h1         ten truyen (vd. 问道章)
//     #author a             tac gia (vd. 文抄公)
//     .count li             状态 (已完结/连载中), 字数 (102万字)
//     #bookintro p          gioi thieu (p dau la thong bao DMCA — bo)
//     .new .keywords a      chuong moi nhat
//     .new .uptime          thoi gian cap nhat cuoi
//     .motion a.tgcj        "开始阅读" -> /read_<id>/ (trang muc luc)
//   Chap nhan ca URL trang truyen (/new_<id>.html) lan URL muc luc
//   (/read_<id>/) va host m.shushuwuxs.com (doi ve www).
//   Site KHONG co tim kiem that (form search la Baidu CSE — ket qua chi
//   hien bang JavaScript, POST tra ve trang rong) nen KHONG co search.js.
//   Trang thai hoan/dang ra: lay tu .count (已完结 -> ongoing false).
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// /read_<id>/ -> /new_<id>.html; m. -> www.
function resolveDetailUrl(url) {
    var u = normalizeUrl(url);
    var m = u.match(/\/read_(\d+)\/?$/);
    if (m) return siteOrigin() + "/new_" + m[1] + ".html";
    return u;
}

function execute(url) {
    var target = resolveDetailUrl(url);
    rateLimitDelay("shushuwuxs.com", 500, 1500);
    var doc = fetchDoc(target);
    if (!doc) return Response.error("Không tải được trang truyện: " + target);

    var name = cleanText(doc.select(".booktitle h1").text());
    if (!name) {
        var t = cleanText(doc.select("title").text());
        name = cleanText(t.split("_")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện từ " + target);

    // Trang the loai khong co .booktitle h1 dung nghia (tieu de la ten
    // the loai) va khong co #bookintro -> bao loi ro rang.
    var introPs = doc.select("#bookintro p");
    if (introPs.isEmpty()) {
        return Response.error("Đây không phải trang truyện (có thể là trang thể loại): " + target);
    }

    var author = cleanText(doc.select("#author a").text());
    if (!author) {
        var au = cleanText(doc.select("#author").text());
        author = cleanText(au.replace(/作者[:：]/, ""));
    }

    var coverEl = doc.select("#bookimg img").first();
    var cover = coverEl === null ? "" : String(coverEl.attr("src") || "");

    // Gioi thieu: bo p DMCA dau tien (onclick ve /report/dmca.html).
    var description = "";
    var i = 0;
    for (i = 0; i < introPs.size(); i++) {
        var p = introPs.get(i);
        var txt = cleanText(p.text());
        if (!txt) continue;
        if (txt.indexOf("如果此书侵犯了您的权益") !== -1) continue;
        var onclick = String(p.attr("onclick") || "");
        if (onclick.indexOf("dmca") !== -1) continue;
        description = txt;
        break;
    }

    // Trang thai + so chu tu .count; cap nhat cuoi + chuong moi nhat.
    var statusText = "";
    var wordCount = "";
    var countLis = doc.select(".count li");
    for (i = 0; i < countLis.size(); i++) {
        var liTxt = cleanText(countLis.get(i).text());
        if (liTxt.indexOf("状态") === 0 || liTxt.indexOf("状 态") === 0) {
            statusText = cleanText(liTxt.replace(/状\s*态[:：]/, ""));
        }
        if (liTxt.indexOf("字数") === 0 || liTxt.indexOf("字 数") === 0) {
            wordCount = cleanText(liTxt.replace(/字\s*数[:：]/, ""));
        }
    }
    var updated = cleanText(doc.select(".new .uptime").text());
    var latest = cleanText(doc.select(".new .keywords a").text());

    var detailParts = [];
    if (author) detailParts.push("作者：" + author);
    if (statusText) detailParts.push("状态：" + statusText);
    if (wordCount) detailParts.push("字数：" + wordCount);
    if (latest) detailParts.push("Mới nhất: " + latest);
    if (updated) detailParts.push(updated);
    detailParts.push("Nguồn: 书书屋小说");

    var ongoing = true;
    if (statusText.indexOf("完结") !== -1) ongoing = false;

    // The loai cua truyen (tu breadcrumb .tabstit) + danh sach day du.
    var genres = [];
    var crumbLinks = doc.select(".tabstit a");
    if (crumbLinks.size() >= 2) {
        var gHref = String(crumbLinks.get(1).attr("href") || "");
        var gTitle = cleanText(crumbLinks.get(1).text());
        if (gHref && gTitle) {
            genres.push({ title: gTitle, input: absUrl(gHref), script: "book.js" });
        }
    }
    var allGenres = [
        ["玄幻", "/xuanhuan/"], ["武侠", "/wuxia/"], ["都市", "/dushi/"],
        ["历史", "/lishi/"], ["游戏", "/youxi/"], ["科幻", "/kehuan/"],
        ["恐怖", "/xuanyi/"], ["其他", "/qita/"], ["古代", "/guyan/"],
        ["现代", "/xianyan/"], ["幻想", "/huanqing/"], ["游戏(女)", "/zongcai/"],
        ["浪漫", "/qingchun/"], ["言情", "/wangluo/"], ["科幻(女)", "/mmkehuan/"],
        ["其他(女)", "/mmqita/"]
    ];
    for (i = 0; i < allGenres.length; i++) {
        genres.push({ title: allGenres[i][0], input: BASE_URL + allGenres[i][1], script: "book.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join("<br>"),
        url: target,
        type: "chinese_novel",
        format: "chinese_novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}
