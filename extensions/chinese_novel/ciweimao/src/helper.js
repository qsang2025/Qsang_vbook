// helper.js — Ham dung chung cho Ciweimao (mip.ciweimao.com, 刺猬猫).
//
// Site truyen chu tieng Trung, MIP, UTF-8 (kiem chung live 2026-11-16):
// - Domain that: mip.ciweimao.com; www/wap cung song nhung trang chuong
//   chi hien 12 doan (mip hien du 105 doan) nen moi URL deu chuan hoa ve
//   mip. trong normalizeStoryUrl / normalizeChapterUrl.
// - Trang chu: khong co form tim kiem, khong co endpoint tim kiem nao
//   (thu /search, /search/index, /book_search, /index/search — deu 404;
//   tham so keyword= cua API book_list_data bi site bo qua) —
//   search.js DUOC CAT theo tien le Sách Hay Online (#57).
// - Trang the loai: API JSONP /index/book_list_data?keyword=&
//   category_type=<id>&pn=<page> — 10 muc/trang, khong co truong total
//   (het muc thi tra items rong). category_type so (kiem chung tung id
//   qua category_name cua muc dau): 0 tat ca, 8 玄幻奇幻, 27 都市青春,
//   1 灵异未知, 30 历史军事, 6 科幻无限, 3 游戏竞技, 5 仙侠武侠,
//   24 免费同人, 11 女频.
// - Trang chi tiet /book/<id>: .info h3.book ten, .cover mip-img bia,
//   .author "Tac gia 著 / The loai", .info p (so chu / 连载中/已完结 /
//   cap nhat), .desc-cnt mo ta. TOC .cnt-box.catalogue li a — DU 1 trang
//   (sach mau 749 muc); chuong khoa co <i class="icon icon-lock">.
// - Trang chuong /chapter/<id>: #J_BookRead chua cac <p class='chapter'>
//   KHONG co the dong </p> (jsoup tu dong dong the). Moi doan co
//   <span>TOKEN 6 ky tu</span> (watermark, khac nhau moi chuong —
//   vd. 1B8Vaj) + <a class='num-link'> link binh luan doan; chap.js
//   xoa ca hai truoc khi tra HTML. Chuong khoa tra trang dang nhap
//   (title "登录-刺猬猫", khong co #J_BookRead) — chap.js bao loi
//   tieng Viet ro rang, khong bypass.
// - Chuong doc DU 1 trang, khong phan trang trong chuong.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 9 the loai + tat ca (id so cua API book_list_data; kiem chung live
// 2026-11-16 qua category_name cua muc dau tien moi id).
var CATEGORIES = [
    { title: "玄幻奇幻", id: "8" },
    { title: "都市青春", id: "27" },
    { title: "灵异未知", id: "1" },
    { title: "历史军事", id: "30" },
    { title: "科幻无限", id: "6" },
    { title: "游戏竞技", id: "3" },
    { title: "仙侠武侠", id: "5" },
    { title: "免费同人", id: "24" },
    { title: "女频", id: "11" }
];

// Tra id so cua the loai theo ten tieng Trung (vd. "科幻无限" -> "6").
// Khong thay thi tra "".
function categoryIdByName(name) {
    var n = cleanText(name);
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].title === n) return CATEGORIES[i].id;
    }
    return "";
}

function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/^《/, "").replace(/》$/, "");
    return n;
}

// Chuan hoa moi URL truyen/chuong ve mip.ciweimao.com (www/wap tra
// trang chuong thieu doan — khong dung duoc). Giu nguyen path/query.
// Tra "" neu URL khong hop le.
function normalizeStoryUrl(url) {
    var s = String(url === undefined || url === null ? "" : url);
    if (!s) return "";
    s = s.replace(/^https?:\/\/(wap\.|www\.)ciweimao\.com/i, "https://mip.ciweimao.com");
    if (/^https?:\/\//i.test(s)) return normalizeUrl(s);
    if (s.charAt(0) === "/") return siteOrigin() + s;
    return BASE_URL + "/" + s;
}

// Fetch 1 trang HTML UTF-8 co pacing; tra ve { doc } hoac { error }.
function fetchCwDoc(url) {
    rateLimitDelay(siteOrigin());
    var doc = fetchDoc(url, { browserFallback: false });
    if (!doc) return { error: "Không tải được trang: " + url };
    return { doc: doc };
}

// Fetch API JSONP /index/book_list_data (tra ve dang ({...}) — can
// boc ngoac truoc khi JSON.parse). Tra ve { items: [...] } hoac { error }.
function fetchCwList(categoryId, page) {
    var url = BASE_URL + "/index/book_list_data?keyword=&category_type=" + encodeURIComponent(String(categoryId)) + "&pn=" + encodeURIComponent(String(page));
    rateLimitDelay(siteOrigin());
    var res = null;
    try {
        res = fetch(url);
    } catch (e) {
        return { error: "Không tải được danh sách: " + e };
    }
    if (!res || !res.ok) {
        return { error: "Không tải được danh sách (HTTP " + (res ? res.status : 0) + ")" };
    }
    var text = "";
    try {
        text = res.text();
    } catch (e2) {
        return { error: "Không đọc được danh sách" };
    }
    if (!text) return { error: "Danh sách trống" };
    text = text.replace(/^\s+|\s+$/g, "");
    if (text.charAt(0) === "(" && text.charAt(text.length - 1) === ")") {
        text = text.slice(1, -1);
    }
    var obj = null;
    try {
        obj = JSON.parse(text);
    } catch (e3) {
        return { error: "Không đọc được danh sách (JSON lỗi)" };
    }
    if (!obj || !obj.data || !(obj.data.items instanceof Array)) {
        return { error: "Danh sách không đúng định dạng" };
    }
    return { items: obj.data.items };
}

// Parse 1 muc sach tu API book_list_data thanh item chuan.
function parseApiBook(e) {
    if (!e || !e.book_id) return null;
    var name = cleanBookName(e.book_name);
    if (!name) return null;
    var cover = String(e.cover || "");
    if (cover.indexOf("notimg") !== -1) cover = "";
    return {
        name: name,
        cover: cover,
        link: BASE_URL + "/book/" + e.book_id,
        description: cleanText(e.author_name || ""),
        tag: cleanText(e.category_name || ""),
        host: siteOrigin()
    };
}
