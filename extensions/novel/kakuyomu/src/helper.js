// helper.js — Ham dung chung cho extension Kakuyomu (kakuyomu.jp).
//
// Site la Next.js (pages-router): trang danh sach / tim kiem / chi tiet
// deu nhung __NEXT_DATA__ chua Apollo state day du (Work, Episode,
// TableOfContentsChapter, rankedWorks/searchWorks connection). Trang chuong
// KHONG co __NEXT_DATA__ — doc HTML tinh truc tiep (.widget-episodeBody).
// Selector .widget-* cua base khoa301020 v1 da CHET tren trang chi tiet /
// danh sach (site doi giao dien), chi con dung o trang chuong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function htmlDecode(s) {
    var t = String(s === undefined || s === null ? "" : s);
    t = t.replace(/&quot;/g, '"');
    t = t.replace(/&#39;/g, "'");
    t = t.replace(/&amp;/g, "&");
    t = t.replace(/&lt;/g, "<");
    t = t.replace(/&gt;/g, ">");
    t = t.replace(/&nbsp;/g, " ");
    return t;
}

function cleanText(s) {
    var t = String(s === undefined || s === null ? "" : s);
    t = htmlDecode(t);
    t = t.replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    return t;
}

// Tach __NEXT_DATA__ (JSON trong the script cua trang Next.js) thanh object.
// Tra null neu khong tim thay hoac parse loi.
function extractNextData(htmlText) {
    var m = null;
    try {
        m = String(htmlText || "").match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
        if (!m) return null;
        return JSON.parse(m[1]);
    } catch (e) {
        return null;
    }
}

// Lay Apollo state tu __NEXT_DATA__ da parse. Tra null neu thieu.
function apolloState(nd) {
    if (!nd || !nd.props || !nd.props.pageProps) return null;
    var st = nd.props.pageProps.__APOLLO_STATE__;
    if (!st) return null;
    return st;
}

// Tim key trong ROOT_QUERY bat dau bang prefix (rankedWorks( / searchWorks(),
// vi key chua ca tham so query nen khong the doan truoc nguyen van.
function findConnectionKey(rootQuery, prefix) {
    if (!rootQuery) return null;
    for (var k in rootQuery) {
        if (k.indexOf(prefix) === 0) return k;
    }
    return null;
}

// GET HTML qua pacedFetch (co pacing + retry 429/405/503 + cooldown).
// Tra {text} khi thanh cong, {error} (tieng Viet) khi that bai.
function fetchKakuText(url) {
    var r = pacedFetch(url, {
        method: "GET",
        headers: { "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
        timeout: 20000,
        maxRetries: 2
    });
    if (!r.ok) {
        if (r.error === "cooldown" || r.status === 429 || r.status === 405) {
            return { error: rateLimitErrorMessage("カクヨム", "kakuyomu.jp", r.cooldownRemainingMs) };
        }
        if (r.status) return { error: "Không tải được trang (HTTP " + r.status + ")." };
        return { error: "Không kết nối được tới カクヨム, hãy kiểm tra mạng rồi thử lại." };
    }
    var text = "";
    try {
        text = r.res.text();
    } catch (e) {
        return { error: "Không đọc được trang trả về." };
    }
    if (!text) return { error: "Trang trả về rỗng." };
    return { text: text };
}

// Ten tac gia tu Work: uu tien activityName (ten hien thi), roi name.
function workAuthorName(state, work) {
    if (!work || !work.author || !work.author.__ref) return "";
    var acc = state[work.author.__ref];
    if (!acc) return "";
    return cleanText(acc.activityName || acc.name || "");
}

// Chuoi trang thai dang: RUNNING = dang ra, COMPLETED = hoan thanh.
function serialStatusText(status) {
    if (status === "COMPLETED") return "完結済";
    if (status === "RUNNING") return "連載中";
    return "";
}

// Mo ta ngan cho muc truyen trong danh sach: catchphrase + so tap + trang thai.
function workDescription(work) {
    var parts = [];
    var cp = cleanText(work.catchphrase || "");
    if (cp) parts.push(cp);
    var meta = "";
    if (work.publicEpisodeCount !== undefined && work.publicEpisodeCount !== null) {
        meta += work.publicEpisodeCount + "話";
    }
    var st = serialStatusText(work.serialStatus || "");
    if (st) meta += (meta ? "・" : "") + st;
    if (work.totalReviewPoint !== undefined && work.totalReviewPoint !== null) {
        meta += (meta ? "・" : "") + work.totalReviewPoint + "pt";
    }
    if (meta) parts.push(meta);
    return parts.join("\n");
}

// 1 muc truyen chuan cho danh sach (gen/search/suggests): name/link/
// description, cover rong (trang danh sach khong co anh bia that;
// anh ogImageUrl chi co o trang chi tiet).
function workItem(state, work) {
    return {
        name: cleanText(work.title || ""),
        link: BASE_URL + "/works/" + work.id,
        description: workDescription(work),
        cover: ""
    };
}

// Tach work id tu URL dang /works/<id> (co hoac khong co duoi /episodes/...).
function parseWorkId(url) {
    var m = String(url || "").match(/\/works\/(\d+)/);
    if (!m) return "";
    return m[1];
}

// Tach episode id tu URL dang /works/<workId>/episodes/<epId>.
function parseEpisodeId(url) {
    var m = String(url || "").match(/\/episodes\/(\d+)/);
    if (!m) return "";
    return m[1];
}

// Bang the loai: slug tren URL ranking -> ten tieng Nhat hien thi.
var GENRE_NAMES = {
    fantasy: "異世界ファンタジー",
    action: "現代ファンタジー",
    sf: "SF",
    love_story: "恋愛",
    romance: "ラブコメ",
    drama: "現代ドラマ",
    horror: "ホラー",
    mystery: "ミステリー",
    nonfiction: "エッセイ・ノンフィクション",
    history: "歴史・時代・伝奇",
    criticism: "創作論・評論",
    others: "詩・童話・その他"
};

// Ma the loai (enum trong __NEXT_DATA__) -> slug tren URL ranking.
var GENRE_ENUM_TO_SLUG = {
    FANTASY: "fantasy",
    ACTION: "action",
    SF: "sf",
    LOVE_STORY: "love_story",
    ROMANCE: "romance",
    DRAMA: "drama",
    HORROR: "horror",
    MYSTERY: "mystery",
    NONFICTION: "nonfiction",
    HISTORY: "history",
    CRITICISM: "criticism",
    OTHERS: "others"
};
