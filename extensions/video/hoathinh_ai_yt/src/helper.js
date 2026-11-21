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

function isRecapOrReviewTitle(title) {
    var s = String(title || "").toLowerCase();
    if (!s) return false;
    var strong = [
        "tóm tắt phim",
        "tom tat phim",
        "review phim",
        "recap",
        "phân tích cốt truyện",
        "phan tich cot truyen",
        "giải thích cốt truyện",
        "giai thich cot truyen",
        "spoil",
        "bình luận phim"
    ];
    var i = 0;
    for (i = 0; i < strong.length; i++) {
        if (s.indexOf(strong[i]) !== -1) return true;
    }
    if (/\b(?:tóm tắt|tom tat|review)\b/i.test(s)) {
        if (s.indexOf("trọn bộ") !== -1 || s.indexOf("tron bo") !== -1) return false;
        if (/\bfull\b/i.test(s)) return false;
        if (/(?:tập|tap)\s*1\b/i.test(s)) return false;
        return true;
    }
    return false;
}

function detectSubGenreBadge(title) {
    var s = String(title || "").toLowerCase();
    if (!s) return "";
    if (s.indexOf("tu tiên") !== -1 || s.indexOf("tu tien") !== -1 || s.indexOf("phàm nhân") !== -1 || s.indexOf("pham nhan") !== -1 || s.indexOf("đấu phá") !== -1 || s.indexOf("dau pha") !== -1 || s.indexOf("tiên nghịch") !== -1 || s.indexOf("tien nghich") !== -1) {
        return "Tu Tiên";
    }
    if (s.indexOf("hệ thống") !== -1 || s.indexOf("he thong") !== -1 || s.indexOf("thức tỉnh") !== -1 || s.indexOf("thuc tinh") !== -1) {
        return "Hệ Thống";
    }
    if (s.indexOf("xuyên không") !== -1 || s.indexOf("xuyen khong") !== -1 || s.indexOf("trọng sinh") !== -1 || s.indexOf("trong sinh") !== -1) {
        return "Xuyên Không";
    }
    if (s.indexOf("mạt thế") !== -1 || s.indexOf("mat the") !== -1 || s.indexOf("tận thế") !== -1 || s.indexOf("tan the") !== -1) {
        return "Mạt Thế";
    }
    if (s.indexOf("cổ trang") !== -1 || s.indexOf("co trang") !== -1 || s.indexOf("kiếm hiệp") !== -1 || s.indexOf("kiem hiep") !== -1 || s.indexOf("võ hiệp") !== -1 || s.indexOf("vo hiep") !== -1) {
        return "Cổ Trang";
    }
    return "";
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
    if (isRecapOrReviewTitle(title)) parts.push("Review/Tóm tắt");
    var subGenre = detectSubGenreBadge(title);
    if (subGenre) parts.push(subGenre);
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
    if (typeof getFilterRecapMode === "function" && getFilterRecapMode() === "hide" && isRecapOrReviewTitle(title)) {
        return true;
    }
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

function matchesSubLang(lang, target) {
    var l = String(lang || "").toLowerCase();
    var t = String(target || "").toLowerCase();
    if (!l || !t) return false;
    if (l === t) return true;
    if (t === "vi") return l.indexOf("vi-") === 0 || l.indexOf("vi_") === 0;
    if (t === "en") return l.indexOf("en-") === 0 || l.indexOf("en_") === 0;
    if (t === "zh-hans") return l === "zh-cn" || l === "zh" || l.indexOf("zh-hans") === 0;
    return false;
}

function buildTranslatedVttUrl(baseVttUrl, targetLang) {
    var u = String(baseVttUrl || "").replace(/([?&])tlang=[^&]*/i, "");
    return u + (u.indexOf("?") === -1 ? "?" : "&") + "tlang=" + encodeURIComponent(targetLang);
}

function extractInnerTubeSubtitles(data) {
    var subMode = (typeof getSubLangMode === "function") ? getSubLangMode() : "vi";
    if (subMode === "off") return [];
    var list = [];
    if (!data || !data.captions || !data.captions.playerCaptionsTracklistRenderer) return list;
    var tracks = data.captions.playerCaptionsTracklistRenderer.captionTracks || [];
    var targetLang = (subMode === "bilingual_vi") ? "vi" : subMode;

    var targetIdx = -1;
    var translatableBase = "";
    var viVttUrl = "";
    var origVttUrl = "";
    var i = 0;
    for (i = 0; i < tracks.length; i++) {
        var ct = tracks[i];
        if (!ct || !ct.baseUrl) continue;
        var vttUrl = ensureFmtVtt(ct.baseUrl);
        var lang = ct.languageCode ? String(ct.languageCode) : "";
        var label = getRunsText(ct.name) || lang || "Subtitle";
        var isAsr = (ct.kind === "asr");
        if (matchesSubLang(lang, targetLang) && targetIdx === -1) {
            targetIdx = list.length;
        }
        if (matchesSubLang(lang, "vi") && !viVttUrl) {
            viVttUrl = vttUrl;
        } else if (!matchesSubLang(lang, "vi") && (!origVttUrl || (!isAsr && origVttUrl))) {
            if (!origVttUrl) origVttUrl = vttUrl;
        }
        if (ct.isTranslatable !== false && (!translatableBase || !isAsr)) {
            if (!translatableBase || !isAsr) translatableBase = vttUrl;
        }
        list.push({
            data: vttUrl,
            type: "vtt",
            label: label,
            language: lang
        });
    }

    if (targetIdx > 0) {
        var chosen = list.splice(targetIdx, 1)[0];
        list.unshift(chosen);
    } else if (targetIdx === -1 && translatableBase) {
        var autoLabel = "Tiếng Việt (Tự dịch)";
        if (targetLang === "en") autoLabel = "English (Auto)";
        else if (targetLang === "zh-Hans") autoLabel = "中文 (自动翻译)";
        var autoUrl = buildTranslatedVttUrl(translatableBase, targetLang);
        list.unshift({
            data: autoUrl,
            type: "vtt",
            label: autoLabel,
            language: targetLang
        });
        if (targetLang === "vi" && !viVttUrl) viVttUrl = autoUrl;
    }

    if (!viVttUrl && translatableBase) {
        viVttUrl = buildTranslatedVttUrl(translatableBase, "vi");
    }
    if (viVttUrl && origVttUrl && viVttUrl !== origVttUrl) {
        list._viVttUrl = viVttUrl;
        list._origVttUrl = origVttUrl;
    }
    return list;
}

function parseVttTimeSec(ts) {
    var s = String(ts || "").trim().replace(",", ".");
    var parts = s.split(":");
    if (parts.length < 2 || parts.length > 3) return -1;
    var sec = 0;
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var n = parseFloat(parts[i]);
        if (isNaN(n)) return -1;
        sec = sec * 60 + n;
    }
    return sec;
}

function parseVttCues(vttText) {
    var raw = String(vttText || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    if (!raw) return [];
    var blocks = raw.split(/\n{2,}/);
    var cues = [];
    var i = 0;
    for (i = 0; i < blocks.length; i++) {
        var lines = blocks[i].split("\n");
        var arrowIdx = -1;
        var j = 0;
        for (j = 0; j < lines.length; j++) {
            if (lines[j].indexOf("-->") !== -1) {
                arrowIdx = j;
                break;
            }
        }
        if (arrowIdx === -1) continue;
        var timeLine = lines[arrowIdx].trim();
        var tParts = timeLine.split("-->");
        var startSec = parseVttTimeSec(tParts[0]);
        var endSec = parseVttTimeSec((tParts[1] || "").trim().split(/\s+/)[0]);
        var textParts = [];
        for (j = arrowIdx + 1; j < lines.length; j++) {
            var cleaned = cleanText(lines[j].replace(/<[^>]+>/g, " "));
            if (cleaned) textParts.push(cleaned);
        }
        var txt = textParts.join(" ");
        if (!txt) continue;
        cues.push({
            startSec: startSec,
            endSec: endSec,
            timeLine: timeLine,
            text: txt
        });
    }
    return cues;
}

function buildBilingualVttDataUri(viVttUrl, origVttUrl) {
    if (!viVttUrl || !origVttUrl || viVttUrl === origVttUrl) return "";
    try {
        var rVi = fetch(viVttUrl, { timeout: 2500 });
        var rOrig = fetch(origVttUrl, { timeout: 2500 });
        if (!rVi || !rVi.ok || !rOrig || !rOrig.ok) return "";
        var viCues = parseVttCues(rVi.text());
        var origCues = parseVttCues(rOrig.text());
        if (!viCues.length || !origCues.length) return "";

        var out = ["WEBVTT\n\n"];
        var origIdx = 0;
        var i = 0;
        for (i = 0; i < viCues.length; i++) {
            var vc = viCues[i];
            var matchText = "";
            if (vc.startSec >= 0) {
                while (origIdx + 1 < origCues.length && origCues[origIdx + 1].startSec >= 0 && origCues[origIdx + 1].startSec <= vc.startSec + 0.6) {
                    origIdx++;
                }
                if (origCues[origIdx] && origCues[origIdx].startSec >= 0 && Math.abs(origCues[origIdx].startSec - vc.startSec) <= 1.5) {
                    matchText = origCues[origIdx].text;
                }
            }
            if (!matchText && i < origCues.length && (viCues.length === origCues.length || vc.startSec < 0)) {
                matchText = origCues[i].text;
            }
            var body = (matchText && matchText !== vc.text) ? (vc.text + "\n" + matchText) : vc.text;
            out.push(vc.timeLine + "\n" + body + "\n\n");
        }
        return "data:text/vtt;base64," + strToB64(out.join(""));
    } catch (e) {
        return "";
    }
}

function attachBilingualSubtitles(subtitles) {
    if (!subtitles || !subtitles.length) return subtitles || [];
    var subMode = (typeof getSubLangMode === "function") ? getSubLangMode() : "vi";
    if (subMode === "off") return subtitles;

    var viUrl = subtitles._viVttUrl || "";
    var origUrl = subtitles._origVttUrl || "";
    var i = 0;
    if (!viUrl || !origUrl) {
        for (i = 0; i < subtitles.length; i++) {
            var s = subtitles[i];
            if (!s || !s.data) continue;
            if (matchesSubLang(s.language, "vi")) {
                if (!viUrl) viUrl = s.data;
            } else {
                if (!origUrl) origUrl = s.data;
            }
        }
    }
    if (!viUrl || !origUrl || viUrl === origUrl) return subtitles;

    var biUri = buildBilingualVttDataUri(viUrl, origUrl);
    if (!biUri) return subtitles;

    var biTrack = {
        data: biUri,
        type: "vtt",
        label: "Song ngữ (Việt + Gốc)",
        language: "vi"
    };
    if (subMode === "bilingual_vi") {
        subtitles.unshift(biTrack);
    } else {
        subtitles.splice(1, 0, biTrack);
    }
    return subtitles;
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
    var chunks = [];
    var out = "";
    var i = 0;
    while (i < raw.length) {
        var b1 = raw.charCodeAt(i++) & 255;
        var has2 = i < raw.length;
        var b2 = has2 ? (raw.charCodeAt(i++) & 255) : 0;
        var has3 = i < raw.length;
        var b3 = has3 ? (raw.charCodeAt(i++) & 255) : 0;
        var trip = (b1 << 16) | (b2 << 8) | b3;
        out += chars.charAt((trip >> 18) & 63) +
            chars.charAt((trip >> 12) & 63) +
            (has2 ? chars.charAt((trip >> 6) & 63) : "=") +
            (has3 ? chars.charAt(trip & 63) : "=");
        if (out.length >= 4096) {
            chunks.push(out);
            out = "";
        }
    }
    if (out) chunks.push(out);
    return chunks.join("");
}

function getFormatQualityHeight(f) {
    if (!f) return 0;
    if (f.qualityLabel) {
        var m = String(f.qualityLabel).match(/(\d{3,4})p/i);
        if (m) return parseInt(m[1], 10) || 0;
    }
    return parseInt(f.height || 0, 10) || 0;
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
            var effGroup = groupCount || 2;
            if (effGroup <= 1) return rawSegs;
            var maxGroupBytes = 2 * 1024 * 1024;
            var maxGroupDur = 20;
            var grouped = [];
            i = 0;
            while (i < rawSegs.length) {
                var startByte = rawSegs[i].start;
                var endByte = rawSegs[i].end;
                var sumDur = rawSegs[i].dur;
                var j = i + 1;
                var limit = Math.min(i + effGroup, rawSegs.length);
                while (j < limit) {
                    var nextEnd = rawSegs[j].end;
                    if ((nextEnd - startByte + 1) > maxGroupBytes) break;
                    if ((sumDur + rawSegs[j].dur) > maxGroupDur) break;
                    endByte = nextEnd;
                    sumDur += rawSegs[j].dur;
                    j++;
                }
                grouped.push({
                    start: startByte,
                    end: endByte,
                    dur: sumDur
                });
                i = j;
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

function getVideoCodecFamily(f) {
    if (!f || !f.mimeType) return "";
    var mt = String(f.mimeType).toLowerCase();
    if (mt.indexOf("av01") !== -1) return "av01";
    if (mt.indexOf("avc1") !== -1) return "avc1";
    if (mt.indexOf("vp9") !== -1 || mt.indexOf("vp09") !== -1) return "vp9";
    return "";
}

function getCodecPreferenceRank(codec, preferCodec) {
    var pref = preferCodec ? String(preferCodec).toLowerCase() : "avc1";
    if (codec === pref) return 3;
    if (codec === "avc1" || codec === "av01") return 2;
    return 1;
}

function isBetterMp4VideoCandidate(vf, best, targetHeight, preferCodec) {
    var h = getFormatQualityHeight(vf);
    var c = getVideoCodecFamily(vf);
    var cRank = getCodecPreferenceRank(c, preferCodec);
    if (!best) return true;

    var bh = getFormatQualityHeight(best);
    var bc = getVideoCodecFamily(best);
    var bcRank = getCodecPreferenceRank(bc, preferCodec);

    if (targetHeight > 0) {
        var exactNew = (h === targetHeight);
        var exactBest = (bh === targetHeight);
        if (exactNew !== exactBest) return exactNew;
        if (exactNew && exactBest) return cRank > bcRank;

        var underNew = (h <= targetHeight);
        var underBest = (bh <= targetHeight);
        if (underNew !== underBest) return underNew;
    }

    if (h !== bh) return h > bh;
    return cRank > bcRank;
}

function findAdaptiveMp4Pair(adaptive, targetHeight, preferCodec) {
    if (!adaptive || !adaptive.length) return null;
    var bestAudio = null;
    var bestVideo = null;
    var i = 0;
    for (i = 0; i < adaptive.length; i++) {
        var af = adaptive[i];
        if (!af || !af.url || !af.mimeType || !af.initRange || !af.indexRange) continue;
        var mt = String(af.mimeType);
        if (mt.indexOf("audio/mp4") !== -1) {
            var isItag140 = parseInt(af.itag || 0, 10) === 140;
            var isOrig140 = isItag140 && !af.isDrc;
            if (!bestAudio || isOrig140 || (isItag140 && parseInt(bestAudio.itag || 0, 10) !== 140)) {
                bestAudio = af;
                if (isOrig140) break;
            }
        }
    }
    if (!bestAudio) return null;
    var th = parseInt(targetHeight || 0, 10) || 0;
    for (i = 0; i < adaptive.length; i++) {
        var vf = adaptive[i];
        if (!vf || !vf.url || !vf.mimeType || !vf.initRange || !vf.indexRange) continue;
        var vmt = String(vf.mimeType);
        if (vmt.indexOf("video/mp4") === -1) continue;
        var h = getFormatQualityHeight(vf);
        if (h < 720) continue;
        if (isBetterMp4VideoCandidate(vf, bestVideo, th, preferCodec)) {
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
        height: getFormatQualityHeight(bestVideo),
        codec: getVideoCodecFamily(bestVideo)
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

function recordWatchedVideo(vid, title, cover, durText) {
    var id = String(vid || "").trim();
    if (!id) return;
    try {
        if (typeof localStorage === "undefined" || !localStorage) return;
        var vids = [];
        var rawVids = localStorage.getItem("watched_vids_v9");
        if (rawVids) {
            var parsedVids = JSON.parse(rawVids);
            if (parsedVids && parsedVids.length) vids = parsedVids;
        }
        var nextVids = [id];
        var i = 0;
        for (i = 0; i < vids.length && nextVids.length < 200; i++) {
            if (vids[i] && String(vids[i]) !== id) nextVids.push(String(vids[i]));
        }
        localStorage.setItem("watched_vids_v9", JSON.stringify(nextVids));

        var items = [];
        var rawItems = localStorage.getItem("watched_items_v9");
        if (rawItems) {
            var parsedItems = JSON.parse(rawItems);
            if (parsedItems && parsedItems.length) items = parsedItems;
        }
        var cleanTitle = title ? cleanText(title) : ("Video " + id);
        var cleanDur = durText ? cleanText(durText) : "";
        var desc = cleanDur ? ("[" + cleanDur + "] • Đã xem") : "Đã xem";
        var newItem = {
            id: id,
            name: cleanTitle,
            cover: cover ? String(cover) : pickBestThumb(null, id),
            link: BASE_URL + "/watch?v=" + id,
            description: desc,
            tag: detectAiBadges(cleanTitle, parseDurationSec(cleanDur))
        };
        var nextItems = [newItem];
        for (i = 0; i < items.length && nextItems.length < 20; i++) {
            var it = items[i];
            if (it && it.id && String(it.id) !== id) nextItems.push(it);
        }
        localStorage.setItem("watched_items_v9", JSON.stringify(nextItems));
    } catch (e) {}
}

function isVideoWatched(vid) {
    var id = String(vid || "").trim();
    if (!id) return false;
    try {
        if (typeof localStorage === "undefined" || !localStorage) return false;
        var raw = localStorage.getItem("watched_vids_v9");
        if (!raw) return false;
        var arr = JSON.parse(raw);
        if (!arr || !arr.length) return false;
        var i = 0;
        for (i = 0; i < arr.length; i++) {
            if (String(arr[i]) === id) return true;
        }
    } catch (e) {}
    return false;
}

function getRecentWatchedItems() {
    try {
        if (typeof localStorage === "undefined" || !localStorage) return [];
        var raw = localStorage.getItem("watched_items_v9");
        if (!raw) return [];
        var arr = JSON.parse(raw);
        return (arr && arr.length) ? arr : [];
    } catch (e) {
        return [];
    }
}

function parseWatchNextRelatedItems(nextRes) {
    var results = nextRes &&
        nextRes.contents &&
        nextRes.contents.twoColumnWatchNextResults &&
        nextRes.contents.twoColumnWatchNextResults.secondaryResults &&
        nextRes.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults &&
        nextRes.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results;
    if (!results || !results.length) return [];

    var minSec = getMinDurationSec();
    var out = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < results.length; i++) {
        var r = results[i];
        if (!r) continue;
        if (r.lockupViewModel) {
            var lv = parseLockupViewModel(r.lockupViewModel);
            if (!lv || !lv.id || seen[lv.id]) continue;
            if (isNoiseVideoTitle(lv.name)) continue;
            if (lv.kind === "video" && isShortOrTooShort(false, lv.durationSec || 0, minSec)) continue;
            seen[lv.id] = true;
            out.push(lv);
        } else if (r.compactVideoRenderer) {
            var cv = r.compactVideoRenderer;
            var vid = cv.videoId ? String(cv.videoId) : "";
            var vTitle = getRunsText(cv.title);
            if (!vid || !vTitle || seen[vid]) continue;
            if (isNoiseVideoTitle(vTitle)) continue;
            var durText = getRunsText(cv.lengthText);
            var durSec = parseDurationSec(durText);
            var navUrl = cv.navigationEndpoint &&
                cv.navigationEndpoint.commandMetadata &&
                cv.navigationEndpoint.commandMetadata.webCommandMetadata &&
                cv.navigationEndpoint.commandMetadata.webCommandMetadata.url;
            var isShort = !!(navUrl && String(navUrl).indexOf("/shorts/") !== -1);
            if (isShortOrTooShort(isShort, durSec, minSec)) continue;
            var vChannel = getRunsText(cv.shortBylineText || cv.longBylineText);
            var vCover = pickBestThumb(cv.thumbnail && cv.thumbnail.thumbnails, vid);
            var durFmt = durSec > 0 ? formatDuration(durSec) : durText;
            var vDesc = durFmt ? ("[" + durFmt + "]") : "[Video]";
            if (vChannel) vDesc += " • " + vChannel;
            seen[vid] = true;
            out.push({
                kind: "video",
                id: vid,
                name: vTitle,
                cover: vCover,
                link: BASE_URL + "/watch?v=" + vid,
                description: vDesc,
                tag: detectAiBadges(vTitle, durSec),
                durationSec: durSec,
                durationText: durFmt,
                channelName: vChannel,
                host: BASE_URL
            });
        } else if (r.compactPlaylistRenderer) {
            var cp = r.compactPlaylistRenderer;
            var pid = cp.playlistId ? String(cp.playlistId) : "";
            var pTitle = getRunsText(cp.title);
            if (!pid || !pTitle || seen[pid]) continue;
            if (isNoiseVideoTitle(pTitle)) continue;
            var countText = getRunsText(cp.videoCountShortText || cp.videoCountText);
            var pChannel = getRunsText(cp.shortBylineText || cp.longBylineText);
            var pCover = pickBestThumb(cp.thumbnail && cp.thumbnail.thumbnails, "");
            var pDesc = countText ? ("[" + countText.replace(/video/i, "tập").trim() + "]") : "[Danh sách phát]";
            if (pChannel) pDesc += " • " + pChannel;
            seen[pid] = true;
            out.push({
                kind: "playlist",
                id: pid,
                name: pTitle,
                cover: pCover,
                link: BASE_URL + "/playlist?list=" + pid,
                description: pDesc,
                tag: detectAiBadges(pTitle, 0),
                channelName: pChannel,
                host: BASE_URL
            });
        }
    }
    return out;
}

function getRawRunsTextPreserveNewlines(obj) {
    if (!obj) return "";
    if (obj.content) return String(obj.content);
    if (obj.simpleText) return String(obj.simpleText);
    if (obj.runs && obj.runs.length) {
        var out = "";
        var i = 0;
        for (i = 0; i < obj.runs.length; i++) {
            out += obj.runs[i].text || "";
        }
        return out;
    }
    return "";
}

function parseTimestampLinesFromComment(rawText, durSec) {
    if (!rawText) return [];
    var lines = String(rawText).split(/\r?\n/);
    var out = [];
    var seenSec = {};
    var i = 0;
    for (i = 0; i < lines.length; i++) {
        var line = String(lines[i] || "").trim();
        if (!line) continue;
        var m = line.match(/^(?:[-•*>\s]*)?((?:\d{1,2}:)?\d{1,2}:\d{2})(?:\s*[-–:|.]?\s*(.*))?$/);
        if (!m) continue;
        var sec = parseDurationSec(m[1]);
        if (sec < 0) continue;
        if (durSec > 0 && sec >= durSec) continue;
        if (seenSec[sec]) continue;
        seenSec[sec] = true;
        var lbl = cleanText(m[2] || "");
        out.push({
            startSec: sec,
            label: lbl || ("Mốc " + formatTimestamp(sec))
        });
    }
    if (out.length < 2) return [];
    out.sort(function (a, b) {
        return a.startSec - b.startSec;
    });
    return out;
}

function fetchTimestampsFromComments(vid, durSec) {
    if (!vid) return [];
    try {
        var nextRes = requestInnerTube("next", { videoId: String(vid) }, "WEB", 2500);
        if (!nextRes) return [];
        var contents = nextRes.contents &&
            nextRes.contents.twoColumnWatchNextResults &&
            nextRes.contents.twoColumnWatchNextResults.results &&
            nextRes.contents.twoColumnWatchNextResults.results.results &&
            nextRes.contents.twoColumnWatchNextResults.results.results.contents;
        if (!contents || !contents.length) return [];

        var token = "";
        var i = 0;
        for (i = 0; i < contents.length; i++) {
            var isr = contents[i] && contents[i].itemSectionRenderer;
            if (!isr || !isr.contents) continue;
            if (isr.sectionIdentifier === "comment-item-section") {
                token = extractContinuationToken(isr.contents);
                if (token) break;
            }
        }
        if (!token) {
            for (i = 0; i < contents.length; i++) {
                var isr2 = contents[i] && contents[i].itemSectionRenderer;
                if (isr2 && isr2.contents) {
                    token = extractContinuationToken(isr2.contents);
                    if (token) break;
                }
            }
        }
        if (!token) return [];

        var cRes = requestInnerTube("next", { continuation: token }, "WEB", 2500);
        if (!cRes) return [];

        var entityMap = {};
        var mutations = cRes.frameworkUpdates && cRes.frameworkUpdates.entityBatchUpdate && cRes.frameworkUpdates.entityBatchUpdate.mutations;
        if (mutations && mutations.length) {
            for (i = 0; i < mutations.length; i++) {
                var mut = mutations[i];
                var cep = mut && mut.payload && mut.payload.commentEntityPayload;
                if (cep && cep.properties && cep.properties.commentId) {
                    entityMap[String(cep.properties.commentId)] = cep;
                }
            }
        }

        var rawComments = [];
        var endpoints = cRes.onResponseReceivedEndpoints || [];
        for (i = 0; i < endpoints.length && rawComments.length < 10; i++) {
            var ep = endpoints[i];
            var contItems = null;
            if (ep.reloadContinuationItemsCommand && ep.reloadContinuationItemsCommand.continuationItems) {
                contItems = ep.reloadContinuationItemsCommand.continuationItems;
            } else if (ep.appendContinuationItemsAction && ep.appendContinuationItemsAction.continuationItems) {
                contItems = ep.appendContinuationItemsAction.continuationItems;
            }
            if (!contItems || !contItems.length) continue;
            var j = 0;
            for (j = 0; j < contItems.length && rawComments.length < 10; j++) {
                var ci = contItems[j];
                var ctr = ci && ci.commentThreadRenderer;
                if (!ctr) continue;
                var cvm = ctr.commentViewModel && ctr.commentViewModel.commentViewModel;
                var cr = ctr.comment && ctr.comment.commentRenderer;
                var rawTxt = "";
                if (cvm && cvm.commentKey && entityMap[cvm.commentKey]) {
                    var ent = entityMap[cvm.commentKey];
                    if (ent.properties && ent.properties.content && ent.properties.content.content) {
                        rawTxt = String(ent.properties.content.content);
                    }
                } else if (cr && cr.contentText) {
                    rawTxt = getRawRunsTextPreserveNewlines(cr.contentText);
                }
                if (rawTxt) rawComments.push(rawTxt);
            }
        }

        var dSec = parseInt(durSec || 0, 10) || 0;
        for (i = 0; i < rawComments.length; i++) {
            var stamps = parseTimestampLinesFromComment(rawComments[i], dSec);
            if (stamps && stamps.length >= 2) return stamps;
        }
    } catch (e) {}
    return [];
}

var _fastCacheClearedOnce = false;

function handleFastCacheMode() {
    var mode = (typeof getFastCacheMode === "function") ? getFastCacheMode() : "on";
    if (mode === "clear") {
        if (!_fastCacheClearedOnce) {
            _fastCacheClearedOnce = true;
            try {
                if (typeof cacheStorage !== "undefined" && cacheStorage && cacheStorage.clear) {
                    cacheStorage.clear();
                }
            } catch (e) {}
            try {
                if (typeof localStorage !== "undefined" && localStorage && localStorage.removeItem) {
                    localStorage.removeItem("watched_vids_v9");
                    localStorage.removeItem("watched_items_v9");
                }
            } catch (e2) {}
        }
        return "clear";
    }
    return mode;
}

function cacheGetJson(key, maxAgeMs) {
    if (!key) return null;
    var mode = handleFastCacheMode();
    if (mode !== "on") return null;
    try {
        if (typeof cacheStorage === "undefined" || !cacheStorage) return null;
        var raw = cacheStorage.getItem(String(key));
        if (!raw) return null;
        var obj = JSON.parse(raw);
        if (!obj || typeof obj.ts !== "number") return null;
        if (maxAgeMs && maxAgeMs > 0 && (Date.now() - obj.ts > maxAgeMs)) return null;
        return obj.val !== undefined ? obj.val : null;
    } catch (e) {
        return null;
    }
}

function cacheSetJson(key, val) {
    if (!key) return;
    var mode = handleFastCacheMode();
    if (mode !== "on") return;
    try {
        if (typeof cacheStorage === "undefined" || !cacheStorage) return;
        cacheStorage.setItem(String(key), JSON.stringify({
            ts: Date.now(),
            val: val
        }));
    } catch (e) {}
}

function applyWatchedMarkersToEpisodes(episodes) {
    if (!episodes || !episodes.length) return episodes || [];
    var out = [];
    var i = 0;
    for (i = 0; i < episodes.length; i++) {
        var ep = episodes[i];
        if (!ep) continue;
        var copy = {};
        var k;
        for (k in ep) {
            if (ep.hasOwnProperty(k)) copy[k] = ep[k];
        }
        var vid = extractVideoId(copy.url);
        if (vid && isVideoWatched(vid) && copy.name && String(copy.name).indexOf("[Đã xem] ") !== 0) {
            copy.name = "[Đã xem] " + copy.name;
        }
        out.push(copy);
    }
    return out;
}
