// toc.js — muc luc chuong cua 爱下电子书 (ixdzs8.com).
//
// Nguon chinh: endpoint AJAX POST /novel/html, form {bid: <id truyen>}
// (JS cua chinh site: $.ajax({type:'POST', url:'/novel/html',
// data:{bid:bid}})), tra ve fragment HTML
//   <li><a href="/read/<id>/p<N>.html">第X章 ...</a></li>
// (chua thu tu tang dan, 正序). Thu POST tren domain chinh truoc, roi
// thu tung mirror (ixdzs.tw, ixdzs.hk).
// LUU Y (khao sat 2026-11-09): POST nay TIMEOUT tu VM (25-30 giay,
// 0 byte, ca ixdzs8.com lan ixdzs.tw, co/khong cookie) — nghi server
// tar-pit POST tu IP datacenter. Chua biet co chay tren may that khong
// (fetch cua app dung OkHttp, IP dien thoai) — test tren may se quyet
// dinh. Neu POST that bai het thi dung fallback ben duoi.
//
// Fallback: trang sach /read/<id>/ co san ul.u-chapter.cfirst = 20
// chuong moi nhat (thu tu NGUOC — moi nhat truoc), dao lai thanh tang
// dan. Truyen ngan (<= 20 chuong) thi day la full muc luc; truyen dai
// thi chi co 20 chuong cuoi cho toi khi POST chay duoc.
//
// QUAN TRONG — KHONG tu tinh so chuong tu so trang p<N>: so trang
// KHONG bang so chuong (da kiem chung live 2026-11-09):
//   646492: p1=第1章, p4=第4章, p5=第6章 (第5章 KHONG CO trang nao),
//   p50=第51章, p153=第154章 (cuoi) — "共153章" = 153 trang.
//   167176 剑来: p1=第一章 惊蛰, p1298=第76章 灯谜 — "共1298章".
// Vi vay toc.js CHI dung link chuong THAT (tu AJAX hoac tu trang sach),
// giu dung thu tu DOM, khong sort theo so trong URL, khong tu sinh ten
// chuong. chap.js tra data2 = ten trong <h1> that cua trang chuong.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');

function execute(url) {
    url = normalizeUrl(url);
    var m = url.match(/\/read\/(\d+)/);
    if (!m) return Response.error("Không đọc được ID truyện từ URL: " + url);
    var bookId = m[1];

    var chapters = [];
    var seen = {};

    function addChapter(href, name) {
        if (!href || !name) return;
        if (href.indexOf("/read/") === -1) return;
        if (href.indexOf("/p") === -1) return;
        if (href.slice(-5) !== ".html") return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: cleanText(name),
            url: link,
            description: "",
            lock: false,
            pay: false
        });
    }

    // Nguon chinh: POST /novel/html {bid} — thu domain chinh roi mirror.
    var origins = [BASE_URL];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        if (origins.indexOf(MIRROR_LIST[i]) === -1) origins.push(MIRROR_LIST[i]);
    }
    var ajaxHtml = "";
    for (i = 0; i < origins.length; i++) {
        var ajaxUrl = origins[i] + "/novel/html";
        try {
            var res = fetch(ajaxUrl, {
                method: "POST",
                headers: {
                    "Referer": url,
                    "X-Requested-With": "XMLHttpRequest",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
                },
                body: { bid: bookId },
                timeout: 30000
            });
            if (res && res.ok) {
                var text = "";
                try { text = res.text(); } catch (eText) { text = ""; }
                if (text && text.indexOf("/read/") !== -1) {
                    ajaxHtml = text;
                    break;
                }
            }
        } catch (ePost) {
            console.log("toc POST " + ajaxUrl + " loi: " + ePost);
        }
    }

    if (ajaxHtml) {
        try {
            var frag = Html.parse(ajaxHtml);
            frag.select("li a").forEach(function (el) {
                addChapter(el.attr("href"), el.text());
            });
            if (chapters.length === 0) {
                frag.select("a").forEach(function (el) {
                    addChapter(el.attr("href"), el.text());
                });
            }
        } catch (eParse) {
            console.log("toc parse fragment loi: " + eParse);
        }
    }

    // Fallback: 20 chuong moi nhat tren trang sach (thu tu nguoc -> dao lai).
    if (chapters.length === 0) {
        var doc = fetchDocWithFallback(url, MIRROR_LIST);
        if (doc) {
            var tmp = [];
            doc.select("ul.u-chapter.cfirst a").forEach(function (el) {
                var href = el.attr("href");
                var name = cleanText(el.text());
                if (!href || !name) return;
                if (href.indexOf("/read/") === -1 || href.indexOf("/p") === -1) return;
                tmp.push({ href: href, name: name });
            });
            for (var j = tmp.length - 1; j >= 0; j--) {
                addChapter(tmp[j].href, tmp[j].name);
            }
            if (chapters.length === 0) {
                doc.select("ul.u-chapter a").forEach(function (el) {
                    addChapter(el.attr("href"), el.text());
                });
            }
        }
    }

    if (chapters.length === 0) return Response.error("Không đọc được mục lục (site có thể đã đổi giao diện hoặc chặn POST mục lục): " + url);
    return Response.success(chapters);
}
