// config.js — Cau hinh goc cua extension Wiki Dich (wikicv.org).
//
// Site dich may truyen tieng Hoa (truyenwikidich.net -> wikicv.org).
// BASE_URL mac dinh https://wikicv.org; nguoi dung doi trong cai dat
// (config DOMAIN trong plugin.json) thi gia tri do se override qua
// bien DOMAIN duoc app inject, nam trong try/catch.
//
// KHONG xoay User-Agent (AGENTS.md quy tac 10): fetch dung UA mac dinh
// cua runtime de cookie Cloudflare (cf_clearance) con hieu luc.
//
// Cookie: mot so chuc nang cua site (tim kiem, the loai, bang xep hang)
// yeu cau dang nhap. Nguoi dung dang nhap bang trinh duyet trong app
// vBook, roi nhap cookie vao config wikicvCookie trong plugin.json
// (tuy chon, mac dinh rong). KHONG commit cookie that vao repo
// (AGENTS.md muc 7).
// Muc luc qua API /book/index KHONG can dang nhap: signKey cua API
// rang buoc theo IP client (doi theo moi lan tai trang chi tiet),
// khong phai theo session dang nhap — may that IP on dinh nen chay
// duoc; VM curl khong test duoc toc vi IP egress xoay theo request
// (xem WIKICV-PROGRESS.md §10.1).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
var BASE_URL = "https://wikicv.org";
try { if (DOMAIN) BASE_URL = DOMAIN; } catch (e) {}
try { if (CONFIG_URL) BASE_URL = CONFIG_URL; } catch (e) {}

// ---- Cookie helper ----
// User nhap cookie vao config wikicvCookie (plugin.json config) de tai trang yeu cau session
// Mirror du phong (AGENTS.md muc 10): truyenwikidich.net chi 301 ve
// wikicv.org nen chi la fallback yeu khi domain chinh loi mang/5xx.
var MIRROR_LIST = ["https://truyenwikidich.net"];

function wikiCookieFromConfig() {
    var c = "";
    try { if (typeof wikicvCookie !== "undefined" && wikicvCookie) { c = String(wikicvCookie); } } catch (e) {}
    // Anh co the dan ca header "Cookie: ..." hoac xuong dong — chi giu gia tri.
    c = c.replace(/^\s*Cookie:\s*/i, "").replace(/[\r\n]+/g, "").trim().replace(/^"|"$/g, "");
    return c;
}

function wikiHeaders(referer) {
    var h = {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8"
    };
    if (referer) h["Referer"] = referer;
    var cookie = wikiCookieFromConfig();
    if (cookie) h["Cookie"] = cookie;
    return h;
}

function wikiFetch(url, referer) {
    var res = null;
    var err = null;
    try { res = fetch(url, { headers: wikiHeaders(referer) }); } catch (e) { err = e; }
    // OK hoac loi 4xx (vd. 404 sai tham so, 403 login) thi tra ngay —
    // mirror khong cuu duoc, chi thu mirror khi loi mang hoac 5xx.
    if (res && (res.ok || (res.status && res.status < 500))) return res;
    for (var i = 0; i < MIRROR_LIST.length; i++) {
        var mUrl = String(url).replace(/^https?:\/\/[^\/]+/i, MIRROR_LIST[i]);
        if (mUrl === url) continue;
        try {
            var mRes = fetch(mUrl, { headers: wikiHeaders(referer) });
            if (mRes) return mRes;
        } catch (e2) {}
    }
    if (res) return res;
    throw err; // giu nguyen hanh vi cu khi loi mang hoan toan
}

// Mo ta ngan cho 1 muc .book-item trong danh sach: tac gia + trang thai
// + luot xem/thich/binh luan (selector da kiem chung tren trang that).
function wikiItemDescription(el) {
    var parts = [];
    var authorEl = el.select("p.book-author a").first();
    if (authorEl) {
        var a = (authorEl.text().trim()) + "";
        if (a) parts.push("Tác giả: " + a);
    }
    el.select("p.book-publisher a").forEach(function (x) {
        var h = (x.attr("href") || "") + "";
        if (h.indexOf("status=") > -1) {
            var s = (x.text().trim()) + "";
            if (s) parts.push(s);
        }
    });
    var nums = [];
    el.select(".book-stats-box .book-stats span[data-ready]").forEach(function (x) {
        nums.push(((x.text().trim()) + ""));
    });
    if (nums.length >= 3) parts.push(nums[0] + " lượt xem • " + nums[1] + " thích • " + nums[2] + " bình luận");
    return parts.join(" • ");
}

function wikiNormalizeUrl(url) {
    if (!url) return "";
    if (url.indexOf("http://") === 0 || url.indexOf("https://") === 0) {
        url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/i, BASE_URL);
    } else if (url.indexOf("//") === 0) {
        url = "https:" + url;
    } else if (url.indexOf("/") === 0) {
        url = BASE_URL + url;
    } else {
        url = BASE_URL + "/" + url;
    }
    return url;
}

// ---- SHA-256 thuần ES5 (cho toc.js sign) ----
function wikiSha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }

    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var lengthProperty = "length";
    var i, j;
    var result = "";
    var words = [];
    var asciiBitLength = ascii[lengthProperty] * 8;

    var hash = wikiSha256.h = wikiSha256.h || [];
    var k = wikiSha256.k = wikiSha256.k || [];
    var primeCounter = k[lengthProperty];

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
        if (!isComposite[candidate]) {
            for (i = 0; i < 313; i += candidate) {
                isComposite[i] = candidate;
            }
            hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        }
    }

    ascii += "\x80";
    while (ascii[lengthProperty] % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii[lengthProperty]; i++) {
        j = ascii.charCodeAt(i);
        if (j >> 8) return;
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
    words[words[lengthProperty]] = asciiBitLength;

    for (j = 0; j < words[lengthProperty];) {
        var w = words.slice(j, (j += 16));
        var oldHash = hash.slice(0);

        for (i = 0; i < 64; i++) {
            var w15 = w[i - 15];
            var w2 = w[i - 2];

            var a = hash[0];
            var e = hash[4];
            var temp1 =
                hash[7] +
                (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
                ((e & hash[5]) ^ (~e & hash[6])) +
                k[i] +
                (w[i] = i < 16
                    ? w[i]
                    : (w[i - 16] +
                        (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                        w[i - 7] +
                        (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
            var temp2 =
                (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
                ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

            hash = [(temp1 + temp2) | 0].concat(hash);
            hash[4] = (hash[4] + temp1) | 0;
            hash.pop();
        }

        for (i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }

    for (i = 0; i < 8; i++) {
        for (j = 3; j + 1; j--) {
            var b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? "0" : "") + b.toString(16);
        }
    }
    return result;
}