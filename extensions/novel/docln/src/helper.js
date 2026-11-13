// helper.js — Ham dung chung cho DocLN (docln.sbs, Cong Light Novel).
//
// Site Hako tieng Viet, UTF-8 (khong can giai ma GBK).
// - Trang chu: https://docln.sbs/ (khong co menu the loai; cac muc xem them
//   tro ve /danh-sach?...).
// - Danh sach: /danh-sach?truyendich=1&sapxep=capnhat|topthang|top|truyenmoi
//   va /danh-sach?sangtac=1&sapxep=capnhat ; phan trang ?page=N (1-based,
//   42 truyen/trang). The loai: /the-loai/<slug>?page=N (cung layout).
// - Tim kiem: GET /tim-kiem?keywords=<kw>&page=N (25 ket qua/trang).
// - Chi tiet: /truyen/<id>[-<slug>] (truyen dich) hoac /sang-tac/<id>-<slug>
//   (sang tac); ten o .series-name a; bia o .series-cover .content
//   (style background-image, host i2.hako.vip); tac gia o
//   .series-information .info-item (span.info-name "Tác giả:" + span.info-value);
//   trang thai o link /oln-dang-tien-hanh|/oln-hoan-thanh; the loai o link
//   /the-loai/...; mo ta o .series-summary (sau h4 "Tóm tắt").
// - Muc luc: ul.list-chapters trong cac section.volume-list (moi volume mot
//   ul; tat ca chuong deu co san trong HTML, cac li class "none" chi an tren
//   mobile — nut "Xem tiep (N chương)" chi bo class an). Link chuong dang
//   /truyen/<id>-<slug>/c<cid>-<ten> hoac /sang-tac/<id>-<slug>/c<cid>-<ten>.
// - Chuong: noi dung MA HOA trong div#chapter-c-protected (data-s, data-k,
//   data-c) — xem decodeProtectedContent. Giai ma duoc tu JS cong khai cua
//   site (scripts/app.js): sap xep chunk theo 4 ky tu dau (so thu tu), roi
//   tuy scheme: xor_shuffle = base64 -> XOR voi key (data-k, lap vong) ->
//   UTF-8; base64_reverse = dao chuoi -> base64 -> UTF-8; mac dinh = base64
//   -> UTF-8. Da kiem chung tu VM 2026-11-13: ch.1 Nang Hau Gai (62 doan,
//   7832 ky tu) va ch.1 Toi Yeu Nu Phan Dien (47 doan, 8797 ky tu) deu ra
//   dung van tieng Viet goc, khong phai van ghep nhu cgsdlx.
// - Chuong doc DU, KHONG can dang nhap, khong preview, khong 401 (kiem
//   chung 2 chuong mau). Chuong chi co anh minh hoa thi noi dung giai ma
//   gan nhu rong (site an anh voi khach — JS cua site thay <img> bang chu
//   "Ảnh tạm thời bị tắt." khi chua dang nhap).
// - Khong co mirror song (www.docln.sbs va docln.net khong tra loi,
//   ln.hako.vn 403 Cloudflare — kiem chung 2026-11-13).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Lay <id> so cua truyen tu URL dang /truyen/<id>[-slug] hoac
// /sang-tac/<id>-<slug>; tra "" khi khong phai URL truyen.
function bookId(url) {
    var m = String(url || "").match(/\/(?:truyen|sang-tac)\/(\d+)/);
    return m ? m[1] : "";
}

// Loai truyen: "truyen" (dich) hoac "sang-tac"; "" khi khong nhan ra.
function bookKind(url) {
    var m = String(url || "").match(/\/(truyen|sang-tac)\//);
    return m ? m[1] : "";
}

// Dua URL bat ky cua site ve dang dung BASE_URL hien tai (doi domain trong
// cai dat van chay duoc). URL ngoai site tra nguyen.
function toSiteUrl(url) {
    var u = String(url || "");
    if (!u) return "";
    if (u.indexOf("http") === 0) {
        return u.replace(/^https?:\/\/[^\/]+/, BASE_URL);
    }
    if (u.charAt(0) === "/") return BASE_URL + u;
    return u;
}

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11) + failover
// qua mirror (hien khong co mirror song). Duong chinh: pacedFetch()
// (file rate-limit.js) — kiem tra cooldown, nghi jitter, retry 429/405/503,
// tu ghi cooldown khi bi chan. Giai ma UTF-8 mac dinh.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchDoclnDoc(url) {
    var candidates = [url];
    var i = 0;
    for (i = 0; i < MIRROR_LIST.length; i++) {
        var alt = String(url).replace(/^https?:\/\/[^\/]+/, MIRROR_LIST[i]);
        if (alt !== url) candidates.push(alt);
    }
    var lastError = "";
    for (i = 0; i < candidates.length; i++) {
        var res = null;
        try {
            res = pacedFetch(candidates[i], {});
        } catch (e) {
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        if (!res) {
            lastError = "Không tải được trang: " + url;
            continue;
        }
        if (res.error === "cooldown") {
            return { error: rateLimitErrorMessage("DocLN", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
        }
        if (!res.ok) {
            var st = res.status || 0;
            if (st === 429 || st === 405) {
                return { error: rateLimitErrorMessage("DocLN", pacedHostOf(candidates[i]), res.cooldownRemainingMs) };
            }
            if (st) {
                lastError = "Không tải được trang (HTTP " + st + "): " + url;
                continue;
            }
            lastError = "Không tải được trang (lỗi mạng): " + url;
            continue;
        }
        var doc = null;
        try {
            doc = res.res.html();
        } catch (e2) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (!doc) {
            lastError = "Không đọc được nội dung trang: " + url;
            continue;
        }
        if (isChallengeDoc(doc)) {
            lastError = "Trang đang yêu cầu xác minh Cloudflare — hãy mở docln.sbs trong trình duyệt của app một lần rồi thử lại.";
            continue;
        }
        return { doc: doc };
    }
    return { error: lastError || ("Không tải được trang: " + url) };
}

// Lay URL bia tu mot khoi anh: uu tien data-bg (lazyload), roi style
// background-image. Bo qua anh nocover.
function coverFromEl(el) {
    if (!el) return "";
    var src = cleanText(el.attr("data-bg"));
    if (!src) {
        var style = String(el.attr("style") || "");
        var m = style.match(/url\(['"]?([^'")]+)['"]?\)/);
        if (m) src = cleanText(m[1]);
    }
    if (!src) return "";
    if (src.indexOf("nocover") !== -1) return "";
    return absUrl(src);
}

// Parser MỘT dong truyen trong danh sach (div.thumb-item-flow):
//   .content.img-in-ratio            bia (data-bg hoac style)
//   .thumb_attr.series-title a       ten + link /truyen/<id>[-slug]
//   .thumb_attr.chapter-title a      chuong moi nhat (mo ta)
//   .thumb_attr.volume-title         tap (mo ta)
function parseListItems(doc) {
    var data = [];
    var seen = {};
    var titles = doc.select("div.thumb-item-flow .thumb_attr.series-title a[href]");
    var covers = doc.select("div.thumb-item-flow .content.img-in-ratio");
    var latest = doc.select("div.thumb-item-flow .thumb_attr.chapter-title a");
    var volumes = doc.select("div.thumb-item-flow .thumb_attr.volume-title");
    var i = 0;
    for (i = 0; i < titles.size(); i++) {
        var a = titles.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var link = toSiteUrl(href);
        if (seen[link]) continue;
        var name = cleanText(a.attr("title")) || cleanText(a.text());
        if (!name) continue;
        seen[link] = 1;
        var item = { name: name, link: link, cover: "", host: BASE_URL };
        if (i < covers.size()) {
            item.cover = coverFromEl(covers.get(i));
        }
        var descParts = [];
        if (i < latest.size()) {
            var lt = cleanText(latest.get(i).text());
            if (lt) descParts.push(lt);
        }
        if (i < volumes.size()) {
            var vt = cleanText(volumes.get(i).text());
            if (vt) descParts.push(vt);
        }
        if (descParts.length > 0) item.description = descParts.join(" • ");
        data.push(item);
    }
    return data;
}

// So trang cuoi ma pager cua site quang cao (link ?page=N); khong co => 1.
function maxPage(doc) {
    var sel = doc.select("a[href*=\"page=\"]");
    var best = 0;
    for (var i = 0; i < sel.size(); i++) {
        var h = String(sel.get(i).attr("href") || "");
        var m = h.match(/[?&]page=(\d+)/);
        if (m) {
            var n = parseInt(m[1], 10);
            if (!isNaN(n) && n > best) best = n;
        }
    }
    return best;
}

// ---- Giai ma noi dung chuong (div#chapter-c-protected) ----
// Runtime vBook (Rhino) khong co atob/TextDecoder, nen tu viet bang JS thuan.

var B64_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

// Base64 -> mang byte (so 0-255). Bo qua ky tu la (khoang trang, xuong dong).
function base64ToBytes(s) {
    var clean = String(s || "").replace(/[^A-Za-z0-9+\/]/g, "");
    var bytes = [];
    var i = 0;
    while (i + 4 <= clean.length) {
        var c1 = B64_ALPHABET.indexOf(clean.charAt(i));
        var c2 = B64_ALPHABET.indexOf(clean.charAt(i + 1));
        var c3 = B64_ALPHABET.indexOf(clean.charAt(i + 2));
        var c4 = B64_ALPHABET.indexOf(clean.charAt(i + 3));
        bytes.push((c1 << 2) | (c2 >> 4));
        bytes.push(((c2 & 15) << 4) | (c3 >> 2));
        bytes.push(((c3 & 3) << 6) | c4);
        i += 4;
    }
    var rem = clean.length - i;
    if (rem === 2) {
        var d1 = B64_ALPHABET.indexOf(clean.charAt(i));
        var d2 = B64_ALPHABET.indexOf(clean.charAt(i + 1));
        bytes.push((d1 << 2) | (d2 >> 4));
    } else if (rem === 3) {
        var e1 = B64_ALPHABET.indexOf(clean.charAt(i));
        var e2 = B64_ALPHABET.indexOf(clean.charAt(i + 1));
        var e3 = B64_ALPHABET.indexOf(clean.charAt(i + 2));
        bytes.push((e1 << 2) | (e2 >> 4));
        bytes.push(((e2 & 15) << 4) | (e3 >> 2));
    }
    return bytes;
}

// Mang byte UTF-8 -> chuoi (dung meo escape/decodeURIComponent vi Rhino
// khong co TextDecoder; fallback tra chuoi nhi phan neu UTF-8 loi).
function utf8BytesToString(bytes) {
    var bin = "";
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i] & 255);
    try {
        return decodeURIComponent(escape(bin));
    } catch (e) {
        return bin;
    }
}

// XOR tung byte voi key (lap vong theo do dai key).
function xorDecodeBytes(bytes, key) {
    var out = [];
    var kl = key.length || 1;
    for (var i = 0; i < bytes.length; i++) out.push(bytes[i] ^ key.charCodeAt(i % kl));
    return out;
}

// Giai ma toan bo div#chapter-c-protected thanh chuoi HTML.
// Tra "" khi khong co div, thuoc tinh thieu, hoac JSON loi.
function decodeProtectedContent(el) {
    if (!el) return "";
    var scheme = String(el.attr("data-s") || "none");
    var key = String(el.attr("data-k") || "");
    var raw = String(el.attr("data-c") || "");
    if (!raw) return "";
    raw = raw.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    var chunks = null;
    try {
        chunks = JSON.parse(raw);
    } catch (e) {
        return "";
    }
    if (!chunks || !(chunks instanceof Array) || chunks.length === 0) return "";
    chunks.sort(function (a, b) {
        return parseInt(String(a).substring(0, 4), 10) - parseInt(String(b).substring(0, 4), 10);
    });
    var parts = [];
    for (var i = 0; i < chunks.length; i++) {
        var payload = String(chunks[i]).substring(4);
        if (scheme === "xor_shuffle") {
            parts.push(utf8BytesToString(xorDecodeBytes(base64ToBytes(payload), key)));
        } else if (scheme === "base64_reverse") {
            parts.push(utf8BytesToString(base64ToBytes(payload.split("").reverse().join(""))));
        } else {
            parts.push(utf8BytesToString(base64ToBytes(payload)));
        }
    }
    var html = parts.join("");
    // Site thay [noteN] bang icon ghi chu; giu lai dang text ngan gon.
    html = html.replace(/\[note(\d+)\]/gi, "[note]");
    // Anh trong chuong bi site an voi khach (JS cua site thay <img> bang chu
    // "Ảnh tạm thời bị tắt." khi chua dang nhap) — bo the img cho sach.
    html = html.replace(/<img[^>]*>/gi, "");
    return html;
}
