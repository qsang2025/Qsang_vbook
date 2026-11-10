// search.js — tim kiem theo tu khoa cua 稷下書院 (novel543.com).
// GET /search/<tu-khoa-url-encoded> (da kiem chung JS cua site:
// window.location.href = "/search/" + kw). Ket qua du kien:
// div.list.search-list > ul.list > li.media (cung cau truc item nhu
// trang the loai — xem helper.js parseBookItem); phan trang ?page=N.
//
// DAC BIET — Cloudflare: tu VM, /search/ tra trang challenge
// "Just a moment..." (HTTP 403). fetchDocWithFallback da thu browser
// fallback; neu van that bai thi dung fetchWithChallengeHandler de tra
// loi tieng Viet co huong dan qua challenge trong trinh duyet cua app
// (mau biquge). Tren may that (IP di dong) co the khong bi challenge —
// kiem chung bang test tren may.
// Tu khoa khop dung 1 truyen co the redirect thang ve trang chi tiet
// (nhan ra bang meta og:novel:book_name) — tra ve 1 item duy nhat nhu sto9.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js, challenge-handler.js, rate-limit.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');
load('challenge-handler.js');
load('rate-limit.js');

function ogContent(doc, prop) {
    var el = doc.select('meta[property="' + prop + '"]').first();
    if (el === null) return "";
    return cleanText(el.attr("content"));
}

function execute(query, page) {
    query = query || "";
    if (!query) return Response.error("Chưa nhập từ khóa tìm kiếm");

    var url = "";
    if (page && page.charAt(0) === "/") {
        // Token trang ke tu luot truoc: path day du cua link ke.
        url = BASE_URL + page;
    } else {
        var n = parseInt(page, 10);
        if (isNaN(n) || n < 1) n = 1;
        url = BASE_URL + "/search/" + encodeURIComponent(query);
        if (n > 1) url = url + "?page=" + n;
    }

    rateLimitDelay("www.novel543.com");
    var doc = fetchDocWithFallback(url, MIRROR_LIST);
    if (!doc) {
        var chRes = fetchWithChallengeHandler(url, { siteName: "稷下書院" });
        if (chRes && chRes.ok) {
            if (chRes.doc) doc = chRes.doc;
            else if (chRes.html) doc = Html.parse(chRes.html);
        } else if (chRes && chRes.error) {
            return Response.error(chRes.error);
        }
    }
    if (!doc) return Response.error("Không tải được kết quả tìm kiếm: " + url);

    // Redirect ve trang chi tiet (site co the redirect khi tu khoa khop
    // chinh xac ten 1 truyen): trang detail co meta og:novel:book_name,
    // trang ket qua thi khong.
    var ogName = doc.select('meta[property="og:novel:book_name"]').first();
    if (ogName !== null) {
        var name = cleanText(ogName.attr("content"));
        if (name) {
            var ogAuthor = ogContent(doc, "og:novel:author");
            var ogImg = ogContent(doc, "og:image");
            var ogLatest = ogContent(doc, "og:novel:latest_chapter_name");
            var ogStatus = ogContent(doc, "og:novel:status");
            var ogUrl = ogContent(doc, "og:novel:read_url");
            var cover = "";
            if (ogImg && ogImg.indexOf("nocover") === -1) cover = absUrl(ogImg);
            var desc = ogAuthor;
            if (ogLatest) desc = desc ? desc + " — " + ogLatest : ogLatest;
            var item = {
                name: htmlDecode(name),
                cover: cover,
                link: ogUrl || url,
                description: desc,
                tag: ogStatus,
                host: siteOrigin()
            };
            return Response.success([item], "");
        }
    }

    var items = [];
    var seen = {};
    doc.select("li.media").forEach(function (el) {
        var item = parseBookItem(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });

    var next = "";
    var nextLink = doc.select("a:contains(»)").first();
    if (nextLink !== null) {
        var href = nextLink.attr("href");
        if (href) {
            if (href.indexOf("http") === 0) {
                var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
                next = m ? m[1] : "";
            } else if (href.charAt(0) === "/") {
                next = href;
            }
        }
    }

    return Response.success(items, next);
}
