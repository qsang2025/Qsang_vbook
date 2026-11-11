var BASE_URL = "https://quykhu.com";
try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    }
} catch (error) {}

// QuyKhu WAF requires Accept-Language: vi-VN,vi;q=0.9
var HEADERS = {
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
};

function normalizeUrl(url) {
    if (!url) return "";
    return url.replace(/^https?:\/\/(www\.)?(vozer\.io|quykhu\.com)/, BASE_URL);
}

function request(url, options) {
    options = options || {};
    var opts = {
        headers: {
            "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8"
        }
    };
    if (options.method) opts.method = options.method;
    if (options.body) opts.body = options.body;
    if (options.headers) {
        for (var k in options.headers) {
            opts.headers[k] = options.headers[k];
        }
    }
    if (options.queries) {
        var sep = url.indexOf("?") === -1 ? "?" : "&";
        var qParts = [];
        for (var qk in options.queries) {
            qParts.push(encodeURIComponent(qk) + "=" + encodeURIComponent(options.queries[qk]));
        }
        url = url + sep + qParts.join("&");
    }

    try {
        if (typeof rateLimitDelay === "function") {
            rateLimitDelay(BASE_URL, 500, 1500);
        }
    } catch (eDelay) {}

    var response = null;
    try {
        response = fetch(url, opts);
    } catch (eFetch) {
        return null;
    }

    if (response && response.status === 429) {
        var wait = 3;
        try {
            var ra = response.header("retry-after");
            if (ra) wait = parseInt(ra, 10) || 3;
        } catch (eH) {}
        try {
            if (typeof sleep !== "undefined" && sleep) {
                sleep(Math.min(wait, 10) * 1000);
            }
        } catch (eS) {}
        try {
            response = fetch(url, opts);
        } catch (eRetry) {
            return null;
        }
    }
    return response;
}

function fetchHtml(url) {
    var response = request(url);
    if (!response || !response.ok) return null;
    return response.html();
}

function parseCards(doc) {
    if (!doc) return Response.error("Không thể đọc danh sách truyện");
    var list = [];
    var items = doc.select(".qk-post-card");
    for (var i = 0; i < items.size(); i++) {
        var e = items.get(i);
        var titleEl = e.select(".qk-post-card__title").first();
        if (titleEl) {
            var descEl = e.select(".qk-post-card__info > p").first();
            list.push({
                name: titleEl.text(),
                link: titleEl.attr("href"),
                cover: e.select(".qk-post-card__thumb img").attr("src"),
                description: descEl ? descEl.text() : "",
                host: BASE_URL
            });
        }
    }
    var nextEl = doc.select(".qk-home-pagination a[rel=next]");
    var next = "";
    if (nextEl && nextEl.attr("href")) {
        var m = nextEl.attr("href").match(/page=(\d+)/);
        if (m) next = m[1];
    }
    return Response.success(list, next);
}

function saveCsrf(doc) {
    if (!doc) return "";
    var token = doc.select("meta[name=csrf-token]").attr("content");
    if (token) {
        try {
            cacheStorage.setItem("csrf", token);
        } catch (e) {}
    }
    return token;
}

function postChapters(endpoint, page, token) {
    return request(endpoint, {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": token,
            "Origin": BASE_URL
        },
        body: JSON.stringify({ page: page })
    });
}

function chapterLinks(html) {
    return Html.parse(html).select(".chapter-list-flow-item a, a.lazy-catalog-row[href]");
}

function chapterEndpoint(doc) {
    return doc.select("[data-chapter-list]").attr("data-endpoint");
}
