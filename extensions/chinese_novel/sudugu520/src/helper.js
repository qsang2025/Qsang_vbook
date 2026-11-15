// helper.js — Ham dung chung cho Sudugu520 (sudugu520.com).
//
// Site truyen chu tieng Trung, 速读谷 (kiem chung live 2026-11-15):
// - Trang chu: nav /paihang/ (排行榜), /wanjie/ (完结小说), /zuixin/
//   (最新更新), /fenlei/ (小说分类, 15 the loai). Trang danh sach dung
//   the div.item (10 truyen/trang), phan trang /<duong>/<N>.html.
// - The loai: 15 muc, duong dan /xuanhuan/, /dushi/, /xianxia/, /qing/,
//   /lishi/, /kehuan/, /qihuan/, /youxi/, /xuanyi/, /junshi/,
//   /zhutianwuxian/, /wuxia/, /tiyu/, /guanchang/, /yanqing/.
// - Tim kiem: GET /i/sor.aspx?key=<tu khoa> (form o /i/so.aspx),
//   10 ket qua/trang, phan trang ?key=<tu khoa>&p=<N>. Da tim thay
//   (rescan #10 bo sot vi form nam tren trang rieng, khong phai trang chu).
// - Trang truyen /<id>/: the div.item (anh bia /files/cover/...,
//   h1 ten + so chu, span trang thai + the loai, link /zuozhe/?tag=
//   ten tac gia), mo ta div.des p, muc luc day du trong #list (756
//   chuong — ca phan "最新三章节" 3 chuong moi nhat nam NGOAI #list
//   nen toc.js chi quet #list a).
// - Trang chuong /<id>/<chapid>.html: noi dung trong div.con (cac <p>),
//   tieu de chuong trong h1 dang "Ten truyen > Ten chuong". Chuong chia
//   nhieu trang: link "下一页" toi -2.html, -3.html, -4.html... (ch.1
//   苟在两界修仙 co 4 trang, tong ~3.476 ky tu — rescan #10 noi 2 trang
//   la thieu). chap.js ghep tat ca trang chia.
// - Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview.
// - Khong co Cloudflare challenge; www la domain duy nhat da kiem chung.
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG
// duoc tai them file nao khac o day. Script nao dung helper nay phai tai
// truoc theo thu tu: file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// 15 the loai (kiem chung live tu /fenlei/ 2026-11-15, kem so luong).
var GENRES = [
    { title: "玄幻小说", input: "/xuanhuan/" },
    { title: "都市小说", input: "/dushi/" },
    { title: "仙侠小说", input: "/xianxia/" },
    { title: "轻小说", input: "/qing/" },
    { title: "历史小说", input: "/lishi/" },
    { title: "科幻小说", input: "/kehuan/" },
    { title: "奇幻小说", input: "/qihuan/" },
    { title: "游戏小说", input: "/youxi/" },
    { title: "悬疑小说", input: "/xuanyi/" },
    { title: "军事小说", input: "/junshi/" },
    { title: "诸天无限", input: "/zhutianwuxian/" },
    { title: "武侠小说", input: "/wuxia/" },
    { title: "体育小说", input: "/tiyu/" },
    { title: "官场小说", input: "/guanchang/" },
    { title: "言情小说", input: "/yanqing/" }
];

// Duong dan the loai theo ten day du (dung cho detail.js).
function genrePathByName(name) {
    var n = cleanText(name);
    var i = 0;
    for (i = 0; i < GENRES.length; i++) {
        if (GENRES[i].title === n) return GENRES[i].input;
    }
    // Trang ket qua tim kiem viet gon ("玄幻" thay vi "玄幻小说").
    for (i = 0; i < GENRES.length; i++) {
        if (GENRES[i].title.indexOf(n) === 0 && n.length >= 2) return GENRES[i].input;
    }
    return "";
}

// Fetch 1 trang HTML co pacing + mirror failover; tra ve
// { doc: Document } hoac { error: "tieng Viet" }.
function fetchSgDoc(url) {
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
            return { error: rateLimitErrorMessage("Sudugu520", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("Sudugu520", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
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

// Parse 1 the div.item thanh muc truyen {name, cover, link,
// description, tag, host}. Tra null neu thieu ten hoac link.
function parseItemCard(card) {
    var linkEl = safeFirst(card.select("div.itemtxt h3 a"));
    if (linkEl === null) linkEl = safeFirst(card.select("div.itemtxt h1 a"));
    if (linkEl === null) return null;
    var name = cleanText(linkEl.text());
    var link = absUrl(linkEl.attr("href"));
    if (!name || !link) return null;
    var cover = "";
    var imgEl = safeFirst(card.select("a img"));
    if (imgEl !== null) cover = absUrl(imgEl.attr("src")) || "";
    var spans = card.select("div.itemtxt p span");
    var status = spans.size() > 0 ? cleanText(spans.get(0).text()) : "";
    var genre = spans.size() > 1 ? cleanText(spans.get(1).text()) : "";
    var author = "";
    var authorEl = safeFirst(card.select("div.itemtxt p a[href^=\"/zuozhe/\"]"));
    if (authorEl !== null) {
        author = cleanText(authorEl.text()).replace(/^作者：/, "");
    }
    var desc = status;
    if (genre) desc = desc ? (desc + " · " + genre) : genre;
    if (author) desc = desc ? (desc + " · " + author) : author;
    return {
        name: name,
        cover: cover,
        link: link,
        description: desc,
        tag: genre,
        host: siteOrigin()
    };
}

// Parse toan bo the div.item tren 1 trang danh sach.
function parseItemList(doc) {
    var items = [];
    var cards = doc.select("div.item");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var one = parseItemCard(cards.get(i));
        if (one !== null) items.push(one);
    }
    return items;
}

// Tim link "下一页" tren trang danh sach; tra ve duong dan tuyet doi
// (hoac "" neu het trang). Xu ly ca dang /xuanhuan/2.html va
// ?key=...&p=2 (tim kiem).
function nextPageHref(doc, pageUrl) {
    var links = doc.select("a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var a = links.get(i);
        if (cleanText(a.text()) === "下一页") {
            var href = a.attr("href");
            if (!href) return "";
            if (href.charAt(0) === "?") {
                // Tim kiem: "?key=...&p=2" — ghep vao path cua trang hien tai
                // (absUrl chi nhan 1 tham so nen khong xu ly duoc dang nay).
                var base = String(pageUrl).split("?")[0];
                return base + href;
            }
            return absUrl(href);
        }
    }
    return "";
}
