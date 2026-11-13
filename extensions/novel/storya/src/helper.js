// helper.js — Ham dung chung cho Storya (storya.click).
//
// Site Next.js tieng Viet, SSR day du (khong can giai ma GBK, khong can
// WebView). Port tu MeoU storya v7 (fork tren dia, src doc duoc).
// - Trang chu: https://storya.click/ la trang chon ngon ngu; noi dung
//   tieng Viet o /vi (co /en song song). Trang chu tieng Viet /vi co link
//   toi /vi/stories, /vi/genres, /vi/rankings, /vi/search.
// - Danh sach: /vi/stories?page=N (20 truyen/trang, rel=next); sap xep
//   ?sort=reads|rating|title. The loai: /vi/genres/<slug>?page=N.
//   The loai: /vi/genres (94 the loai, tieu de kem "N truyen").
// - Tim kiem: GET /vi/search?q=<kw> (khong phan trang that — &page=N tra
//   lai cung ket qua; chi tra ket qua khi go CO DAU, go khong dau tra
//   ket qua mo/khong lien quan; tu khoa vo nghia tra rong).
// - Chi tiet: /vi/stories/<slug>; tieu de "[Toi Chuong N] Full
//   (Hoan Thanh)" hoac dang cap nhat; meta description co dang "Doc
//   truyen <ten> full online mien phi, N chuong, tac gia <ten>, the loai
//   ..."; bia og:image (/media/covers/...); the loai link /vi/genres/...
// - Muc luc: trang chi tiet liet ke ~100 chuong/trang, phan trang
//   ?cpage=N#chapters (link a[rel="next"]); ?order=asc cho thu tu tang
//   dan (chuong 1 truoc). Moi dong chuong: span so chuong + span ten
//   chuong + luot doc + ngay. Can bo trung (nut "Doc tu dau" trung link
//   chuong 1) va bo feed.xml.
// - Chuong: /vi/stories/<slug>/<chapter-slug>; noi dung DU trong
//   div.reader-content > p.whitespace-pre-line; tieu de chuong trong
//   <title> ("<ten truyen> Chuong N: <ten chuong> | Storya").
//   KHONG can dang nhap, khong preview, khong 401, khong VIP (kiem
//   chung tu VM 2026-11-13: ch.1296 Chu Than Ngu Hi, 9963 ky tu, mo dau
//   "Long Tinh da dung moi quan he de tim Tran Thuat..."; ch.1 Cuoc song
//   buong tha o The gioi Thien Ma, mo dau "Ngay xuan, huong thom lan
//   toa khap nui xa..." — deu dung truyen goc, ten nhan vat nhat quan).
// - Mirror: www.storya.click tra 200, cung noi dung (kiem chung
//   2026-11-13). Base Klein storya v2 dung API /api/v1 da chet (404)
//   — bo, khong dung.
// - Site hau nhu toan truyen Hoan Thanh (3 truyen mau kiem tra deu
//   Hoan Thanh); duong ongoing=true (chu "Dang cap nhat" trong main)
//   chua gap that ngoai doi — ghi nhan la diem mo.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var SITE_PREFIX = "/vi";
var STORY_PATH_RE = /^\/vi\/stories\/([^\/\?#]+)$/;

// Lay slug truyen tu URL dang /vi/stories/<slug> (co the kem
// /<chapter-slug> hoac ?order=...); tra "" khi khong nhan ra.
function extractSlug(url) {
    var m = /\/(?:vi\/)?stories\/([^\/\?#]+)/.exec(String(url || ""));
    if (m) return m[1];
    return String(url || "").replace(/^\/+/, "").replace(/\/+$/, "");
}

// Dua URL bat ky cua site ve dang dung BASE_URL hien tai (doi domain
// trong cai dat van chay duoc). URL ngoai site tra nguyen.
function toSiteUrl(url) {
    var u = String(url || "");
    if (!u) return "";
    if (u.indexOf("http") === 0) {
        return u.replace(/^https?:\/\/[^\/]+/, BASE_URL);
    }
    if (u.charAt(0) === "/") return BASE_URL + u;
    return u;
}

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11) +
// failover qua mirror (www.storya.click). Duong chinh: pacedFetch()
// (file rate-limit.js) — kiem tra cooldown, nghi jitter, retry
// 429/405/503, tu ghi cooldown khi bi chan. Giai ma UTF-8 mac dinh.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchStoryaDoc(url) {
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
            return { error: rateLimitErrorMessage("Storya", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Storya", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
            } else {
                lastError = "Không tải được trang (lỗi mạng): " + url;
            }
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
        if (isChallengeDoc(doc)) {
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở storya.click trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Parser MỘT trang danh sach truyen: cac link a[href*="/vi/stories/"]
// (moi truyen 1 link co h2/h3 hoac img alt lam ten). Bo trung theo link.
function parseStories(doc) {
    if (!doc) return [];
    var links = doc.select('a[href*="/vi/stories/"]');
    var stories = [];
    var seen = {};
    for (var i = 0; i < links.size(); i++) {
        var link = links.get(i);
        var href = String(link.attr("href") || "");
        var match = STORY_PATH_RE.exec(href);
        if (!match || seen[match[1]]) continue;
        seen[match[1]] = true;
        var name = cleanText(link.select("h2").text()) || cleanText(link.select("h3").text());
        if (!name) name = cleanText(link.select("img").attr("alt")) || cleanText(link.text());
        if (!name) continue;
        var image = safeFirst(link.select("img"));
        var cover = "";
        if (image) {
            cover = String(image.attr("src") || "");
            var srcset = String(image.attr("srcset") || "");
            if (srcset) {
                var firstSource = srcset.split(",")[0].trim().split(/\s+/)[0];
                if (firstSource) cover = firstSource;
            }
        }
        var description = cleanText(link.select("p").text());
        stories.push({
            name: name,
            link: toSiteUrl(href),
            host: BASE_URL,
            cover: cover ? toSiteUrl(cover) : "",
            description: description
        });
    }
    return stories;
}

// So trang ke tiep tu link a[rel="next"] (href ?page=N hoac
// ?cpage=N); khong co => "" (het trang).
function getNextPage(doc) {
    if (!doc) return "";
    var next = safeFirst(doc.select('a[rel="next"]'));
    if (!next) return "";
    var href = String(next.attr("href") || "");
    var match = /[?&](?:page|cpage)=(\d+)/.exec(href);
    return match ? match[1] : "";
}
