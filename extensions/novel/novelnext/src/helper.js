// helper.js — Ham dung chung cho NovelNext (novelnext.me).
//
// Site aggregator truyen dich tieng Anh, 8.091 truyen (kiem chung live
// 2026-11-15):
// - Trang chu: 3 muc SSR — Hot Novel (JS render), Latest Release, Novel
//   Completed; nav co 4 trang danh sach: /dayvisit/ (Latest Release),
//   /allvisit/ (Hot Novel), /full.html (Completed), /monthvisit/ (Most
//   Popular). Moi trang 20 truyen, phan trang ?page=N.
// - The loai: /genre/<Ten>/ (55 the loai, so luong trong nav dropdown);
//   trang truyen dung link /tag/<slug>/ (cung dang danh sach 20/trang).
//   10 the loai nguoi lon BI LOC khoi genre.js: Adult, Mature, Smut,
//   Ecchi, Yaoi, Yuri, Gender Bender, Shounen Ai, Shoujo Ai, Lgbt+
//   (manifest nsfw: true). Harem giu lai (tien le readernovel).
// - Tim kiem: API chinh thuc GET /search/api?keyword=<q>&limit=20&page=<n>
//   tra JSON {success, hits, total, page, limit} — hits co book_url,
//   articlename, author, genres, lastchapter, fullflag. Tim kiem theo
//   tu khoa (fuzzy): "this world" tra 79 ket qua.
// - Trang truyen /novelnext/<slug>/: meta og:novel:* (author, genre,
//   status, last chapter), anh bia img.lazy data-src
//   /files/image/<slug>.jpg, mo ta div.desc-text, muc luc day du trong
//   #tab-chapters (430 chuong — ca truyen 1.503 chuong cung 1 trang,
//   khong phan trang, khong can page.js).
// - Trang chuong /novelnext/<slug>/chapter-<n>: NOI DUNG CHUA Kiem
//   chung tu VM — Cloudflare tra 429 cho moi request toi duong /chapter-
//   tu IP datacenter tu 2026-11-15 ~14:44 (ke ca desktop UA, ke ca
//   ?ref=, ke ca truyen khac). Rescan #9 da kiem chung ch.1 DAY DU
//   (135 <p>, 60 KB, mo dau "Welcome... zi... watch Donghai News...").
//   chap.js dung cascade selector phong thu; test tren may that se
//   quyet dinh.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview
//   (theo rescan #9 + khong co marker khoa nao tren trang truyen).
// - Khong co Cloudflare challenge tren trang thuong (chi rate-limit
//   429); www chua kiem chung nen khong co mirror.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 44 the loai giu lai (sau khi loc 10 the loai nguoi lon). input la
// duong dan day du tren site (nav dropdown dung dang nay).
var GENRES = [
    { title: "Webnovel", input: "/genre/Webnovel/" },
    { title: "Fantasy", input: "/genre/Fantasy/" },
    { title: "Systemflow", input: "/genre/Systemflow/" },
    { title: "Action", input: "/genre/Action/" },
    { title: "Romance", input: "/genre/Romance/" },
    { title: "Adventure", input: "/genre/Adventure/" },
    { title: "Comedy", input: "/genre/Comedy/" },
    { title: "Harem", input: "/genre/Harem/" },
    { title: "Urban", input: "/genre/Urban/" },
    { title: "Slice of Life", input: "/genre/Slice+of+Life/" },
    { title: "Official Circles", input: "/genre/Official+Circles/" },
    { title: "Science fiction", input: "/genre/Science+fiction/" },
    { title: "Drama", input: "/genre/Drama/" },
    { title: "Mystery", input: "/genre/Mystery/" },
    { title: "Supernatural", input: "/genre/Supernatural/" },
    { title: "Reincarnation", input: "/genre/Reincarnation/" },
    { title: "Game", input: "/genre/Game/" },
    { title: "Martial Arts", input: "/genre/Martial+Arts/" },
    { title: "Sci-fi", input: "/genre/Sci-fi/" },
    { title: "Psychological", input: "/genre/Psychological/" },
    { title: "School Life", input: "/genre/School+Life/" },
    { title: "Eastern", input: "/genre/Eastern/" },
    { title: "Xianxia", input: "/genre/Xianxia/" },
    { title: "Historical", input: "/genre/Historical/" },
    { title: "Other", input: "/genre/Other/" },
    { title: "Tragedy", input: "/genre/Tragedy/" },
    { title: "Xuanhuan", input: "/genre/Xuanhuan/" },
    { title: "Shounen", input: "/genre/Shounen/" },
    { title: "Josei", input: "/genre/Josei/" },
    { title: "Seinen", input: "/genre/Seinen/" },
    { title: "Horror", input: "/genre/Horror/" },
    { title: "Fan-Fiction", input: "/genre/Fan-Fiction/" },
    { title: "Isekai", input: "/genre/Isekai/" },
    { title: "Wuxia", input: "/genre/Wuxia/" },
    { title: "Shoujo", input: "/genre/Shoujo/" },
    { title: "Sports", input: "/genre/Sports/" },
    { title: "Magic", input: "/genre/Magic/" },
    { title: "Mecha", input: "/genre/Mecha/" },
    { title: "Litrpg", input: "/genre/Litrpg/" },
    { title: "System", input: "/genre/System/" },
    { title: "Video games", input: "/genre/Video+games/" },
    { title: "Anime & comics", input: "/genre/Anime+%26+comics/" },
    { title: "Magical realism", input: "/genre/Magical+realism/" },
    { title: "Thriller", input: "/genre/Thriller/" }
];

// Anh bia theo slug: /files/image/<slug>.jpg (mau kiem chung:
// this-world-is-terrible.jpg, the-martial-emperor-with-dragon-blood-3.jpg).
function coverForSlug(slug) {
    var s = String(slug || "").replace(/^\/+|\/+$/g, "");
    if (!s) return "";
    return siteOrigin() + "/files/image/" + s + ".jpg";
}

// Lay slug truyen tu URL trang truyen /novelnext/<slug>/.
function slugOf(url) {
    var m = String(url || "").match(/\/novelnext\/([^\/\?#]+)/);
    return m ? m[1] : "";
}

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// thu lan luot cac mirror trong MIRROR_LIST khi domain chinh loi.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchNnDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var res = null;
        try {
            res = pacedFetch(candidates[i], {});
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!res) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (res.error === "cooldown") {
            return { error: rateLimitErrorMessage("NovelNext", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("NovelNext", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
                continue;
            }
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        var doc = null;
        try {
            doc = res.res.html();
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeText(doc.html())) {
            lastError = "Trang đang hiện kiểm tra Cloudflare, thử lại sau: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Fetch 1 JSON API (search API) co pacing; tra ve { json: Object }
// hoac { error: "tieng Viet" }.
function fetchNnJson(url) {
    var res = null;
    try {
        res = pacedFetch(url, { headers: { "Accept": "application/json" } });
    } catch (e) {
        return { error: "Không tải được kết quả tìm kiếm (lỗi mạng)." };
    }
    if (!res) return { error: "Không tải được kết quả tìm kiếm." };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("NovelNext", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("NovelNext", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        return { error: "Không tải được kết quả tìm kiếm (HTTP " + st + ")." };
    }
    var text = "";
    try {
        text = res.res.text();
    } catch (e2) {
        return { error: "Không đọc được kết quả tìm kiếm." };
    }
    var parsed = null;
    try {
        parsed = JSON.parse(text);
    } catch (e3) {
        return { error: "Kết quả tìm kiếm không đúng định dạng." };
    }
    return { json: parsed };
}

// Parser 1 trang danh sach (.list-novel .row): anh bia data-src,
// tieu de + link, tac gia, chuong moi nhat (lam description).
// Tra ve mang item {name, cover, link, description, tag}.
function parseNovelList(doc) {
    var items = [];
    var rows = doc.select(".list-novel .row");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var titleEl = safeFirst(row.select("h3.novel-title a"));
        if (titleEl === null) continue;
        var link = titleEl.attr("href");
        var name = cleanText(titleEl.text());
        if (!link || !name) continue;
        var img = safeFirst(row.select("img.cover"));
        var cover = "";
        if (img !== null) {
            cover = img.attr("data-src") || img.attr("src") || "";
            if (cover) cover = absUrl(cover);
        }
        var authorEl = safeFirst(row.select(".author"));
        var author = authorEl === null ? "" : cleanText(authorEl.text());
        var lastEl = safeFirst(row.select(".col-xs-2 a"));
        var last = lastEl === null ? "" : cleanText(lastEl.text());
        var desc = "";
        if (author) desc = author;
        if (last) desc = desc ? desc + " — " + last : last;
        items.push({
            name: name,
            cover: cover,
            link: absUrl(link),
            description: desc,
            tag: ""
        });
    }
    return items;
}

// Token trang ke cua trang danh sach: href cua li.next (khong phai
// "disabled"); tra "" khi het trang.
function nextPageHref(doc, currentUrl) {
    var nextEl = safeFirst(doc.select("ul.pagination li.next a"));
    if (nextEl === null) return "";
    var li = doc.select("ul.pagination li.next");
    var cls = li.attr("class") || "";
    if (cls.indexOf("disabled") !== -1) return "";
    var href = nextEl.attr("href");
    if (!href) return "";
    return absUrl(href);
}
