// helper.js — Ham dung chung cho Powanjuan (powanjuan.cc, 破万卷小说).
//
// Site truyen chu tieng Trung, EmpireCMS, GBK (kiem chung live 2026-11-16):
// - Trang chu: nav 9 the loai song (dsyq, tongren, wxxz, wxxz2, khjj,
//   yxjj, ghxy, jsls, sort); base Moleys v1 ghi THEM 4 the loai chet
//   (cyjk, xtfq, qcyq, dmtr — deu 404) nen bo.
// - Trang chu: danh sach .books div.bk (20 truyen), h3 co nhan [the loai]
//   + ten + hau to "(1-99)"/"(全本)", .booknews co tac gia, p mo ta.
// - Trang the loai (zen.js): ul.clearfix li (15 truyen/trang), strong > a
//   ten + hau to, .descript mo ta, .tips (tac gia / dung luong / ngay);
//   phan trang /<duong>/index_<N>.html, link 下一页.
// - Trang chi tiet /<the loai>/<id> (KHONG .html; dang .html cung 200
//   nhung link noi bo dung dang khong hau to): .desc h1 ten + hau to,
//   .descTip p (作者： / 时间：), .descInfo p mo ta; KHONG co anh bia.
//   Muc luc DAY DU tren trang chi tiet (div.catalog ul.clearfix li a):
//   sach mau 2460 chuong, sach 2: 721 chuong.
// - Trang chuong /view/<prefix>-<id>-<n>.html: prefix KHAC nhau theo
//   sach (17 o sach mau, 12 o sach 2) — luon lay URL tu muc luc, khong
//   tu suy prefix. Noi dung #mycontent (cac <p>); site phan trang theo
//   ~3000 ky tu chu khong theo chuong: 1 trang "第N节" co the chua 2
//   chuong + tieu de chuong ke; tra nguyen trang lam 1 chuong.
//   Chuong 1 co khoi dau trang (ten sach + 作者： + 简介： + tom tat,
//   roi dong "第N章 ..." — chap.js cat bo, GIU lai dong tieu de vi h1
//   chi co "第N节"); cac chuong sau bat dau thang vao noi dung.
// - Tim kiem: form POST /e/search/index.php (field keyboard, show=title,
//   classid=0) tren trang chu, class formSearch; POST truc tiep treo tu
//   VM (tarpit IP datacenter — tien le dingdian666/bixiange/jpxs123/ffxs8)
//   nen search.js dung WebView submit form nhu ffxs8/sjks88 v2.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge; www la domain chinh, https://www va
//   http://m. la mirror (cung noi dung, 200). powanjuan.me chet (000).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 9 the loai song (kiem chung live tu nav trang chu + tung trang 2026-11-16).
var CATEGORIES = [
    { title: "都市情感", slug: "dsyq", input: "/dsyq/" },
    { title: "同人小说", slug: "tongren", input: "/tongren/" },
    { title: "玄幻奇幻", slug: "wxxz", input: "/wxxz/" },
    { title: "武侠修真", slug: "wxxz2", input: "/wxxz2/" },
    { title: "科幻魔法", slug: "khjj", input: "/khjj/" },
    { title: "游戏竞技", slug: "yxjj", input: "/yxjj/" },
    { title: "鬼话悬疑", slug: "ghxy", input: "/ghxy/" },
    { title: "军事历史", slug: "jsls", input: "/jsls/" },
    { title: "总排行榜", slug: "sort", input: "/sort/" }
];

// The loai theo slug duong dan trong URL truyen.
function categoryBySlug(slug) {
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
}

// The loai theo URL truyen (/tongren/13276 -> 同人小说). Khong neo
// dau chuoi vi URL day du bat dau bang https://... .
function categoryFromUrl(url) {
    var m = /\/(dsyq|tongren|wxxz2|wxxz|khjj|yxjj|ghxy|jsls|sort)\//.exec(String(url));
    if (m) return categoryBySlug(m[1]);
    return null;
}

// Cat hau to "(全本)" / "(1-99)" khoi ten sach va nhan "[the loai]"
// o dau ten (trang /sort/ chen <label>[the loai]</label> vao <strong>).
function cleanBookName(name) {
    var n = cleanText(name);
    n = n.replace(/^\[[^\]]+\]\s*/, "");
    n = n.replace(/\s*\((全本|完本|已完结|连载中?)\)\s*$/, "");
    n = n.replace(/\s*\(\d+-\d+\)\s*$/, "");
    return n;
}

// Fetch 1 trang HTML GBK co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchPwDoc(url) {
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
            return { error: rateLimitErrorMessage("Powanjuan", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Powanjuan", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Parse 1 muc truyen trang chu (.books div.bk) thanh
// {name, cover, link, description, tag, host}. Tra null neu thieu ten/link.
function parseHomeCard(bk) {
    var linkEl = safeFirst(bk.select("a"));
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var link = absUrl(href);
    if (!link) return null;
    var h3 = safeFirst(bk.select("h3"));
    if (h3 === null) return null;
    var name = cleanBookName(h3.text());
    if (!name) return null;
    var desc = "";
    var pEl = safeFirst(bk.select("p"));
    if (pEl !== null) desc = cleanText(stripTags(pEl.html()));
    if (!desc) {
        var news = safeFirst(bk.select(".booknews"));
        if (news !== null) desc = cleanText(news.text());
    }
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse 1 muc truyen trang the loai (ul.clearfix li) thanh
// {name, cover, link, description, tag, host}. Tra null neu thieu ten/link.
// Chu y: tren trang /sort/, <strong> chua 2 link: nhan the loai
// <label>[<a href=/wxxz/>玄幻奇幻</a>]</label> dung TRUOC, roi moi
// link sach <a href="/wxxz/15725.html"> — lay link CUOI trong strong
// (link sach), khong lay link dau (link the loai).
function parseListCard(li) {
    var strongEl = safeFirst(li.select("strong"));
    var linkEl = null;
    if (strongEl !== null) {
        var anchors = strongEl.select("a");
        if (anchors.size() > 0) linkEl = anchors.get(anchors.size() - 1);
    }
    if (linkEl === null) linkEl = safeFirst(li.select("a"));
    if (linkEl === null) return null;
    var href = linkEl.attr("href");
    if (!href) return null;
    var link = absUrl(href);
    if (!link) return null;
    var name = cleanBookName(linkEl.text());
    if (!name) return null;
    var desc = "";
    var dEl = safeFirst(li.select(".descript"));
    if (dEl !== null) desc = cleanText(stripTags(dEl.html()));
    if (!desc) {
        var tips = safeFirst(li.select(".tips"));
        if (tips !== null) desc = cleanText(tips.text());
    }
    return {
        name: name,
        cover: "",
        link: link,
        description: desc,
        tag: "",
        host: siteOrigin()
    };
}

// Parse toan bo danh sach tren 1 trang: thu ul.clearfix li (trang the
// loai / ket qua tim kiem), roi .books div.bk (trang chu). Tra mang rong
// neu khong nhan ra dang nao.
function parseItemList(doc) {
    var items = [];
    var seen = {};
    var i = 0;
    var lis = doc.select("ul.clearfix li");
    for (i = 0; i < lis.size(); i++) {
        var one = parseListCard(lis.get(i));
        if (one !== null && !seen[one.link]) {
            seen[one.link] = true;
            items.push(one);
        }
    }
    if (items.length > 0) return items;
    var bks = doc.select(".books div.bk");
    for (i = 0; i < bks.size(); i++) {
        var two = parseHomeCard(bks.get(i));
        if (two !== null && !seen[two.link]) {
            seen[two.link] = true;
            items.push(two);
        }
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

// Chuan hoa URL trang truyen: dang /<the loai>/<id> (khong dau "/" cuoi)
// bi site 301 ve /<the loai>/<id>/ — them "/" truoc khi fetch vi
// runtime fetch khong theo redirect 301. Dang .html giu nguyen.
function normalizeStoryUrl(url) {
    var u = String(url || "");
    if (/\/\w+\/\d+$/.test(u)) return u + "/";
    return u;
}
