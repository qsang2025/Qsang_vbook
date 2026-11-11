// helper.js — Ham dung chung cho Metruyenhotvn (metruyenhotvn.com).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day (co che tai file khong de quy). Script nao
// dung helper nay phai tai truoc theo thu tu:
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file rate-limit.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
//
// Site metruyenhotvn.com (kiem chung live 2026-11-11): Laravel, HTML tinh,
// khong Cloudflare; 46 the loai; danh sach dung `table.list-story-show`
// (moi hang <tr>: anh bia td.image, tieu de h3.rv-home-a-title, chuong
// moi nhat td.chap.pc), phan trang `?page=N` (nut li.next); tim kiem
// THAT la API goi y GET /ajax/suggest-story?q=<tu khoa> tra JSON
// [{name, url}] (form /tim-truyen?q= tra ve trang chu rong — KHONG dung);
// muc luc day du qua API GET /ajax/list-chapter?story=<slug>&chapter=1
// tra JSON {status, html} voi <option value="/slug/chuong-N/">N</option>
// (trang chi tiet chi hien ~55 chuong moi nhat); chuong trong
// `<div class="chapter-c">` (cac doan <p>).

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchMthDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Metruyenhotvn", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Metruyenhotvn", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = docFromResponse(res.res, url);
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    return { doc: doc };
}

// Fetch 1 API JSON co pacing (tim kiem suggest-story, muc luc list-chapter).
// Tra ve { text: <body> } khi HTTP 2xx, hoac { error: "tieng Viet" }.
function fetchMthText(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được dữ liệu: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Metruyenhotvn", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Metruyenhotvn", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được dữ liệu (HTTP " + st + "): " + url };
        return { error: "Không tải được dữ liệu (lỗi mạng): " + url };
    }
    var text = "";
    try {
        text = res.res.text();
    } catch (e2) {
        return { error: "Không đọc được dữ liệu: " + url };
    }
    return { text: text };
}

// Parser MOT hang truyen <tr> trong table.list-story-show thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: h3.rv-home-a-title a (title attr, du phong text).
//   - Bia: td.image img[data-src] (lazyload) hoac src.
//   - Mo ta: chuong moi nhat (td.chap.pc a, VD "Chương 798").
//   - Tag: diem danh gia (.rate, VD "9.4/10").
function parseBookRow(row) {
    var titleEl = row.select("h3.rv-home-a-title a").first();
    if (titleEl === null) return null;
    var href = titleEl.attr("href") || "";
    var name = cleanText(titleEl.attr("title")) || cleanText(titleEl.text());
    if (!href || !name) return null;

    var cover = "";
    var img = row.select("td.image img").first();
    if (img !== null) {
        cover = img.attr("data-src") || img.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var description = "";
    var chapEl = safeFirst(row.select("td.chap.pc a"));
    if (chapEl === null) chapEl = safeFirst(row.select("td.chap a"));
    if (chapEl !== null) description = cleanText(chapEl.text());

    var tag = "";
    var rateEl = row.select(".rate").first();
    if (rateEl !== null) tag = cleanText(rateEl.text());

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: description,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho home/genre/search-duyet).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    doc.select("table.list-story-show tr").forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung phan trang
// `?page=N` trong div.pagination; nut li.next tro toi trang sau.
function mthNextPage(doc) {
    var nextEl = doc.select(".pagination li.next a").first();
    if (nextEl === null) return "";
    var nxt = nextEl.attr("href") || "";
    nxt = cleanText(nxt);
    if (!nxt || nxt === "#") return "";
    if (nxt.indexOf("http") === 0) return nxt;
    return absUrl(nxt);
}

// Lay slug truyen tu URL chi tiet ("/long-than-thuong-co/" -> "long-than-thuong-co").
function storySlug(url) {
    var u = String(url || "").replace(/[#?].*$/, "").replace(/\/+$/, "");
    var parts = u.split("/");
    var slug = parts[parts.length - 1] || "";
    if (slug.indexOf("metruyenhotvn.com") !== -1) return "";
    return slug;
}

// Viet hoa chu cai dau moi tu ("tien hiep" -> "Tiên Hiệp").
function titleCaseVi(text) {
    var words = cleanText(text).split(/\s+/);
    var out = [];
    var i = 0;
    for (i = 0; i < words.length; i++) {
        var w = words[i];
        if (!w) continue;
        out.push(w.charAt(0).toUpperCase() + w.slice(1));
    }
    return out.join(" ");
}

// Chon ten the loai dep nhat trong cac text cung 1 slug (site viet khong
// nhat quan giua cac cho: "Tiên Hiệp" / "Tiên hiệp").
// Uu tien: nhieu tu nhat, roi nhieu chu hoa nhat.
function bestGenreText(texts) {
    var best = "";
    var bestWords = 0;
    var bestCaps = 0;
    var i = 0;
    for (i = 0; i < texts.length; i++) {
        var t = cleanText(texts[i]);
        if (!t || t.length < 2) continue;
        var words = t.split(/\s+/).length;
        var caps = 0;
        var j = 0;
        for (j = 0; j < t.length; j++) {
            var ch = t.charAt(j);
            if (ch === ch.toUpperCase() && ch !== ch.toLowerCase()) caps++;
        }
        if (words > bestWords || (words === bestWords && caps > bestCaps)) {
            best = t;
            bestWords = words;
            bestCaps = caps;
        }
    }
    if (!best) return "";
    return titleCaseVi(best);
}
