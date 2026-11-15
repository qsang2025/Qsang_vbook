// helper.js — Ham dung chung cho Sjks88 (sjks88.com, 手机小说).
//
// Site truyen chu tieng Trung, EmpireCMS, GBK (kiem chung live 2026-11-16):
// - Trang chu: nav 14 the loai + /latest/ (最新小说) + /ranking/ (总排行榜).
//   Trang chu khong co danh sach truyen — home.js chi tra tab tinh.
// - Trang danh sach (/xuanhuan/, /latest/, /ranking/ ...): the
//   ul.list li (20 truyen/trang), a.title > b ten + hau to "(1-99)",
//   .bookWriter span tac gia + .pubdate, p.desc mo ta; phan trang
//   /<duong>/index_<N>.html, link 下一页 trong ul.page. Trang /ranking/
//   them nhan <label>[the loai]</label> truoc ten — cat bo.
// - Trang truyen /<the loai>/<id>.html: h1 ten + hau to "(1-99)" (so
//   chuong da cu — khong dung de dem chuong), .autor2 x3 (作者 / 更新时间 /
//   类别), mo ta .main_content .desc; KHONG co anh bia; muc luc DAY DU
//   tren trang chi tiet (div.list li a, 240 chuong o sach mau).
// - Trang chuong /<the loai>/<id>/<n>.html: noi dung div.content (cac
//   <p>); chuong 1 co khoi dau trang (ten sach + 作者： + 简介： + tom tat
//   mo ta, roi dong "第N章 ...") — chap.js cat bo; cac chuong sau bat
//   dau thang vao noi dung. Khong co trang chia trong chuong (nav
//   artic_pages chi co 首节/上一节/下一节/尾节/目录).
// - Tim kiem: form POST /e/search/indexsearch.php (field keyboard,
//   show=title, classid=0) tren trang chu; ket qua
//   /e/search/result/index.php?page=<0-based>&searchid=<id> (kieu
//   EmpireCMS). POST truc tiep treo tu VM (tarpit IP datacenter — tien
//   le dingdian666/bixiange/jpxs123/ffxs8) nen search.js dung WebView
//   submit form nhu bixiange/jpxs123/ffxs8.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge; www la domain chinh, https://www va
//   http://m. la mirror (cung noi dung, 200).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 22 the loai (kiem chung live tu nav trang chu + <title> tung trang
// the loai 2026-11-16). Luu y 2 diem base Moleys v1 ghi SAI: Direct2
// thuc te la 诸天 (khong phai 情感), Direct4 商道 tra 403 nen bo.
var CATEGORIES = [
    { title: "网游", slug: "wangyou", input: "/wangyou/" },
    { title: "玄幻", slug: "xuanhuan", input: "/xuanhuan/" },
    { title: "修真", slug: "xiuzhen", input: "/xiuzhen/" },
    { title: "科幻", slug: "kehuan", input: "/kehuan/" },
    { title: "穿越", slug: "chuanyue", input: "/chuanyue/" },
    { title: "武侠", slug: "wuxia", input: "/wuxia/" },
    { title: "历史", slug: "Direct6", input: "/Direct6/" },
    { title: "军事", slug: "Direct5", input: "/Direct5/" },
    { title: "官场", slug: "guanchang", input: "/guanchang/" },
    { title: "同人", slug: "erciyuan", input: "/erciyuan/" },
    { title: "奇幻", slug: "Direct3", input: "/Direct3/" },
    { title: "悬疑", slug: "Suspense", input: "/Suspense/" },
    { title: "都市", slug: "ds", input: "/ds/" },
    { title: "诸天", slug: "Direct2", input: "/Direct2/" },
    { title: "鬼话", slug: "Direct1", input: "/Direct1/" },
    { title: "言情", slug: "Direct7", input: "/Direct7/" },
    { title: "耽美", slug: "danmei", input: "/danmei/" },
    { title: "传记", slug: "zhuanji", input: "/zhuanji/" },
    { title: "精品", slug: "xiaoshuo", input: "/xiaoshuo/" },
    { title: "乡土", slug: "xt", input: "/xt/" },
    { title: "纪实", slug: "jishi", input: "/jishi/" },
    { title: "排行", slug: "ranking", input: "/ranking/" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// The loai theo URL truyen (/xuanhuan/53251.html -> 玄幻). Khong neo
// dau chuoi vi URL day du bat dau bang https://... .
function categoryFromUrl(url) {
    var m = /\/(Direct1|Direct2|Direct3|Direct5|Direct6|Direct7|xuanhuan|wangyou|xiuzhen|kehuan|chuanyue|wuxia|guanchang|erciyuan|Suspense|ds|danmei|zhuanji|xiaoshuo|xt|jishi|ranking)\//.exec(String(url));
    if (m) return categoryBySlug(m[1]);
    return null;
}

// Cat hau to "(全本)" / "(1-99)" khoi ten sach va nhan "[the loai]"
// o dau ten (trang /ranking/ chen <label>[穿越]</label> vao <b>).
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/^\[[^\]]+\]\s*/, "");
    n = n.replace(/\s*\((全本|完本|已完结|连载中?)\)\s*$/, "");
    n = n.replace(/\s*\(\d+-\d+\)\s*$/, "");
    return n;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchSjDoc(url) {
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
            return { error: rateLimitErrorMessage("Sjks88", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Sjks88", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Parse 1 the ul.list li (trang the loai / moi nhat / xep hang) thanh
// muc truyen {name, cover, link, description, tag, host}.
// Tra null neu thieu ten hoac link.
function parseListCard(li) {
    var linkEl = safeFirst(li.select("a.title"));
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var link = absUrl(href);
    if (!link) return null;
    var name = "";
    var bEl = safeFirst(linkEl.select("b"));
    if (bEl !== null) name = cleanBookName(bEl.text());
    if (!name) name = cleanBookName(linkEl.text());
    if (!name) return null;
    var author = "";
    var auEl = safeFirst(li.select("div.bookWriter span"));
    if (auEl !== null) author = cleanText(auEl.text()).replace(/^作者[:：]\s*/, "");
    var desc = "";
    var dEl = safeFirst(li.select("p.desc"));
    if (dEl !== null) desc = cleanText(stripTags(dEl.html()));
    if (!desc && author) desc = "作者：" + author;
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse toan bo danh sach tren 1 trang: thu ul.list li (trang the loai
// / moi nhat / xep hang / ket qua tim kiem), neu khong co thi thu moi
// the a.title (trang ket qua tim kiem dung template khac). Tra mang
// rong neu khong nhan ra dang nao.
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var i = 0;
    var lis = doc.select("ul.list li");
    for (i = 0; i < lis.size(); i++) {
        var one = parseListCard(lis.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    if (items.length > 0) return items;
    var anchors = doc.select("a.title");
    for (i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var href = a.attr("href");
        if (!href) continue;
        var link = absUrl(href);
        if (!link || seen[link]) continue;
        var name = "";
        var bEl = safeFirst(a.select("b"));
        if (bEl !== null) name = cleanBookName(bEl.text());
        if (!name) name = cleanBookName(a.text());
        if (!name) continue;
        seen[link] = true;
        items.push({
            name: name,
            cover: "",
            link: link,
            description: "",
            tag: "",
            host: siteOrigin()
        });
    }
    return items;
}

// Tim link "下一页" tren trang danh sach; tra ve URL tuyet doi
// (hoac "" neu het trang).
function nextPageHref(doc) {
    var links = doc.select("ul.page a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href");
            if (!href) return "";
            return absUrl(href);
        }
    }
    return "";
}
