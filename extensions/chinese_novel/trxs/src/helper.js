// helper.js — Ham dung chung cho Trxs (trxs.cc, 同人小说网).
//
// Site GB2312 (kiem chung live 2026-11-13): moi trang phai giai ma bang
// res.html("gbk") — doc dung UTF-8 se ra chu rac.
// - Trang chu /tongren/ : danh sach .books .bk (a[href="/tongren/<id>.html"])
// - The loai: chi co 2 tag index /tags-150-0.html (全本同人) va
//   /tags-151-0.html (连载同人) + bang xep hang /rating/ (1 trang).
// - Chi tiet: /tongren/<id>.html — div.book_info (.pic img[alt] = ten sach,
//   .infos h1 = ten + "(全本)"/"(1-490)", .date span = "作者：X",
//   .infos p = "标签：..." + gioi thieu); muc luc o div.book_list
//   (mot so truyen KHONG co list — dung fallback doc 尾章 o chuong 1).
// - Chuong: /tongren/<id>/<n>.html — div.read_chapterDetail; khoi dau lap
//   lai tieu de/tac gia/gioi thieu truoc noi dung that (xem trimChapter).
// - Tim kiem: form POST /e/search/index.php (keyboard, show=title,
//   classid=0); site luu DB bang GBK nen tu khoa phai encode GBK — trang 1
//   chay qua WebView (xem search.js); site gioi han 1 lan tim / 60 giay.
// - Chuong doc DU, KHONG can dang nhap (kiem chung ch.1 人在木叶，战场收尸十年
//   va ch.1 穿越八年才出道: noi dung dung truyen goc, khong phai van ban ghep
//   nhu cgsdlx, khong preview, khong 401).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Lay <id> so cua truyen tu URL dang /tongren/<id>.html hoac
// /tongren/<id>/<n>.html; tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/tongren\/(\d+)(?:\.html|\/\d+\.html)?/);
    return m ? m[1] : "";
}

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11) + giai
// ma GBK + failover qua mirror.
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter, retry 429/405/503, tu ghi cooldown khi bi chan. Giai ma bang
// htmlGbk() (file gbk.js). Neu domain chinh loi mang/5xx thi thu lan luot
// cac mirror trong MIRROR_LIST (cung pacing).
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchTrxsDoc(url) {
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
            return { error: rateLimitErrorMessage("Trxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Trxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở trxs.cc trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Parser MỘT dong truyen trong danh sach (.books .bk > a[href="/tongren/<id>.html"]).
// Ten sach lay tu <img alt> (da sach, khong co hau to "(1-490)"/"(全本)");
// fallback sang <h3>. Bo qua dong khong co ten hoac trung link.
function parseListItem(a, seen) {
    var href = String(a.attr("href") || "");
    var m = href.match(/^\/tongren\/(\d+)\.html$/);
    if (!m) return null;
    var id = m[1];
    var link = BASE_URL + "/tongren/" + id + ".html";
    if (seen[link]) return null;

    var name = "";
    var img = safeFirst(a.select("img"));
    if (img) {
        var alt = cleanText(img.attr("alt"));
        if (alt) name = alt;
    }
    if (!name) {
        var h3 = safeFirst(a.select("h3"));
        if (h3) name = cleanText(h3.text());
    }
    if (name) name = cleanText(name.replace(/[（(][^）)]*[）)]\s*$/, ""));
    if (!name) return null;

    seen[link] = 1;
    var item = { name: name, link: link, cover: "", host: BASE_URL };
    if (img) {
        var src = cleanText(img.attr("src"));
        if (src && src.indexOf("nocover") === -1) item.cover = absUrl(src);
    }
    var news = safeFirst(a.select(".booknews"));
    if (news) {
        var d = cleanText(news.text());
        if (d) item.description = d;
    } else {
        var p = safeFirst(a.select("p"));
        if (p) {
            var d2 = cleanText(p.text());
            if (d2) item.description = d2;
        }
    }
    return item;
}

// Parser ca danh sach truyen tren 1 trang (.books .bk a[href*="/tongren/"]).
function parseListItems(doc) {
    var data = [];
    var seen = {};
    var sel = doc.select('.books .bk a[href*="/tongren/"]');
    for (var i = 0; i < sel.size(); i++) {
        var item = parseListItem(sel.get(i), seen);
        if (item) data.push(item);
    }
    return data;
}

// Cat khoi dau lap lai trong div.read_chapterDetail: tieu de sach, "作者：X",
// "简介：..." truoc noi dung that. Noi dung that bat dau o doan dau tien co
// dang "第N章 ..." (vd "第1章 你老爹埋在哪"); neu khong co marker thi bat dau
// o doan dau tien khong phai header.
// Tra ve { html: "...", title: "第N章 ..." } — title rong khi khong tim
// duoc marker (khi do goi ham lay tu div.read_chapterName).
function trimChapter(html) {
    var parts = String(html || "").split("</p>");
    var texts = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        texts.push(cleanText(parts[i].replace(/<[^>]*>/g, "")));
    }
    // Bo cac doan header o dau: rong, chua "作者：" / "作者:", bat dau bang
    // "简介：" / "简介:", hoac ket thuc bang " 著" (dang "<ten> <tac gia> 著").
    var start = 0;
    while (start < texts.length) {
        var t = texts[start];
        if (!t) { start++; continue; }
        if (t.indexOf("作者：") !== -1 || t.indexOf("作者:") !== -1) { start++; continue; }
        if (t.indexOf("简介：") === 0 || t.indexOf("简介:") === 0) { start++; continue; }
        if (/ 著$/.test(t) && t.length < 40) { start++; continue; }
        break;
    }
    // Tim marker "第N章 ..." trong cac doan con lai.
    var marker = -1;
    var title = "";
    for (i = start; i < texts.length; i++) {
        if (/^第\s*\d+\s*[章節节]/.test(texts[i])) { marker = i; title = texts[i]; break; }
    }
    if (marker !== -1) start = marker;
    var out = [];
    for (var k = start; k < parts.length; k++) out.push(parts[k]);
    return { html: out.join("</p>"), title: title };
}

// Lay tieu de chuong tu div.read_chapterName ("<ten sach> 第N章 作者：X"):
// cat bo ten sach o dau va phan tac gia o cuoi.
function chapterNameTitle(doc) {
    var el = safeFirst(doc.select(".read_chapterName"));
    if (!el) return "";
    var lines = cleanText(el.text()).split("\n");
    var first = cleanText(lines[0] || "");
    if (!first) return "";
    var m = first.match(/第\s*\d+\s*[章節节].*$/);
    if (m) return cleanText(m[0]);
    return "";
}
