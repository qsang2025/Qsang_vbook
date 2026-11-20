// config.js — cau hinh goc cua extension FQ Video (fanqienovel.com / hongguoduanju.com).
//
// BASE_URL mac dinh la https://fanqienovel.com (khop metadata.source va config.DOMAIN.default).
// VIDEO_BASE_URL mac dinh la https://hongguoduanju.com (cong video chinh thuc cua ByteDance
// dung chung series_id/itemId voi Fanqie, co the doi qua config.VIDEO_DOMAIN).
// Cac bien DOMAIN, VIDEO_DOMAIN, CONFIG_URL, MIRRORS do app inject nen KHONG khai bao var
// trung ten, chi doc trong try/catch.
// File nay duoc nap boi cac script khac, nen KHONG duoc nap them file nao khac o day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://fanqienovel.com";
var VIDEO_BASE_URL = "https://hongguoduanju.com";

function stripTrailingSlash(url) {
    return String(url || "").replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
}

try {
    if (DOMAIN) {
        var injectedDomain = stripTrailingSlash(DOMAIN);
        if (injectedDomain) BASE_URL = injectedDomain;
    }
} catch (e) {
}

try {
    if (VIDEO_DOMAIN) {
        var injectedVideoDomain = stripTrailingSlash(VIDEO_DOMAIN);
        if (injectedVideoDomain) VIDEO_BASE_URL = injectedVideoDomain;
    }
} catch (e2) {
}

try {
    if (CONFIG_URL) {
        var injectedCfg = stripTrailingSlash(CONFIG_URL);
        if (injectedCfg) {
            if (injectedCfg.indexOf("hongguoduanju") !== -1) {
                VIDEO_BASE_URL = injectedCfg;
            } else {
                BASE_URL = injectedCfg;
            }
        }
    }
} catch (e3) {
}

function parseMirrorList(value) {
    var list = [];
    var parts = [];
    var i = 0;
    if (typeof value === "string") {
        parts = value.split(",");
        for (i = 0; i < parts.length; i++) {
            var u = stripTrailingSlash(parts[i]);
            if (u) list.push(u);
        }
        return list;
    }
    if (value instanceof Array) {
        for (i = 0; i < value.length; i++) {
            var v = stripTrailingSlash(value[i]);
            if (v) list.push(v);
        }
        return list;
    }
    return list;
}

var MIRROR_LIST = [];

try {
    if (MIRRORS) {
        var injectedMirrors = parseMirrorList(MIRRORS);
        if (injectedMirrors.length > 0) MIRROR_LIST = injectedMirrors;
    }
} catch (e4) {
}

(function () {
    var kept = [];
    var seen = {};
    var k = 0;
    for (k = 0; k < MIRROR_LIST.length; k++) {
        var m = MIRROR_LIST[k];
        if (!m || m === BASE_URL || m === VIDEO_BASE_URL || seen[m]) continue;
        seen[m] = true;
        kept.push(m);
    }
    MIRROR_LIST = kept;
})();
