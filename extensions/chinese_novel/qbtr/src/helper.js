// helper.js — Ham dung chung cho qbtr.cc (全本同人小说网).
//
// - Danh sach: .books .bk > a[href="/<cat>/<id>.html"] > .infos > h3
//   (ten), .booknews (tac gia + size MB + ngay), p (mo ta). Khong co anh
//   bia: <img src=""> rong + cover.js tra 0 byte — site khong co bia.
// - Phan trang: div.page, link "下一页" (trang ke); trang chu / khong co
//   pager -> het. Trang the loai dung /tongren/index_N.html,
//   /changgui/index_N.html, /hot/index_N.html; trang tag dung
//   /e/tags/?tagid=<id> roi /tags-etagid<id>-<n>.html (kiem chung live
//   2026-11-16: /tags-etagid166-1.html tra 9 sach).
// - The loai: tag tren /m_tags.html — NHUNG link dep /tags-<id>-0.html
//   CHET ("此TAG不存在", kiem chung 6 id: 160, 166, 170, 175, 180, 181);
//   chi dung duoc qua /e/tags/?tagid=<id>. Tag 181 co 0 sach + ten
//   mojibake (site luu ten bang UTF-8 trong trang GBK) nen BO.
// - Chi tiet: /tongren/<id>.html — h1 ten, .date span "作者：X" + ngay,
//   .book_info .infos p mo ta (ngat <br/>), muc luc div.book_list day du.
// - Chuong: /tongren/<id>/<n>.html — h1 "<ten> 第N章" trong
//   .read_chapterName, noi dung .read_chapterDetail (the p); dau chuong
//   lap phan gioi thieu sach 2 lan (简介 gian the + 簡介 phon the) truoc
//   than bai that, cuoi chuong co 2 dong 上一篇/下一篇 — xem trimChapter.
// - Tim kiem: form EmpireCMS POST /e/search/index.php (xem search.js).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 16 tag con sach (tu /m_tags.html, kiem chung live 2026-11-16). Moi tag
// mo qua /e/tags/?tagid=<id> (link dep /tags-<id>-0.html chet). Tag 181
// bo: 0 sach + ten mojibake tren chinh site.
var GENRES = [
    { title: "火影", input: "https://www.qbtr.cc/e/tags/?tagid=160" },
    { title: "FATE", input: "https://www.qbtr.cc/e/tags/?tagid=163" },
    { title: "后宫", input: "https://www.qbtr.cc/e/tags/?tagid=164" },
    { title: "聊天群", input: "https://www.qbtr.cc/e/tags/?tagid=165" },
    { title: "综漫", input: "https://www.qbtr.cc/e/tags/?tagid=166" },
    { title: "海贼", input: "https://www.qbtr.cc/e/tags/?tagid=167" },
    { title: "系统", input: "https://www.qbtr.cc/e/tags/?tagid=168" },
    { title: "盗墓", input: "https://www.qbtr.cc/e/tags/?tagid=169" },
    { title: "斗罗", input: "https://www.qbtr.cc/e/tags/?tagid=170" },
    { title: "柯南", input: "https://www.qbtr.cc/e/tags/?tagid=171" },
    { title: "型月", input: "https://www.qbtr.cc/e/tags/?tagid=172" },
    { title: "洪荒", input: "https://www.qbtr.cc/e/tags/?tagid=173" },
    { title: "漫威", input: "https://www.qbtr.cc/e/tags/?tagid=175" },
    { title: "娱乐", input: "https://www.qbtr.cc/e/tags/?tagid=176" },
    { title: "连载", input: "https://www.qbtr.cc/e/tags/?tagid=179" },
    { title: "全本", input: "https://www.qbtr.cc/e/tags/?tagid=180" }
];

// Lay <id> so cua truyen tu URL dang /tongren/<id>.html,
// /changgui/<id>.html hoac /tongren/<id>/<n>.html; tra "" khi khong
// phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/(tongren|changgui)\/(\d+)(?:\.html|\/\d+\.html)?/);
    return m ? m[2] : "";
}

// Parser MOT dong truyen trong danh sach (.bk > a). Ten lay tu h3;
// mo ta lay tu .booknews (tac gia + size + ngay) + doan p dau tien.
// Bo qua dong khong co ten hoac trung link. Khong co bia (site khong
// co anh bia — <img src=""> rong).
function parseBookItem(a, seen) {
    var href = String(a.attr("href") || "");
    var m = href.match(/^\/(tongren|changgui)\/(\d+)\.html$/);
    if (!m) return null;
    var link = BASE_URL + "/" + m[1] + "/" + m[2] + ".html";
    if (seen[link]) return null;

    var h3 = safeFirst(a.select("h3"));
    var name = h3 !== null ? cleanText(h3.text()) : "";
    if (!name) return null;
    seen[link] = 1;

    var descParts = [];
    var news = safeFirst(a.select("div.booknews"));
    if (news !== null) {
        var t = cleanText(news.text());
        if (t) descParts.push(t);
    }
    var p = safeFirst(a.select("p"));
    if (p !== null) {
        var d = cleanText(p.text());
        if (d) descParts.push(d);
    }
    return {
        name: name,
        link: link,
        description: descParts.join(" | ")
    };
}

// Parser RIENG cho trang ket qua tim kiem — bo cuc KHAC danh sach:
// <div class="bk_right"><h3><a href="/tongren/<id>.html">TEN</a></h3>
// <div class="booknews">作者： X <label class="date">NGAY</label></div>
// <p>简介：...</p></div>. Link <a> NAM TRONG h3 (khong chua h3,
// .booknews, p nhu .bk > a o trang the loai) nen parseBookItem tra null
// cho ca 20 ket qua — loi tim kiem tren may that 2026-11-16 (device
// test 20/22, 2 case search code 1; probe tam xac nhan bk=20, shadow=0).
function parseSearchList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("div.bk_right");
    if (cards.size() === 0) cards = doc.select("div.bk");
    for (var i = 0; i < cards.size(); i++) {
        var card = cards.get(i);
        var a = safeFirst(card.select("h3 a"));
        if (a === null) a = safeFirst(card.select("a"));
        if (a === null) continue;
        var href = String(a.attr("href") || "");
        var m = href.match(/^\/(tongren|changgui)\/(\d+)\.html$/);
        if (!m) continue;
        var link = BASE_URL + "/" + m[1] + "/" + m[2] + ".html";
        if (seen[link]) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        seen[link] = 1;
        var descParts = [];
        var news = safeFirst(card.select("div.booknews"));
        if (news !== null) {
            var t = cleanText(news.text());
            if (t) descParts.push(t);
        }
        var pp = safeFirst(card.select("p"));
        if (pp !== null) {
            var d = cleanText(pp.text());
            if (d) descParts.push(d);
        }
        items.push({ name: name, link: link, description: descParts.join(" | ") });
    }
    return items;
}

// Parser toan bo danh sach .bk tren 1 trang (trang the loai, trang
// chu, trang tag). Trang ket qua tim kiem dung parseSearchList rieng.
function parseListItems(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select("div.bk");
    for (var i = 0; i < cards.size(); i++) {
        var a = safeFirst(cards.get(i).select("a"));
        if (a === null) continue;
        var one = parseBookItem(a, seen);
        if (one !== null) items.push(one);
    }
    return items;
}

// URL trang ke trong div.page: link co text "下一页" (chinh xac nhat —
// cac so trang trong pager co the lap lai o nhieu cho). Tra URL tuyet
// doi, "" khi het (trang chu / khong co pager).
function nextPageHref(doc) {
    var links = doc.select("div.page a");
    for (var i = 0; i < links.size(); i++) {
        var a = links.get(i);
        var t = cleanText(a.text());
        if (t === "下一页") {
            var href = a.attr("href") || "";
            if (!href) return "";
            if (href.indexOf("http") === 0) return href;
            if (href.charAt(0) !== "/") href = "/" + href;
            return BASE_URL.replace(/\/+$/, "") + href;
        }
    }
    return "";
}

// Cat phan gioi thieu lap dau chuong + dong dieu huong cuoi chuong.
// Chi chuong 1 moi co khoi gioi thieu (ten sach + tac gia + mo ta lap
// 1-2 lan); chuong 2 tro di mo thang bang than bai. Cau truc khoi gioi
// thieu khac nhau tuy sach (kiem chung live 2026-11-16, 3 sach):
// - 10047 ch.1: p0 ten, p2 "作者：X", p4 "简介：" + mo ta gian the,
//   p23 "簡介：" (dau hai cham NUA : U+003A, khac p4 dung ： U+FF1A) +
//   mo ta phon the, p43 "第一卷 : 第1章 ..." moi la than bai.
// - 10127 ch.1: p0 ten + tac gia (khong co moc 简介), p13 "第一章 ...".
// - 10011 ch.1: p0 ten, p1 tac gia, p2 "简介：", p6 "第1章 ...".
// Quy tac: tim doan tieu de chuong DAU TIEN dang "第<so><卷|章>" (ngan,
// <= 60 ky tu); CHI cat toi do neu phan truoc no co dau hieu gioi thieu
// (moc 简介/簡介, dong ten sach, hoac dong "作者：") — neu khong, doan
// tieu de giua trang chi la ranh gioi chuong ke tiep tren cung trang
// (vd. 10127 ch.2 co "第三章 ..." o p63, phai GIU nguyen). Neu khong
// co tieu de nao thi roi ve moc 简介/簡介 cuoi cung; khong co moc thi
// giu nguyen toan bo. Cuoi chuong: cat cac dong "上一篇"/"下一篇" neu co.
// Tra ve HTML cac <p> con lai (giu nguyen the p de app hien thi).
// bookTitle: ten sach lay tu h1 trang chuong (da cat hau to " 第N章").
function trimChapter(detailEl, bookTitle) {
    var paras = detailEl.select("p");
    var n = paras.size();
    if (n === 0) return "";
    var texts = [];
    var i = 0;
    for (i = 0; i < n; i++) {
        texts.push(cleanText(paras.get(i).text()));
    }
    var title = String(bookTitle || "");

    // Tieu de chuong dau tien: bat dau bang 第<so><卷|章>, ngan.
    var headingIdx = -1;
    for (i = 0; i < n; i++) {
        var t = texts[i];
        if (t.length > 0 && t.length <= 60 &&
            /^第[一二三四五六七八九十百零\d]+[卷章]/.test(t)) {
            headingIdx = i;
            break;
        }
    }
    var start = 0;
    if (headingIdx !== -1) {
        // Phan truoc tieu de co phai khoi gioi thieu khong?
        var hasIntro = false;
        for (i = 0; i < headingIdx; i++) {
            var stem = texts[i].replace(/[:：\s]+$/, "");
            if (stem === "简介" || stem === "簡介") { hasIntro = true; break; }
            if (title && texts[i].indexOf(title) !== -1) { hasIntro = true; break; }
            if (texts[i].indexOf("作者：") === 0) { hasIntro = true; break; }
        }
        if (hasIntro) start = headingIdx;
    }
    if (start === 0) {
        // Roi ve moc 简介/簡介 cuoi cung (cat ca 2 ban gian the +
        // phon the khi tieu de chuong khong nhan dang duoc).
        // Moc co khi dung ： (U+FF1A), co khi dung : (U+003A) — so
        // theo goc sau khi bo dau hai cham.
        for (i = 0; i < n; i++) {
            var stem2 = texts[i].replace(/[:：\s]+$/, "");
            if (stem2 === "简介" || stem2 === "簡介") {
                start = i + 1;
            }
        }
    }
    var end = n;
    while (end > start) {
        var t2 = texts[end - 1];
        if (t2.indexOf("上一篇") === 0 || t2.indexOf("下一篇") === 0) {
            end--;
        } else {
            break;
        }
    }
    // Bo cac doan rong o hai dau khoi con lai.
    while (start < end && texts[start] === "") start++;
    while (end > start && texts[end - 1] === "") end--;
    if (start >= end) return "";
    var out = [];
    for (i = start; i < end; i++) {
        out.push("<p>" + cleanText(paras.get(i).text()) + "</p>");
    }
    return out.join("");
}
