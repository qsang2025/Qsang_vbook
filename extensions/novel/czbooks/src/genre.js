// genre.js — danh sach the loai cua 小說狂人 (czbooks.net).
// Lay DONG bang cach quet link /c/{slug} tren trang chu — kiem chung
// live 2026-11-09 ca ban desktop lan mobile (2 UA): du 25 muc, dung ten
// hien thi nhu bang cung (gom ca 5 bang xep hang). Khong gioi han vao
// menu desktop (ul.site-desktop-menu khong co tren ban mobile) hay muc
// "依分類找書" cua drawer mobile (div.site-drawer-categories thieu muc
// 狂人原創 — no nam o muc 探索 phia tren). Link "狂人原創" trong muc
// 探索 cua drawer co them ky tu ↗ (icon aria-hidden) nen ten duoc loc
// bo ↗; link "更多 ↗" cua cac bang bi loai. Ket qua sap theo thu tu
// chuan cua bang cung de desktop/mobile tra ve cung mot thu tu, slug
// moi (chua co trong bang cung) noi them vao cuoi theo thu tu gap tren
// site. Neu fetch that bai, menu doi giao dien, hoac parse duoc < 10 muc
// thi FALLBACK ve bang cung 25 muc duoi day
// (slug lech ten hien thi, KHONG suy tu ten):
//   玄幻奇幻 /c/xuanhuan, 言情 /c/yanqing, 武俠仙俠 /c/xianxia,
//   軍事歷史 /c/lishi, 科幻未來 /c/wangyou (slug wangyou nhung ten la
//   科幻未來, khong phai 网游), 靈異玄幻 /c/lingyi, 女生同人 /c/tongren,
//   原創同人 /c/erciyuan, 耽美 /c/danmei, 百合 /c/baihe, 日系 /c/japan,
//   奇幻冒險 /c/fanatsy (slug sai chinh ta, giu nguyen), 電視劇 /c/drama,
//   情色工口 /c/herotic (NSFW), 耽美工口 /c/blerotic (NSFW),
//   經典文學 /c/classicbook, 推理 /c/suspense, 女性向 /c/girl,
//   短篇 /c/short, 狂人原創 /c/creator,
//   精選排行 /c/normal, 人氣榜 /c/all, 收藏榜 /c/favorite,
//   完本榜 /c/finish, 工口榜 /c/hot (NSFW, bang).
// KHONG co muc 都市 rieng — KHONG bia tab 都市.
// Moi muc tro ve book.js voi input /c/{slug} (trang the loai mac dinh
// sort 最新; bang xep hang mac dinh /day).
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/ (can BASE_URL, MIRROR_LIST, fetchDocWithFallback,
// cleanText).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Bang cung 25 muc — fallback khi khong lay duoc menu dong.
function fallbackGenres() {
    return [
        { title: "玄幻奇幻", input: "/c/xuanhuan", script: "book.js" },
        { title: "言情", input: "/c/yanqing", script: "book.js" },
        { title: "武俠仙俠", input: "/c/xianxia", script: "book.js" },
        { title: "軍事歷史", input: "/c/lishi", script: "book.js" },
        { title: "科幻未來", input: "/c/wangyou", script: "book.js" },
        { title: "靈異玄幻", input: "/c/lingyi", script: "book.js" },
        { title: "女生同人", input: "/c/tongren", script: "book.js" },
        { title: "原創同人", input: "/c/erciyuan", script: "book.js" },
        { title: "耽美", input: "/c/danmei", script: "book.js" },
        { title: "百合", input: "/c/baihe", script: "book.js" },
        { title: "日系", input: "/c/japan", script: "book.js" },
        { title: "奇幻冒險", input: "/c/fanatsy", script: "book.js" },
        { title: "電視劇", input: "/c/drama", script: "book.js" },
        { title: "情色工口", input: "/c/herotic", script: "book.js" },
        { title: "耽美工口", input: "/c/blerotic", script: "book.js" },
        { title: "經典文學", input: "/c/classicbook", script: "book.js" },
        { title: "推理", input: "/c/suspense", script: "book.js" },
        { title: "女性向", input: "/c/girl", script: "book.js" },
        { title: "短篇", input: "/c/short", script: "book.js" },
        { title: "狂人原創", input: "/c/creator", script: "book.js" },
        { title: "精選排行", input: "/c/normal", script: "book.js" },
        { title: "人氣榜", input: "/c/all", script: "book.js" },
        { title: "收藏榜", input: "/c/favorite", script: "book.js" },
        { title: "完本榜", input: "/c/finish", script: "book.js" },
        { title: "工口榜", input: "/c/hot", script: "book.js" }
    ];
}

function execute() {
    // Lay dong: quet link /c/{slug} tren trang chu. KHONG gioi han vao
    // menu desktop (ul.site-desktop-menu khong co tren ban mobile) hay
    // muc "依分類找書" cua drawer (div.site-drawer-categories thieu muc
    // 狂人原創 — no nam o muc 探索 phia tren): ca 2 cach deu lam mat
    // muc. Quet ca trang lay du 25 slug ca desktop lan mobile (da kiem
    // chung bang curl 2 UA); link "更多 ↗" cua cac bang bi loai, ten
    // duoc loc bo ky tu ↗, thu tu chuan hoa theo bang cung o duoi.
    var found = {};
    var seenOrder = [];
    try {
        var doc = fetchDocWithFallback(BASE_URL, MIRROR_LIST);
        if (doc) {
            var links = doc.select("a[href*=\"/c/\"]");
            links.forEach(function (a) {
                var href = a.attr("href") || "";
                var m = href.match(/\/c\/([^\/\?#]+)/);
                if (!m) return;
                var slug = m[1];
                // Bo ky tu ↗ (icon "more" nam trong the <a>) va trim lai.
                var title = cleanText(cleanText(a.text()).replace(/↗/g, ""));
                // Bo link "更多" o cac muc bang xep hang (trung slug
                // voi muc menu nhung khong co ten the loai).
                if (!title || title.indexOf("更多") === 0) return;
                if (found[slug]) return;
                found[slug] = title;
                seenOrder.push(slug);
            });
        }
    } catch (e) {
        found = {};
        seenOrder = [];
    }
    // Du muc (>= 10) thi dung danh sach dong; sap theo thu tu chuan
    // cua bang cung de desktop/mobile tra ve cung mot thu tu (site
    // doi vi tri hien thi thi thu tu van on dinh), slug moi (chua co
    // trong bang cung) noi them vao cuoi theo thu tu gap tren site.
    // It muc / fetch hong -> dung bang cung.
    if (seenOrder.length < 10) return Response.success(fallbackGenres());
    var items = [];
    var order = fallbackOrder();
    var i = 0;
    for (i = 0; i < order.length; i++) {
        if (found[order[i]]) {
            items.push({ title: found[order[i]], input: "/c/" + order[i], script: "book.js" });
        }
    }
    for (i = 0; i < seenOrder.length; i++) {
        if (fallbackOrderIndex(seenOrder[i]) === -1) {
            items.push({ title: found[seenOrder[i]], input: "/c/" + seenOrder[i], script: "book.js" });
        }
    }
    return Response.success(items);
}

// Thu tu chuan 25 muc (khop bang cung) — dung sap danh sach dong.
function fallbackOrder() {
    return ["xuanhuan", "yanqing", "xianxia", "lishi", "wangyou",
        "lingyi", "tongren", "erciyuan", "danmei", "baihe",
        "japan", "fanatsy", "drama", "herotic", "blerotic",
        "classicbook", "suspense", "girl", "short", "creator",
        "normal", "all", "favorite", "finish", "hot"];
}

function fallbackOrderIndex(slug) {
    var order = fallbackOrder();
    var i = 0;
    for (i = 0; i < order.length; i++) {
        if (order[i] === slug) return i;
    }
    return -1;
}
