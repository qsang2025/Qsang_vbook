// gen.js — Danh sach truyen & Bang xep hang Tiem Truyen Chu
load('config.js');

function parseStoryListFromJson(json) {
    var list = [];
    var wrapped = unwrapList(json);
    var items = wrapped.items;
    if (!items || !items.length) return list;
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        if (!it || !it.id) continue;
        var cover = it.cover_url || it.poster || "";
        if (cover && cover.indexOf("http") !== 0) {
            cover = BASE_URL + (cover.charAt(0) === "/" ? "" : "/") + cover;
        }
        var author = it.author || "Không rõ";
        var chapInfo = it.latest_chapter_title || (it.total_chapters ? (it.total_chapters + " chương") : "");
        var desc = author;
        if (chapInfo) {
            desc = desc ? (desc + " • " + chapInfo) : chapInfo;
        }
        list.push({
            name: it.title || ("Truyện #" + it.id),
            link: BASE_URL + "/truyen/" + it.id,
            cover: cover,
            description: desc,
            host: BASE_URL
        });
    }
    return list;
}

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var raw = url ? String(url).trim() : "stories?sort=updated";
    var apiPath = raw;

    if (raw.indexOf("http") === 0) {
        var m = raw.match(/\/api\/v1\/(.+)$/i);
        if (m && m[1]) {
            apiPath = m[1];
        } else if (raw.indexOf("cat=") !== -1) {
            var mc = raw.match(/[?&]cat=([^&]+)/i);
            apiPath = mc && mc[1] ? ("stories?cat=" + mc[1]) : "stories?sort=updated";
        } else {
            apiPath = "stories?sort=updated";
        }
    } else if (raw.indexOf("/api/v1/") === 0) {
        apiPath = raw.replace(/^\/api\/v1\//, "");
    } else if (raw.indexOf("/danh-sach") === 0) {
        var qIdx = raw.indexOf("?");
        apiPath = qIdx !== -1 ? ("stories" + raw.substring(qIdx)) : "stories?sort=updated";
    } else if (raw.indexOf("/bang-xep-hang") === 0) {
        var qIdx2 = raw.indexOf("?");
        apiPath = qIdx2 !== -1 ? ("ranking" + raw.substring(qIdx2)) : "ranking?by=views";
    }

    var sep = apiPath.indexOf("?") !== -1 ? "&" : "?";
    var apiUrl = BASE_URL + "/api/v1/" + apiPath + sep + "page=" + p + "&limit=30";

    var json = fetchJson(apiUrl);
    var wrapped = unwrapList(json);
    if (wrapped.items) {
        var list = parseStoryListFromJson(json);
        var totalPages = wrapped.totalPages ? parseInt(wrapped.totalPages, 10) : 1;
        var next = (p < totalPages && list.length > 0) ? String(p + 1) : "";
        return Response.success(list, next);
    }

    // Fallback HTML neu API loi
    // Lưu ý: selector .story-item chưa kiểm chứng từ 2026-11-08 (trang web
    // hiện là interstitial "tải app" khi chưa đăng nhập nên fallback này gần
    // như luôn rơi vào isInterstitialDoc). Nếu site đổi giao diện thì xóa
    // fallback thay vì sửa mù.
    var htmlUrl = normalizeUrl(raw);
    var res = null;
    try {
        res = fetch(htmlUrl, { headers: buildHeaders() });
    } catch (eFetch) {
        res = null;
    }
    if (!res || !res.ok) {
        return Response.error("Không thể tải danh sách truyện từ Tiệm Truyện Chữ.");
    }
    var doc = res.html();
    if (isInterstitialDoc(doc)) {
        return Response.error("Danh sách truyện trên Tiệm Truyện Chữ hiện chỉ mở được trong ứng dụng (trang tải app). Hãy mở Trình duyệt trong vBook để đăng nhập rồi thử lại.");
    }
    var items = doc.select(".story-item");
    var htmlList = [];
    for (var i = 0; i < items.size(); i++) {
        var el = items.get(i);
        var titleEl = el.select("a.story-title, a[href*='/truyen/']").first();
        if (!titleEl) continue;
        var name = titleEl.text().trim();
        var href = titleEl.attr("href");
        if (!name || !href) continue;
        var imgEl = el.select("img.story-poster, img").first();
        var cover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
        if (cover && cover.indexOf("http") !== 0) {
            cover = normalizeUrl(cover);
        }
        var meta = el.select(".story-meta").text().trim();
        htmlList.push({
            name: name,
            link: normalizeUrl(href),
            cover: cover,
            description: meta,
            host: BASE_URL
        });
    }
    if (htmlList.length === 0) {
        return Response.error("Không tải được danh sách truyện từ Tiệm Truyện Chữ.");
    }
    var nextHtml = htmlList.length >= 20 ? String(p + 1) : "";
    return Response.success(htmlList, nextHtml);
}
