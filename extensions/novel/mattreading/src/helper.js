// helper.js — Ham dung chung cho MattReading (mattreadingtranslations.com).
//
// Site WordPress dich truyen tieng Anh, 8 truyen (kiem chung live 2026-11-15):
// - Trang /novels/: 8 truyen, moi muc la link + anh bia + trang thai
//   (Complete/Ongoing/Hiatus/Dropped). Link Tyrant la ?page_id=53 (301 ve
//   permalink dep) — ham novelByUrl() anh xa ve URL dep.
// - Trang truyen (type-page): tom tat o div.entry-content p dau + anh bia
//   trong entry-content; muc luc o div#toc-container > table.chapter-table
//   (hang tieu de CHAPTER | DATE OF PUBLICATION, 10 chuong/trang);
//   phan trang .pagination (/page/2/ ... /page/89/ — Tyrant 885 chuong).
// - Trang chuong (type-post, category rieng theo truyen):
//   /<slug>-chapter-<n>/; noi dung o div.entry-content (<p>); cuoi
//   chuong co doan quang cao "–TL Notes–" + patreon/discord (chap.js xoa).
//   Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview
//   (kiem chung ch.1 Tyrant: 139 <p>, 10.087 ky tu, mo dau
//   "I fucking did it!"; ch.1 Slit-Eyed: mo dau "Why am I inside a game?").
// - Chuyen muc /category/<slug>/ (tyrant, sliteyed, doom, sclass,
//   merchant, trait, idle, wolf): 10 bai chuong moi nhat/trang, moi nhat
//   len dau — dung cho tab "chuong moi" cua tung truyen.
// - Tim kiem /?s=<kw>: 10 bai/trang, tron bai chuong that (-chapter-),
//   bai thong bao NEW CHAPTERS / SIDE STORIES (search.js loc bo).
// - Khong co Cloudflare; www 301 ve bare domain nen khong co mirror.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 8 truyen cua site (tu trang /novels/, kiem chung live 2026-11-15).
// cover: anh bia goc (http:// doi thanh https:// khi dung).
var NOVELS = [
    { slug: "tyrant", title: "I Became the Tyrant of a Defense Game", status: "Complete", category: "tyrant", url: "/i-became-the-tyrant-of-a-defense-game/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/08/Tyrant.webp" },
    { slug: "sliteyed", title: "I’m the Slit-Eyed Character at the Academy, but I’m not the Mastermind", status: "Hiatus", category: "sliteyed", url: "/im-the-slit-eyed-character-at-the-academy-but-im-not-the-mastermind/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/08/SlitEyed.webp" },
    { slug: "idle", title: "Idle Mage in the Game’s Academy", status: "Dropped", category: "idle", url: "/idle-mage-in-the-games-academy/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/08/Idle.webp" },
    { slug: "wolf", title: "White Wolves", status: "Complete", category: "wolf", url: "/white-wolves/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/08/WhiteWolves.webp" },
    { slug: "sclass", title: "The S-Classes That I Raised", status: "Ongoing", category: "sclass", url: "/the-s-classes-that-i-raised/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/08/SClass.webp" },
    { slug: "trait", title: "Trait Hoarder", status: "Complete", category: "trait", url: "/trait-hoarder/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2024/09/Trait.webp" },
    { slug: "merchant", title: "The Youngest Son of the Eunhae Merchant Group", status: "Ongoing", category: "merchant", url: "/the-youngest-son-of-the-eunhae-merchant-group/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2025/06/resource-1.jpg" },
    { slug: "doom", title: "Surviving in a Doomed Academy", status: "Ongoing", category: "doom", url: "/surviving-in-a-doomed-academy/", cover: "https://mattreadingtranslations.com/wp-content/uploads/2026/08/Doomed-1.jpg" }
];

// Tim truyen theo URL trang truyen (so sanh duong dan, bo "/" cuoi).
function novelByUrl(url) {
    var p = String(url || "").replace(/^https?:\/\/[^\/]+/, "").replace(/\/+$/, "") + "/";
    var i = 0;
    for (i = 0; i < NOVELS.length; i++) {
        if (NOVELS[i].url === p) return NOVELS[i];
    }
    return null;
}

// Trang truyen co dang /<slug>/ (khong phai /category/, /novels/, /page/).
function isNovelPageUrl(url) {
    return novelByUrl(url) !== null;
}

// Anh bia site co luc dung http:// — doi ve https:// cho nhat quan.
function fixCover(src) {
    var s = String(src || "");
    if (s.indexOf("http://mattreadingtranslations.com/") === 0) {
        return "https://" + s.substring(7);
    }
    return s;
}

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// thu lan luot cac mirror trong MIRROR_LIST khi domain chinh loi.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchMrDoc(url) {
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
            return { error: rateLimitErrorMessage("MattReading", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("MattReading", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// So trang hien tai trong URL dang /page/<N>/ (khong co -> 1).
// Tim o bat cu vi tri nao trong URL (trang tim kiem co dang
// /page/2/?s=<kw> — so trang khong nam o cuoi URL).
function pageNumOf(url) {
    var m = String(url || "").match(/\/page\/(\d+)\//);
    return m ? parseInt(m[1], 10) : 1;
}

// Link trang ke trong .pagination: lay href that cua trang (hien tai + 1),
// neu khong co thi xay tu URL goc. Tra "" khi het trang.
function nextPageHref(doc, listUrl) {
    var cur = pageNumOf(listUrl);
    var links = doc.select(".pagination a");
    var i = 0;
    var maxPage = cur;
    var nextHref = "";
    for (i = 0; i < links.size(); i++) {
        var href = links.get(i).attr("href") || "";
        var m = href.match(/\/page\/(\d+)\//);
        if (m) {
            var n = parseInt(m[1], 10);
            if (n > maxPage) maxPage = n;
            if (n === cur + 1) nextHref = href;
        }
    }
    if (maxPage <= cur) return "";
    if (nextHref) return nextHref;
    // Xay link trang ke: chen /page/<N>/ truoc query string (neu co),
    // vd /page/2/?s=tyrant -> /page/3/?s=tyrant.
    var q = String(listUrl).indexOf("?");
    var path = q === -1 ? String(listUrl) : String(listUrl).substring(0, q);
    var query = q === -1 ? "" : String(listUrl).substring(q);
    path = path.replace(/\/page\/\d+\//, "/").replace(/\/+$/, "") + "/";
    return path + "page/" + (cur + 1) + "/" + query;
}

// Parser danh sach truyen tren /novels/: link + anh bia + trang thai.
// Link Tyrant la ?page_id=53 — anh xa ve permalink dep qua bang NOVELS.
function parseNovelList(doc) {
    var items = [];
    var seen = {};
    var ec = safeFirst(doc.select("div.entry-content"));
    if (ec === null) return items;
    var links = ec.select("a");
    var imgs = ec.select("img");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = a.attr("href") || "";
        var text = cleanText(a.text());
        if (!href || !text) continue;
        // Chi lay link trang truyen (co trong bang NOVELS) hoac ?page_id=53.
        var novel = novelByUrl(href);
        if (novel === null && href.indexOf("page_id=53") === -1) continue;
        if (novel === null) novel = NOVELS[0];
        var link = absUrl(novel.url);
        if (seen[link]) continue;
        seen[link] = true;
        var cover = novel.cover;
        var img = imgs.size() > i ? imgs.get(i) : null;
        if (img !== null) {
            var src = img.attr("src") || "";
            if (src) cover = fixCover(src);
        }
        items.push({
            name: text,
            cover: cover,
            link: link,
            description: "Trạng thái: " + novel.status,
            tag: novel.status,
            host: siteOrigin()
        });
    }
    return items;
}

// Parser danh sach bai viet dang article (trang chu, chuyen muc, tim kiem):
// moi article co h2/h3 > a (ten + link) va co the co anh dai dien.
function parseArticleList(doc) {
    var items = [];
    var seen = {};
    var arts = doc.select("article");
    var i = 0;
    for (i = 0; i < arts.size(); i++) {
        var art = arts.get(i);
        var titleEl = safeFirst(art.select("h2 a, h3 a, .entry-title a"));
        if (titleEl === null) continue;
        var name = cleanText(titleEl.text());
        var href = titleEl.attr("href") || "";
        if (!name || !href) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        seen[link] = true;
        var cover = "";
        var img = safeFirst(art.select("img"));
        if (img !== null) cover = fixCover(img.attr("src") || "");
        var dateEl = safeFirst(art.select("time, .entry-date, .posted-on"));
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: dateEl === null ? "" : cleanText(dateEl.text()),
            tag: "",
            host: siteOrigin()
        });
    }
    return items;
}

// Parser muc luc tren trang truyen: table.chapter-table, bo hang tieu de.
function parseTocRows(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("table.chapter-table tr");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var a = safeFirst(row.select("td a"));
        if (a === null) continue;
        var name = cleanText(a.text());
        var href = a.attr("href") || "";
        if (!name || !href) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        seen[link] = true;
        var date = "";
        var cells = row.select("td");
        if (cells.size() > 1) date = cleanText(cells.get(1).text());
        items.push({ name: name, url: link, description: date });
    }
    return items;
}

// Tach so chuong tu ten ("Chapter 123" hoac "... – Chapter 123").
function chapNum(name) {
    var m = String(name || "").match(/Chapter\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : 0;
}
