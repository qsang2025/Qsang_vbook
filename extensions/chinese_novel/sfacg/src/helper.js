// helper.js — ham dung chung cua extension SF轻小说 (book.sfacg.com).
//
// - parseBookCard(el): 1 muc sach trong danh sach (trang the loai
//   ul.Comic_Pic_List, trang tag ul.TAG_list, bang ket qua tim kiem
//   table.comic_cover). Lay ten tu strong a (fallback img alt), link tu
//   strong a, bia tu img, mo ta tu link tac gia (neu co) hoac link the
//   loai (neu co).
// - absMediaUrl(href): URL tuyet doi cho anh bia — anh bia nam tren
//   rs.sfacg.com (host tinh rieng cua site) nen KHONG duoc qua ham
//   absUrl() cua config-helpers (ham do viet lai host ve BASE_URL).
//
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// URL tuyet doi cho anh bia / media: giu nguyen host goc khi da la
// URL tuyet doi (rs.sfacg.com...), chi noi BASE_URL khi la duong dan
// tuong doi.
function absMediaUrl(href) {
    if (!href) return "";
    href = String(href).trim();
    if (/^https?:\/\//i.test(href)) return href;
    if (href.indexOf("//") === 0) return "https:" + href;
    if (href.charAt(0) === "/") return siteOrigin() + href;
    return BASE_URL + "/" + href;
}

// 1 muc sach trong danh sach; tra ve null neu khong du ten/link.
function parseBookCard(el) {
    var titleLink = safeFirst(el.select("strong a"));
    if (titleLink === null) titleLink = safeFirst(el.select("a"));
    if (titleLink === null) return null;
    var link = absUrl(titleLink.attr("href"));
    if (!link) return null;
    var name = cleanText(titleLink.text());
    var img = safeFirst(el.select("img"));
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    if (!name) return null;
    var cover = "";
    if (img !== null) cover = absMediaUrl(img.attr("src"));
    var desc = "";
    var authorEl = safeFirst(el.select("a[id*='AuthorLink'], a[href*='/Club/']"));
    if (authorEl !== null) {
        desc = cleanText(authorEl.text());
    } else {
        var catEl = safeFirst(el.select("a[href*='/List/']"));
        if (catEl !== null) desc = cleanText(catEl.text());
    }
    return { name: name, cover: cover, link: link, description: desc, tag: "", host: siteOrigin() };
}
