// helper.js — Ham dung chung cho Jjwxc (jjwxc.net, Tan Giang / Jinjiang).
//
// Site truyen chu tieng Trung, ma hoa GBK (kiem chung live 2026-11-19
// tu VM + probe dien thoai cua muse-main 19/11, task 094):
// - Trang truyen + muc luc + chuong deu o onebook.php?novelid=<id>
//   (chuong them &chapterid=<n>). Muc luc nam tren trang truyen:
//   cac dong tr[itemprop*="chapter"] (dong moi nhat co itemprop
//   "chapter newestChapter" nen phai dung *=, khong dung =).
//   Sach mau 砸锅卖铁去上学 (novelid 4737103): 338 chuong, chuong
//   1-15 mien phi (href onebook.php), chuong 16-338 VIP (rel
//   my.jjwxc.net/onebook_vip.php + onclick vip_buy + nhan [VIP]).
//   Chuong VIP mo ra trang dang nhap (my.jjwxc.net/login.php) —
//   extension chi danh dau [VIP] + lock/pay, chap.js bao loi ro,
//   TUYET DOI khong bypass VIP/dang nhap/mua chuong.
// - Trang chuong mien phi: noi dung trong div.noveltext (HTML tinh,
//   khong can JS), tieu de chuong o h2 dang "第 N 章" (co khoang
//   trang), noi dung khong co the p — text tho tach bang br, thut
//   dau dong bang &nbsp;. Dau noveltext co rac UI ([添加书签]...),
//   cuoi co rac (插入书签 / 作者有话说...), ghi chu tac gia nam
//   trong script#note_str (bi loai khi bo script).
// - Trang danh sach: bookbase_slave.php (booktype=free/vip/...,
//   orderstr=1 theo cap nhat, 2 theo diem, 3 theo ngay dang, 4 theo
//   luu tru) va bookbase.php (loc theo xx: 1 言情, 2 纯爱, 3 百合,
//   5 无CP, 6 多元...). Moi dong la 1 tr: td tac gia (oneauthor.php),
//   td ten truyen (onebook.php?novelid=, class tooltip), td the loai,
//   td trang thai (完结/连载中), so lieu, ngay. Phan trang o
//   .controlbar (link 下一页, href khong co dau nhay).
// - Tim kiem: search.php?kw=<GBK>&t=1 (form form8, input name=kw,
//   id autoComplete, chi co tren trang danh sach/truyen, trang chu
//   khong co form). Ket qua: cac khoi h3.title > a + div.intro +
//   div.info, 25 ket qua/trang, khong thay link phan trang.
// - Chi tiet: ten o h1, tac gia [itemprop="author"], mo ta
//   [itemprop="description"], trang thai "文章进度：完结/连载中",
//   the loai "文章类型：原创-言情-...". Khong co anh bia tren trang
//   truyen (bia chi tai qua JS picturePushList.php) nen cover rong.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai
// tai truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Cac nhom the loai theo tham so xx cua bookbase.php (kiem chung tu
// form loc tren trang truyen 2026-11-19).
var CATEGORIES = [
    { title: "言情", xx: "1", input: "/bookbase.php?fw=0&yc=0&xx=1&mainview=0&sd=0&fbsj=3&s_typeid=1&version=1" },
    { title: "纯爱", xx: "2", input: "/bookbase.php?fw=0&yc=0&xx=2&mainview=0&sd=0&fbsj=3&s_typeid=1&version=1" },
    { title: "百合", xx: "3", input: "/bookbase.php?fw=0&yc=0&xx=3&mainview=0&sd=0&fbsj=3&s_typeid=1&version=1" },
    { title: "无CP", xx: "5", input: "/bookbase.php?fw=0&yc=0&xx=5&mainview=0&sd=0&fbsj=3&s_typeid=1&version=1" },
    { title: "多元", xx: "6", input: "/bookbase.php?fw=0&yc=0&xx=6&mainview=0&sd=0&fbsj=3&s_typeid=1&version=1" }
];

// The loai theo ten tieng Trung trong "文章类型" cua trang chi tiet.
function categoryByTitle(title) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].title === title) return CATEGORIES[i];
    }
    return null;
}

// Giai quyet link tren trang thanh URL tuyet doi. Xu ly them dang
// "//www.jjwxc.net/..." (protocol-relative) ma absUrl chung chua xu ly.
function jjAbsUrl(href) {
    if (!href) return "";
    href = String(href);
    if (href.indexOf("//") === 0) href = "https:" + href;
    return absUrl(href);
}

// Lay novelid tu URL truyen/chuong.
function novelIdFromUrl(url) {
    var m = /[?&]novelid=(\d+)/.exec(String(url || ""));
    return m ? m[1] : "";
}

// Chuan hoa URL truyen ve dang onebook.php?novelid=<id> tren BASE_URL.
function normalizeStoryUrl(url) {
    var u = String(url || "");
    if (u.charAt(0) === "/") u = siteOrigin() + u;
    u = normalizeUrl(u);
    var nid = novelIdFromUrl(u);
    if (nid) return BASE_URL + "/onebook.php?novelid=" + nid;
    return u;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchJjDoc(url) {
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
            return { error: rateLimitErrorMessage("Jjwxc", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Jjwxc", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
        if (isChallengeText(doc.html())) {
            lastError = "Trang đang hiện kiểm tra Cloudflare, thử lại sau: " + url;
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Parse 1 dong tr cua trang danh sach thanh muc truyen. Tra null neu
// dong khong co link truyen (dong tieu de bang, dong trang...).
function parseListRow(tr) {
    var linkEl = safeFirst(tr.select('a[href*="onebook.php?novelid="]'));
    if (linkEl === null) return null;
    var link = normalizeStoryUrl(jjAbsUrl(linkEl.attr("href")));
    if (!link || !novelIdFromUrl(link)) return null;
    var name = cleanText(linkEl.text());
    if (!name) return null;
    var author = "";
    var authorEl = safeFirst(tr.select('a[href*="oneauthor.php"]'));
    if (authorEl !== null) author = cleanText(authorEl.text());
    var tds = tr.select("td");
    var typeText = "";
    var statusText = "";
    if (tds.size() > 2) typeText = cleanText(tds.get(2).text());
    if (tds.size() > 3) statusText = cleanText(tds.get(3).text());
    var desc = "";
    if (author) desc = "作者：" + author;
    if (typeText) desc = desc ? desc + " ┃ " + typeText : typeText;
    if (statusText) desc = desc ? desc + " ┃ " + statusText : statusText;
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: statusText,
        host: siteOrigin()
    };
}

// Parse toan bo dong danh sach tren 1 trang (bookbase_slave /
// bookbase). Bo trung theo link.
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("tr");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var one = parseListRow(rows.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    return items;
}

// Tim link "下一页" tren trang danh sach; tra ve URL tuyet doi
// (hoac "" neu het trang).
function nextPageHref(doc) {
    var links = doc.select(".controlbar a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href");
            if (!href) return "";
            return jjAbsUrl(href);
        }
    }
    return "";
}

// Dem chuong tren trang truyen: tong / mien phi / VIP. Chuong VIP
// nhan dien qua rel chua onebook_vip hoac onclick chua vip_buy.
function countChapters(doc) {
    var rows = doc.select('tr[itemprop*="chapter"]');
    var total = 0;
    var free = 0;
    var vip = 0;
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var a = safeFirst(rows.get(i).select('a[itemprop="url"]'));
        if (a === null) continue;
        var href = String(a.attr("href") || "");
        var rel = String(a.attr("rel") || "");
        var onclick = String(a.attr("onclick") || "");
        if (!/[?&]chapterid=\d+/.test(href) && !/[?&]chapterid=\d+/.test(rel)) continue;
        total = total + 1;
        if (rel.indexOf("onebook_vip") !== -1 || onclick.indexOf("vip_buy") !== -1) {
            vip = vip + 1;
        } else {
            free = free + 1;
        }
    }
    return { total: total, free: free, vip: vip };
}
