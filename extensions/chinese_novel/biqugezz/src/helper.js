// helper.js — Ham dung chung cho Biqugezz (biqugezz.com).
//
// Site HTML tinh phia server, ma GBK (kiem chung live 2026-11-15):
// - Trang chu 200, 27 KB: #gengxin (30 muc moi cap nhat) + #zuixin
//   (30 muc moi len ke). Khong co anh bia o danh sach.
// - Trang the loai /<cat>.html: #fengtui .bookbox, 30 muc/trang, phan
//   trang /<cat>-<N>.html (xuanhuan co 330 trang). Khong co anh bia.
// - Chi tiet /go/<id>/: meta og:novel:* day du (ten, tac gia, the loai,
//   trang thai, chuong moi, gio cap nhat) + og:image lam bia.
// - Muc luc: #list-chapterAll dd a — DAY DU tren 1 trang (vd 81 chuong),
//   href tuong doi dang "1.html" / "13036696.html" (giai theo URL chi
//   tiet, KHONG dung absUrl mac dinh — no ghep ve goc site).
// - Chuong /go/<id>/<N>.html: noi dung o .readcontent, chia trang
//   (1/2): a#linkNext "下一页" -> "<N>_<M>.html"; trang cuoi cung
//   a#linkNext la "下一章" (dung vong lap). Chuong doc DU, KHONG can
//   dang nhap, khong VIP, khong preview (kiem chung ch.1 凡骨:
//   mo dau "“砰、砰砰……”呼啸的寒风中，一个衣着单薄的小男孩…" dung
//   noi dung goc, khong phai van ban ghep nhu cgsdlx).
// - Tim kiem: POST /modules/article/search.php, searchkey MA GBK +
//   action=login. 1 ket qua -> 302 thang ve trang chi tiet; nhieu ket
//   qua -> #fengtui .bookbox (30 muc, khong thay phan trang).
//   POST UTF-8 tra trang rong (0 ket qua) — phai dung WebView submit
//   form cua chinh site de trinh duyet encode GBK (tien le bixiange).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11),
// giai ma GBK. Duong chinh: pacedFetch() (file rate-limit.js) — kiem
// tra cooldown, nghi jitter, retry 429/405/503, tu ghi cooldown khi bi
// chan. Neu domain chinh loi mang/5xx thi thu lan luot cac mirror trong
// MIRROR_LIST (cung pacing).
// Tra ve { doc: Document} khi thanh cong, hoac { error: "tieng Viet"}.
function fetchBqDoc(url) {
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
            return { error: rateLimitErrorMessage("Biqugezz", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Biqugezz", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
            doc = res.res.html("gbk");
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

// Giai link chuong tuong doi dang "1.html" theo URL trang chi tiet
// (vd https://www.biqugezz.com/go/97746/ + "13036696.html").
// absUrl() dung chung ghep ve goc site nen KHONG dung duoc o day.
function resolveChapUrl(detailUrl, href) {
    if (!href) return "";
    href = String(href);
    if (/^https?:\/\//i.test(href)) return normalizeUrl(href);
    if (href.charAt(0) === "/") return siteOrigin() + href;
    var base = detailUrl;
    if (base.slice(-1) !== "/") base = base + "/";
    return base + href;
}

// Parser 1 o truyen trong div.bookbox (trang the loai / ket qua tim kiem).
// Cau truc that (kiem chung live 2026-11-15):
//   div.p10 > span.num + div.bookinfo > h4.bookname > a (ten + link)
//   div.author (tac gia) / div.cat (chuong moi) / div.update (gioi thieu)
// Trang danh sach KHONG co anh bia — cover lay o detail (og:image).
function parseBookBox(el) {
    var linkEl = safeFirst(el.select("h4.bookname a"));
    if (linkEl === null) linkEl = safeFirst(el.select("h4 a"));
    if (linkEl === null) return null;
    var link = absUrl(linkEl.attr("href"));
    if (!link) return null;
    var name = cleanText(linkEl.text());
    if (!name) return null;
    var author = "";
    var authorEl = safeFirst(el.select("div.author"));
    if (authorEl !== null) author = cleanText(authorEl.text()).replace(/^作者：/, "");
    var desc = author;
    var updateEl = safeFirst(el.select("div.update"));
    if (updateEl !== null) {
        var intro = cleanText(updateEl.text()).replace(/^简介：/, "");
        if (intro) desc = author ? author + " — " + intro : intro;
    }
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        host: siteOrigin()
    };
}

// Parser ca danh sach #fengtui .bookbox: duyet cac o, bo trung theo link.
function parseBookBoxes(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("#fengtui .bookbox");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = parseBookBox(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}
