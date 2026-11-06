// toc.js — muc luc chuong cua Truyen Full.
//
// Cach site lay danh sach chuong day du (khao sat 2026-11-06, xac minh
// bang curl: tra ve du 1.594 chuong cho truyen mau Đạo Kiếm Thần Hoàng):
// trang chi tiet chi render SSR 50 chuong dau trong #list-chapter, danh
// sach day du lay qua WordPress admin-ajax:
//   GET /wp-admin/admin-ajax.php?action=tv6_client&nonce=<nonce>&task=chapters&id=<storyId>
//   -> {"success":true,"data":{"items":[{"id","name","url"}...]}}
// storyId lay tu comment_post_ID trong HTML trang chi tiet; nonce lay tu
// bien tv6 trong the script tv6-client-js-extra ("nonce":"..."). Nonce
// BAT BUOC (sai hoac thieu nonce thi server tra "-1") va het han theo
// phien WordPress, nen toc.js phai tai lai trang chi tiet de lay nonce
// moi moi lan — khong hardcode nonce cu.
// Neu AJAX that bai thi fallback ve link chuong SSR trong #list-chapter
// (50 chuong dau) thay vi bao loi ngay.
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

// Trich story ID (post ID cua truyen) tu HTML tho trang chi tiet.
function extractStoryId(raw) {
    var m = raw.match(/comment_post_ID'\s+value='(\d+)'/);
    if (m) return m[1];
    m = raw.match(/class="follow"[^>]*data-id="(\d+)"/);
    if (m) return m[1];
    m = raw.match(/data-id="(\d+)"[^>]*data-score/);
    if (m) return m[1];
    return "";
}

// Trich nonce cua tv6 (bien window.tv6 trong script tv6-client-js-extra).
function extractNonce(raw) {
    var m = raw.match(/"nonce"\s*:\s*"([a-z0-9]+)"/i);
    if (m) return m[1];
    return "";
}

// Goi AJAX task=chapters, tra ve mang chuong tho [{name, url}] hoac null.
function fetchChaptersViaAjax(storyId, nonce) {
    var ajaxUrl = BASE_URL + "/wp-admin/admin-ajax.php?action=tv6_client&nonce=" + nonce + "&task=chapters&id=" + storyId;
    var res = null;
    try {
        res = fetch(ajaxUrl);
    } catch (e) {
        console.log("toc AJAX chapters loi: " + e);
        return null;
    }
    if (!res || !res.ok) {
        console.log("toc AJAX chapters HTTP " + (res ? res.status : 0));
        return null;
    }
    var parsed = null;
    try {
        parsed = res.json();
    } catch (e2) {
        try {
            parsed = JSON.parse(String(res.text()));
        } catch (e3) {
            console.log("toc parse JSON AJAX loi: " + e3);
            return null;
        }
    }
    if (!parsed || !parsed.success || !parsed.data || !(parsed.data.items instanceof Array)) {
        console.log("toc AJAX tra ve khong co data.items");
        return null;
    }
    return parsed.data.items;
}

// Duong fallback: link chuong SSR trong #list-chapter (50 chuong dau).
function collectDomChapters(doc) {
    var chapters = [];
    var seen = {};
    doc.select("#list-chapter ul.list-chapter a").forEach(function (el) {
        var href = el.attr("href");
        var name = cleanText(el.text());
        if (!href || !name) return;
        var link = absUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        chapters.push({
            name: name,
            url: link,
            num: chapterNumber(link),
            description: "",
            lock: false,
            pay: false
        });
    });
    chapters.sort(function (a, b) { return a.num - b.num; });
    var out = [];
    var i = 0;
    for (i = 0; i < chapters.length; i++) {
        out.push({
            name: chapters[i].name,
            url: chapters[i].url,
            description: "",
            lock: false,
            pay: false
        });
    }
    return out;
}

function execute(url) {
    url = normalizeUrl(url);

    // Tai HTML tho cua trang chi tiet (1 lan duy nhat, dung cho ca 2 duong).
    var res = null;
    try {
        res = fetch(url);
    } catch (e) {
        return Response.error("Không tải được trang truyện: " + url);
    }
    if (!res || !res.ok) {
        return Response.error("Không tải được trang truyện (HTTP " + (res ? res.status : 0) + "): " + url);
    }
    var raw = "";
    try {
        raw = String(res.text());
    } catch (e2) {
        return Response.error("Không đọc được trang truyện: " + url);
    }
    var doc = Html.parse(raw);

    // Duong chinh: AJAX task=chapters (danh sach day du).
    var storyId = extractStoryId(raw);
    var nonce = extractNonce(raw);
    if (storyId && nonce) {
        var data = fetchChaptersViaAjax(storyId, nonce);
        if (data && data.length > 0) {
            var chapters = [];
            var i = 0;
            for (i = 0; i < data.length; i++) {
                var item = data[i];
                if (!item || !item.url) continue;
                chapters.push({
                    name: cleanText(item.name || ""),
                    url: absUrl(item.url),
                    num: chapterNumber(item.url),
                    description: "",
                    lock: false,
                    pay: false
                });
            }
            chapters.sort(function (a, b) { return a.num - b.num; });
            var out = [];
            var j = 0;
            for (j = 0; j < chapters.length; j++) {
                out.push({
                    name: chapters[j].name || ("Chương " + chapters[j].num),
                    url: chapters[j].url,
                    description: "",
                    lock: false,
                    pay: false
                });
            }
            console.log("toc AJAX: " + out.length + " chuong");
            return Response.success(out);
        }
        console.log("toc AJAX that bai, chuyen sang fallback DOM");
    } else {
        console.log("toc: khong tim duoc storyId/nonce trong HTML, chuyen sang fallback DOM");
    }

    // Duong fallback: link chuong SSR trong #list-chapter (50 chuong dau).
    var fallback = collectDomChapters(doc);
    if (fallback.length === 0) {
        return Response.error("Không đọc được mục lục (AJAX lỗi và trang không có link chương): " + url);
    }
    console.log("toc fallback DOM: chi tim duoc " + fallback.length + " chuong dau — xem README.");
    return Response.success(fallback);
}
