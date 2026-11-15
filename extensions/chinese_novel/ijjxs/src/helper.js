// helper.js — Ham dung chung cho Ijjxs (ijjxsxzw.com, 久久小说下载网).
//
// Site truyen chu tieng Trung, EmpireCMS, UTF-8 (kiem chung live 2026-11-16):
// - Domain that: ijjxs.com 301 ve ijjxsxzw.com; chi https:// tra 200
//   truc tiep (http 301, runtime fetch khong theo redirect) — BASE_URL
//   https://www.ijjxsxzw.com, mirror duy nhat https://m.ijjxsxzw.com.
// - Trang chu: nav 15 the loai song (chuanyue, chongshengxiaoshuo, lsjs,
//   young, qinggan, wuxia, tongrenxiaoshuo, wuxianliu, dmtr, xuanhuan,
//   dushi, tiexue, juben, kongbu, gdmz); moi trang 10 muc, phan trang
//   /txt/<cat>/index_<N>.html, link 下一页.
// - Trang the loai: .catalog .listbg (10 truyen/trang): a.img img (co
//   the la /e/data/images/notimg.gif — bo qua), span.title a ten + link
//   /txt/<id>.html, span.new .oldDate ngay, div sau mo ta.
// - Trang chi tiet /txt/<id>.html: article.panel h3 《ten》, .body.detail
//   .pic img bia (anh avatar that), .kv p (书籍作者：/书籍分类：/书籍大小：/
//   写作进度：<span class="sfwj">/上传时间：/下载方式：), panel 内容简介
//   .desc (co the <style> o dau — go truoc khi lay text); link doc
//   /read/<id>/; breadcrumb nav.bd-crumb cho the loai.
// - Muc luc: trang /read/<id>/ (dang rut gon, khong can doan <cat>):
//   div.chapter-list a — DAY DU 1 trang (sach mau 284 muc, sach 2: 151
//   muc); muc dau la 内容简介 (trang 1), tu muc 2 la chuong that.
// - Trang chuong /read/<cat>/<id>/<n>.html: #view_content_txt (cac <p>);
//   trang 1 la gioi thieu sach (484 ky tu), tu trang 2 la chuong
//   (ch.1 sach mau 3.817 ky tu, ch.1 sach 2: 5.041 ky tu); h1 dang
//   "Ten truyen  第N章 Ten chuong". Khong co trang chia trong chuong,
//   khong co khoa VIP / dang nhap / preview.
// - Tim kiem: form POST /e/search/index.php (field keyboard,
//   show=title,writer, tbname=download, tempid=2, orderby=newstime,
//   myorder=0) tren trang chu, class search; POST truc tiep treo tu VM
//   (000 — tarpit IP datacenter) nen search.js dung WebView submit form
//   nhu ffxs8/sjks88 v2/powanjuan.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 15 the loai song (kiem chung live tu nav trang chu + tung trang 2026-11-16).
var CATEGORIES = [
    { title: "穿越", slug: "chuanyue", input: "/txt/chuanyue/" },
    { title: "重生", slug: "chongshengxiaoshuo", input: "/txt/chongshengxiaoshuo/" },
    { title: "古代架空", slug: "lsjs", input: "/txt/lsjs/" },
    { title: "现代言情", slug: "young", input: "/txt/young/" },
    { title: "总裁豪门", slug: "qinggan", input: "/txt/qinggan/" },
    { title: "仙侠幻想", slug: "wuxia", input: "/txt/wuxia/" },
    { title: "同人衍生", slug: "tongrenxiaoshuo", input: "/txt/tongrenxiaoshuo/" },
    { title: "无限流", slug: "wuxianliu", input: "/txt/wuxianliu/" },
    { title: "耽于纯美", slug: "dmtr", input: "/txt/dmtr/" },
    { title: "玄幻魔法", slug: "xuanhuan", input: "/txt/xuanhuan/" },
    { title: "都市异能", slug: "dushi", input: "/txt/dushi/" },
    { title: "历史军事", slug: "tiexue", input: "/txt/tiexue/" },
    { title: "网游小说", slug: "juben", input: "/txt/juben/" },
    { title: "惊悚悬疑", slug: "kongbu", input: "/txt/kongbu/" },
    { title: "文学名著", slug: "gdmz", input: "/txt/gdmz/" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// The loai theo URL truyen (/txt/xuanhuan/60720.html -> 玄幻魔法).
// Khong neo dau chuoi vi URL day du bat dau bang https://... .
function categoryFromUrl(url) {
    var m = /\/(chuanyue|chongshengxiaoshuo|lsjs|young|qinggan|wuxia|tongrenxiaoshuo|wuxianliu|dmtr|xuanhuan|dushi|tiexue|juben|kongbu|gdmz)\//.exec(String(url));
    if (m) return categoryBySlug(m[1]);
    return null;
}

// The loai theo ten hien thi (vd. "耽于纯美" trong .kv) — dung khi URL
// khong mang slug the loai.
function categoryByTitle(title) {
    var t = cleanText(title);
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].title === t) return CATEGORIES[i];
    }
    return null;
}

// Cat 《》 quanh ten sach va khoang trang thua.
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/^《/, "").replace(/》$/, "");
    return n;
}

// Fetch 1 trang HTML UTF-8 co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchIjDoc(url) {
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
            return { error: rateLimitErrorMessage("Ijjxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Ijjxs", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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
            doc = res.res.html();
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

// Parse 1 muc truyen trang the loai (.catalog .listbg) thanh
// {name, cover, link, description, tag, host}. Tra null neu thieu ten/link.
// Anh bia co the la /e/data/images/notimg.gif (anh cho) — bo qua.
function parseListCard(el) {
    var linkEl = safeFirst(el.select(".title a"));
    if (linkEl === null) linkEl = safeFirst(el.select("a[href*='/txt/']"));
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var link = absUrl(href);
    if (!link) return null;
    var name = cleanBookName(linkEl.text());
    if (!name) {
        var t = linkEl.attr("title");
        if (t) name = cleanBookName(t);
    }
    if (!name) return null;
    var cover = "";
    var imgEl = safeFirst(el.select("a.img img"));
    if (imgEl !== null) {
        var src = imgEl.attr("src") || "";
        if (src && src.indexOf("notimg.gif") === -1) {
            cover = absUrl(src) || "";
        }
    }
    var desc = "";
    var descEl = safeFirst(el.select("div[style]"));
    if (descEl !== null) desc = cleanText(stripTags(descEl.html()));
    if (!desc) {
        var dateEl = safeFirst(el.select(".oldDate"));
        if (dateEl !== null) desc = cleanText(dateEl.text());
    }
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse toan bo danh sach tren 1 trang: thu .catalog .listbg (trang the
// loai / ket qua tim kiem), roi ul.clearfix li (du phong), roi
// .books div.bk (trang chu). Tra mang rong neu khong nhan ra dang nao.
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var i = 0;
    var cards = doc.select(".catalog .listbg");
    for (i = 0; i < cards.size(); i++) {
        var one = parseListCard(cards.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    if (items.length > 0) return items;
    var lis = doc.select("ul.clearfix li");
    for (i = 0; i < lis.size(); i++) {
        var li = lis.get(i);
        var a = safeFirst(li.select("a"));
        if (a === null) continue;
        var href = a.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        var nm = cleanBookName(a.text());
        if (!nm) continue;
        seen[link] = true;
        items.push({ name: nm, cover: "", link: link, description: "", tag: "", host: siteOrigin() });
    }
    if (items.length > 0) return items;
    var bks = doc.select(".books div.bk");
    for (i = 0; i < bks.size(); i++) {
        var bk = bks.get(i);
        var ba = safeFirst(bk.select("a"));
        if (ba === null) continue;
        var bh = ba.attr("href");
        if (!bh) continue;
        var bl = absUrl(bh);
        if (!bl || seen[bl]) continue;
        var bn = cleanBookName(ba.text());
        if (!bn) continue;
        seen[bl] = true;
        items.push({ name: bn, cover: "", link: bl, description: "", tag: "", host: siteOrigin() });
    }
    return items;
}

// Tim link "下一页" tren trang danh sach; tra ve URL tuyet doi
// (hoac "" neu het trang).
function nextPageHref(doc) {
    var a = safeFirst(doc.select("a:contains(下一页)"));
    if (a === null) return "";
    var href = a.attr("href");
    if (!href) return "";
    return absUrl(href) || "";
}

// Chuan hoa URL trang truyen /txt/<id>.html ve dang goc ijjxsxzw.com
// (doi host cu ijjxs.com -> ijjxsxzw.com).
function normalizeStoryUrl(url) {
    var u = String(url || "");
    u = u.replace(/^https?:\/\/(www\.)?ijjxs\.com\//, "https://www.ijjxsxzw.com/");
    return u;
}

// Tu URL trang chi tiet /txt/<id>.html (hoac /read/<id>/) suy ra URL
// trang muc luc dang rut gon /read/<id>/ — dang nay tra day du danh
// sach chuong ma khong can doan <cat> trong URL chuong.
function readUrlFromDetail(url) {
    var u = normalizeStoryUrl(String(url || ""));
    var m = /\/txt\/(\d+)\.html?/.exec(u);
    if (m) return siteOrigin() + "/read/" + m[1] + "/";
    m = /\/read\/(\d+)\/?/.exec(u);
    if (m) return siteOrigin() + "/read/" + m[1] + "/";
    return u;
}
