// helper.js — Ham dung chung cho Bixiange (m.bixiange.top, 笔仙阁).
//
// Site GBK (kiem chung live 2026-11-14): moi trang phai giai ma bang
// res.html("gbk") — doc dung UTF-8 se ra chu rac.
// - Trang chu / : nav 7 the loai hien, 12 slug deu 200.
// - Danh sach /{cat}/, /newest/, /sort/ : item .list li (.cover img[alt]
//   = ten sach; .title a = ten + "(1-728)"; .tips span = "作者：X").
//   20 truyen/trang, phan trang /{section}/index_{N}.html.
// - Chi tiet /{cat}/{id}/ : h1 = ten + "(1-537)"; .info-left .cover img;
//   .descTip span "作者：X" / "分类：X"; .descInfo p = mo ta; khong co
//   marker trang thai (ongoing mac dinh true).
// - Muc luc div.catalog ul li a -> /{cat}/{id}/index/{n}.html, ten 第N节;
//   toan bo TOC tren 1 trang (mau 794 chuong); phan trang TOC dang
//   /{cat}/{id}/index_{N}.html (xem page.js).
// - Chuong /{cat}/{id}/index/{n}.html : #mycontent; ch.1 chua khoi intro
//   (ten + tac gia + 简介) truoc marker 正文卷 — cat bo (xem chap.js);
//   chuong dai tach trang con _{p}.html.
// - Tim kiem: POST /e/search/indexpage.php, tu khoa BAT BUOC encode GBK
//   (POST UTF-8 -> trang 信息提示, 0 ket qua); GET /search/?keyword= hong.
//   Trang 1 chay qua WebView (xem search.js); trang sau
//   /e/search/result/index.php?page=<0-based>&searchid=<id>.
// - Chuong doc DU, KHONG can dang nhap (kiem chung ch.1 + ch.2 truyen mau
//   我的魔法没有上限！: noi dung khop ten truyen, khong phai van ban ghep).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11) + giai
// ma GBK + failover qua mirror.
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter, retry 429/405/503, tu ghi cooldown khi bi chan. Giai ma bang
// htmlGbk() (file gbk.js). Neu domain chinh loi mang/5xx thi thu lan luot
// cac mirror trong MIRROR_LIST (cung pacing).
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchBxDoc(url) {
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
            return { error: rateLimitErrorMessage("Bixiange", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Bixiange", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
            doc = htmlGbk(res.res);
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeDoc(doc)) {
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở m.bixiange.top trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Parser MOT dong truyen trong danh sach (.list li).
// Ten lay tu <img alt> (da sach, khong co hau to "(1-728)"); fallback sang
// text cua link .title a (cat hau to). Bo qua dong khong co ten/trung link.
function parseListItem(li, seen) {
    var a = safeFirst(li.select(".title a"));
    var href = "";
    if (a) href = String(a.attr("href") || "");
    if (!href) {
        var anyA = safeFirst(li.select("a[href]"));
        if (anyA) href = String(anyA.attr("href") || "");
    }
    href = normalizeHref(href);
    if (!href || !STORY_URL_RE.test(href)) return null;
    var link = resolveUrl(href);
    if (seen[link]) return null;

    var name = "";
    var img = safeFirst(li.select(".cover img"));
    if (img) name = cleanText(img.attr("alt"));
    if (!name && a) name = cleanText(a.text());
    name = cleanBookName(name);
    if (!name) return null;

    seen[link] = 1;
    var item = { name: name, link: link, cover: "", host: BASE_URL };
    if (img) {
        var src = cleanText(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
        if (src) {
            if (src.charAt(0) === "/") src = BASE_URL + src;
            item.cover = src;
        }
    }
    var tips = li.select(".tips span");
    for (var i = 0; i < tips.size(); i++) {
        var t = cleanText(tips.get(i).text());
        if (t.indexOf("作者") === 0 && t.length > 3) {
            item.description = t;
            break;
        }
    }
    return item;
}

// Parser ca danh sach truyen tren 1 trang (.list li); fallback quet rong
// cac link truyen khi khong co .list (vd. trang ket qua tim kiem).
function parseListItems(doc) {
    var data = [];
    var seen = {};
    var items = doc.select(".list li");
    var i = 0;
    for (i = 0; i < items.size(); i++) {
        var item = parseListItem(items.get(i), seen);
        if (item) data.push(item);
    }
    if (data.length > 0) return data;
    var links = doc.select("a[href]");
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var href = normalizeHref(a.attr("href") || "");
        if (!href || !STORY_URL_RE.test(href)) continue;
        var link = resolveUrl(href);
        if (seen[link]) continue;
        var name = cleanBookName(a.text());
        if (!name || name.length < 2 || name.length > 60) continue;
        if (LIST_SKIP_NAME_RE.test(name)) continue;
        seen[link] = 1;
        var img = safeFirst(a.select("img"));
        var it = { name: name, link: link, cover: "", host: BASE_URL };
        if (img) {
            var src = cleanText(img.attr("data-src") || img.attr("src"));
            if (src) {
                if (src.charAt(0) === "/") src = BASE_URL + src;
                it.cover = src;
            }
        }
        data.push(it);
        if (data.length >= 30) break;
    }
    return data;
}
