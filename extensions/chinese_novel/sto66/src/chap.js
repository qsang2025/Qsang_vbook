// chap.js — doc noi dung mot chuong (execute(url) -> html, title).
//
// Layout da kiem chung cua sto66.com (UTF-8):
//   Chuong: https://www.sto66.com/chapter/<bookId>/<chapId>.html
//     h1.pt10                 tieu de chuong (vd. "第1章 哀其不幸，怒其不争！")
//     #content.readcontent p  toan bo noi dung chuong, moi <p> 1 doan
//   Giua noi dung co dong marker "这章没有结束，请点击下一页继续阅读！"
//   (site chen san, khong phai phan trang that — chuong nam tron 1 trang)
//   -> bo dong do khi doc.
//   Noi dung doc DU, khong login/VIP. Pacing + retry 429 theo quy tac nha.
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
                setCooldown("sto66.com", wait);
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
    if (isCoolingDown("sto66.com")) {
        return Response.error(rateLimitErrorMessage("思兔阅读", "sto66.com", cooldownRemainingMs("sto66.com")));
    }
    rateLimitDelay("sto66.com", 500, 1500);
    var response = getPage(url);
    if (!response) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + url);

    var doc = null;
    try {
        doc = response.html();
    } catch (e) {
        return Response.error("Không đọc được nội dung chương: " + url);
    }
    if (!doc) return Response.error("Không đọc được nội dung chương: " + url);

    var titleEl = doc.select("h1.pt10").first();
    if (titleEl === null) titleEl = doc.select("h1").first();
    var title = titleEl ? cleanText(titleEl.text()) : "";

    var content = doc.select("#content").first();
    if (content === null) {
        return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện): " + url);
    }

    var lines = [];
    var paras = content.select("p");
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        var line = cleanText(paras.get(i).text());
        if (!line) continue;
        if (line.indexOf("这章没有结束") !== -1) continue;
        if (line.indexOf("sto66.com") !== -1 && line.length < 60) continue;
        lines.push(line);
    }

    if (lines.length === 0) {
        return Response.error("Chương trống (có thể là chương VIP / cần đăng nhập): " + url);
    }
    if (lines.length > 0 && title && lines[0] === title) lines.shift();

    console.log("chap dong: " + lines.length + " | tieu de: " + title);
    return Response.success(cleanHtml(lines.join("<br>")), title);
}
