// helper.js — ham dung chung cho extension FQ Video (fanqienovel.com / hongguoduanju.com).
//
// Cong video chinh thuc hongguoduanju.com chia se chung series_id va itemId (vid) voi
// fanqienovel.com/api/reader/directory/detail?bookId=<id>.
// - Trang danh sach/BXH/chi tiet nhung trang thai SSR trong bien _ROUTER_DATA (JSON thuan).
// - Tim kiem: GET /api/search/result?query=<q>&page=<N> (header Referer: .../search, 1-30 ky tu).
// - Phat truc tiep (tap 1-5 tren web cong khai):
//     1) POST /api/video/protected/play-info (definition: "720p") -> legacy_play_info.main_url
//        (MP4 720p khong ma hoa er=0 cho man kich / hoat hinh AI).
//     2) POST /api/video/protected/fallback-play-info -> main_url (MP4 khong ma hoa er=0
//        full thoi luong cho phim ngan nguoi that & du phong).
//   KHONG bao gio dung /video/public/<vid>/360p.mp4 (chi la clip xem truoc 10 giay SEO).
//   KHONG xoay User-Agent (quy tac 10); pace moi request qua rate-limit.js (quy tac 11).
//
// File nay duoc nap boi cac script khac, nen KHONG duoc nap them file nao khac o day.
// Script goi phai nap file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var FQ_MIN_DELAY_MS = 1200;
var FQ_MAX_DELAY_MS = 2200;
var FQ_TIMEOUT_MS = 25000;

function videoBaseUrl() {
    var base = "https://hongguoduanju.com";
    try {
        if (typeof VIDEO_BASE_URL !== "undefined" && VIDEO_BASE_URL) {
            base = String(VIDEO_BASE_URL).replace(/\/+$/, "");
        }
    } catch (e) {
    }
    return base || "https://hongguoduanju.com";
}

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : videoBaseUrl();
}

function videoOrigin() {
    return originOf(videoBaseUrl());
}

function normalizeCover(url) {
    var u = String(url === undefined || url === null ? "" : url).replace(/^\s+|\s+$/g, "");
    if (!u) return "";
    if (u.indexOf("//") === 0) return "https:" + u;
    if (u.charAt(0) === "/") return videoOrigin() + u;
    return u;
}

function canonicalDetailUrl(seriesId) {
    return videoBaseUrl() + "/detail?series_id=" + String(seriesId || "");
}

function canonicalEpisodeUrl(seriesId, itemId) {
    return videoBaseUrl() + "/player/" + String(seriesId || "") + "/" + String(itemId || "");
}

function extractSeriesId(url) {
    var s = String(url === undefined || url === null ? "" : url).replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (/^\d{6,}$/.test(s)) return s;
    var m = s.match(/[?&]series_id=(\d+)/i);
    if (m) return m[1];
    m = s.match(/[?&]bookId=(\d+)/i);
    if (m) return m[1];
    m = s.match(/\/player\/(\d+)(?:\/|$|\?)/i);
    if (m) return m[1];
    m = s.match(/\/page\/(\d+)(?:\/|$|\?)/i);
    if (m) return m[1];
    return "";
}

function extractPlayerIds(url) {
    var s = String(url === undefined || url === null ? "" : url).replace(/^\s+|\s+$/g, "");
    var seriesId = "";
    var itemId = "";
    var m = s.match(/\/player\/(\d+)\/(\d+)/i);
    if (m) {
        seriesId = m[1];
        itemId = m[2];
    } else {
        var sm = s.match(/[?&]series_id=(\d+)/i);
        var im = s.match(/[?&](?:item_id|vid)=(\d+)/i);
        if (sm) seriesId = sm[1];
        if (im) itemId = im[1];
        if (!seriesId) seriesId = extractSeriesId(s);
    }
    return { seriesId: seriesId, itemId: itemId };
}

function truncateText(text, maxLen) {
    var t = cleanText(text || "");
    if (!maxLen || t.length <= maxLen) return t;
    return t.substring(0, maxLen - 1).replace(/\s+$/, "") + "…";
}

// Quet JSON can bang ngoac cho bien _ROUTER_DATA nhung trong HTML SSR.
// Dung vong lap quet ky tu thay vi regex de khong bi cat cut khi JSON chua
// chuoi HTML hoac dau "};" ben trong.
function extractRouterData(html) {
    var text = String(html || "");
    if (!text) return null;
    var searchPos = 0;
    while (searchPos < text.length) {
        var idx = text.indexOf("_ROUTER_DATA", searchPos);
        if (idx === -1) return null;
        searchPos = idx + 12;

        var eq = text.indexOf("=", searchPos);
        if (eq === -1 || eq - searchPos > 20) continue;

        var pos = eq + 1;
        while (pos < text.length) {
            var c0 = text.charAt(pos);
            if (c0 === " " || c0 === "\t" || c0 === "\r" || c0 === "\n") {
                pos = pos + 1;
            } else {
                break;
            }
        }
        if (pos >= text.length) continue;

        // Truong hop hiem: _ROUTER_DATA = JSON.parse("...")
        if (text.substring(pos, pos + 10) === "JSON.parse") {
            var qStart = text.indexOf("\"", pos + 10);
            if (qStart === -1) continue;
            var esc = false;
            var qi = qStart + 1;
            for (; qi < text.length; qi++) {
                var qc = text.charAt(qi);
                if (esc) {
                    esc = false;
                } else if (qc === "\\") {
                    esc = true;
                } else if (qc === "\"") {
                    break;
                }
            }
            if (qi < text.length) {
                try {
                    var unescaped = JSON.parse(text.substring(qStart, qi + 1));
                    return JSON.parse(unescaped);
                } catch (e0) {
                    continue;
                }
            }
            continue;
        }

        if (text.charAt(pos) !== "{") continue;

        var depth = 0;
        var inStr = false;
        var escaped = false;
        var i = pos;
        for (; i < text.length; i++) {
            var ch = text.charCodeAt(i);
            if (inStr) {
                if (escaped) {
                    escaped = false;
                } else if (ch === 92) { // '\'
                    escaped = true;
                } else if (ch === 34) { // '"'
                    inStr = false;
                }
            } else {
                if (ch === 34) { // '"'
                    inStr = true;
                } else if (ch === 123) { // '{'
                    depth = depth + 1;
                } else if (ch === 125) { // '}'
                    depth = depth - 1;
                    if (depth === 0) {
                        var raw = text.substring(pos, i + 1);
                        try {
                            return JSON.parse(raw);
                        } catch (e1) {
                            break;
                        }
                    }
                }
            }
        }
    }
    return null;
}

function getHeaderIgnoreCase(headers, name) {
    if (!headers || !name) return "";
    var target = String(name).toLowerCase();
    for (var k in headers) {
        try {
            if (String(k).toLowerCase() === target) {
                return String(headers[k] || "");
            }
        } catch (e) {
        }
    }
    return "";
}

function isVerifyResponse(status, headers, bodyText) {
    var verifyHdr = getHeaderIgnoreCase(headers, "bdturing-verify");
    if (verifyHdr) return true;
    var body = String(bodyText || "");
    if (body.indexOf("search_verification_required") !== -1) return true;
    if (body.indexOf("bdturing-verify") !== -1) return true;
    if (typeof isChallengeText === "function" && isChallengeText(body)) return true;
    return false;
}

function fqHttpError(r, url, actionLabel, bodyText) {
    var label = actionLabel || "Không tải được dữ liệu FQ Video";
    var host = pacedHostOf(url);
    var body = String(bodyText || "");

    if (!r) return label + " (không có phản hồi từ máy chủ).";
    if (r.error === "cooldown" || r.status === 429 || r.status === 405) {
        return rateLimitErrorMessage("FQ Video", host, r.cooldownRemainingMs);
    }
    if (isVerifyResponse(r.status, r.headers, body)) {
        return "FQ Video đang yêu cầu xác minh bảo mật (captcha). Vui lòng đợi ít phút rồi thử lại, không tải lại liên tục.";
    }
    if (r.status === 403 && (body.indexOf("public_fallback_unavailable") !== -1 || body.indexOf("protected_playback_unavailable") !== -1)) {
        return "Tập này bị khóa trên web công khai (chỉ mở miễn phí 5 tập đầu; tập 6+ cần xem trên ứng dụng Fanqie / Hồng Quả).";
    }
    if (r.status === 400 && body.indexOf("too_long") !== -1) {
        return "Từ khóa tìm kiếm tối đa 30 ký tự (giới hạn API FQ Video). Vui lòng rút gọn từ khóa.";
    }
    if (r.status === 400 && body.indexOf("empty") !== -1) {
        return "Vui lòng nhập từ khóa để tìm kiếm.";
    }
    if (r.status === 404 || r.status === 500) {
        return label + " (không tìm thấy nội dung hoặc ID phim không hợp lệ, HTTP " + r.status + ").";
    }
    if (r.status > 0) {
        return label + " (HTTP " + r.status + ").";
    }
    return label + " (lỗi kết nối mạng).";
}

function readResponseTextSafe(res) {
    if (!res) return "";
    try {
        return String(res.text() || "");
    } catch (e) {
        return "";
    }
}

function buildMirrorUrls(url) {
    var urls = [url];
    var mirrors = [];
    try {
        if (typeof MIRROR_LIST !== "undefined" && MIRROR_LIST && MIRROR_LIST.length > 0) {
            mirrors = MIRROR_LIST;
        }
    } catch (e) {
    }
    var i = 0;
    for (i = 0; i < mirrors.length; i++) {
        var m = String(mirrors[i] || "").replace(/\/+$/, "");
        if (!m) continue;
        var alt = String(url).replace(/^https?:\/\/[^\/]+/i, m);
        if (alt && alt !== url) urls.push(alt);
    }
    return urls;
}

function fqFetchHtml(url, referer, actionLabel) {
    var candidates = buildMirrorUrls(url);
    var lastErr = "";
    var lastStatus = 0;
    var i = 0;

    for (i = 0; i < candidates.length; i++) {
        var target = candidates[i];
        var r = pacedFetch(target, {
            referer: referer || videoBaseUrl() + "/",
            headers: {
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "zh-CN,zh;q=0.9,vi;q=0.8"
            },
            minDelayMs: FQ_MIN_DELAY_MS,
            maxDelayMs: FQ_MAX_DELAY_MS,
            maxRetries: 2,
            timeout: FQ_TIMEOUT_MS
        });
        var body = readResponseTextSafe(r ? r.res : null);
        if (r && r.ok) {
            if (isVerifyResponse(r.status, r.headers, body)) {
                return { ok: false, status: r.status, text: body, error: fqHttpError(r, target, actionLabel, body) };
            }
            return { ok: true, status: r.status, text: body, error: "" };
        }
        lastStatus = r ? r.status : 0;
        lastErr = fqHttpError(r, target, actionLabel, body);
        // Khong failover sang mirror khi 4xx (rate-limit, 403, 404, 400) hoac cooldown.
        if (r && (r.error === "cooldown" || (r.status >= 400 && r.status < 500))) {
            break;
        }
    }
    return { ok: false, status: lastStatus, text: "", error: lastErr || (actionLabel || "Không tải được trang.") };
}

function fqFetchJson(url, opts, actionLabel) {
    opts = opts || {};
    var method = opts.method || "GET";
    var reqHeaders = {
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "zh-CN,zh;q=0.9,vi;q=0.8"
    };
    if (method === "POST") {
        reqHeaders["Content-Type"] = "application/json";
        reqHeaders["Origin"] = originOf(url);
    }
    if (opts.headers) {
        for (var k in opts.headers) {
            reqHeaders[k] = opts.headers[k];
        }
    }

    var candidates = opts.allowMirrors ? buildMirrorUrls(url) : [url];
    var lastErr = "";
    var lastStatus = 0;
    var lastBody = "";
    var i = 0;

    for (i = 0; i < candidates.length; i++) {
        var target = candidates[i];
        var fetchOpts = {
            method: method,
            referer: opts.referer || videoBaseUrl() + "/",
            headers: reqHeaders,
            minDelayMs: typeof opts.minDelayMs === "number" ? opts.minDelayMs : FQ_MIN_DELAY_MS,
            maxDelayMs: typeof opts.maxDelayMs === "number" ? opts.maxDelayMs : FQ_MAX_DELAY_MS,
            maxRetries: typeof opts.maxRetries === "number" ? opts.maxRetries : 2,
            timeout: typeof opts.timeout === "number" ? opts.timeout : FQ_TIMEOUT_MS
        };
        if (opts.body !== undefined && opts.body !== null) {
            fetchOpts.body = typeof opts.body === "string" ? opts.body : JSON.stringify(opts.body);
        }

        var r = pacedFetch(target, fetchOpts);
        var body = readResponseTextSafe(r ? r.res : null);
        lastBody = body;
        lastStatus = r ? r.status : 0;

        if (r && r.ok) {
            if (isVerifyResponse(r.status, r.headers, body)) {
                return { ok: false, status: r.status, json: null, body: body, error: fqHttpError(r, target, actionLabel, body) };
            }
            if (!body) {
                return { ok: false, status: r.status, json: null, body: "", error: (actionLabel || "API trả về phản hồi rỗng") + "." };
            }
            try {
                var parsed = JSON.parse(body);
                return { ok: true, status: r.status, json: parsed, body: body, error: "" };
            } catch (e) {
                return { ok: false, status: r.status, json: null, body: body, error: (actionLabel || "Không phân tích được JSON từ API") + "." };
            }
        }

        lastErr = fqHttpError(r, target, actionLabel, body);
        if (r && (r.error === "cooldown" || (r.status >= 400 && r.status < 500))) {
            break;
        }
    }
    return { ok: false, status: lastStatus, json: null, body: lastBody, error: lastErr || (actionLabel || "Không gọi được API.") };
}

function findRankContent(routerData) {
    if (!routerData || !routerData.loaderData) return null;
    var ld = routerData.loaderData;
    for (var k in ld) {
        var entry = ld[k];
        if (entry && entry.content && entry.content.rankList instanceof Array) {
            return entry.content;
        }
    }
    return null;
}

function findCategoryContent(routerData) {
    if (!routerData || !routerData.loaderData) return null;
    var ld = routerData.loaderData;
    for (var k in ld) {
        var entry = ld[k];
        if (entry && entry.recommendList instanceof Array) {
            return entry;
        }
    }
    return null;
}

function findDetailPage(routerData) {
    if (!routerData || !routerData.loaderData) return null;
    var ld = routerData.loaderData;
    if (ld.detail_page && ld.detail_page.seriesDetail) return ld.detail_page;
    for (var k in ld) {
        var entry = ld[k];
        if (entry && entry.seriesDetail) {
            return entry;
        }
    }
    return null;
}

function mapRankItem(item) {
    if (!item) return null;
    var sid = String(item.seriesId || item.series_id || item.id || "");
    var name = cleanText(item.title || item.series_name || "");
    if (!sid || !name) return null;
    var heat = cleanText(item.primaryMetricText || item.heatText || "");
    var rankLabel = item.rank ? "Top " + item.rank : "";
    var desc = "";
    if (rankLabel) desc += rankLabel;
    if (heat) desc += (desc ? " · " : "") + heat;
    return {
        name: name,
        cover: normalizeCover(item.cover || item.series_cover || ""),
        link: canonicalDetailUrl(sid),
        description: desc,
        tag: heat || rankLabel,
        host: videoOrigin()
    };
}

function mapCategoryItem(item) {
    if (!item) return null;
    var sid = String(item.series_id || item.seriesId || item.id || "");
    var name = cleanText(item.series_name || item.title || "");
    if (!sid || !name) return null;
    var epText = cleanText(item.episode_right_text || "");
    if (!epText && item.episode_cnt) {
        epText = item.episode_cnt + " tập";
    }
    return {
        name: name,
        cover: normalizeCover(item.series_cover || item.cover || ""),
        link: canonicalDetailUrl(sid),
        description: truncateText(item.series_intro || "", 140),
        tag: epText,
        host: videoOrigin()
    };
}

function mapSearchItem(entry) {
    if (!entry) return null;
    var vd = entry.video_data ? entry.video_data : entry;
    var sid = String(vd.series_id || vd.seriesId || entry.series_id || "");
    var name = cleanText(vd.series_title || vd.series_name || entry.name || "");
    if (!sid || !name) return null;

    var genreTag = "";
    if (String(vd.genre || "") === "205") {
        genreTag = "Hoạt hình/Mạn kịch";
    } else if (String(vd.genre || "") === "203") {
        genreTag = "Phim ngắn";
    }
    var epText = cleanText(vd.episode_right_text || "");
    if (!epText && vd.episode_cnt) {
        epText = vd.episode_cnt + " tập";
    }
    var tag = genreTag;
    if (epText) tag = tag ? tag + " · " + epText : epText;

    return {
        name: name,
        cover: normalizeCover(vd.series_cover || ""),
        link: canonicalDetailUrl(sid),
        description: truncateText(vd.series_intro || "", 140),
        tag: tag,
        host: videoOrigin()
    };
}

function fetchSeriesDetail(seriesId) {
    var detailUrl = canonicalDetailUrl(seriesId);
    var r = fqFetchHtml(detailUrl, videoBaseUrl() + "/", "Không tải được trang chi tiết phim");
    if (!r.ok) {
        return { ok: false, detail: null, social: null, url: detailUrl, error: r.error };
    }
    var rd = extractRouterData(r.text);
    var dp = findDetailPage(rd);
    if (!dp || !dp.seriesDetail || !dp.seriesDetail.series_name) {
        return {
            ok: false,
            detail: null,
            social: null,
            url: detailUrl,
            error: "Không đọc được thông tin phim (ID không hợp lệ hoặc cấu trúc site đã đổi)."
        };
    }
    return {
        ok: true,
        detail: dp.seriesDetail,
        social: dp.seriesSocialInfo || {},
        url: detailUrl,
        error: ""
    };
}

function fetchFanqieDirectory(seriesId) {
    var dirUrl = siteOrigin() + "/api/reader/directory/detail?bookId=" + encodeURIComponent(String(seriesId || ""));
    var r = fqFetchJson(dirUrl, {
        referer: siteOrigin() + "/",
        minDelayMs: 600,
        maxDelayMs: 1200,
        maxRetries: 1,
        timeout: 15000
    }, "Không tải được mục lục Fanqie");
    if (!r.ok || !r.json || r.json.code !== 0 || !r.json.data) {
        return { titleMap: {}, itemIds: [] };
    }
    var titleMap = {};
    var itemIds = [];
    var data = r.json.data;
    if (data.allItemIds instanceof Array) {
        var k = 0;
        for (k = 0; k < data.allItemIds.length; k++) {
            var idStr = String(data.allItemIds[k] || "");
            if (idStr) itemIds.push(idStr);
        }
    }
    if (data.chapterListWithVolume instanceof Array) {
        var v = 0;
        for (v = 0; v < data.chapterListWithVolume.length; v++) {
            var vol = data.chapterListWithVolume[v];
            if (!(vol instanceof Array)) continue;
            var c = 0;
            for (c = 0; c < vol.length; c++) {
                var ch = vol[c];
                if (!ch || !ch.itemId) continue;
                var cid = String(ch.itemId);
                var title = cleanText(ch.title || "");
                if (title) titleMap[cid] = title;
            }
        }
    }
    return { titleMap: titleMap, itemIds: itemIds };
}

function isUnencryptedMp4Url(url) {
    var u = String(url || "").replace(/^\s+|\s+$/g, "");
    if (!/^https?:\/\//i.test(u)) return false;
    // Tuyet doi tranh clip xem truoc SEO 10 giay va stream ma hoa CENC er=1.
    if (u.indexOf("/video/public/") !== -1) return false;
    if (/[?&]er=1(?:&|$)/i.test(u)) return false;
    return true;
}

function resolveStreamUrl(seriesId, itemId, mode) {
    var sid = String(seriesId || "");
    var vid = String(itemId || "");
    if (!vid) {
        return { ok: false, status: 0, url: "", source: "", error: "Thiếu mã tập phim (item_id)." };
    }

    var referer = sid ? canonicalEpisodeUrl(sid, vid) : videoBaseUrl() + "/";

    // Buoc 1 (che do "hd"): thu play-info 720p truoc de lay MP4 720p khong ma hoa
    // (legacy_play_info.main_url — ap dung cho man kich & hoat hinh AI).
    if (mode !== "fallback" && sid) {
        var playUrl = videoBaseUrl() + "/api/video/protected/play-info";
        var pr = fqFetchJson(playUrl, {
            method: "POST",
            referer: referer,
            body: {
                series_id: sid,
                item_id: vid,
                definition: "720p"
            },
            maxRetries: 2,
            timeout: FQ_TIMEOUT_MS
        }, "Không lấy được thông tin phát HD");

        if (pr.ok && pr.json && pr.json.legacy_play_info && pr.json.legacy_play_info.main_url) {
            var hdUrl = String(pr.json.legacy_play_info.main_url);
            if (isUnencryptedMp4Url(hdUrl)) {
                return { ok: true, status: 200, url: hdUrl, source: "play-info-720p", error: "" };
            }
        }
        // Neu server bao 403 (tap 6+ khoa app) hoac bi rate-limit/captcha thi dung ngay.
        if (!pr.ok && (pr.status === 403 || pr.status === 429 || pr.status === 405 || pr.error.indexOf("xác minh") !== -1 || pr.error.indexOf("chặn IP") !== -1)) {
            return { ok: false, status: pr.status, url: "", source: "", error: pr.error };
        }
    }

    // Buoc 2: fallback-play-info — tra MP4 khong ma hoa er=0 day du thoi luong cho ca
    // phim ngan nguoi that (noi play-info dung CENC DASH er=1) va man kich/du phong.
    var fbUrl = videoBaseUrl() + "/api/video/protected/fallback-play-info";
    var fr = fqFetchJson(fbUrl, {
        method: "POST",
        referer: referer,
        body: {
            item_id: vid
        },
        maxRetries: 2,
        timeout: FQ_TIMEOUT_MS
    }, "Không lấy được link phát MP4 trực tiếp");

    if (fr.ok && fr.json && fr.json.main_url) {
        var mp4Url = String(fr.json.main_url);
        if (isUnencryptedMp4Url(mp4Url)) {
            return { ok: true, status: 200, url: mp4Url, source: "fallback-mp4", error: "" };
        }
    }

    return {
        ok: false,
        status: fr.status || 0,
        url: "",
        source: "",
        error: fr.error || "Không lấy được luồng MP4 native không mã hóa cho tập này."
    };
}
