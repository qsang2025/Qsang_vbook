// helper.js — ham dung chung cua extension HHKUNGFU (hhkungfu.ee).
// Site WordPress theme HaLim (khao sat 2026-11-06):
//   the phim: <a class="halim-thumb" href="https://hhkungfu.ee/<slug>">
//     <img class="film-poster-img"> + <span class="status"> +
//     <span class="episode">Tập X/Y</span> + <h2 class="entry-title"> +
//     <p class="original_title"> (ten goc)
//   trang chi tiet: <h1> ten, <h2 class="org_title"> ten goc,
//     .list_cate a = the loai, .hh3d-new-ep .new-ep = tap moi nhat,
//     .hh3d-info = tinh trang / luot xem, .entry-content p = mo ta
//   tap phim: /watch-<slug>/tap-<N>-sv<S>.html, link tap co
//     data-post-id / data-ep="tap-N" / data-sv="1|2"
//   server xem: 2 nhom .halim-server (#Vietsub sv=1, #Thuyết Minh sv=2);
//     2 nut chat luong .get-eps: "1080P V1" data-type="tiktik",
//     "1080P V2" data-type="pro"
//   player lay qua AJAX GET /player/player.php?action=dox_ajax_player
//     &post_id=&chapter_st=tap-N&type=&sv= -> tra ve <iframe> embed
//     (streamfree.vip). Tap khong co video tra ve iframe not-found.jpg.
//   phan trang WP dang /page/N/ (khong phai ?page=N).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js
// vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Parse MOT the phim trong trang danh sach (trang chu, tim kiem,
// the loai, /moi-cap-nhat...). Tra ve item hoac null.
function parseFilmCard(a) {
    var href = a.attr("href");
    if (!href) return null;
    var path = href;
    if (path.indexOf(BASE_URL) === 0) path = path.substring(BASE_URL.length);
    // Chi nhan link dang /<slug> (1 doan); loai trang /watch-*, /page/*...
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    if (/^\/(moi-cap-nhat|top-xem-nhieu|hoan-thanh)/.test(path)) return null;

    var img = a.select("img.film-poster-img").first();
    if (img === null) img = a.select("img").first();
    if (img === null) return null;

    var name = "";
    var h2 = a.select("h2.entry-title").first();
    if (h2 !== null) name = cleanText(h2.text());
    if (!name) name = cleanText(a.attr("title"));
    if (!name) return null;

    var cover = unwrapCover(img.attr("src"));
    var orig = "";
    var op = a.select("p.original_title").first();
    if (op !== null) orig = cleanText(op.text());

    var status = "";
    var st = a.select("span.status").first();
    if (st !== null) status = cleanText(st.text());
    var ep = "";
    var epEl = a.select("span.episode").first();
    if (epEl !== null) ep = cleanText(epEl.text());
    var tag = status;
    if (ep) tag = tag ? tag + " · " + ep : ep;

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: orig,
        tag: tag,
        host: siteOrigin()
    };
}

// URL phan trang kieu WordPress: /page/N/ (trang 1 = URL goc).
function pageUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var base = String(url).replace(/\/+$/, "");
    var q = base.indexOf("?");
    if (q !== -1) return base.substring(0, q) + "/page/" + n + base.substring(q);
    return base + "/page/" + n;
}

// Parse ca trang danh sach (dung chung cho home/genre/search).
// Tra ve { items, next }: next = so trang ke ("" = het).
function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    doc.select("a.halim-thumb").forEach(function (a) {
        var item = parseFilmCard(a);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var maxPage = cur;
    doc.select("a[href]").forEach(function (a) {
        var m = String(a.attr("href")).match(/\/page\/(\d+)\/?/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    });

    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}

// So tap tu "tap-12" hoac "Tập 12".
function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

// URL AJAX lay player: GET /player/player.php?action=dox_ajax_player
// &post_id=&chapter_st=tap-N&type=tiktik|pro&sv=1|2.
function playerUrl(postId, chapter, sv, type) {
    return BASE_URL + "/player/player.php?action=dox_ajax_player" +
        "&post_id=" + postId +
        "&chapter_st=" + chapter +
        "&type=" + type +
        "&sv=" + sv;
}

// Boc URL anh goc: poster site nay la URL truc tiep tren hhkungfu.ee,
// khong qua proxy; chi can chuyen thanh URL tuyet doi.
function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src);
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}
