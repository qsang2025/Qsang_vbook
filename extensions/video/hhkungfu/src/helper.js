// helper.js — ham dung chung cua extension HHKUNGFU (hhkungfu.ee).
// Site WordPress theme HaLim:
//   danh sach: a.halim-thumb > img.film-poster-img, span.status,
//              span.episode, h2.entry-title, p.original_title
//   chi tiet:  h1.entry-title, h2.org_title, meta og:image,
//              .list_cate a, .hh3d-new-ep .new-ep, .hh3d-info,
//              .halim-entry-box article p / .entry-content p
//   muc luc:   .halim-server (#Vietsub sv=1, #Thuyet Minh sv=2) > a[data-ep]
//   server:    #halim-ajax-list-server .get-eps (data-type=tiktik|pro|vip4k|vip4kv2)
//   player:    GET /player/player.php?action=dox_ajax_player&post_id=&chapter_st=&type=&sv=
//   native:    PhimAPI (/phim/<slug> va /v1/api/tim-kiem?keyword=...) lay link_m3u8
// File nay duoc nap boi cac script khac, KHONG nap them file nao o day.
// Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js, file safe-first.js
// truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : siteOrigin();
}

function toDetailUrl(url) {
    var u = normalizeUrl(url).replace(/\/+$/, "");
    var m = u.match(/^(https?:\/\/[^\/]+)\/watch-([^\/]+)\/[^\/]+$/i);
    if (m) return m[1] + "/" + m[2];
    return u;
}

function unwrapCover(src) {
    var s = String(src === undefined || src === null ? "" : src).replace(/^\s+|\s+$/g, "");
    if (!s) return "";
    if (s.indexOf("http") === 0) return s;
    if (s.indexOf("//") === 0) return "https:" + s;
    return absUrl(s);
}

function parseFilmCard(a) {
    if (!a) return null;
    var href = String(a.attr("href") || "");
    if (!href) return null;
    var path = href.replace(/^https?:\/\/[^\/]+/i, "");
    if (!/^\/[^\/\?#]+\/?$/.test(path)) return null;
    if (/^\/(moi-cap-nhat|top-xem-nhieu|hoan-thanh|lich-chieu|lich-su|bookmark|category|tag|page|wp-|dang-ky|sitemap|player)/.test(path)) {
        return null;
    }

    var img = safeFirst(a.select("img.film-poster-img"));
    if (img === null) img = safeFirst(a.select("img"));

    var name = "";
    var h2 = safeFirst(a.select("h2.entry-title"));
    if (h2 !== null) name = cleanText(h2.text());
    if (!name) name = cleanText(a.attr("title"));
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = unwrapCover(img.attr("data-src") || img.attr("data-original") || img.attr("src"));
    }

    var orig = "";
    var op = safeFirst(a.select("p.original_title"));
    if (op !== null) orig = cleanText(op.text());

    var status = "";
    var st = safeFirst(a.select("span.status"));
    if (st !== null) status = cleanText(st.text());
    var ep = "";
    var epEl = safeFirst(a.select("span.episode"));
    if (epEl !== null) ep = cleanText(epEl.text());
    var tag = status;
    if (ep) tag = tag ? tag + " · " + ep : ep;

    return {
        name: name,
        cover: cover,
        link: absUrl(href).replace(/\/+$/, ""),
        description: orig,
        tag: tag,
        host: siteOrigin()
    };
}

function pageUrl(url, page) {
    var n = parseInt(page, 10);
    if (isNaN(n) || n <= 1) return url;
    var raw = String(url || "");
    var q = raw.indexOf("?");
    var pathPart = (q !== -1 ? raw.substring(0, q) : raw).replace(/\/page\/\d+\/?$/, "").replace(/\/+$/, "");
    var queryPart = q !== -1 ? raw.substring(q) : "";
    return pathPart + "/page/" + n + queryPart;
}

function parseListPage(doc, currentPage) {
    var items = [];
    var seen = {};
    var cur = parseInt(currentPage, 10);
    if (isNaN(cur) || cur < 1) cur = 1;

    var cards = doc.select("a.halim-thumb");
    var i = 0;
    for (i = 0; i < cards.size(); i++) {
        var item = parseFilmCard(cards.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }

    var maxPage = cur;
    var links = doc.select("ul.page-numbers a[href], .page-numbers a[href], a[href*='/page/']");
    for (i = 0; i < links.size(); i++) {
        var m = String(links.get(i).attr("href") || "").match(/\/page\/(\d+)(?:\/|\?|$)/);
        if (m) {
            var p = parseInt(m[1], 10);
            if (!isNaN(p) && p > maxPage) maxPage = p;
        }
    }

    return { items: items, next: maxPage > cur ? String(cur + 1) : "" };
}

function episodeSortKey(epAttr, text) {
    var s = String(epAttr || "");
    var mDec = s.match(/tap-(\d+)-(\d+)/i);
    if (mDec) return parseFloat(mDec[1] + "." + mDec[2]);
    var m = s.match(/tap-(\d+)/i);
    if (!m) m = String(text || "").match(/Tập\s*(\d+(?:\.\d+)?)/i);
    if (!m) m = s.match(/(\d+)/);
    if (!m) m = String(text || "").match(/(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : 0;
}

function episodeNumber(s) {
    var m = String(s || "").match(/tap-(\d+)/i);
    if (!m) m = String(s || "").match(/Tập\s*(\d+)/i);
    if (!m) m = String(s || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
}

function stripVnDiacritics(s) {
    var str = String(s || "").toLowerCase();
    var map = [
        [/[àáảãạăằắẳẵặâầấẩẫậ]/g, "a"],
        [/[èéẻẽẹêềếểễệ]/g, "e"],
        [/[ìíỉĩị]/g, "i"],
        [/[òóỏõọôồốổỗộơờớởỡợ]/g, "o"],
        [/[ùúủũụưừứửữự]/g, "u"],
        [/[ỳýỷỹỵ]/g, "y"],
        [/đ/g, "d"]
    ];
    var i = 0;
    for (i = 0; i < map.length; i++) {
        str = str.replace(map[i][0], map[i][1]);
    }
    return str;
}

function normTitle(s) {
    return stripVnDiacritics(s).replace(/[^a-z0-9]+/g, " ").replace(/^\s+|\s+$/g, "");
}

function fetchPhimApiJson(url, timeoutMs) {
    var r = null;
    try {
        r = pacedFetch(url, {
            headers: { "Accept": "application/json" },
            referer: "https://phimapi.com/",
            minDelayMs: 0,
            maxDelayMs: 0,
            maxRetries: 0,
            timeout: timeoutMs || 6500
        });
    } catch (e) {
        return null;
    }
    if (!r || !r.ok || !r.res) return null;
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return null; }
    if (!text || isChallengeText(text)) return null;
    try { return JSON.parse(text); } catch (e3) { return null; }
}

function phimApiTitleMatches(candidateName, candidateSlug, hhSlug, hhTitle) {
    var cNorm = normTitle(candidateName);
    var hNorm = normTitle(hhTitle);
    if (hhSlug && (candidateSlug === hhSlug || candidateSlug === hhSlug + "-hoat-hinh")) return true;
    if (!cNorm || !hNorm) return false;
    if (cNorm === hNorm) return true;
    var cNoMov = cNorm.replace(/\bmovie\b/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    var hNoMov = hNorm.replace(/\bmovie\b/g, " ").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    if (cNoMov && cNoMov === hNoMov) return true;
    return false;
}

function isValidPhimApiMovie(detail, hhSlug, hhTitle, isSeries) {
    if (!detail || !detail.status || !detail.movie || !detail.episodes) return false;
    if (!detail.episodes.length) return false;
    var mv = detail.movie;
    var mType = String(mv.type || "").toLowerCase();
    if (isSeries) {
        if (mType === "single") return false;
        var maxEps = 0;
        var i = 0;
        for (i = 0; i < detail.episodes.length; i++) {
            var sd = detail.episodes[i] && detail.episodes[i].server_data;
            if (sd && sd.length > maxEps) maxEps = sd.length;
        }
        if (maxEps <= 1) return false;
    }
    return phimApiTitleMatches(mv.name || "", String(mv.slug || ""), hhSlug, hhTitle);
}

function scorePhimApiItem(item, hhSlug, hhTitle, hhOrig, isSeries) {
    if (!item || !item.slug) return -1;
    var mType = String(item.type || "").toLowerCase();
    if (isSeries && mType === "single") return -1;
    if (!phimApiTitleMatches(item.name || "", String(item.slug || ""), hhSlug, hhTitle)) return -1;

    var score = 0;
    var cNorm = normTitle(item.name || "");
    var hNorm = normTitle(hhTitle || "");
    if (hNorm && cNorm === hNorm) score += 100;
    else score += 60;
    if (mType === "hoathinh") score += 50;
    else if (mType === "series") score += 10;
    if (hhSlug && (item.slug === hhSlug || item.slug === hhSlug + "-hoat-hinh")) score += 40;
    var oNorm = normTitle(item.origin_name || "");
    var hOrig = normTitle(hhOrig || "");
    if (hOrig && oNorm && oNorm === hOrig) score += 20;
    return score;
}

function findPhimApiEpisodeLink(serverData, targetEp, isFull) {
    if (!serverData || !serverData.length) return null;
    var i = 0;
    if (isFull) {
        for (i = 0; i < serverData.length; i++) {
            var fep = serverData[i];
            if (!fep || !fep.link_m3u8) continue;
            var fSlug = String(fep.slug || "").toLowerCase();
            var fName = String(fep.name || "").toLowerCase();
            if (fSlug === "full" || fName.indexOf("full") !== -1 || serverData.length === 1) {
                return { url: String(fep.link_m3u8), isRange: false };
            }
        }
        return null;
    }
    if (!targetEp || targetEp <= 0) return null;

    // Pass 1: exact single-episode numeric match (ignores range slugs like tap-01-05)
    for (i = 0; i < serverData.length; i++) {
        var ep = serverData[i];
        if (!ep || !ep.link_m3u8) continue;
        var slug = String(ep.slug || "").trim();
        var name = String(ep.name || "").trim();
        var m = slug.match(/^tap-0*(\d+)$/i);
        if (!m) m = name.match(/^(?:Tập\s*)?0*(\d+)$/i);
        if (m && parseInt(m[1], 10) === targetEp) {
            return { url: String(ep.link_m3u8), isRange: false };
        }
    }

    // Pass 2: range fallback (e.g. Thuyet Minh tap-01-05 / Tap 01-05)
    for (i = 0; i < serverData.length; i++) {
        var rep = serverData[i];
        if (!rep || !rep.link_m3u8) continue;
        var rSlug = String(rep.slug || "").trim();
        var rName = String(rep.name || "").trim();
        var rm = rSlug.match(/^tap-0*(\d+)-0*(\d+)$/i);
        if (!rm) rm = rName.match(/0*(\d+)\s*-\s*0*(\d+)/);
        if (rm) {
            var lo = parseInt(rm[1], 10);
            var hi = parseInt(rm[2], 10);
            if (!isNaN(lo) && !isNaN(hi) && lo <= targetEp && targetEp <= hi) {
                return { url: String(rep.link_m3u8), isRange: true };
            }
        }
    }
    return null;
}

function resolvePhimApiTracks(hhSlug, hhTitle, hhOrig, targetEp, isFull, isSeries, preferDub) {
    var out = { primary: [], secondary: [] };
    var detail = null;

    if (hhSlug) {
        var direct = fetchPhimApiJson("https://phimapi.com/phim/" + encodeURIComponent(hhSlug), 6500);
        if (isValidPhimApiMovie(direct, hhSlug, hhTitle, isSeries)) {
            detail = direct;
        }
    }

    if (!detail && hhTitle) {
        var searchJson = fetchPhimApiJson("https://phimapi.com/v1/api/tim-kiem?keyword=" + encodeURIComponent(hhTitle), 5500);
        var items = searchJson && searchJson.data && searchJson.data.items;
        if (items && items.length > 0) {
            var bestItem = null;
            var bestScore = -1;
            var i = 0;
            for (i = 0; i < items.length; i++) {
                var sc = scorePhimApiItem(items[i], hhSlug, hhTitle, hhOrig, isSeries);
                if (sc > bestScore) {
                    bestScore = sc;
                    bestItem = items[i];
                }
            }
            if (bestItem && bestItem.slug && bestItem.slug !== hhSlug) {
                var fetched = fetchPhimApiJson("https://phimapi.com/phim/" + encodeURIComponent(bestItem.slug), 6500);
                if (isValidPhimApiMovie(fetched, hhSlug, hhTitle, isSeries)) {
                    detail = fetched;
                }
            }
        }
    }

    if (!detail || !detail.episodes) return out;

    var seenTitle = {};
    var seenUrl = {};
    var s = 0;
    for (s = 0; s < detail.episodes.length; s++) {
        var grp = detail.episodes[s];
        if (!grp || !grp.server_data) continue;
        var found = findPhimApiEpisodeLink(grp.server_data, targetEp, isFull);
        if (!found || !found.url || found.url.indexOf("http") !== 0) continue;
        if (seenUrl[found.url]) continue;
        seenUrl[found.url] = true;

        var rawServer = cleanText(grp.server_name || "").replace(/^#/, "");
        var lower = rawServer.toLowerCase();
        var isDub = lower.indexOf("thuyết minh") !== -1 || lower.indexOf("lồng tiếng") !== -1 || lower.indexOf("thuyet minh") !== -1;
        var langLabel = isDub ? "Thuyết Minh" : (lower.indexOf("vietsub") !== -1 ? "Vietsub" : (rawServer || "PhimAPI"));
        var title = "Native HLS (" + langLabel + ")";
        if (seenTitle[title]) {
            var n = 2;
            while (seenTitle["Native HLS (" + langLabel + " " + n + ")"]) n++;
            title = "Native HLS (" + langLabel + " " + n + ")";
        }
        seenTitle[title] = true;

        var entry = { title: title, data: found.url };
        if ((preferDub && isDub) || (!preferDub && !isDub)) {
            out.primary.push(entry);
        } else {
            out.secondary.push(entry);
        }
    }
    return out;
}
