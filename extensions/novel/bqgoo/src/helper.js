// helper.js — helper rieng cua Bqgoo (bqgoo.cc).
// Chi chua ham thuong, khong load them file nao khac. Cac script dung
// thi load file nay sau file config.js, config-helpers.js,
// fetch-helpers.js, rate-limit.js (va file cleanHtml.js neu can).
// Ham o day chi duoc GOI trong execute(), luc do moi file da load xong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Tach id truyen tu URL dang /shu/<id>/, /shu/<id>/<n>.html,
// ?id=<id> hoac duoi URL la /<id>. Tra ve so, hoac 0 neu khong co.
function parseBookId(url) {
    var s = String(url || "");
    var m = s.match(/\/shu\/(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/[?&]id=(\d+)/);
    if (m) return parseInt(m[1], 10);
    m = s.match(/\/(\d+)\/?$/);
    if (m) return parseInt(m[1], 10);
    return 0;
}

// Link trang chi tiet chuan cua truyen (domain doc truyen).
function bookUrl(id) {
    return BOOK_ORIGIN + "/shu/" + id + "/";
}

// Link chuong: /shu/<id>/<chapterid>.html (khop dang URL that cua site).
function chapterUrl(id, chapterid) {
    return BOOK_ORIGIN + "/shu/" + id + "/" + chapterid + ".html";
}

// Bia: https://www.bqg349.xyz/bookimg/<floor(id/1000)>/<id>.jpg
// (da kiem chung 200: 1985 -> /bookimg/1/1985.jpg).
function coverUrl(id) {
    var folder = Math.floor(id / 1000);
    return COVER_HOST + "/bookimg/" + folder + "/" + id + ".jpg";
}

// Doi ten the loai (sortname trong /api/book) ve key cua /api/sort.
// Tra ve "" neu ten khong nam trong 8 the loai cua site.
function sortKeyForName(sortname) {
    var name = cleanText(sortname || "");
    if (name === "玄幻") return "xuanhuan";
    if (name === "武侠") return "wuxia";
    if (name === "都市") return "dushi";
    if (name === "历史") return "lishi";
    if (name === "网游") return "wangyou";
    if (name === "科幻") return "kehuan";
    if (name === "女生") return "nvsheng";
    if (name === "完本") return "finish";
    return "";
}

// Mot muc truyen tu entry JSON cua API (search / index / sort):
// {id, title, author, intro, sortname}. Link luon la URL chi tiet
// tren BOOK_ORIGIN de detail.js / toc.js nhan dang duoc id.
function bookItem(entry) {
    var e = entry || {};
    var id = parseInt(e.id, 10);
    if (isNaN(id) || id <= 0) return null;
    var name = cleanText(e.title || "");
    if (!name) return null;
    var tag = cleanText(e.author || "");
    if (e.sortname) tag = tag + (tag ? " · " : "") + cleanText(e.sortname);
    return {
        name: name,
        cover: coverUrl(id),
        link: bookUrl(id),
        description: cleanText(e.intro || ""),
        tag: tag,
        host: BOOK_ORIGIN
    };
}

// Lay JSON tu API co failover qua mirror: thu BASE_URL truoc, roi tung
// mirror trong MIRROR_LIST (duong dan path giu nguyen, chi doi host).
// Dung fetchJson() cua file fetch-helpers.js (kiem challenge truoc khi
// parse). Tra ve object da parse hoac null khi tat ca host deu hong.
function fetchJsonWithFallback(path) {
    var bases = [BASE_URL];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        bases.push(MIRROR_LIST[i]);
    }
    for (i = 0; i < bases.length; i++) {
        var base = String(bases[i]).replace(/\/+$/, "");
        var j = fetchJson(base + path);
        if (j) return j;
    }
    return null;
}

// Text thuong: moi doan 1 dong (\n don) -> <p>...</p> (giong mau qimao).
function plainToHtml(plain) {
    var lines = String(plain || "").split(/\r\n|\n|\r/);
    var html = "";
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        var p = cleanText(lines[i]);
        if (p) html += "<p>" + p + "</p>";
    }
    return cleanHtml(html);
}
