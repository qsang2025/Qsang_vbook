// chap.js — doc noi dung mot chuong (execute(url) -> html, title).
//
// Layout da kiem chung cua zhenhunxiaoshuo.com (WordPress, UTF-8):
//   Chuong: https://www.zhenhunxiaoshuo.com/<n>.html
//     h1.focusbox-title            tieu de chuong (vd. "第1章 他……他他他他还没有脚！")
//     article.article-content > p  toan bo noi dung chuong, moi <p> 1 doan
//   Noi dung doc DU, khong login/VIP (kiem chung ch.1 镇魂: mo dau
//   "农历七月十五，天还没亮。" , ket "...收获颇丰——他不单见了领导，还见了鬼。"
//   + "他的亲娘舅果然给他找了一份别出心裁的好差事。").
//   Khong dung textGbk (site UTF-8). Pacing + retry 429 theo quy tac nha.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file cleanHtml.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('cleanHtml.js');

// Tai trang chuong, retry toi da 3 lan. Loi 429 doi theo Retry-After
// (toi da 30 giay) roi thu lai; loi khac backoff 500ms, 1000ms.
// Gap 429/405 thi ghi cooldown va KHONG dung browser fallback (cung IP).
function getPage(url) {
    var i = 0;
    for (i = 0; i < 3; i++) {
        try {
            var res = fetch(url, { headers: defaultHeaders(BASE_URL + "/") });
            if (res && res.ok) return res;
            var status = res ? res.status : 0;
            console.log("chap HTTP " + status + " lan " + (i + 1) + ": " + url);
            if (status === 429 || status === 405) {
                var wait = backoffMs(i, null);
                try {
                    var ra = res.headers["Retry-After"] || res.headers["retry-after"];
                    if (ra) wait = backoffMs(i, String(ra));
                } catch (e2) {
                }
                setCooldown("zhenhunxiaoshuo.com", wait);
                try { sleep(wait); } catch (e3) {}
                continue;
            }
        } catch (e) {
            console.log("chap fetch loi lan " + (i + 1) + ": " + e);
        }
        try { sleep(500 * (i + 1)); } catch (e4) {}
    }
    return null;
}

function execute(url) {
    url = normalizeUrl(url);
    if (isCoolingDown("zhenhunxiaoshuo.com")) {
        return Response.error(rateLimitErrorMessage("镇魂小说网", "zhenhunxiaoshuo.com", cooldownRemainingMs("zhenhunxiaoshuo.com")));
    }
    rateLimitDelay("zhenhunxiaoshuo.com", 500, 1500);
    var response = getPage(url);
    if (!response) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

    var doc = null;
    try {
        doc = response.html();
    } catch (e) {
        return Response.error("Không đọc được nội dung chương: " + url);
    }
    if (!doc) return Response.error("Không đọc được nội dung chương: " + url);

    var title = cleanText(doc.select("h1.focusbox-title").text());

    var article = doc.select("article.article-content").first();
    if (article === null) {
        return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện): " + url);
    }

    var lines = [];
    var paras = article.select("p");
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        var line = cleanText(paras.get(i).text());
        if (!line) continue;
        if (line.indexOf("zhenhunxiaoshuo.com") !== -1 && line.length < 60) continue;
        lines.push(line);
    }

    if (lines.length === 0) {
        return Response.error("Chương trống (có thể là chương VIP / cần đăng nhập): " + url);
    }
    if (lines.length > 0 && title && lines[0] === title) lines.shift();

    console.log("chap dong: " + lines.length + " | tieu de: " + title);
    return Response.success(cleanHtml(lines.join("<br>")), title);
}
