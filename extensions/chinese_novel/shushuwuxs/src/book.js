// book.js — danh sach truyen theo chuyen muc / bang xep hang
// (execute(url, page) -> items, next).
//
// Ba dang trang danh sach tren shushuwuxs.com:
//   Dang A — trang the loai (/xuanhuan/, /dushi/, ...): 2 muc:
//     * #hotcontent .item (6 truyen noi bat, co anh bia):
//       .image a img            anh bia (tupianxs.com)
//       dl dt span              tac gia
//       dl dt a[href=/read_<id>/]  ten truyen
//       dl dd                   gioi thieu ngan
//     * #newscontent ul li (60 truyen moi cap nhat cua the loai):
//       .s1 the loai, .s2 a ten truyen, .s3 a chuong moi nhat,
//       .s4 tac gia, .s5 thoi gian cap nhat (MM-DD HH:MM)
//     1 trang duy nhat (kiem chung: /dushi/2.html tra ve y het /dushi/)
//     nen next = "".
//   Dang B — /all/ (全部小说): .novelslist li:
//       <a href="/read_<id>/">Ten truyen</a>/Tac gia
//     1 trang duy nhat (300 muc), next = "".
//   Dang C — bang .novelslist2 (/lastupdate/, /allvisit/, /allvote/,
//     /goodnum/, /quanben/, /postdate/): moi dong li:
//       .s1  the loai [..]   .s2 a  ten truyen   .s3 a  chuong moi nhat
//       .s4  tac gia         .s5  so chu         .s6  trang thai
//       .s7  thoi gian cap nhat
//     Phan trang theo URL /<ten>/N.html (50 muc/trang, khong co link
//     "trang ke" tren trang — phai tu tang so trang). page token la so
//     trang dang chuoi ("" = trang 1); tra next = so trang ke khi van
//     con muc, "" khi trang rong.
// Link muc trong danh sach tro ve /read_<id>/ (trang muc luc) — doi
// thanh /new_<id>.html (trang truyen) de detail.js nhan dung.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

// /read_<id>/ (trang muc luc) -> /new_<id>.html (trang truyen).
function toDetailLink(href) {
    var m = String(href || "").match(/\/read_(\d+)\/?$/);
    if (m) return siteOrigin() + "/new_" + m[1] + ".html";
    return absUrl(href);
}

// Trang .novelslist2 (lastupdate + cac bang xep hang) moi phan trang
// theo /N.html; trang the loai va /all/ chi co 1 trang.
// (App strip dau "/" cuoi URL nen so sanh sau khi bo "/" cuoi.)
function isPagedList(path) {
    var p = String(path || "").replace(/\/$/, "");
    return p === "/lastupdate" || p === "/allvisit" ||
        p === "/allvote" || p === "/goodnum" ||
        p === "/quanben" || p === "/postdate";
}

function execute(url, page) {
    var target = normalizeUrl(url);
    var path = target.replace(siteOrigin(), "");
    var pageNum = 1;
    if (page) {
        var n = parseInt(String(page), 10);
        if (!isNaN(n) && n > 0) pageNum = n;
    }

    // Trang .novelslist2: trang 1 la /<ten>/, trang N>1 la /<ten>/N.html.
    var fetchUrl = target;
    if (isPagedList(path) && pageNum > 1) {
        var base = path.replace(/\/$/, "") + "/";
        fetchUrl = siteOrigin() + base + pageNum + ".html";
    }

    rateLimitDelay("shushuwuxs.com", 500, 1500);
    var doc = fetchDoc(fetchUrl);
    if (!doc) return Response.error("Không tải được trang danh sách: " + fetchUrl);

    var items = [];
    var seen = {};
    var i = 0;

    // Dang A (noi bat): #hotcontent .item — chay truoc de truyen noi bat
    // len dau danh sach; "seen" loai trung voi #newscontent.
    var blocks = doc.select("#hotcontent .item");
    for (i = 0; i < blocks.size(); i++) {
        var b = blocks.get(i);
        var a = b.select("dl dt a").first();
        if (a === null) continue;
        var nm = cleanText(a.text());
        if (!nm) continue;
        var lk = toDetailLink(a.attr("href"));
        if (!lk || seen[lk]) continue;
        seen[lk] = true;
        var au = cleanText(b.select("dl dt span").text());
        var img = b.select(".image img").first();
        var cv = img === null ? "" : String(img.attr("src") || "");
        var ds = cleanText(b.select("dl dd").text());
        items.push({
            name: nm,
            link: lk,
            author: au,
            cover: cv,
            description: ds,
            host: siteOrigin()
        });
    }


    // Parser chung cho dong li dang .s1/.s2/.s3/.s4/.s5/.s6/.s7.
    // - .novelslist2 (/lastupdate/, cac bang xep hang): .s5 = so chu,
    //   .s6 = trang thai, .s7 = thoi gian cap nhat.
    // - #newscontent (muc "recently updated" tren trang the loai):
    //   .s5 = thoi gian cap nhat (dang MM-DD HH:MM), khong co .s6/.s7.
    function parseRow(li) {
        var titleA = li.select(".s2 a").first();
        if (titleA === null) return null;
        var name = cleanText(titleA.text());
        if (!name) return null;
        var link = toDetailLink(titleA.attr("href"));
        if (!link || seen[link]) return null;
        seen[link] = true;
        var author = cleanText(li.select(".s4").text());
        var genre = cleanText(li.select(".s1").text());
        var s5 = cleanText(li.select(".s5").text());
        var status = cleanText(li.select(".s6").text());
        var updated = cleanText(li.select(".s7").text());
        var words = "";
        if (s5.indexOf("字") !== -1) {
            words = s5;
        } else if (!updated && /\d{1,2}-\d{1,2}/.test(s5)) {
            updated = s5;
        }
        var latest = cleanText(li.select(".s3 a").text());
        var descParts = [];
        if (genre) descParts.push(genre);
        if (status) descParts.push(status);
        if (words) descParts.push(words);
        if (latest) descParts.push("Mới nhất: " + latest);
        if (updated) descParts.push("Cập nhật: " + updated);
        return {
            name: name,
            link: link,
            author: author,
            cover: "",
            description: descParts.join(" | "),
            host: siteOrigin()
        };
    }

    // Dang C: bang .novelslist2.
    var rows = doc.select(".novelslist2 ul li");
    for (i = 0; i < rows.size(); i++) {
        var it = parseRow(rows.get(i));
        if (it) items.push(it);
    }

    // Trang the loai: muc "recently updated" #newscontent (60 muc).
    var newsRows = doc.select("#newscontent ul li");
    for (i = 0; i < newsRows.size(); i++) {
        var it2 = parseRow(newsRows.get(i));
        if (it2) items.push(it2);
    }

    // Dang B: /all/ (.novelslist li).
    var lis = doc.select(".novelslist ul li");
    for (i = 0; i < lis.size(); i++) {
        var li2 = lis.get(i);
        var a2 = li2.select("a").first();
        if (a2 === null) continue;
        var nm2 = cleanText(a2.text());
        if (!nm2) continue;
        var lk2 = toDetailLink(a2.attr("href"));
        if (!lk2 || seen[lk2]) continue;
        seen[lk2] = true;
        var whole = cleanText(li2.text());
        var au2 = "";
        var slash = whole.indexOf("/");
        if (slash !== -1) au2 = cleanText(whole.substring(slash + 1));
        items.push({
            name: nm2,
            link: lk2,
            author: au2,
            cover: "",
            description: "",
            host: siteOrigin()
        });
    }

    if (items.length === 0) {
        return Response.error("Không có dữ liệu tại " + fetchUrl);
    }

    // Chi dang C moi co trang ke (tu tang so trang); dang A/B 1 trang.
    var next = "";
    if (isPagedList(path)) next = String(pageNum + 1);
    return Response.success(items, next);
}
