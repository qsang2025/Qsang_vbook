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
