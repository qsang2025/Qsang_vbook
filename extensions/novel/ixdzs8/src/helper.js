// helper.js — ham phu cua extension 爱下电子书 (ixdzs8.com).
//
// Giu queryBuilder + htmlDecode goc cua template, them cac ham rieng cho
// site nay: parse mot dong truyen o trang danh sach / tim kiem
// (ul.u-list > li.burl) va lay duong dan trang ke tu pager
// (div.pagei a[title*="下一页"]).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     file config.js;
//     file config-helpers.js;
//     file fetch-helpers.js;
//     file helper.js;
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js +
// fetch-helpers.js TRUOC helper.js (cac ham duoi day dung BASE_URL,
// absUrl, cleanText, siteOrigin).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Ghe query tim kiem vao URL co san, dung dau "?" hay "&" tuy URL da co query.
function queryBuilder(base, params) {
    var url = base;
    var keys = Object.keys(params);
    var i = 0;
    for (i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = params[k];
        if (v === undefined || v === null || v === "") continue;
        url = url + (url.indexOf("?") === -1 ? "?" : "&") +
            encodeURIComponent(k) + "=" + encodeURIComponent(String(v));
    }
    return url;
}

// Giai ma cac HTML entity pho bien trong tieu de/mo ta lay tu thuoc tinh HTML.
function htmlDecode(s) {
    var text = String(s === undefined || s === null ? "" : s);
    var map = {
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&nbsp;": " "
    };
    var key = "";
    for (key in map) {
        text = text.split(key).join(map[key]);
    }
    text = text.replace(/&#(\d+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 10));
    });
    text = text.replace(/&#x([0-9a-fA-F]+);/g, function (m, code) {
        return String.fromCharCode(parseInt(code, 16));
    });
    return text;
}

// --- Rieng cho ixdzs8.com ------------------------------------------------
// (Khao sat 2026-11-09: site tieng Trung gian the, UTF-8; tat ca trang
// danh sach — /new/, /hot/, /end/, /sort/<id>/, /tags/<tag>, /bsearch —
// deu dung mot markup dong truyen: ul.u-list > li.burl
//   <li class="burl" data-url="/read/<id>/">
//     <div class="l-img"><a><img src="https://img22.ixdzs.com/..."/></a></div>
//     <div class="l-text"><div class="l-info">
//       <h3 class="bname"><a href="/read/<id>/" title="Ten">Ten</a></h3>
//       <p class="l-p1"><span class="bauthor"><a>Tac gia</a></span>
//         <span class="size">1837.39万字</span>
//         <span class="lz">连载中</span> (hoac <span class="end">已完结</span>)</p>
//       <p class="l-p2">Gioi thieu...</p>
//       <p class="l-last">最新:<a href="/read/<id>/p<N>.html">
//         <span class="l-chapter">第8159章 ...</span></a>
//         <span class="l-time">2026-11-09 10:29</span></p>
//     </div></div></li>
// Pager: div.pagei > a.num (so trang) + a[title="...下一页"] (&raquo;)
// + a[title="...最后一页"] (末页). Trang /sort/ dung dang
// /sort/<id>/index-0-0-0-<P>.html, cac trang khac dung ?page=<P> —
// token trang ke tra ve luon la PATH day du cua link ke nen khong can
// doan pattern phan trang nao ca.)

// Parse MOT dong truyen li.burl thanh item { name, cover, link,
// description, tag, host } hoac null neu khong phai dong truyen.
function parseBookRow(el) {
    var href = el.attr("data-url");
    if (!href) {
        var h3a = el.select("h3.bname a").first();
        if (h3a !== null) href = h3a.attr("href");
    }
    if (!href) return null;

    var name = "";
    var titleEl = el.select("h3.bname a").first();
    if (titleEl !== null) {
        name = cleanText(titleEl.attr("title")) || cleanText(titleEl.text());
    }
    if (!name) {
        var img0 = el.select(".l-img img").first();
        if (img0 !== null) name = cleanText(img0.attr("alt"));
    }
    if (!name) return null;

    var img = el.select(".l-img img").first();
    if (img === null) img = el.select("img").first();
    var cover = "";
    if (img !== null) {
        cover = img.attr("data-src") || img.attr("src") || "";
        if (cover.indexOf("nocover") !== -1) cover = "";
        else if (cover) cover = absUrl(cover);
    }

    var statusEl = el.select(".lz, .end").first();
    var status = statusEl !== null ? cleanText(statusEl.text()) : "";
    var sizeEl = el.select(".size").first();
    var size = sizeEl !== null ? cleanText(sizeEl.text()) : "";
    var tag = status;
    if (size) tag = tag ? tag + " · " + size : size;

    var desc = cleanText(el.select(".l-p2").text());
    var lastEl = el.select(".l-last .l-chapter").first();
    if (lastEl !== null) {
        var latest = cleanText(lastEl.text());
        if (latest) desc = desc ? desc + " | 最新: " + latest : "最新: " + latest;
    }

    return {
        name: htmlDecode(name),
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Lay duong dan trang ke tu pager (div.pagei a co title chua "下一页").
// Tra ve path (vd "/new/?page=2", "/sort/1/index-0-0-0-2.html") hoac "".
function nextPagePath(doc) {
    var links = doc.select("div.pagei a");
    var i = 0;
    for (i = 0; i < links.size(); i++) {
        var el = links.get(i);
        var title = el.attr("title") || "";
        if (title.indexOf("下一页") === -1) continue;
        var href = el.attr("href");
        if (!href) return "";
        if (href.indexOf("http") === 0) {
            var m = href.match(/^https?:\/\/[^\/]+(\/.*)$/);
            return m ? m[1] : "";
        }
        if (href.charAt(0) === "/") return href;
        return "";
    }
    return "";
}

// Parse ca danh sach li.burl trong doc (bo trung theo link).
function parseBookRows(doc) {
    var items = [];
    var seen = {};
    doc.select("ul.u-list > li.burl").forEach(function (el) {
        var item = parseBookRow(el);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    // Du phong: li.burl ngoai ul.u-list (neu site doi markup).
    if (items.length === 0) {
        doc.select("li.burl").forEach(function (el) {
            var item = parseBookRow(el);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        });
    }
    return items;
}
