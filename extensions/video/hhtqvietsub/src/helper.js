// helper.js — ham dung chung cua extension HHTQ Vietsub (hhtq.press).
//
// Site dung theme HalimMovies (WordPress), khao sat live 2026-11-20:
//   danh sach: article.grid-item > a.halim-thumb (img data-src lazyload,
//              span.episode, span.status, h2.entry-title,
//              p.original_title); phan trang ul.page-numbers a.next
//   chi tiet:  h1.entry-title, img.movie-thumb, p.org_title,
//              p.released a, p.episode, p.directors a, p.actors a,
//              p.category a, .entry-content .item-content
//   muc luc:   danh sach tap KHONG co san trong HTML chi tiet (div rong
//              .list-episode-ajax-1), phai POST AJAX:
//              POST /wp-content/themes/haunmovies/halim-ajax.php
//              action=halim_episode_pagination, postid, server, cur_sv,
//              eps_nav (chi so cum 100 tap), episode, eps_link
//              -> HTML li.halim-episode a[href="/-<slug>/tap-<n>-sv1.html"]
//   phat:      GET /wp-content/themes/haunmovies/player.php
//              ?episode_slug=tap-<n>&server_id=<sv>&subsv_id=&post_id=<id>
//              &nonce=<body data-nonce>&custom_var=
//              -> JSON {data:{status:true, sources:"<iframe src=...>"}}
//              iframe tro ve trang embed ben thu ba (vd tenmienphu68.lol);
//              tu IP datacenter cua VM trang embed tra 403, phat that chi
//              kiem chung duoc tren may that (IP di dong).
//   tim kiem:  /search/<tu-khoa> (site redirect ?s= ve duong dan nay),
//              phan trang /search/<tu-khoa>/page/<n>
// post_id / episode_slug / server nam trong bien halim_cfg nhung trong
// trang; nonce cua player la thuoc tinh data-nonce cua the body.
// File nay duoc nap boi cac script khac, nen KHONG duoc nap them file
// nao khac o day. Script phai nap file config.js, file config-helpers.js,
// file fetch-helpers.js, file rate-limit.js truoc file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var AJAX_PATH = "/wp-content/themes/haunmovies/halim-ajax.php";
var PLAYER_PATH = "/wp-content/themes/haunmovies/player.php";

// Lay truong chuoi/so tu JSON halim_cfg nhung trong HTML trang. Regex la
// can thiet vi halim_cfg nam trong the script, khong nam trong DOM text.
// Tra ve "" neu khong thay.
function cfgField(html, key) {
    var text = String(html || "");
    var m = text.match(new RegExp("\"" + key + "\"\\s*:\\s*\"([^\"]*)\""));
    if (m) return m[1].replace(/\\\//g, "/");
    m = text.match(new RegExp("\"" + key + "\"\\s*:\\s*(\\d+)"));
    if (m) return m[1];
    return "";
}

// Doc cau hinh player tu mot Document trang chi tiet / trang xem phim.
function halimCfg(doc) {
    var html = "";
    try { html = String(doc.html()); } catch (e) { html = ""; }
    var nonce = "";
    try {
        var bodyEl = doc.select("body").first();
        if (bodyEl !== null) nonce = String(bodyEl.attr("data-nonce") || "");
    } catch (e2) { nonce = ""; }
    return {
        postId: cfgField(html, "post_id"),
        episodeSlug: cfgField(html, "episode_slug"),
        server: cfgField(html, "server") || "1",
        postUrl: cfgField(html, "post_url"),
        nonce: nonce
    };
}

// Parse mot dong phim trong danh sach (article.grid-item). Tra ve item
// danh sach cua vBook hoac null neu khong phai dong phim.
function movieItem(el) {
    var a = el.select("a.halim-thumb").first();
    if (a === null) a = el.select("a").first();
    if (a === null) return null;
    var href = String(a.attr("href") || "");
    if (!href) return null;

    var name = cleanText(el.select("h2.entry-title").text());
    if (!name) name = cleanText(a.attr("title"));
    var img = el.select("img").first();
    if (!name && img !== null) name = cleanText(img.attr("alt"));
    if (!name) return null;

    var cover = "";
    if (img !== null) {
        cover = String(img.attr("data-src") || "");
        if (!cover) cover = String(img.attr("src") || "");
    }
    if (cover) cover = absUrl(cover);

    var desc = cleanText(el.select("p.original_title").text());
    var tag = cleanText(el.select("span.episode").text());
    var status = cleanText(el.select("span.status").text());
    if (status) tag = tag ? tag + " - " + status : status;

    return {
        name: name,
        cover: cover,
        link: absUrl(href),
        description: desc,
        tag: tag,
        host: siteOrigin()
    };
}

// Parse ca danh sach phim tren mot trang. Bo trung theo link.
function movieItems(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select("article.grid-item");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var item = movieItem(rows.get(i));
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    }
    return items;
}

// URL trang ke tiep tu pager WordPress (a.next.page-numbers). Tra ve ""
// neu khong con trang sau.
function nextListUrl(doc) {
    var next = doc.select("a.next.page-numbers").first();
    if (next === null) return "";
    var href = String(next.attr("href") || "");
    if (!href) return "";
    return absUrl(href);
}

// POST AJAX lay danh sach tap cua mot cum (eps_nav) tren mot server.
// Tra ve Document cua HTML tra ve, hoac null neu loi.
function fetchEpisodeDoc(postId, server, epsNav, episodeSlug, referer) {
    var body = "action=halim_episode_pagination"
        + "&postid=" + encodeURIComponent(String(postId || ""))
        + "&server=" + encodeURIComponent(String(server || "1"))
        + "&cur_sv=" + encodeURIComponent(String(server || "1"))
        + "&eps_nav=" + encodeURIComponent(String(epsNav || "0"))
        + "&episode=" + encodeURIComponent(String(episodeSlug || ""))
        + "&eps_link=";
    var r = null;
    try {
        r = pacedFetch(BASE_URL + AJAX_PATH, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            },
            referer: referer || BASE_URL + "/",
            body: body,
            timeout: 45000
        });
    } catch (e) {
        console.log("fetchEpisodeDoc loi: " + e);
        return null;
    }
    if (!r || !r.ok || !r.res) {
        console.log("fetchEpisodeDoc HTTP " + (r ? r.status : 0));
        return null;
    }
    try {
        return r.res.html();
    } catch (e2) {
        console.log("fetchEpisodeDoc doc HTML loi: " + e2);
        return null;
    }
}

// Parse cac tap trong HTML tra ve tu AJAX muc luc. Tra ve mang
// {name, url, slug} theo dung thu tu tren trang.
function parseEpisodes(doc) {
    var eps = [];
    if (!doc) return eps;
    var rows = doc.select("li.halim-episode a");
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var a = rows.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var name = cleanText(a.attr("title"));
        if (!name) name = cleanText(a.text());
        if (!name) continue;
        var span = a.select("span").first();
        var slug = "";
        if (span !== null) slug = String(span.attr("data-episode-slug") || "");
        eps.push({ name: name, url: absUrl(href), slug: slug });
    }
    return eps;
}

// Goi player.php lay HTML nguon phat (sources) cua mot tap. Tra ve chuoi
// sources (HTML chua iframe hoac link stream), hoac "" neu loi.
function fetchPlayerSources(cfg, referer) {
    if (!cfg || !cfg.postId || !cfg.episodeSlug) return "";
    var url = BASE_URL + PLAYER_PATH
        + "?episode_slug=" + encodeURIComponent(cfg.episodeSlug)
        + "&server_id=" + encodeURIComponent(cfg.server || "1")
        + "&subsv_id="
        + "&post_id=" + encodeURIComponent(cfg.postId)
        + "&nonce=" + encodeURIComponent(cfg.nonce || "")
        + "&custom_var=";
    var r = null;
    try {
        r = pacedFetch(url, {
            headers: { "X-Requested-With": "XMLHttpRequest" },
            referer: referer || BASE_URL + "/",
            timeout: 45000
        });
    } catch (e) {
        console.log("fetchPlayerSources loi: " + e);
        return "";
    }
    if (!r || !r.ok || !r.res) {
        console.log("fetchPlayerSources HTTP " + (r ? r.status : 0));
        return "";
    }
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return ""; }
    if (!text) return "";
    try {
        var json = JSON.parse(text);
        if (json && json.data && json.data.sources) return String(json.data.sources);
    } catch (e3) {
        console.log("fetchPlayerSources parse JSON loi: " + e3);
    }
    return "";
}

// Boc link phat tu HTML sources cua player: uu tien link .m3u8/.mp4 truc
// tiep trong sources, sau do den src cua iframe embed. Regex la can thiet
// vi sources la HTML tho trong JSON, khong phai Document.
// Tra ve {stream, embed}: stream la link phat truc tiep (neu co), embed
// la URL trang nhung (neu co).
function parseSources(sources) {
    var text = String(sources || "").replace(/\\\//g, "/");
    var out = { stream: "", embed: "" };
    var m = text.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
    if (m) out.stream = m[0];
    if (!out.stream) {
        m = text.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
        if (m) out.stream = m[0];
    }
    m = text.match(/<iframe[^>]+src="([^"]+)"/i);
    if (m) out.embed = m[1];
    if (!out.embed) {
        m = text.match(/<iframe[^>]+src='([^']+)'/i);
        if (m) out.embed = m[1];
    }
    return out;
}

// Origin cua URL (vd "https://tenmienphu68.lol") — dung lam host de app
// gan cookie/Referer theo dung host phat. Fallback ve BASE_URL.
function originOf(url) {
    var m = String(url || "").match(/^(https?:\/\/[^\/]+)/i);
    return m ? m[1] : BASE_URL;
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
