// helper.js — Ham dung chung cho ixunshu.net (爱寻书).
//
// - Danh sach the .item (trang chu, trang xep hang, trang the loai,
//   trang ket qua tim kiem): div.image > a + dl > dt > a (ten, link)
//   + dd (mo ta) + div.btm (tac gia / ngay). LUU Y: a CUOI CUNG trong
//   the la link tac gia (/zz/...) nen phai lay dt > a, khong lay a.last()
//   (loi cua base Darkrai9x v1).
// - Danh sach dang li #newscontent li: span.s1 (the loai), span.s2 > a
//   (ten, link), span.s5 (tac gia). Tren trang chu moi li co 3 link
//   (ten, [目录], 最新章节) nen phai lay span.s2 > a.
// - Khong co anh bia that: img luon la /static/default/img/nocover.jpg
//   nen khong tra cover.
// - Trang the loai / xep hang khong co phan trang (khong co .page) —
//   gen.js luon tra next = "".
// - Chi tiet: /xs/<id> — h1 ten, #info > p (tac gia, trang thai,
//   chuong moi, cap nhat), meta description (tom tat that, cat bo phan
//   mo dau "爱寻书提供...内容简介："), .con_top breadcrumb (the loai).
// - Chuong: /xs/<id>/zj/<cid> — h1 "<ten> (N/M)" khi chia trang,
//   noi dung #booktxt (the p), phan trang ?page=N qua .bottem1 下一页.
// - Tim kiem: GET /zhao/?keyword= (form tren trang chu) — tu VM tra
//   trang 验证码; tren may that kiem chung, neu bi chan thi bo search.js.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Lay <id> so cua truyen tu URL dang /xs/<id> hoac /xs/<id>/zj/<cid>;
// tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/xs\/(\d+)(?:\/|$|\?)/);
    return m ? m[1] : "";
}

// Parser MOT the .item (div.image + dl > dt > a + dd + div.btm).
// Bo qua the khong co ten hoac trung link.
function parseItemCard(card, seen) {
    var a = safeFirst(card.select("dl > dt > a"));
    if (a === null) a = safeFirst(card.select("dt > a"));
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    var id = bookId(href);
    if (!id) return null;
    var link = BASE_URL + "/xs/" + id;
    if (seen[link]) return null;
    var name = cleanText(a.text());
    if (!name) return null;
    seen[link] = 1;
    var descParts = [];
    var dd = safeFirst(card.select("dd"));
    if (dd !== null) {
        var d = cleanText(dd.text());
        if (d) descParts.push(d);
    }
    var btm = safeFirst(card.select("div.btm"));
    if (btm !== null) {
        var t = cleanText(btm.text());
        if (t) descParts.push(t);
    }
    return { name: name, link: link, description: descParts.join(" | ") };
}

// Parser MOT dong li trong #newscontent (span.s2 > a la ten).
function parseNewsLi(li, seen) {
    var a = safeFirst(li.select("span.s2 > a"));
    if (a === null) a = safeFirst(li.select("a[href*=\"/xs/\"]"));
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    var id = bookId(href);
    if (!id) return null;
    var link = BASE_URL + "/xs/" + id;
    if (seen[link]) return null;
    var name = cleanText(a.text());
    if (!name || name === "[目录]") return null;
    seen[link] = 1;
    var descParts = [];
    var s1 = safeFirst(li.select("span.s1"));
    if (s1 !== null) {
        var g = cleanText(s1.text());
        if (g) descParts.push(g);
    }
    var s5 = safeFirst(li.select("span.s5"));
    if (s5 !== null) {
        var au = cleanText(s5.text());
        if (au) descParts.push(au);
    }
    return { name: name, link: link, description: descParts.join(" | ") };
}

// Parser toan bo danh sach 1 trang: the .item (uu tien, co tom tat)
// + dong li #newscontent. Dung cho trang chu muc, trang the loai,
// trang xep hang, trang ket qua tim kiem (cung bo cuc .item).
function parseListItems(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".item");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var one = parseItemCard(cards.get(i), seen);
        if (one !== null) items.push(one);
    }
    var lis = doc.select("#newscontent li");
    for (i = 0; i < lis.size(); i++) {
        var two = parseNewsLi(lis.get(i), seen);
        if (two !== null) items.push(two);
    }
    return items;
}

// Cat bo phan mo dau boilerplate cua meta description:
// "爱寻书提供<the loai>小说《<ten>》最新章节全文免费在线阅读，
// 该小说是由<tg>所著。内容简介：<tom tat that>".
function cleanMetaDesc(raw) {
    var s = cleanText(raw);
    var k = s.indexOf("内容简介：");
    if (k !== -1) s = cleanText(s.substring(k + "内容简介：".length));
    return s;
}
