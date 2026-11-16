// helper.js — Ham dung chung cho fuxsb.com (腐小说).
//
// - Danh sach: .list_article ul li > h2 a (ten + " 作者：X"), p.desc
//   (mo ta), .like .time (ngay) + .like .click (tac gia). Khong co anh
//   bia tren site (chi co logo /img/logo.png) — list/detail khong co
//   cover (tien le sjks88/powanjuan/qbtr).
// - Phan trang danh muc: /<cat>/, /<cat>/list_2.html, ...; tag:
//   /tags-<id>-0.html, /tags-<id>-1.html, ...; ca hai deu co link
//   "下一页" trong div.dede_pages — nextFxPage lay href do.
// - Trang chi tiet: h1 ten, .tbtls (tac gia + ngay + tag), meta
//   description (mo ta), div.tuijian_box (推荐文章 + 作者部分作品 —
//   suggests), .con_box div (noi dung trang: div text dai nhat).
// - Tong so trang cua sach: chu "共<N>页" trong vung phan trang cua
//   trang chi tiet; fallback: so lon nhat tu link _<n>.html.
// - Tim kiem: GET /e/search/?searchget=1&keyboard=<kw>&show=title tra
//   302 ve /e/search/result/?searchid=<id>; cac trang sau:
//   /e/search/result/index.php?page=<0-based>&searchid=<id>.
//   POST /e/search/index.php truc tiep tu VM TREO (tarpit IP datacenter
//   — giong sjks88/qbtr) nen chi dung WebView POST lam du phong khi
//   GET that bai (xem search.js).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 23 tag tren trang chu (kiem chung live 2026-11-16: ca 23 URL
// /tags-<id>-0.html deu tra 200, giu NGUYEN thu tu tren trang chu).
// Base Moleys v7 co ~50 tag nhung 1 tag ten mojibake (tags-234) va
// nhieu tag khong co tren trang chu — chi lay 23 tag da kiem chung nay.
var GENRES = [
    { title: "甜文", input: "https://www.fuxsb.com/tags-197-0.html" },
    { title: "ABO", input: "https://www.fuxsb.com/tags-191-0.html" },
    { title: "快穿", input: "https://www.fuxsb.com/tags-218-0.html" },
    { title: "种田文", input: "https://www.fuxsb.com/tags-502-0.html" },
    { title: "强强", input: "https://www.fuxsb.com/tags-170-0.html" },
    { title: "爽文", input: "https://www.fuxsb.com/tags-183-0.html" },
    { title: "娱乐圈", input: "https://www.fuxsb.com/tags-219-0.html" },
    { title: "重生", input: "https://www.fuxsb.com/tags-2-0.html" },
    { title: "美人受", input: "https://www.fuxsb.com/tags-184-0.html" },
    { title: "穿书", input: "https://www.fuxsb.com/tags-225-0.html" },
    { title: "灵异神怪", input: "https://www.fuxsb.com/tags-4-0.html" },
    { title: "系统", input: "https://www.fuxsb.com/tags-171-0.html" },
    { title: "生子", input: "https://www.fuxsb.com/tags-15-0.html" },
    { title: "短篇", input: "https://www.fuxsb.com/tags-619-0.html" },
    { title: "仙侠修真", input: "https://www.fuxsb.com/tags-224-0.html" },
    { title: "狗血", input: "https://www.fuxsb.com/tags-765-0.html" },
    { title: "美食", input: "https://www.fuxsb.com/tags-488-0.html" },
    { title: "星际", input: "https://www.fuxsb.com/tags-202-0.html" },
    { title: "校园", input: "https://www.fuxsb.com/tags-221-0.html" },
    { title: "无CP", input: "https://www.fuxsb.com/tags-1010-0.html" },
    { title: "无限流", input: "https://www.fuxsb.com/tags-216-0.html" },
    { title: "末世", input: "https://www.fuxsb.com/tags-435-0.html" },
    { title: "破镜重圆", input: "https://www.fuxsb.com/tags-11-0.html" }
];

// Parser MOT dong truyen trong .list_article ul li. Ten lay tu h2
// (tach " 作者：X" ra khoi ten); mo ta = "作者：X | ngay | p.desc".
// Link phai dang /<cat>/<id>.html (chu cai + so) — bo qua dong khac
// (vd. dong quang cao). Dedupe theo link.
function parseFxList(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select(".list_article ul li");
    for (var i = 0; i < rows.size(); i++) {
        var li = rows.get(i);
        var h2 = safeFirst(li.select("h2"));
        if (h2 === null) continue;
        var a = safeFirst(h2.select("a"));
        if (a === null) continue;
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var link = absUrl(href);
        var m = link.match(/\/([a-z]+)\/(\d+)\.html$/);
        if (!m) continue;
        if (seen[link]) continue;
        var h2t = cleanText(h2.text());
        var parts = h2t.split("作者：");
        var name = cleanText(parts[0]);
        if (!name) continue;
        seen[link] = 1;
        var author = parts.length > 1 ? cleanText(parts[1]) : "";
        var descEl = safeFirst(li.select("p.desc"));
        var desc = descEl !== null ? cleanText(descEl.text()) : "";
        var timeEl = safeFirst(li.select(".like .time"));
        var time = timeEl !== null ? cleanText(timeEl.text()) : "";
        var dparts = [];
        if (author) dparts.push("作者：" + author);
        if (time) dparts.push(time);
        if (desc) dparts.push(desc);
        items.push({
            name: name,
            link: link,
            description: dparts.join(" | ")
        });
    }
    return items;
}

// URL trang ke cua danh sach (danh muc/tag): href cua link "下一页"
// trong div.dede_pages, tuyet doi hoa; "" khi het trang. Duyet tay
// thay vi dung :contains de tranh phu thuoc vao selector jsoup mo rong.
function nextFxPage(doc) {
    var links = doc.select(".dede_pages a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = String(a.attr("href") || "");
            if (!href) return "";
            return absUrl(href);
        }
    }
    return "";
}

// Tong so trang cua 1 sach (trang chi tiet): doc chu "共<N>页" trong
// vung phan trang; fallback: so lon nhat tu cac link _<n>.html;
// fallback cuoi: 1. (Sua loi base Moleys v7: base doc tong so trang tu
// link DAU TIEN cua ul — link dau la "下一页" khong co so.)
function totalPagesFromDoc(doc) {
    var divs = doc.select("div");
    for (var i = 0; i < divs.size(); i++) {
        var t = String(divs.get(i).text() || "");
        var m = t.match(/共\s*(\d+)\s*页/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n >= 1) return n;
        }
    }
    var best = 1;
    var links = doc.select("a[href*=\"_\"]");
    for (var j = 0; j < links.size(); j++) {
        var h = String(links.get(j).attr("href") || "");
        var mm = h.match(/_(\d+)\.html/);
        if (mm) {
            var v = parseInt(mm[1], 10);
            if (!isNaN(v) && v > best) best = v;
        }
    }
    return best;
}

// So trang lon nhat ma pager ket qua tim kiem quang cao (page param
// 0-based): quet .dede_pages a[href*=searchid] lay page= lon nhat.
function searchMaxPage(doc) {
    var sel = doc.select(".dede_pages a[href*=\"searchid=\"]");
    var best = 0;
    for (var i = 0; i < sel.size(); i++) {
        var h = String(sel.get(i).attr("href") || "");
        var m = h.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    return best;
}

// Lay searchid tu pager ket qua tim kiem (href ?page=N&searchid=M);
// fallback: regex tren toan bo HTML. Tra "" khi khong co (trang ket
// qua chi co 1 trang thi khong co searchid — nhung cung khong can).
function searchIdFromDoc(doc) {
    var sel = doc.select(".dede_pages a[href*=\"searchid=\"]");
    for (var i = 0; i < sel.size(); i++) {
        var h = String(sel.get(i).attr("href") || "");
        var m = h.match(/searchid=(\d+)/);
        if (m) return m[1];
    }
    var html = "";
    try { html = doc.html() + ""; } catch (e) { html = ""; }
    var m2 = html.match(/searchid=(\d+)/);
    return m2 ? m2[1] : "";
}
