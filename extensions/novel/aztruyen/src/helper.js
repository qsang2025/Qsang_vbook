// helper.js — Ham dung chung cho AzTruyen (aztruyen.top).
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
// Site aztruyen.top (kiem chung live 2026-11-11): HTML tinh, khong
// Cloudflare; 28 the loai; trang chu co 2 muc trong 2 div.row.storylist
// (0 = "Top Truyện Hay", 1 = "Truyện mới cập nhật", moi muc 12 truyen,
// khong phan trang); trang the loai 20 truyen/trang, phan trang ?page=N
// (nut "›" trong div.pagination-control ul.page); moi hang truyen la
// div.col-sm-12.col-md-6.story (anh bia a.thumbnail img[data-src], tieu
// de h2 a, mo ta p.crop-text-2.desc); trang chi tiet `/<slug>-<id-so>/`
// co the loai that o p.story_categories a[itemprop=genre], trang thai o
// p.story_completed ("Hoàn thành" / "Đang cập nhật"), tac gia that o dong
// dau mo ta ("Tác giả: ...", neu co), trang thai o dong "Tình Trạng:"
// trong mo ta (du phong p.story_completed), muc luc trong div#chapters
// ul.chapters thu 2 ("Danh sách chương", giu nguyen thu tu DOM, khong
// sap theo so chuong — truyen nhieu quyen danh so lai theo quyen;
// truyen RAT DAI co the chi hien 200 chuong moi nhat, VD 800 chuong
// chi hien 601–800, truyen 249 chuong hien du; site khong co cach lay
// chuong cu hon, nut prev o chuong dau danh sach bi vo hieu hoa)
// li.listc a (URL chuong dang /chuong-N-<tieu-de>-<id>/,
// /part-N-<id>/, ca dang co tien to quyen /q-N-chuong-N-...-/);
// chuong trong `<div class="chapter-content">` (cac doan <p>), tieu de o
// h2.chapter-title.
// TIM KIEM KHONG CO: tim kiem cua chinh site dang hong hoan toan
// (kiem chung live 2026-11-11) — GET /tim-kiem/<tu-khoa> tra trang loi
// "Trang lỗi hoặc không có kết quả tìm kiếm" voi MOI tu khoa thu (ke ca
// tu khoa site tu ghi trong "Tìm kiếm gần đây"), ca khi co cookie phien
// + Referer; POST / voi search_q tra ve trang chu khong loc; khong co
// endpoint AJAX/goi y nao trong JS cua site (chi co redirect ve
// /tim-kiem/<tu-khoa>); cung hong nhu vay tren truyen247.pro (cung mau).
// Vi vay extension KHONG co search.js / khong khai bao khoa search
// trong plugin.json (theo create mode: drop script key site that su
// khong ho tro). Duyet truyen bang Trang chu / The loai.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchAzDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("AzTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("AzTruyen", pacedHostOf(url), res.cooldownRemainingMs) };
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

// Parser MOT hang truyen div.col-sm-12.col-md-6.story thanh doi tuong
// truyen { name, cover, link, description, tag, host } hoac null.
//   - Ten + link: h2 a (title attr, du phong text).
//   - Bia: a.thumbnail img[data-src] (ban day du) hoac src (ban nho
//     images-135x203 tren trang chu; tren trang the loai src da la ban day du).
//   - Mo ta: p.crop-text-2.desc (mo ta rut gon cua truyen).
//   - Tag: ten nguoi dang (a[rel=author] trong hang) — hien thi de phan
//     biet cac ban dang lai cung ten truyen.
function parseBookRow(row) {
    var titleEl = row.select("h2 a").first();
    if (titleEl === null) return null;
    var href = titleEl.attr("href") || "";
    var name = cleanText(titleEl.attr("title")) || cleanText(titleEl.text());
    if (!href || !name) return null;

    var cover = "";
    var img = safeFirst(row.select("a.thumbnail img"));
    if (img === null) img = safeFirst(row.select("img"));
    if (img !== null) {
        cover = img.attr("data-src") || img.attr("src") || "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
    }

    var description = "";
    var descEl = row.select("p.crop-text-2.desc").first();
    if (descEl !== null) description = cleanText(descEl.text());

    var tag = "";
    var authorEl = row.select("a[rel=author]").first();
    if (authorEl !== null) tag = cleanText(authorEl.text());

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: description,
        tag: tag,
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho home/genre).
// sectionIndex: -1 = lay tat ca hang tren trang; 0/1 = chi lay hang trong
// div.row.storylist thu sectionIndex (trang chu co 2 muc: 0 = "Top Truyện
// Hay", 1 = "Truyện mới cập nhật"). Tra ve mang truyen (dedupe theo link).
function parseBookList(doc, sectionIndex) {
    var items = [];
    var seen = {};
    var rows = null;
    if (sectionIndex === 0 || sectionIndex === 1) {
        var sections = doc.select("div.row.storylist");
        if (sectionIndex >= sections.size()) return items;
        rows = sections.get(sectionIndex).select("div.col-sm-12.col-md-6.story");
    } else {
        rows = doc.select("div.col-sm-12.col-md-6.story");
    }
    rows.forEach(function (row) {
        var item = parseBookRow(row);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung phan trang
// `?page=N` trong div.pagination-control ul.page; nut "›" tro toi trang
// sau, nut "»" tro toi trang cuoi (khong dung).
function azNextPage(doc) {
    var nextUrl = "";
    doc.select(".pagination-control ul.page a").forEach(function (el) {
        if (cleanText(el.text()) === "›") {
            nextUrl = el.attr("href") || "";
        }
    });
    nextUrl = cleanText(nextUrl);
    if (!nextUrl || nextUrl === "#") return "";
    if (nextUrl.indexOf("http") === 0) return nextUrl;
    return absUrl(nextUrl);
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
// nhat quan giua cac cho). Uu tien: nhieu tu nhat, roi nhieu chu hoa nhat.
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
