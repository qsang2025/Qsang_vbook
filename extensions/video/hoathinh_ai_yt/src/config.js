// config.js — cau hinh va 3-tier API client cho Hoat Hinh AI YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var BASE_URL = "https://www.youtube.com";
try {
    if (typeof DOMAIN !== "undefined" && DOMAIN) {
        var d = String(DOMAIN).trim();
        if (d.indexOf("http") === 0) BASE_URL = d.replace(/\/+$/, "");
    }
} catch (e) {}

var PIPED_INSTANCES = [
    "https://api.piped.private.coffee",
    "https://pipedapi.ducks.party",
    "https://api.piped.projectsegfau.lt",
    "https://pipedapi.kavin.rocks"
];

var INVIDIOUS_INSTANCES = [
    "https://inv.nadeko.net",
    "https://invidious.nerdvpn.de",
    "https://iv.datura.network",
    "https://invidious.jing.rocks"
];

var FEATURED_CHANNELS = [
    {
        title: "CibiiSub",
        id: "UCoDbjVH_qTL7EvtEkTNpEzw",
        handle: "/@CibiiSub-01",
        cover: "https://yt3.googleusercontent.com/7mI4AADlc6AkTf90WbrEc98INvujTBpEdFxoAZlV4MrUEsC1jSefgE6sgIPaKRCr4ZFG66oyIis=s900-c-k-c0x00ffffff-no-rj",
        description: "Hoạt Hình 3D - AI • Playlist 151+ tập, bản full 37m–3h37m"
    },
    {
        title: "Zzzphim",
        id: "UCkaKs808Jt2Mi9F-HJ0OmuQ",
        handle: "/@Zzzphim",
        cover: "https://yt3.googleusercontent.com/vKaiphofTvhwgu9FKNlKMlUr1wsnB-_mezc5MjKXN42QaIeiMaceeUR97PG5OHeCRlIGl3UI=s900-c-k-c0x00ffffff-no-rj",
        description: "AI Tu Tiên / Huyền Huyễn • Bản full 2h–6h mỗi ngày"
    },
    {
        title: "Não Phẳng Tu Tiên",
        id: "UCZFxno6YgiW4rIJb534B6TQ",
        handle: "/@nao-phang",
        cover: "https://yt3.googleusercontent.com/p11nLxCPNolIe7t76Rww9Yj_d0e8nFg9vX91OpcyCn9kyLR9n4IOfVJwY-nAi3p-ZCEQaDFP=s900-c-k-c0x00ffffff-no-rj",
        description: "AI Tu Tiên Donghua • Bản full 1h–5h+ cập nhật liên tục"
    },
    {
        title: "2K Sub",
        id: "UCOt427I8MNYQubeVLWqdn_g",
        handle: "/@2KSUB2000",
        cover: "https://yt3.googleusercontent.com/2pT1OpzSTT733gjE97X4-uFY44guGeOjo7P24ymLllcWuThD5KovURuUd5bPGILz8yOq7GRwtw=s900-c-k-c0x00ffffff-no-rj",
        description: "AI Tu Tiên Marathon • Bản trọn bộ 2h–18h"
    },
    {
        title: "Giấc Mộng Tu Tiên",
        id: "UCOQHUfdEJ4cgF_vDNzXMwWg",
        handle: "/@giacmongtutien",
        cover: "https://yt3.googleusercontent.com/jydCc5SZZf-2kBHz2_jnS2pCLgGIZNoKRw1oVyq1mx_FscbNM11hpS7GOGqAZRMBCX1CoKDkZQ=s900-c-k-c0x00ffffff-no-rj",
        description: "AI Tu Tiên • Bản full 1h–8h+ thuyết minh"
    },
    {
        title: "Pi Studio",
        id: "UCUHwv_gxpPDKi0A16-xFffg",
        handle: "/@pikapistudio",
        cover: "https://yt3.googleusercontent.com/P5iuw-6ijBC6OFlw8xqviCM9wUjHYm19pR0xKH7VuC5wOVFGK--3i_wLzqSSbitcA-SVr8T2QAU=s900-c-k-c0x00ffffff-no-rj",
        description: "AI Donghua Full-end • 47m–1h32m & playlists"
    }
];

function getCustomMirrors() {
    var list = [];
    try {
        if (typeof MIRRORS !== "undefined" && MIRRORS) {
            var parts = String(MIRRORS).split(",");
            var i = 0;
            for (i = 0; i < parts.length; i++) {
                var u = parts[i].trim().replace(/\/+$/, "");
                if (u.indexOf("http") === 0) list.push(u);
            }
        }
    } catch (e) {}
    return list;
}

function getMinDurationSec() {
    try {
        if (typeof MIN_DURATION !== "undefined" && MIN_DURATION) {
            var n = parseInt(String(MIN_DURATION).trim(), 10);
            if (!isNaN(n) && n > 0) return n;
        }
    } catch (e) {}
    return 1200;
}

function getPreferredQuality() {
    try {
        if (typeof PREFERRED_QUALITY !== "undefined" && PREFERRED_QUALITY) {
            var q = String(PREFERRED_QUALITY).trim();
            if (q === "auto_hls" || q === "4k_2k" || q === "1080p" || q === "720p") return q;
        }
    } catch (e) {}
    return "1080p";
}

function getSortBy() {
    try {
        if (typeof SORT_BY !== "undefined" && SORT_BY) {
            var s = String(SORT_BY).trim();
            if (s === "relevance" || s === "upload_date" || s === "view_count" || s === "duration") return s;
        }
    } catch (e) {}
    return "relevance";
}

function isDanmakuEnabled() {
    try {
        if (typeof ENABLE_DANMAKU !== "undefined" && ENABLE_DANMAKU !== null) {
            var v = String(ENABLE_DANMAKU).trim().toLowerCase();
            if (v === "off" || v === "false" || v === "0") return false;
        }
    } catch (e) {}
    return true;
}

function getAudioFilter() {
    try {
        if (typeof AUDIO_FILTER !== "undefined" && AUDIO_FILTER) {
            var f = String(AUDIO_FILTER).trim();
            if (f === "thuyet_minh" || f === "tron_bo" || f === "all") return f;
        }
    } catch (e) {}
    return "all";
}

function isCleanTitlesEnabled() {
    try {
        if (typeof CLEAN_TITLES !== "undefined" && CLEAN_TITLES !== null) {
            var v = String(CLEAN_TITLES).trim().toLowerCase();
            if (v === "off" || v === "false" || v === "0") return false;
        }
    } catch (e) {}
    return true;
}

var _cloudInvidious = [];
var _cloudInvidiousFetched = false;

function fetchCloudInvidiousInstances() {
    if (_cloudInvidiousFetched) return _cloudInvidious;
    _cloudInvidiousFetched = true;
    try {
        var res = fetch("https://api.invidious.io/instances.json?sort_by=health", {
            headers: { "Accept": "application/json" },
            timeout: 3500
        });
        if (!res || !res.ok) return _cloudInvidious;
        var arr = JSON.parse(res.text());
        if (!arr || !arr.length) return _cloudInvidious;
        var seen = {};
        var i = 0;
        for (i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
            seen[INVIDIOUS_INSTANCES[i].replace(/\/+$/, "").toLowerCase()] = true;
        }
        for (i = 0; i < arr.length && _cloudInvidious.length < 4; i++) {
            var pair = arr[i];
            if (!pair || pair.length < 2) continue;
            var info = pair[1];
            if (!info || info.type !== "https" || info.api !== true) continue;
            var uri = info.uri ? String(info.uri).trim().replace(/\/+$/, "") : "";
            if (!uri || uri.indexOf("https://") !== 0) continue;
            var key = uri.toLowerCase();
            if (seen[key]) continue;
            seen[key] = true;
            _cloudInvidious.push(uri);
        }
    } catch (e) {}
    return _cloudInvidious;
}

var _preferredPlayerClient = "";

function getPlayerClientsOrder() {
    var defaults = ["ANDROID", "IOS", "ANDROID_VR"];
    if (!_preferredPlayerClient) return defaults;
    var out = [_preferredPlayerClient];
    var i = 0;
    for (i = 0; i < defaults.length; i++) {
        if (defaults[i] !== _preferredPlayerClient) out.push(defaults[i]);
    }
    return out;
}

function setPreferredPlayerClient(clientType) {
    if (clientType) _preferredPlayerClient = String(clientType);
}

function getAllFeaturedChannels() {
    var list = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < FEATURED_CHANNELS.length; i++) {
        var fc = FEATURED_CHANNELS[i];
        list.push(fc);
        if (fc.id) seen[String(fc.id).toLowerCase()] = true;
        if (fc.handle) seen[String(fc.handle).replace(/^\/+/, "").toLowerCase()] = true;
    }
    try {
        if (typeof CUSTOM_CHANNELS !== "undefined" && CUSTOM_CHANNELS) {
            var parts = String(CUSTOM_CHANNELS).split(",");
            for (i = 0; i < parts.length; i++) {
                var raw = parts[i].trim();
                if (!raw) continue;
                var cid = "";
                var handle = "";
                var mUc = raw.match(/(UC[a-zA-Z0-9_-]{10,})/);
                var mHandle = raw.match(/(@[a-zA-Z0-9_.-]+)/);
                if (mHandle) {
                    handle = mHandle[1];
                } else if (mUc) {
                    cid = mUc[1];
                } else {
                    handle = raw.charAt(0) === "@" ? raw : ("@" + raw);
                }
                var key = (cid || handle).toLowerCase();
                if (!key || seen[key]) continue;
                seen[key] = true;
                list.push({
                    title: cid || handle,
                    id: cid,
                    handle: handle ? ("/" + handle) : "",
                    cover: "",
                    description: "Kênh YouTube bổ sung"
                });
            }
        }
    } catch (e) {}
    return list;
}

var _cachedVisitorData = "";

function fetchVisitorData() {
    if (_cachedVisitorData) return _cachedVisitorData;
    try {
        var res = fetch(BASE_URL + "/youtubei/v1/visitor_id?prettyPrint=false", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "Origin": BASE_URL,
                "Referer": BASE_URL + "/"
            },
            body: JSON.stringify({
                context: {
                    client: {
                        clientName: "WEB",
                        clientVersion: "2.20241126.01.00",
                        hl: "vi",
                        gl: "VN"
                    }
                }
            }),
            timeout: 8000
        });
        if (res && res.ok) {
            var j = JSON.parse(res.text());
            if (j && j.responseContext && j.responseContext.visitorData) {
                _cachedVisitorData = String(j.responseContext.visitorData);
            }
        }
    } catch (e) {}
    return _cachedVisitorData;
}

function getInnerTubeContext(clientType, visitorData) {
    var cl = null;
    if (clientType === "ANDROID") {
        cl = {
            clientName: "ANDROID",
            clientVersion: "20.10.38",
            androidSdkVersion: 34,
            osName: "Android",
            osVersion: "14",
            hl: "vi",
            gl: "VN"
        };
    } else if (clientType === "ANDROID_VR") {
        cl = {
            clientName: "ANDROID_VR",
            clientVersion: "1.60.19",
            androidSdkVersion: 32,
            deviceMake: "Oculus",
            deviceModel: "Quest 3",
            hl: "vi",
            gl: "VN"
        };
    } else if (clientType === "IOS") {
        cl = {
            clientName: "IOS",
            clientVersion: "20.10.4",
            deviceMake: "Apple",
            deviceModel: "iPhone16,2",
            osName: "iPhone",
            osVersion: "18.3.2.22D82",
            hl: "vi",
            gl: "VN"
        };
    } else {
        cl = {
            clientName: "WEB",
            clientVersion: "2.20241126.01.00",
            hl: "vi",
            gl: "VN"
        };
    }
    if (visitorData) cl.visitorData = visitorData;
    return { client: cl };
}

function isBadApiText(txt) {
    if (!txt) return true;
    var s = String(txt).trim();
    if (!s) return true;
    if (s.charAt(0) === "<") return true;
    if (s.indexOf("SignInConfirmNotBotException") !== -1) return true;
    return false;
}

function requestInnerTube(action, payload, clientType, timeoutMs) {
    var url = BASE_URL + "/youtubei/v1/" + action + "?prettyPrint=false";
    var body = {};
    var k;
    if (payload) {
        for (k in payload) {
            if (payload.hasOwnProperty(k)) body[k] = payload[k];
        }
    }
    var vd = "";
    if (action === "player" && clientType && clientType !== "WEB") {
        vd = fetchVisitorData();
        body.contentCheckOk = true;
        body.racyCheckOk = true;
    }
    body.context = getInnerTubeContext(clientType || "WEB", vd);

    var headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Origin": BASE_URL,
        "Referer": BASE_URL + "/"
    };
    if (clientType === "ANDROID") {
        headers["User-Agent"] = "com.google.android.youtube/20.10.38 (Linux; U; Android 14) gzip";
    } else if (clientType === "ANDROID_VR") {
        headers["User-Agent"] = "com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip";
    } else if (clientType === "IOS") {
        headers["User-Agent"] = "com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)";
    }

    try {
        var res = fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body),
            timeout: timeoutMs || 12000
        });
        if (!res || !res.ok) return null;
        var txt = res.text();
        if (isBadApiText(txt)) return null;
        return JSON.parse(txt);
    } catch (e) {
        return null;
    }
}

function fetchJsonSafe(url, timeoutMs) {
    try {
        var res = fetch(url, {
            headers: { "Accept": "application/json" },
            timeout: timeoutMs || 7000
        });
        if (!res || !res.ok) return null;
        var txt = res.text();
        if (isBadApiText(txt)) return null;
        var j = JSON.parse(txt);
        if (!j || j.error) return null;
        return j;
    } catch (e) {
        return null;
    }
}

// 3-tier requestApi: Piped -> Invidious -> YouTube InnerTube rescue.
// opts: { timeoutMs, preferInnerTube, innerTubeAction, innerTubePayload, clientType }
function requestApi(endpoint, opts) {
    opts = opts || {};
    var timeoutMs = opts.timeoutMs || 6000;
    var i = 0;
    var j = null;

    if (opts.preferInnerTube && opts.innerTubeAction) {
        j = requestInnerTube(opts.innerTubeAction, opts.innerTubePayload, opts.clientType || "WEB");
        if (j) return { tier: "innertube", data: j };
    }

    var custom = getCustomMirrors();
    var pipedList = custom.concat(PIPED_INSTANCES);
    for (i = 0; i < pipedList.length; i++) {
        j = fetchJsonSafe(pipedList[i] + endpoint, timeoutMs);
        if (j) return { tier: "piped", data: j };
    }

    var invEndpoint = endpoint;
    if (endpoint.indexOf("/streams/") === 0) {
        invEndpoint = "/api/v1/videos/" + endpoint.substring(9);
    } else if (endpoint.indexOf("/playlists/") === 0) {
        invEndpoint = "/api/v1/playlists/" + endpoint.substring(11);
    } else if (endpoint.indexOf("/comments/") === 0) {
        invEndpoint = "/api/v1/comments/" + endpoint.substring(10);
    }
    for (i = 0; i < INVIDIOUS_INSTANCES.length; i++) {
        j = fetchJsonSafe(INVIDIOUS_INSTANCES[i] + invEndpoint, timeoutMs);
        if (j) return { tier: "invidious", data: j };
    }

    var cloudInv = fetchCloudInvidiousInstances();
    for (i = 0; i < cloudInv.length; i++) {
        j = fetchJsonSafe(cloudInv[i] + invEndpoint, timeoutMs);
        if (j) return { tier: "invidious", data: j };
    }

    if (opts.innerTubeAction) {
        var clients = opts.clientTypes || [opts.clientType || "ANDROID_VR", "IOS"];
        for (i = 0; i < clients.length; i++) {
            j = requestInnerTube(opts.innerTubeAction, opts.innerTubePayload, clients[i]);
            if (j) return { tier: "innertube", data: j };
        }
    }

    return null;
}
