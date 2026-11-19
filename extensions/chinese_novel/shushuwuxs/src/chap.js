// chap.js — doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Layout da kiem chung cua shushuwuxs.com (SSR, UTF-8):
//   Chuong: https://www.shushuwuxs.com/read_<id>/<cid>.html
//     .bookname h1              tieu de chuong (vd. "第一章 重生")
//     #content > p             toan bo noi dung chuong, moi <p> 1 doan
//       p dau tien la thong bao DMCA (onclick ve /report/dmca.html)
//       — bo truoc khi lay noi dung.
//   Chuong PHAN TRANG: a#pager_next chu "下一页" -> trang ke dang
//     "<cid>_2.html" (vd. 1203503.html -> 1203503_2.html); trang cuoi
//     a#pager_next la "下一章" thi dung. Noi tat ca cac trang chia thanh
//     1 chuong day du (toi da 10 trang). Kiem chung ch.1 问道章:
//     trang 1 ~1525 ky tu + trang 2 ~1552 ky tu, doc lien mach, khong
//     login/VIP. Khong dung textGbk (site UTF-8). Pacing + retry 429
//     theo quy tac nha.
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
                setCooldown("shushuwuxs.com", wait);
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

// Lay HTML sach cua #content tren 1 trang chuong (da bo p DMCA).
// Tra "" khi khong co noi dung.
function readPageContent(doc) {
    var contentEl = doc.select("#content").first();
    if (contentEl === null) return "";
    var ps = contentEl.select("p");
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var p = ps.get(i);
        var txt = cleanText(p.text());
        var onclick = String(p.attr("onclick") || "");
        if (onclick.indexOf("dmca") !== -1) {
            p.remove();
            continue;
        }
        if (txt.indexOf("如果此书侵犯了您的权益") !== -1) {
            p.remove();
        }
    }
    return contentEl.html() || "";
}

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    if (isCoolingDown("shushuwuxs.com")) {
        return Response.error(rateLimitErrorMessage("书书屋小说", "shushuwuxs.com", cooldownRemainingMs("shushuwuxs.com")));
    }
    rateLimitDelay("shushuwuxs.com", 500, 1500);
    var response = getPage(chapUrl);
    if (!response) return Response.error("Không tải được chương (lỗi mạng hoặc bị chặn): " + chapUrl);

    var doc = null;
    try {
        doc = response.html();
    } catch (e) {
        return Response.error("Không đọc được nội dung chương: " + chapUrl);
    }
    if (!doc) return Response.error("Không đọc được nội dung chương: " + chapUrl);

    var titleEl = doc.select(".bookname h1").first();
    var title = titleEl ? cleanText(titleEl.text()) : "";
    if (!title) {
        var t = cleanText(doc.select("title").text());
        title = cleanText(t.split("_")[0]);
    }

    var content = readPageContent(doc);
    if (!content) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("登录") !== -1 || fullText.indexOf("登入") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương (có thể là chương VIP / cần đăng nhập): " + chapUrl);
    }

    // Noi cac trang chia: theo a#pager_next khi chu la "下一页".
    var dirUrl = chapUrl.substring(0, chapUrl.lastIndexOf("/") + 1);
    var pages = 1;
    while (pages < 10) {
        var nextEls = doc.select("a#pager_next");
        if (nextEls.size() === 0) break;
        var nextEl = nextEls.get(0);
        if (cleanText(nextEl.text()) !== "下一页") break;
        var href = String(nextEl.attr("href") || "");
        if (!href) break;
        var nextUrl = href.charAt(0) === "/" ? siteOrigin() + href : dirUrl + href;
        var r2 = getPage(nextUrl);
        if (!r2) break;
        var doc2 = null;
        try {
            doc2 = r2.html();
        } catch (e2) {
            break;
        }
        if (!doc2) break;
        var more = readPageContent(doc2);
        if (!more) break;
        content += more;
        doc = doc2;
        pages++;
    }

    content = cleanHtml(content);
    if (!content) return Response.error("Không tìm thấy nội dung chương: " + chapUrl);

    console.log("chap trang: " + pages + " | tieu de: " + title);
    return Response.success(content, title);
}
