// helper.js — cac ham tien ich dung chung cho Hoat Hinh AI YouTube.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function normYtUrl(url) {
    var s = String(url === undefined || url === null ? "" : url).trim();
    if (!s) return "";
    var mShort = s.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (mShort) return BASE_URL + "/watch?v=" + mShort[1];
    s = s.replace(/^https?:\/\/(m\.)?youtube\.com/i, BASE_URL);
    if (s.charAt(0) === "/") return BASE_URL + s;
    return s;
}

function extractVideoId(url) {
    var s = String(url || "").trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
    var m = s.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    m = s.match(/\/(?:shorts|embed|live)\/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
    return "";
}

function extractPlaylistId(url) {
    var s = String(url || "").trim();
    var m = s.match(/[?&]list=([a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    if (s.indexOf("VL") === 0 && s.length > 4) return s.substring(2);
    if (/^(PL|OL|UU|LL|FL)[a-zA-Z0-9_-]+$/.test(s)) return s;
    return "";
}

function extractChannelId(url) {
    var s = String(url || "").trim();
    var m = s.match(/\/channel\/(UC[a-zA-Z0-9_-]+)/);
    if (m) return m[1];
    if (/^UC[a-zA-Z0-9_-]{10,}$/.test(s)) return s;
    return "";
}

function extractHandle(url) {
    var s = String(url || "").trim();
    var m = s.match(/youtube\.com\/(@[a-zA-Z0-9_.-]+)/);
    if (m) return m[1];
    if (s.charAt(0) === "@") return s;
    return "";
}

function parseDurationSec(input) {
    if (typeof input === "number") return isNaN(input) ? 0 : Math.floor(input);
    var s = cleanText(input);
    if (!s) return 0;
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    var parts = s.split(":");
    if (parts.length < 2 || parts.length > 3) return 0;
    var total = 0;
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var n = parseInt(parts[i], 10);
        if (isNaN(n)) return 0;
        total = total * 60 + n;
    }
    return total;
}

function pad2(n) {
    return n < 10 ? "0" + n : String(n);
}

function formatDuration(sec) {
    var n = parseInt(sec, 10);
    if (isNaN(n) || n <= 0) return "";
    var h = Math.floor(n / 3600);
    var m = Math.floor((n % 3600) / 60);
    var s = n % 60;
    if (h > 0) return pad2(h) + ":" + pad2(m) + ":" + pad2(s);
    return pad2(m) + ":" + pad2(s);
}

function formatTimestamp(sec) {
    var n = parseInt(sec, 10);
    if (isNaN(n) || n <= 0) return "00:00";
    return formatDuration(n);
}

function extractStartSec(url) {
    var s = String(url || "");
    var m = s.match(/[?&]t=(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (!isNaN(n) && n > 0) ? n : 0;
}

function extractEndSec(url) {
    var s = String(url || "");
    var m = s.match(/[?&]end=(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (!isNaN(n) && n > 0) ? n : 0;
}

function extractDurSec(url) {
    var s = String(url || "");
    var m = s.match(/[?&]dur=(\d+)/);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return (!isNaN(n) && n > 0) ? n : 0;
}

function extractBaseSeriesTitle(title) {
    var s = String(title || "").toLowerCase();
    if (!s) return "";
    s = s.replace(/\[[^\]]*\]/g, " ");
    s = s.replace(/\([^)]*(?:full|4k|2k|1080p|720p|hd|60fps|thuyết minh|thuyet minh|vietsub|lồng tiếng|long tieng|trọn bộ|tron bo|phần|phan|part|season|tập|tap|ep)[^)]*\)/gi, " ");
    s = s.replace(/(?:phần|phan|part|season|mùa|mua)\s*\d+(?:\s*[-–~]\s*\d+)?/gi, " ");
    s = s.replace(/\b[ps]\d+\b/gi, " ");
    s = s.replace(/(?:tập|tap|episode|ep\.?)\s*\d+(?:\s*[-–~]\s*\d+)?/gi, " ");
    s = s.replace(/\b(?:trọn bộ|tron bo|bản full|ban full|full hd|full|thuyết minh|thuyet minh|vietsub|lồng tiếng|long tieng|hoạt hình 3d|hoat hinh 3d|hoạt hình ai|hoat hinh ai|4k|2k|1080p|720p|60fps|hd|3d)\b/gi, " ");
    s = s.replace(/[|\-–—•:\/()\[\]]+/g, " ");
    s = s.replace(/\s+/g, " ").trim();
    return s;
}

function extractPartNumber(title) {
    var s = String(title || "");
    var m = s.match(/(?:phần|phan|part|season|mùa|mua)\s*0*(\d+)/i);
    if (m) return parseInt(m[1], 10);
    m = s.match(/\b[ps]0*(\d+)\b/i);
    if (m) return parseInt(m[1], 10);
    var ep = extractEpisodeNumber(s);
    return ep > 0 ? ep : 0;
}

function detectAiBadges(title, durSec) {
    var s = String(title || "").toLowerCase();
    var hasTm = s.indexOf("thuyết minh") !== -1 || s.indexOf("thuyet minh") !== -1;
    var hasLt = s.indexOf("lồng tiếng") !== -1 || s.indexOf("long tieng") !== -1;
    var hasSub = s.indexOf("vietsub") !== -1;
    var hasTb = s.indexOf("trọn bộ") !== -1 || s.indexOf("tron bo") !== -1;
    var has4k = /\b(?:4k|2160p)\b/i.test(s);
    var has2k = /\b(?:2k|1440p)\b/i.test(s);
    var hasFull = /\bfull\b/i.test(s);
    var isMarathon = typeof durSec === "number" && durSec >= 10800;

    var parts = [];
    if (hasTm) parts.push("Thuyết Minh");
    else if (hasLt) parts.push("Lồng Tiếng");
    else if (hasSub) parts.push("Vietsub");

    if (has4k) parts.push("4K");
    else if (has2k) parts.push("2K");
    else if (isMarathon) parts.push("Marathon");
    else if (hasTb) {
        parts.push("Trọn Bộ");
        if (hasFull && parts.length < 2) parts.push("Full");
    } else if (hasFull && parts.length === 0) {
        parts.push("Full");
    }

    return parts.join(" • ");
}

function formatCleanEpisodeTitle(rawTitle, fallbackIndex) {
    var raw = cleanText(rawTitle);
    if (!raw) return fallbackIndex ? ("Tập " + fallbackIndex) : "";
    if (!isCleanTitlesEnabled()) return raw;

    var s = raw;
    s = s.replace(/\[[^\]]*\]/g, " ");
    s = s.replace(/\([^)]*(?:full|4k|2k|1080p|720p|60fps|hd|thuyết minh|thuyet minh|vietsub|lồng tiếng|long tieng|trọn bộ|tron bo|hoạt hình|hoat hinh|ai|3d)[^)]*\)/gi, " ");
    s = s.replace(/\#[^\s#]+/g, " ");
    s = s.replace(/\s*\|.*$/, "");
    s = cleanText(s);

    if (!s) return fallbackIndex ? ("Tập " + fallbackIndex) : raw;

    var ep = extractEpisodeNumber(s);
    if (ep > 0) {
        var rest = s.replace(/(?:tập|tap|episode|ep\.?)\s*0*\d+\s*[-–:|.]?\s*/i, "");
        rest = cleanText(rest).replace(/^[-–:|.\s]+|[-–:|.\s]+$/g, "");
        return rest ? ("Tập " + ep + " - " + rest) : ("Tập " + ep);
    }
    if (fallbackIndex && fallbackIndex > 0) {
        return "Tập " + fallbackIndex + " - " + s;
    }
    return s;
}

function isBlockedByUserKeywords(title) {
    var kws = getBlockedKeywords();
    if (!kws || kws.length === 0) return false;
    var s = String(title || "").toLowerCase();
    if (!s) return false;
    var i = 0;
    for (i = 0; i < kws.length; i++) {
        if (s.indexOf(kws[i]) !== -1) return true;
    }
    return false;
}

function isNoiseVideoTitle(title) {
    var s = String(title || "").toLowerCase();
    if (!s) return false;
    if (isBlockedByUserKeywords(s)) return true;
    if (s.indexOf("karaoke") !== -1) return true;
    if (s.indexOf("nhạc nền") !== -1 || s.indexOf("nhac nen") !== -1) return true;
    if (s.indexOf("behind the scenes") !== -1) return true;
    if (s.indexOf("soundtrack") !== -1) return true;
    if (s.indexOf("nhạc phim") !== -1 || s.indexOf("nhac phim") !== -1) return true;
    if (/\b(?:ost|trailer|teaser|reaction|amv|mv)\b/i.test(s)) return true;
    return false;
}

function isShortOrTooShort(urlOrFlag, durSec, minSec) {
    if (urlOrFlag === true) return true;
    if (typeof urlOrFlag === "string" && urlOrFlag.indexOf("/shorts/") !== -1) return true;
    var limit = (minSec !== undefined && minSec !== null) ? minSec : getMinDurationSec();
    if (durSec > 0 && durSec < limit) return true;
    return false;
}

function pickBestThumb(sources, fallbackVideoId) {
    if (sources && sources.length > 0) {
        var u = sources[sources.length - 1].url;
        if (u) {
            if (u.indexOf("//") === 0) return "https:" + u;
            return String(u);
        }
    }
    if (fallbackVideoId) {
        return "https://i.ytimg.com/vi/" + fallbackVideoId + "/hqdefault.jpg";
    }
    return "";
}

function getRunsText(obj) {
    if (!obj) return "";
    if (obj.content) return cleanText(obj.content);
    if (obj.simpleText) return cleanText(obj.simpleText);
    if (obj.runs && obj.runs.length) {
        var out = "";
        var i = 0;
        for (i = 0; i < obj.runs.length; i++) {
            out += obj.runs[i].text || "";
        }
        return cleanText(out);
    }
    return "";
}

// Parse lockupViewModel (playlist hoac video trong InnerTube search/browse).
function parseLockupViewModel(vm) {
    if (!vm || !vm.contentId) return null;
    var id = String(vm.contentId);
    var ctype = String(vm.contentType || "");
    var meta = vm.metadata && vm.metadata.lockupMetadataViewModel;
    var title = meta ? getRunsText(meta.title) : "";
    if (!title) return null;

    var channelName = "";
    var channelId = "";
    var extraText = "";
    if (meta && meta.metadata && meta.metadata.contentMetadataViewModel && meta.metadata.contentMetadataViewModel.metadataRows) {
        var rows = meta.metadata.contentMetadataViewModel.metadataRows;
        if (rows.length > 0 && rows[0].metadataParts && rows[0].metadataParts.length > 0) {
            var part0 = rows[0].metadataParts[0];
            if (part0.text) {
                channelName = cleanText(part0.text.content || "");
                if (part0.text.commandRuns && part0.text.commandRuns.length > 0) {
                    var ep = part0.text.commandRuns[0].onTap &&
                        part0.text.commandRuns[0].onTap.innertubeCommand &&
                        part0.text.commandRuns[0].onTap.innertubeCommand.browseEndpoint;
                    if (ep && ep.browseId) channelId = String(ep.browseId);
                }
            }
            if (rows[0].metadataParts.length > 1 && rows[0].metadataParts[1].text) {
                extraText = cleanText(rows[0].metadataParts[1].text.content || "");
            }
        }
    }

    var badgeText = "";
    var cover = "";
    var ci = vm.contentImage;
    if (ctype === "LOCKUP_CONTENT_TYPE_PLAYLIST" || id.indexOf("PL") === 0) {
        var colThumb = ci && ci.collectionThumbnailViewModel && ci.collectionThumbnailViewModel.primaryThumbnail && ci.collectionThumbnailViewModel.primaryThumbnail.thumbnailViewModel;
        if (colThumb) {
            if (colThumb.image && colThumb.image.sources) cover = pickBestThumb(colThumb.image.sources, "");
            if (colThumb.overlays && colThumb.overlays.length > 0) {
                var ov0 = colThumb.overlays[0];
                var b0 = ov0.thumbnailOverlayBadgeViewModel && ov0.thumbnailOverlayBadgeViewModel.thumbnailBadges && ov0.thumbnailOverlayBadgeViewModel.thumbnailBadges[0];
                if (b0 && b0.thumbnailBadgeViewModel && b0.thumbnailBadgeViewModel.text) {
                    badgeText = cleanText(b0.thumbnailBadgeViewModel.text);
                }
            }
        }
        if (!cover && ci && ci.thumbnailViewModel && ci.thumbnailViewModel.image) {
            cover = pickBestThumb(ci.thumbnailViewModel.image.sources, "");
        }
        var countLabel = badgeText ? badgeText.replace(/video/i, "tập").trim() : "Danh sách phát";
        if (countLabel && countLabel.indexOf("tập") === -1) countLabel = countLabel + " tập";
        var descPl = "[" + countLabel + "]";
        if (channelName) descPl += " • " + channelName;
        return {
            kind: "playlist",
            id: id,
            name: title,
            cover: cover,
            link: BASE_URL + "/playlist?list=" + id,
            description: descPl,
            tag: detectAiBadges(title, 0),
            channelName: channelName,
            channelId: channelId,
            host: BASE_URL
        };
    }

    // Video lockup
    var tvm = ci && ci.thumbnailViewModel;
    if (tvm) {
        if (tvm.image && tvm.image.sources) cover = pickBestThumb(tvm.image.sources, id);
        if (tvm.overlays && tvm.overlays.length > 0) {
            var ov = tvm.overlays[0];
            var badges = ov.thumbnailBottomOverlayViewModel && ov.thumbnailBottomOverlayViewModel.badges;
            if (badges && badges.length > 0 && badges[0].thumbnailBadgeViewModel) {
                badgeText = cleanText(badges[0].thumbnailBadgeViewModel.text || "");
            }
        }
    }
    if (!cover) cover = pickBestThumb(null, id);

    var durSec = parseDurationSec(badgeText);
    var durFmt = durSec > 0 ? formatDuration(durSec) : badgeText;
    var descVid = durFmt ? "[" + durFmt + "]" : "[Full]";
    if (channelName) descVid += " • " + channelName;
    if (extraText && !channelName) descVid += " • " + extraText;

    return {
        kind: "video",
        id: id,
        name: title,
        cover: cover,
        link: BASE_URL + "/watch?v=" + id,
        description: descVid,
        tag: detectAiBadges(title, durSec),
        durationSec: durSec,
        durationText: durFmt,
        channelName: channelName,
        channelId: channelId,
        host: BASE_URL
    };
}

function parseVideoRenderer(vr) {
    if (!vr || !vr.videoId) return null;
    var id = String(vr.videoId);
    var title = getRunsText(vr.title);
    if (!title) return null;
    var durText = getRunsText(vr.lengthText);
    var durSec = parseDurationSec(durText);
    var isShort = false;
    var navUrl = vr.navigationEndpoint && vr.navigationEndpoint.commandMetadata && vr.navigationEndpoint.commandMetadata.webCommandMetadata && vr.navigationEndpoint.commandMetadata.webCommandMetadata.url;
    if (navUrl && String(navUrl).indexOf("/shorts/") !== -1) isShort = true;
    if (isShortOrTooShort(isShort, durSec, getMinDurationSec())) return null;

    var channelName = getRunsText(vr.ownerText || vr.shortBylineText);
    var cover = pickBestThumb(vr.thumbnail && vr.thumbnail.thumbnails, id);
    var durFmt = durSec > 0 ? formatDuration(durSec) : durText;
    var desc = durFmt ? "[" + durFmt + "]" : "[Video]";
    if (channelName) desc += " • " + channelName;

    return {
        name: title,
        cover: cover,
        link: BASE_URL + "/watch?v=" + id,
        description: desc,
        tag: detectAiBadges(title, durSec),
        durationSec: durSec,
        host: BASE_URL
    };
}

function extractContinuationToken(arr) {
    if (!arr || !arr.length) return "";
    var i = 0;
    for (i = arr.length - 1; i >= 0; i--) {
        var it = arr[i];
        if (!it) continue;
        var c = it.continuationItemRenderer || it.continuationItemViewModel;
        if (c) {
            var tok = c.continuationEndpoint && c.continuationEndpoint.continuationCommand && c.continuationEndpoint.continuationCommand.token;
            if (tok) return String(tok);
            tok = c.continuationCommand && c.continuationCommand.innertubeCommand && c.continuationCommand.innertubeCommand.continuationCommand && c.continuationCommand.innertubeCommand.continuationCommand.token;
            if (tok) return String(tok);
        }
    }
    return "";
}

function extractEpisodeNumber(name) {
    var s = String(name || "");
    var m = s.match(/(?:tập|tap|ep|episode|#)\s*0*(\d+)/i);
    if (m) return parseInt(m[1], 10);
    m = s.match(/^\s*0*(\d+)\s*(?:[-–:|.]|$)/);
    if (m) return parseInt(m[1], 10);
    return -1;
}

// Neu playlist dang xep nguoc (Tap N -> Tap 1), tu dong dao lai thanh Tap 1 -> Tap N.
function normalizeEpisodeOrder(episodes) {
    if (!episodes || episodes.length < 2) return episodes;
    var firstNum = extractEpisodeNumber(episodes[0].name);
    var lastNum = extractEpisodeNumber(episodes[episodes.length - 1].name);
    if (firstNum > 0 && lastNum > 0 && firstNum > lastNum) {
        episodes.reverse();
    }
    return episodes;
}

function resolveChannelId(url) {
    var cid = extractChannelId(url);
    if (cid) return cid;
    var handle = extractHandle(url);
    if (!handle) return "";
    var res = requestInnerTube("navigation/resolve_url", { url: BASE_URL + "/" + handle }, "WEB");
    if (res && res.endpoint && res.endpoint.browseEndpoint && res.endpoint.browseEndpoint.browseId) {
        return String(res.endpoint.browseEndpoint.browseId);
    }
    return "";
}

function ensureFmtVtt(url) {
    var u = String(url || "");
    if (!u) return "";
    if (u.indexOf("fmt=") !== -1) {
        return u.replace(/([?&])fmt=[^&]*/i, "$1fmt=vtt");
    }
    return u + (u.indexOf("?") === -1 ? "?" : "&") + "fmt=vtt";
}

function extractInnerTubeSubtitles(data) {
    var list = [];
    if (!data || !data.captions || !data.captions.playerCaptionsTracklistRenderer) return list;
    var tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks || [];
    var hasVi = false;
    var translatableBase = "";
    var i = 0;
    for (i = 0; i < tracks.length; i++) {
        var ct = tracks[i];
        if (!ct || !ct.baseUrl) continue;
        var vttUrl = ensureFmtVtt(ct.baseUrl);
        var lang = ct.languageCode ? String(ct.languageCode) : "";
        var label = getRunsText(ct.name) || lang || "Subtitle";
        if (lang === "vi" || lang.indexOf("vi-") === 0 || lang.indexOf("vi_") === 0) {
            hasVi = true;
        }
        if (!translatableBase && ct.isTranslatable !== false) {
            translatableBase = vttUrl;
        }
        list.push({
            data: vttUrl,
            type: "vtt",
            label: label,
            language: lang
        });
    }
    if (!hasVi && translatableBase) {
        var autoUrl = translatableBase.replace(/([?&])tlang=[^&]*/i, "");
        autoUrl += (autoUrl.indexOf("?") === -1 ? "?" : "&") + "tlang=vi";
        list.push({
            data: autoUrl,
            type: "vtt",
            label: "Tiếng Việt (Tự dịch)",
            language: "vi"
        });
    }
    return list;
}

function extractPipedSubtitles(data) {
    var list = [];
    if (!data || !data.subtitles || !data.subtitles.length) return list;
    var i = 0;
    for (i = 0; i < data.subtitles.length; i++) {
        var s = data.subtitles[i];
        if (!s || !s.url) continue;
        list.push({
            data: String(s.url),
            type: "vtt",
            label: String(s.name || s.code || "Subtitle"),
            language: String(s.code || "")
        });
    }
    return list;
}

function extractInnerTubeAudios(adaptiveFormats, headers) {
    var byKey = {};
    var order = [];
    var i = 0;
    if (!adaptiveFormats || !adaptiveFormats.length) return [];
    for (i = 0; i < adaptiveFormats.length; i++) {
        var af = adaptiveFormats[i];
        if (!af || !af.url || !af.mimeType) continue;
        var mt = String(af.mimeType);
        if (mt.indexOf("audio/") !== 0) continue;
        var at = af.audioTrack;
        if (!at) continue;
        var key = String(at.id || at.displayName || "");
        if (!key) continue;
        var isMp4 = mt.indexOf("audio/mp4") !== -1;
        var bitrate = parseInt(af.bitrate || 0, 10) || 0;
        var existing = byKey[key];
        if (!existing || (isMp4 && !existing._isMp4) || (isMp4 === existing._isMp4 && bitrate > existing._bitrate)) {
            var lang = "";
            if (at.id) {
                var dotIdx = String(at.id).indexOf(".");
                lang = dotIdx !== -1 ? String(at.id).substring(0, dotIdx) : String(at.id);
            }
            var entry = {
                data: String(af.url),
                type: "",
                label: cleanText(at.displayName || lang || "Audio"),
                language: lang,
                headers: headers || {},
                _isDefault: !!at.audioIsDefault,
                _isMp4: isMp4,
                _bitrate: bitrate
            };
            if (!existing) order.push(key);
            byKey[key] = entry;
        }
    }
    if (order.length <= 1) return [];
    var out = [];
    for (i = 0; i < order.length; i++) {
        var item = byKey[order[i]];
        out.push({
            data: item.data,
            type: item.type,
            label: item.label,
            language: item.language,
            headers: item.headers
        });
    }
    return out;
}

function resolveCrossSourceFallback(vid) {
    if (!vid) return null;
    try {
        var oembedUrl = "https://www.youtube.com/oembed?url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + vid) + "&format=json";
        var oembed = fetchJsonSafe(oembedUrl, 4000);
        if (!oembed || !oembed.title) return null;

        var searchQ = extractBaseSeriesTitle(oembed.title);
        if (!searchQ || searchQ.length < 3) searchQ = cleanText(oembed.title);
        if (!searchQ) return null;

        var dmSearchUrl = "https://api.dailymotion.com/videos?search=" + encodeURIComponent(searchQ) + "&limit=3&fields=id,title,duration";
        var dmSearch = fetchJsonSafe(dmSearchUrl, 5000);
        if (!dmSearch || !dmSearch.list || !dmSearch.list.length) return null;

        var i = 0;
        for (i = 0; i < dmSearch.list.length; i++) {
            var item = dmSearch.list[i];
            if (!item || !item.id) continue;
            var metaUrl = "https://www.dailymotion.com/player/metadata/video/" + encodeURIComponent(String(item.id));
            var meta = fetchJsonSafe(metaUrl, 5000);
            var hlsUrl = meta && meta.qualities && meta.qualities.auto && meta.qualities.auto[0] && meta.qualities.auto[0].url;
            if (hlsUrl) {
                return {
                    url: String(hlsUrl),
                    mimeType: "application/x-mpegURL",
                    title: item.title ? cleanText(item.title) : cleanText(oembed.title),
                    duration: parseInt(item.duration || 0, 10) || 0
                };
            }
        }
    } catch (e) {}
    return null;
}

function b64ToBytes(b64) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var lookup = [];
    var i = 0;
    for (i = 0; i < 256; i++) lookup[i] = -1;
    for (i = 0; i < 64; i++) lookup[chars.charCodeAt(i)] = i;
    var s = String(b64 || "");
    var out = [];
    var buffer = 0;
    var bits = 0;
    for (i = 0; i < s.length; i++) {
        var c = s.charCodeAt(i);
        if (c === 61) break;
        var val = c < 256 ? lookup[c] : -1;
        if (val === -1) continue;
        buffer = (buffer << 6) | val;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            out.push((buffer >> bits) & 255);
        }
    }
    return out;
}

function strToB64(str) {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var raw = unescape(encodeURIComponent(String(str || "")));
    var out = "";
    var i = 0;
    while (i < raw.length) {
        var b1 = raw.charCodeAt(i++) & 255;
        var has2 = i < raw.length;
        var b2 = has2 ? (raw.charCodeAt(i++) & 255) : 0;
        var has3 = i < raw.length;
        var b3 = has3 ? (raw.charCodeAt(i++) & 255) : 0;
        var trip = (b1 << 16) | (b2 << 8) | b3;
        out += chars.charAt((trip >> 18) & 63);
        out += chars.charAt((trip >> 12) & 63);
        out += has2 ? chars.charAt((trip >> 6) & 63) : "=";
        out += has3 ? chars.charAt(trip & 63) : "=";
    }
    return out;
}

function sidxU32(b, o) {
    return (((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]);
}

function sidxU16(b, o) {
    return (b[o] << 8) + b[o + 1];
}

function parseSidxSegments(bytes, indexEnd, groupCount) {
    if (!bytes || bytes.length < 32) return [];
    var pos = 0;
    while (pos + 8 <= bytes.length) {
        var sz = sidxU32(bytes, pos);
        var type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
        if (type === "sidx") {
            var ver = bytes[pos + 8];
            var timescale = sidxU32(bytes, pos + 16);
            if (!timescale) return [];
            var off = pos + 20;
            var firstOffset = 0;
            if (ver === 0) {
                firstOffset = sidxU32(bytes, off + 4);
                off += 8;
            } else {
                firstOffset = sidxU32(bytes, off + 12);
                off += 16;
            }
            var count = sidxU16(bytes, off + 2);
            off += 4;
            var curByte = indexEnd + 1 + firstOffset;
            var rawSegs = [];
            var i = 0;
            for (i = 0; i < count && off + 12 <= bytes.length; i++) {
                var refSize = sidxU32(bytes, off) & 0x7FFFFFFF;
                var dur = sidxU32(bytes, off + 4);
                if (refSize > 0 && dur > 0) {
                    rawSegs.push({
                        start: curByte,
                        end: curByte + refSize - 1,
                        dur: dur / timescale
                    });
                }
                curByte += refSize;
                off += 12;
            }
            if (!groupCount || groupCount <= 1) return rawSegs;
            var grouped = [];
            for (i = 0; i < rawSegs.length; i += groupCount) {
                var endIdx = Math.min(i + groupCount - 1, rawSegs.length - 1);
                var sumDur = 0;
                var j = i;
                for (j = i; j <= endIdx; j++) sumDur += rawSegs[j].dur;
                grouped.push({
                    start: rawSegs[i].start,
                    end: rawSegs[endIdx].end,
                    dur: sumDur
                });
            }
            return grouped;
        }
        if (sz < 8) break;
        pos += sz;
    }
    return [];
}

function buildFmp4MediaM3u8(baseUrl, initRangeStr, indexRangeStr, groupCount) {
    if (!baseUrl || !initRangeStr || !indexRangeStr) return "";
    var idxParts = String(indexRangeStr).split("-");
    if (idxParts.length !== 2) return "";
    var indexEnd = parseInt(idxParts[1], 10);
    if (isNaN(indexEnd) || indexEnd <= 0) return "";
    try {
        var r = fetch(baseUrl + "&range=" + indexRangeStr, { timeout: 6000 });
        if (!r || !r.ok) return "";
        var bytes = b64ToBytes(r.base64());
        var segs = parseSidxSegments(bytes, indexEnd, groupCount || 3);
        if (!segs || segs.length === 0) return "";

        var maxDur = 1;
        var i = 0;
        for (i = 0; i < segs.length; i++) {
            var d = Math.ceil(segs[i].dur);
            if (d > maxDur) maxDur = d;
        }
        var lines = [
            "#EXTM3U",
            "#EXT-X-VERSION:7",
            "#EXT-X-TARGETDURATION:" + maxDur,
            "#EXT-X-MEDIA-SEQUENCE:0",
            "#EXT-X-PLAYLIST-TYPE:VOD",
            "#EXT-X-INDEPENDENT-SEGMENTS",
            "#EXT-X-MAP:URI=\"" + baseUrl + "&range=" + initRangeStr + "\""
        ];
        for (i = 0; i < segs.length; i++) {
            lines.push("#EXTINF:" + segs[i].dur.toFixed(3) + ",");
            lines.push(baseUrl + "&range=" + segs[i].start + "-" + segs[i].end);
        }
        lines.push("#EXT-X-ENDLIST");
        return lines.join("\n");
    } catch (e) {
        return "";
    }
}

function buildFmp4DataUri(m3u8Text) {
    if (!m3u8Text) return "";
    return "data:application/x-mpegurl;base64," + strToB64(m3u8Text);
}

function findAdaptiveMp4Pair(adaptive, targetHeight) {
    if (!adaptive || !adaptive.length) return null;
    var bestAudio = null;
    var bestVideo = null;
    var i = 0;
    for (i = 0; i < adaptive.length; i++) {
        var af = adaptive[i];
        if (!af || !af.url || !af.mimeType || !af.initRange || !af.indexRange) continue;
        var mt = String(af.mimeType);
        if (mt.indexOf("audio/mp4") !== -1) {
            if (!bestAudio || parseInt(af.itag || 0, 10) === 140) {
                bestAudio = af;
                if (parseInt(af.itag || 0, 10) === 140) break;
            }
        }
    }
    if (!bestAudio) return null;
    for (i = 0; i < adaptive.length; i++) {
        var vf = adaptive[i];
        if (!vf || !vf.url || !vf.mimeType || !vf.initRange || !vf.indexRange) continue;
        var vmt = String(vf.mimeType);
        if (vmt.indexOf("video/mp4") === -1) continue;
        var h = parseInt(vf.height || 0, 10) || 0;
        if (h < 720) continue;
        if (targetHeight > 0 && h === targetHeight) {
            bestVideo = vf;
            break;
        }
        if (!bestVideo || h > (parseInt(bestVideo.height || 0, 10) || 0)) {
            bestVideo = vf;
        }
    }
    if (!bestVideo) return null;
    return {
        vUrl: String(bestVideo.url),
        vInit: String(bestVideo.initRange.start) + "-" + String(bestVideo.initRange.end),
        vIndex: String(bestVideo.indexRange.start) + "-" + String(bestVideo.indexRange.end),
        aUrl: String(bestAudio.url),
        aInit: String(bestAudio.initRange.start) + "-" + String(bestAudio.initRange.end),
        aIndex: String(bestAudio.indexRange.start) + "-" + String(bestAudio.indexRange.end),
        height: parseInt(bestVideo.height || 0, 10) || 0
    };
}

function deduplicateSiblingParts(parts) {
    if (!parts || parts.length <= 1) return parts || [];
    var byPart = {};
    var order = [];
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var p = parts[i];
        var pNum = p._partNum || 9999;
        var isMerged = /\b(?:tổng hợp|tong hop|full|trọn bộ|tron bo)\b/i.test(p.name) && /[-+&]/.test(p.name);
        if (pNum > 0 && pNum < 9999) {
            var prev = byPart[pNum];
            if (!prev) {
                byPart[pNum] = { item: p, merged: isMerged };
                order.push(pNum);
            } else if (prev.merged && !isMerged) {
                byPart[pNum] = { item: p, merged: isMerged };
            }
        } else {
            var uniqKey = "u_" + i;
            byPart[uniqKey] = { item: p, merged: isMerged };
            order.push(uniqKey);
        }
    }
    var out = [];
    for (i = 0; i < order.length; i++) {
        out.push(byPart[order[i]].item);
    }
    return out;
}

function fetchPhimApiTocFallback(seriesTitle) {
    var clean = extractBaseSeriesTitle(seriesTitle);
    if (!clean || clean.length < 3) clean = cleanText(seriesTitle);
    if (!clean) return [];
    try {
        var searchUrl = "https://phimapi.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(clean) + "&limit=5";
        var sJson = fetchJsonSafe(searchUrl, 5000);
        var items = sJson && sJson.data && sJson.data.items;
        if (!items || !items.length) return [];

        var bestSlug = "";
        var i = 0;
        for (i = 0; i < items.length; i++) {
            var it = items[i];
            if (it && it.slug && String(it.type || "").toLowerCase() !== "single") {
                bestSlug = String(it.slug);
                break;
            }
        }
        if (!bestSlug && items[0] && items[0].slug) bestSlug = String(items[0].slug);
        if (!bestSlug) return [];

        var detail = fetchJsonSafe("https://phimapi.com/phim/" + encodeURIComponent(bestSlug), 6000);
        if (!detail || !detail.episodes || !detail.episodes.length) return [];
        var epsOut = [];
        var seen = {};
        var grp = detail.episodes[0];
        var sd = grp && grp.server_data ? grp.server_data : [];
        for (i = 0; i < sd.length; i++) {
            var ep = sd[i];
            if (!ep || !ep.link_m3u8 || seen[ep.link_m3u8]) continue;
            seen[ep.link_m3u8] = true;
            var epName = cleanText(ep.name || ("Tập " + (i + 1)));
            if (/^\d+$/.test(epName)) epName = "Tập " + epName;
            epsOut.push({
                name: epName,
                url: String(ep.link_m3u8),
                description: "PhimAPI HLS",
                lock: false,
                pay: false
            });
        }
        return epsOut;
    } catch (e) {
        return [];
    }
}
