// helper.js — ham phu cua extension Hoat Hinh AI Trung Quoc (Dailymotion).
//
// Nguon du lieu la API cong khai cua Dailymotion (khong can khoa, tra JSON):
//   Tim kiem:  GET https://api.dailymotion.com/videos?search=<q>&page=<n>&limit=20
//                   &fields=id,title,description,duration,thumbnail_720_url,owner.screenname
//   Chi tiet:  GET https://api.dailymotion.com/video/<id>?fields=...
//   Stream:    GET https://www.dailymotion.com/player/metadata/video/<id>
//                   -> .qualities.auto[0].url (link .m3u8 goc cua CDN)
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('config-helpers.js');
//     load('helper.js');
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js + config-helpers.js TRUOC
// helper.js (cac ham duoi day dung BASE_URL, API_BASE, META_BASE, absUrl,
// cleanText, siteOrigin).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Cac tu khoa tim kiem da chon san (khao sat 2026-11-06, explorer_r1_3
// muc 1.5) — dung chung cho tab home va danh sach the loai.
var CURATED_QUERIES = [
    { title: "Hoạt Hình AI", input: "hoạt hình AI trung quốc thuyết minh" },
    { title: "Truyện Tranh Động", input: "truyện tranh động thuyết minh" },
    { title: "Hoạt Hình 2D", input: "hoạt hình 2D trung quốc thuyết minh" },
    { title: "Tu Tiên", input: "tu tiên thuyết minh" }
];

// Nhan dien trang challenge cua Cloudflare (mau lib/fetch-helpers.js):
// trang challenge co the tra ve HTTP 200 nen KHONG duoc tin res.ok —
// phai kiem marker challenge trong body TRUOC khi parse JSON.
function isChallengeText(text) {
    if (!text) return false;
    var t = String(text);
    if (t.indexOf("challenges.cloudflare.com") !== -1) return true;
    if (t.indexOf("__cf_chl") !== -1) return true;
    if (t.indexOf("cf-challenge") !== -1) return true;
    if (t.indexOf("cf-turnstile") !== -1) return true;
    if (t.indexOf("turnstile") !== -1 && t.indexOf("cloudflare") !== -1) return true;
    if (t.indexOf("Attention Required") !== -1) return true;
    if (t.indexOf("Please verify you are a human") !== -1) return true;
    if (/checking your browser/i.test(t)) return true;
    if (t.indexOf("cf-error-code") !== -1) return true;
    return false;
}

// GET JSON tu API Dailymotion. Tra ve doi tuong JSON da parse, hoac null
// neu HTTP loi / gap trang challenge / khong parse duoc. Doc body dang
// text truoc roi moi kiem challenge (mau fetchJson trong
// lib/fetch-helpers.js), thay vi .json() truc tiep nhu truoc.
// Khong xoay User-Agent (AGENTS.md §6 quy tac 10): chi gui Accept JSON
// + Referer mac dinh.
function dmApiGet(url) {
    var res = null;
    try {
        res = fetch(url, { headers: { "Accept": "application/json" } });
    } catch (e) {
        console.log("dmApiGet loi fetch: " + url + " (" + e + ")");
        return null;
    }
    if (!res || !res.ok) {
        console.log("dmApiGet HTTP " + (res ? res.status : 0) + ": " + url);
        return null;
    }
    var text = "";
    try {
        text = res.text();
    } catch (e2) {
        console.log("dmApiGet loi doc body: " + url + " (" + e2 + ")");
        return null;
    }
    if (!text) return null;
    if (isChallengeText(text)) {
        console.log("dmApiGet: trang challenge Cloudflare (HTTP 200): " + url);
        return null;
    }
    try {
        return JSON.parse(text);
    } catch (e3) {
        console.log("dmApiGet loi parse JSON: " + url + " (" + e3 + ")");
        return null;
    }
}

// Doi giay thanh "1:48:58" / "12:34" de hien o tag/mo ta.
function formatDuration(sec) {
    var n = parseInt(sec, 10);
    if (isNaN(n) || n < 0) return "";
    var h = Math.floor(n / 3600);
    var m = Math.floor((n % 3600) / 60);
    var s = n % 60;
    var mm = (m < 10 ? "0" + m : "" + m);
    var ss = (s < 10 ? "0" + s : "" + s);
    if (h > 0) return h + ":" + mm + ":" + ss;
    return m + ":" + ss;
}

// Tach video id (vd "x98x90i") tu URL dang /video/<id> hoac tu chuoi data
// cua chap.js. Tra ve "" neu khong thay.
function videoIdFromUrl(url) {
    var s = String(url === undefined || url === null ? "" : url);
    var m = s.match(/\/video\/([a-zA-Z0-9]+)/);
    if (m) return m[1];
    if (/^[a-zA-Z0-9]+$/.test(s)) return s;
    return "";
}

// URL xem video day du tu id.
function watchUrl(id) {
    return BASE_URL + "/video/" + id;
}

// Parse MOT video trong JSON tra ve cua API thanh item danh sach cua vBook.
// Chu y: API tra truong owner long nhau dang PHANG: "owner.screenname"
// (key co dau cham), khong phai object long nhau — doc bang key chuoi.
function videoItem(v) {
    if (!v || !v.id) return null;
    var id = String(v.id);
    var title = cleanText(v.title);
    if (!title) return null;
    var owner = cleanText(v["owner.screenname"]);
    var dur = formatDuration(v.duration);
    var desc = owner;
    if (dur) desc = desc ? desc + " • " + dur : dur;
    var d = cleanText(v.description);
    if (d) desc = desc ? desc + " — " + d : d;
    return {
        name: title,
        cover: v.thumbnail_720_url ? String(v.thumbnail_720_url) : "",
        link: watchUrl(id),
        description: desc,
        tag: dur,
        host: siteOrigin()
    };
}

// Boc link .m3u8 tu JSON metadata cua player Dailymotion.
// Uu tien khoa "auto" (master playlist), neu khong co thi quet moi khoa
// trong .qualities lay URL .m3u8 dau tien. Tra ve "" neu khong thay.
function extractM3u8(meta) {
    if (!meta || !meta.qualities) return "";
    var q = meta.qualities;
    var auto = q.auto;
    if (auto && auto.length > 0 && auto[0].url) return String(auto[0].url);
    var keys = Object.keys(q);
    var i = 0;
    var j = 0;
    for (i = 0; i < keys.length; i++) {
        var arr = q[keys[i]];
        if (!arr || !arr.length) continue;
        for (j = 0; j < arr.length; j++) {
            var u = arr[j] ? String(arr[j].url || "") : "";
            if (u.indexOf(".m3u8") !== -1) return u;
        }
    }
    return "";
}
