// helper.js — ham dung chung cua extension Hoat Hinh 3D Trung Quoc.
//
// Nguon: API JSON cong khai https://phimapi.com (khao sat 2026-11-06):
//   danh sach:  /v1/api/danh-sach/hoat-hinh?country=trung-quoc
//               &category=<slug>&page=N — loc dung donghua (type hoathinh)
//   the loai:   /v1/api/the-loai -> {items:[{name, slug}]}; KHONG co
//               huyen-huyen / kiem-hiep (2 slug nay tra 404), dung slug
//               that: than-thoai, vo-thuat, vien-tuong, co-trang, khoa-hoc...
//   chi tiet:   /phim/<slug> -> {movie, episodes:[{server_name,
//               server_data:[{name, slug, link_m3u8, link_embed}]}]}
//   tim kiem:   /v1/api/tim-kiem?keyword=<q>&page=N
//   anh: thumb_url/poster_url dang tuong doi -> tien to https://phimimg.com/
//   phan trang: data.params.pagination {currentPage, totalPages}
// Luu y: link_m3u8 tra 404 tu IP datacenter cua VM (CDN chan IP may chu);
// kiem chung phat that su chi co tren may that / khi bam Play trong app.
//
// Load: file nay duoc load() boi cac script khac, nen KHONG duoc load()
// them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var CDN_IMAGE = "https://phimimg.com";

// GET JSON tu API. Tra ve doi tuong JSON hoac null neu loi.
function fetchJson(url) {
    var res = null;
    try {
        res = fetch(url, { headers: { "Accept": "application/json", "Referer": BASE_URL + "/" } });
    } catch (e) {
        console.log("fetchJson loi: " + e);
        return null;
    }
    if (!res || !res.ok) {
        console.log("fetchJson HTTP " + (res ? res.status : 0) + ": " + url);
        return null;
    }
    try {
        return res.json();
    } catch (e2) {
        console.log("fetchJson .json() loi: " + e2);
        return null;
    }
}

// Anh thumb/poster cua API la duong dan tuong doi (uploads/...) -> ghep
// voi CDN anh https://phimimg.com/ (APP_DOMAIN_CDN_IMAGE).
function coverUrl(u) {
    var s = String(u === undefined || u === null ? "" : u);
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    if (s.charAt(0) === "/") return CDN_IMAGE + s;
    return CDN_IMAGE + "/" + s;
}

// Ghe / thay so trang ?page=N vao URL danh sach cua API.
function apiPagedUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n < 1) n = 1;
    if (url.indexOf("page=") !== -1) return url.replace(/([?&])page=\d+/, "$1page=" + n);
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "page=" + n;
}

// Parse trang danh sach/tim kiem cua API thanh {items, next}.
// items: {name, cover, link, description, tag, host}; next: so trang ke
// ("") = het. Link muc tro ve detail API /phim/<slug>.
function listItems(json) {
    var out = { items: [], next: "" };
    if (!json || !json.data || !json.data.items) return out;
    var arr = json.data.items;
    var seen = {};
    var i = 0;
    for (i = 0; i < arr.length; i++) {
        var it = arr[i];
        if (!it || !it.slug) continue;
        var link = BASE_URL + "/phim/" + it.slug;
        if (seen[link]) continue;
        seen[link] = true;
        var tag = "";
        if (it.episode_current) tag = it.episode_current;
        if (it.quality) tag = tag ? tag + " · " + it.quality : it.quality;
        if (it.lang) tag = tag ? tag + " · " + it.lang : it.lang;
        var desc = it.origin_name || "";
        if (it.year) desc = desc ? desc + " (" + it.year + ")" : String(it.year);
        out.items.push({
            name: it.name || it.origin_name || it.slug,
            cover: coverUrl(it.poster_url || it.thumb_url),
            link: link,
            description: desc,
            tag: tag,
            host: BASE_URL
        });
    }
    var pg = json.data.params && json.data.params.pagination;
    if (pg) {
        var cur = parseInt(pg.currentPage, 10);
        var total = parseInt(pg.totalPages, 10);
        if (!isNaN(cur) && !isNaN(total) && cur < total) out.next = String(cur + 1);
    }
    return out;
}

// Slug phim tu URL chi tiet /phim/<slug> (co the kem ?ep=...).
function slugFromDetailUrl(url) {
    var m = String(url || "").match(/\/phim\/([^\/\?&#]+)/);
    return m ? m[1] : "";
}

// Slug tap tu query ?ep=<slug-tap> trong URL muc luc (toc.js dat).
function episodeSlugFromUrl(url) {
    var m = String(url || "").match(/[?&]ep=([^&#]+)/);
    return m ? decodeURIComponent(m[1]) : "";
}
