// chap.js — Doc noi dung mot chuong (Zongheng).
// Contract: execute(url) -> html, title?
// URL chuong: https://read.zongheng.com/chapter/{bookId}/{chapterId}.html
// (book.zongheng.com/chapter/... redirect ve read.zongheng.com).
// Noi dung: div.content > p (kiem chung 2026-11-11: chuong thuong day du).
// Chuong VIP: div.content chi co ~2-3 doan preview + khoi
//   div.reader-end.reader-order ("本章节为VIP章节，需要订阅才可以继续阅读哦～")
//   -> tra loi ro rang chu khong tra text cut (can dang nhap + tra tien
//   tren web moi doc tiep; extension khong lay duoc full text).
// Chuong moi nhat: div.content cung chi la preview cut giua cau
// (ket thuc bang "......") + khoi div.reader-end.reader-app-download
// ("请您至纵横小说App阅读最新章节") -> cung tra loi ro, khong tra
// preview lam noi dung day du (kiem chung 2026-11-11: ch.85 111362402
// chi co 226 ky tu sau khi loc rac, trong khi chuong day du ~3000 ky tu).
// Rac quang cao: chuoi <p> lien tiep, moi <p> la 1 ky tu lap lai 3 lan
// (下下下/载载载/纵纵纵/横横横/小小小/说说说) + <p>看全文</p>, ghep lai
// la "下载纵横小说看全文" (du tai app) — loc ca cum, khong xoa <p>
// 1 ky tu that dung le (vd. "哈哈哈" dung mot minh van giu).
// Tieu de chuong: lay tu <title> (dang "第85章 接剑_剑来小说...").
// Load: file rate-limit.js (pacing + retry).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

var ZH_AD_TEXT = "下载纵横小说看全文";

function isAdPara(t) {
    if (!t) return false;
    if (t === "看全文") return true;
    if (t.length < 3) return false;
    var c0 = t.charAt(0);
    var i = 0;
    for (i = 1; i < t.length; i++) {
        if (t.charAt(i) !== c0) return false;
    }
    return true;
}

function dedupeRun(s) {
    var out = "";
    var i = 0;
    for (i = 0; i < s.length; i++) {
        var ch = s.charAt(i);
        if (out.length === 0 || out.charAt(out.length - 1) !== ch) out += ch;
    }
    return out;
}

function execute(url) {
    url = zhNormalizeUrl(url);
    var pf = pacedFetch(url, { headers: zhHeaders(url) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Zongheng", "zongheng.com", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được chương (HTTP " + pf.status + "): " + url);
    }
    var doc = pf.res.html();
    var vipEl = zhFirst(doc.select("div.reader-end.reader-order"));
    if (vipEl) {
        return Response.error("Chương VIP — cần đăng nhập và mua trên web zongheng.com mới đọc được");
    }
    var appEl = zhFirst(doc.select("div.reader-end.reader-app-download"));
    if (appEl) {
        return Response.error("Chương mới nhất chỉ đọc được trong app zongheng.com — bản web chỉ hiện đoạn mở đầu");
    }
    var contentEl = zhFirst(doc.select("div.content"));
    if (!contentEl) return Response.error("Không đọc được nội dung chương (site có thể đã đổi giao diện): " + url);
    var paras = [];
    contentEl.select("p").forEach(function (el) {
        var t = zhCleanText(el.text());
        if (t) paras.push(t);
    });
    if (paras.length === 0) return Response.error("Không đọc được nội dung chương: " + url);
    // Loc cum quang cao "下载纵横小说看全文" (cac <p> 1 ky tu lap lai lien tiep).
    var kept = [];
    var i = 0;
    while (i < paras.length) {
        if (isAdPara(paras[i])) {
            var run = [];
            var j = i;
            while (j < paras.length && isAdPara(paras[j])) { run.push(paras[j]); j++; }
            var joined = dedupeRun(run.join(""));
            if (joined === ZH_AD_TEXT) {
                i = j;
                continue;
            }
            var k = 0;
            for (k = 0; k < run.length; k++) kept.push(run[k]);
            i = j;
        } else {
            kept.push(paras[i]);
            i++;
        }
    }
    if (kept.length === 0) return Response.error("Không đọc được nội dung chương: " + url);
    var title = "";
    var titleEl = zhFirst(doc.select("title"));
    if (titleEl) {
        title = zhCleanText(titleEl.text()).split("_")[0];
    }
    console.log("chap dong: " + kept.length + " | tieu de: " + title);
    return Response.success(kept.join("<br>"), title);
}
