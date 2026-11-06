// helper.js — ham phu tach khoi config.js (mau khoa301020: config chi
// chua hang, helper chua ham).
//
// File nay duoc load() boi cac script can no (viet o dau file script):
//     load('config.js');
//     load('helper.js');
// File duoc load KHONG duoc load them file khac, nen helper.js khong load
// config.js; script phai load config.js TRUOC helper.js vi slugify va
// queryBuilder khong can BASE_URL nhung htmlDecode thi doc lap, con cac
// script dung chung se can ca hai. Build se copy file nay vao src/.
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

// Chuyen ten truyen tieng Viet co dau thanh slug khong dau (phuc vu tim
// kiem theo sitemap hoac so khop slug khi site khong co o tim kiem).
// Vi du: "De Che Vo Song" -> "de-che-vo-song".
function slugify(s) {
    var text = String(s === undefined || s === null ? "" : s).toLowerCase();
    var pairs = [
        [/[\u00e0\u00e1\u1ea1\u1ea3\u00e3\u00e2\u1ea7\u1ea5\u1ead\u1ea9\u1eab\u0103\u1eb1\u1eaf\u1eb7\u1eb3\u1eb5]/g, "a"],
        [/[\u00e8\u00e9\u1eb9\u1ebb\u1ebd\u00ea\u1ec1\u1ebf\u1ec7\u1ec3\u1ec5]/g, "e"],
        [/[\u00ec\u00ed\u1ecb\u1ec9\u0129]/g, "i"],
        [/[\u00f2\u00f3\u1ecd\u1ecf\u00f5\u00f4\u1ed3\u1ed1\u1ed9\u1ed5\u1ed7\u01a1\u1edd\u1edb\u1ee3\u1edf\u1ee1]/g, "o"],
        [/[\u00f9\u00fa\u1ee5\u1ee7\u0169\u01b0\u1eeb\u1ee9\u1ef1\u1eed\u1eef]/g, "u"],
        [/[\u1ef3\u00fd\u1ef5\u1ef7\u1ef9]/g, "y"],
        [/\u0111/g, "d"]
    ];
    var i = 0;
    for (i = 0; i < pairs.length; i++) {
        text = text.replace(pairs[i][0], pairs[i][1]);
    }
    text = text.replace(/[^a-z0-9]+/g, "-");
    text = text.replace(/^-+|-+$/g, "");
    return text;
}
