// book.js — script danh sach dung chung cho tab home / the loai (Tadu).
// Contract: execute(input, page) -> [{ name, link, cover, description,
// host }], nextPage (chuoi so trang, "" khi het).
// input la id the loai (vd. "99" = 东方玄幻). URL store cua site:
//   /store/<cat>-a-0-5-a-40-t-<page>-<channel>
// (a = tat ca, 0 = moi so chu, 5 = sap xep mac dinh, a = moi gia,
// 40 = ?, t = ?, channel 98 = nam / 122 = nu / 79 = xuat ban /
// 270 = nhi nguyen — xem channelFor trong config.js).
// Moi trang 30 truyen, selector .bookList > li (kiem chung live 2026-11-12).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

// Lay so trang lon nhat tu form phan trang, de biet con trang sau khong.
function maxPageNo(doc) {
    var max = 1;
    var links = doc.select("form#pageForm a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var n = 0;
        var dp = el.attr("data-page");
        if (dp) n = parseInt(dp, 10);
        if (!n || isNaN(n)) {
            var m = el.attr("href").match(/-t-(\d+)-/);
            if (m) n = parseInt(m[1], 10);
        }
        if (!isNaN(n) && n > max) max = n;
    }
    return max;
}

function execute(input, page) {
    var cat = safeString(input) || "99";
    var pageNo = parseInt(page || "1", 10);
    if (!pageNo || pageNo < 1) pageNo = 1;

    var url = BASE_URL + "/store/" + cat + "-a-0-5-a-40-t-" + pageNo + "-" + channelFor(cat);
    var response = fetchPage(url);
    if (!response.ok) return Response.error("Không tải được danh sách (HTTP " + response.status + ")");

    var doc = response.html();
    var data = [];
    var rows = doc.select(".bookList > li");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var nameEl = safeFirst(row.select(".rtList a.bookNm"));
        if (!nameEl) continue;
        var name = cleanText(nameEl.text());
        var link = buildAbsoluteUrl(nameEl.attr("href"));
        if (!name || !link) continue;

        var cover = "";
        var imgEl = safeFirst(row.select("a.bookImg img"));
        if (imgEl) {
            var src = imgEl.attr("data-src") || imgEl.attr("src");
            if (src && src.indexOf("coverBg") === -1) cover = fixCover(src);
        }

        var author = "";
        var authorEl = safeFirst(row.select("a.authorNm"));
        if (authorEl) author = cleanText(authorEl.text());
        var intro = "";
        var introEl = safeFirst(row.select("a.bookIntro"));
        if (introEl) intro = cleanText(introEl.text());
        var description = author;
        if (intro) description = description ? description + " · " + intro : intro;
        if (description.length > 200) description = description.substring(0, 200);

        data.push({ name: name, link: link, cover: cover, description: description, host: BASE_URL });
    }

    if (data.length === 0) return Response.error("Không đọc được danh sách truyện (site có thể đã đổi giao diện)");
    var next = pageNo < maxPageNo(doc) ? String(pageNo + 1) : "";
    return Response.success(data, next);
}
