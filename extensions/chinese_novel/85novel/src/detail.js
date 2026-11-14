// detail.js — Chi tiet truyen (execute(url) -> doi tuong truyen).
//
// Trang /book/<id>.html (kiem chung live 2026-11-14):
// - Ten h1; tac gia span .ms-2 trong .hero-content (kem chu 著);
//   bia img trong .hero-content, src /cover/<id>.jpg (og:image cua site
//   hong dang https:https://... — sua double-scheme khi dung fallback).
// - Meta .text-base-700 span: the loai ‧ de tai ‧ so chu ‧ trang thai
//   (連載中/已完結) ‧ 整理: ‧ 異動:.
// - Mo ta .overscroll-contain p (co <p> rong — loc).
// - Tag span.bg-base-300 (loc "×"/rong); chuong moi nhat
//   a.text-primary-400 + thoi gian cap nhat .opacity-60.
// - ongoing suy tu trang thai: 已完結/完結 -> false; con lai -> true.
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

var DETAIL_GENRE_MAP = {
    "男生小說": "/list/1/",
    "女生小說": "/list/2/",
    "文學刊物": "/list/3/",
    "玄幻奇幻": "/list/667/",
    "玄幻": "/list/667/",
    "奇幻": "/list/667/",
    "仙俠武俠": "/list/668/",
    "仙俠": "/list/668/",
    "武俠": "/list/668/",
    "都市生活": "/list/669/",
    "都市": "/list/669/",
    "歷史軍事": "/list/670/",
    "歷史": "/list/670/",
    "軍事": "/list/670/",
    "遊戲競技": "/list/671/",
    "遊戲": "/list/671/",
    "科幻未來": "/list/672/",
    "科幻": "/list/672/",
    "懸疑靈異": "/list/728/",
    "懸疑": "/list/728/",
    "靈異": "/list/728/",
    "次元宅萌": "/list/734/",
    "輕小說": "/list/734/",
    "諸天無限": "/list/735/",
    "古代言情": "/list/673/",
    "現代言情": "/list/674/",
    "浪漫青春": "/list/733/",
    "玄幻仙俠": "/list/675/",
    "科幻遊戲": "/list/736/",
    "靈異懸疑": "/list/737/",
    "文學藝術": "/list/741/",
    "人文社科": "/list/742/",
    "經管勵志": "/list/743/",
    "經典文學": "/list/744/",
    "出版小說": "/list/745/",
    "少兒教育": "/list/746/",
    "連載中": "/list/finish1/",
    "已完結": "/list/finish2/",
    "完結": "/list/finish2/"
};

function execute(url) {
    url = normalizeInput(url);
    var r = pacedFetch(url, {
        headers: { "Accept-Language": "zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7" },
        minDelayMs: 30000,
        maxDelayMs: 30500,
        maxRetries: 0
    });
    if (!r.ok) return Response.error(pacedErrorMessage(r));
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e) {
        return Response.error("Không đọc được trang truyện từ 85 Novel.");
    }
    var titleEl = safeFirst(doc.select("h1"));
    var title = titleEl ? cleanText(titleEl.text()) : "";
    if (!title) {
        var ogTitleEl = safeFirst(doc.select("meta[property=og:title]"));
        title = ogTitleEl ? cleanText(ogTitleEl.attr("content")).replace(/\s*85小說網$/, "").replace(/\s*85小说网$/, "") : "";
    }
    if (!title) return Response.error("Không tìm thấy tên truyện trên trang chi tiết.");
    var author = getAuthor(doc);
    var cover = getCover(doc, url);
    var meta = parseMeta(doc);
    var description = parseDescription(doc);
    var latestEl = safeFirst(doc.select("a.text-primary-400"));
    var latest = latestEl ? cleanText(latestEl.text()) : "";
    var latestUpdatedEl = safeFirst(doc.select(".flex.gap-3 .opacity-60"));
    var latestUpdated = latestUpdatedEl ? cleanText(latestUpdatedEl.text()) : "";
    var tags = [];
    var tagEls = doc.select("span.bg-base-300");
    var i = 0;
    for (i = 0; i < tagEls.size(); i++) {
        var t = cleanText(tagEls.get(i).text());
        if (t && t !== "×" && t !== "x") tags.push(t);
    }
    var genres = buildGenres(meta, tags);
    var detailParts = [];
    if (meta.category) detailParts.push("分類: " + meta.category);
    if (meta.subCategory) detailParts.push("題材: " + meta.subCategory);
    if (meta.words) detailParts.push("字數: " + meta.words);
    if (meta.status) detailParts.push("狀態: " + meta.status);
    if (meta.organized) detailParts.push("整理: " + meta.organized);
    if (meta.changed) detailParts.push("異動: " + meta.changed);
    if (tags.length) detailParts.push("標籤: " + tags.join(", "));
    if (latest) detailParts.push("最新章節: " + latest);
    if (latestUpdated) detailParts.push(latestUpdated);
    var ongoing = true;
    if (meta.status && /(?:已完結|完結)/.test(meta.status)) ongoing = false;
    return Response.success({
        name: title,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join("<br>"),
        url: url,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: []
    });
}

function getCover(doc, url) {
    var imgEl = safeFirst(doc.select("img[src^=/cover/]"));
    if (!imgEl) imgEl = safeFirst(doc.select(".hero-content img"));
    var cover = imgEl ? imgEl.attr("src") : "";
    if (!cover) {
        var ogEl = safeFirst(doc.select("meta[property=og:image]"));
        cover = ogEl ? ogEl.attr("content") : "";
    }
    cover = normalizeCoverUrl(cover);
    if (cover) return cover;
    var m = /\/book\/(\d+)\.html/.exec(url || "");
    if (m) return BASE_URL + "/cover/" + m[1] + ".jpg";
    return "";
}

// og:image cua site hong dang "https:https://..." — sua lai.
function normalizeCoverUrl(url) {
    url = cleanText(url).replace(/^https:https:\/\//, "https://").replace(/^http:https:\/\//, "https://");
    if (!url || /nocover\.jpg$/i.test(url)) return "";
    return absUrl(url);
}

function getAuthor(doc) {
    var authorEl = safeFirst(doc.select(".hero-content .flex.items-baseline span, .flex.flex-col.gap-1 > span"));
    var author = authorEl ? cleanText(authorEl.text()).replace(/著/g, "").trim() : "";
    if (author) return author;
    var titleEl = safeFirst(doc.select("title"));
    var title = titleEl ? cleanText(titleEl.text()) : "";
    var m = /\(([^)]+)\)/.exec(title);
    return m ? m[1] : "";
}

function parseMeta(doc) {
    var spans = [];
    var els = doc.select(".hero-content .text-base-700 span, .w-full.z-20 .text-base-700 span");
    var i = 0;
    for (i = 0; i < els.size(); i++) {
        var text = cleanText(els.get(i).text());
        if (text) spans.push(text);
    }
    var values = [];
    for (i = 0; i < spans.length; i++) {
        if (spans[i] !== "整理:" && spans[i] !== "異動:") values.push(spans[i]);
    }
    var category = "";
    var subCategory = "";
    var words = "";
    var status = "";
    for (i = 0; i < values.length; i++) {
        var text = values[i];
        if (!words && /(?:萬字|字)$/.test(text)) {
            words = text;
        } else if (!status && /(?:連載中|已完結|完結|連載)/.test(text)) {
            status = text;
        } else if (!category) {
            category = text;
        } else if (!subCategory) {
            subCategory = text;
        }
    }
    return {
        category: category,
        subCategory: subCategory,
        words: words,
        status: status,
        organized: valueAfterLabel(spans, "整理:"),
        changed: valueAfterLabel(spans, "異動:")
    };
}

function valueAfterLabel(items, label) {
    var i = 0;
    for (i = 0; i < items.length; i++) {
        if (items[i] === label) {
            return (i + 1 < items.length) ? items[i + 1] : "";
        }
    }
    return "";
}

function parseDescription(doc) {
    var paragraphs = [];
    var ps = doc.select(".overscroll-contain p");
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var text = cleanText(ps.get(i).text());
        if (text) paragraphs.push(text);
    }
    if (paragraphs.length) return paragraphs.join("<br><br>");
    var ogEl = safeFirst(doc.select("meta[property=og:description]"));
    return ogEl ? cleanText(ogEl.attr("content")) : "";
}

function buildGenres(meta, tags) {
    var data = [];
    var seen = {};
    addDetailGenre(data, seen, meta.category);
    addDetailGenre(data, seen, meta.subCategory);
    addDetailGenre(data, seen, meta.status);
    var i = 0;
    for (i = 0; i < tags.length; i++) addDetailGenre(data, seen, tags[i]);
    return data;
}

function addDetailGenre(data, seen, title) {
    title = cleanText(title);
    if (!title || seen[title]) return;
    seen[title] = true;
    var input = DETAIL_GENRE_MAP[title];
    if (input) {
        data.push({ title: title, input: input, script: "gen.js" });
    } else {
        data.push({ title: title, input: title, script: "search.js" });
    }
}
