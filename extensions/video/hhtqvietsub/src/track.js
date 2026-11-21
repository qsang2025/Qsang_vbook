// track.js (video: buoc 2 cua chap -> track) — giai data cua mot server
// (tu chap.js) thanh stream phat duoc. Thu tu uu tien:
//   1. native truc tiep (.m3u8/.mp4 san trong data hoac boc tu HTML embed).
//   2. native qua API stream-bootstrap cua trang embed JWPlayer (POST
//      bootstrap/issue xin playlist thuong, xem ghi chu o ham
//      resolveViaBootstrap) — trang embed khong chua link stream dang chu
//      nen regex o buoc 1 luon rong voi host nay (loi task 116).
//   3. native qua trinh duyet headless (Engine.newBrowser) khi fetch
//      thuong khong lay duoc stream — chi nhan URL media .m3u8/.mp4 that.
//   4. webview nhung trang embed/player de phat trong trang. KHONG dung
//      auto o day: auto sniff hut thi bao loi cung "khong the tai may
//      chu" (da gap that 20/11), con webview van nhung trang de phat.
// Khong xoay User-Agent (quy tac 10): chi gui Referer, de runtime dung
// UA mac dinh.
// Luu y: trang embed ben thu ba co the chan IP datacenter (403 tu VM);
// viec phat that chi kiem chung duoc tren may that khi bam Play trong app.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function nativeResult(streamUrl, referer) {
    var ref = referer || (BASE_URL + "/");
    var hostLower = originOf(streamUrl).toLowerCase();
    if (hostLower.indexOf("tenmienphu68") !== -1 || hostLower.indexOf("syntheticvideo") !== -1) {
        ref = "https://tenmienphu68.lol/";
    } else if (!referer && (hostLower.indexOf("phim1280") !== -1 || hostLower.indexOf("kkphim") !== -1 || hostLower.indexOf("kvp") !== -1)) {
        ref = "https://phimapi.com/";
    }
    return Response.success({
        type: "native",
        data: streamUrl,
        host: originOf(streamUrl),
        mimeType: streamUrl.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
        headers: { "Referer": ref },
        timeSkip: []
    });
}

function webviewResult(pageUrl) {
    return Response.success({
        type: "webview",
        data: pageUrl,
        host: originOf(pageUrl),
        headers: { "Referer": BASE_URL + "/" },
        timeSkip: []
    });
}

// Boc link .m3u8/.mp4 truc tiep tu mot khoi text (HTML trang embed).
// Regex la can thiet vi link stream nam trong script cua player, khong
// nam trong DOM. Tra ve "" neu khong boc duoc.
function streamFromText(text) {
    var t = String(text || "");
    if (!t) return "";
    var m = t.match(/https?:\/\/[^"'\s<>]+\.m3u8[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    m = t.match(/https?:\/\/[^"'\s<>]+\.mp4[^"'\s<>]*/i);
    if (m) return m[0].replace(/\\\//g, "/");
    return "";
}

// Tai HTML trang embed mot lan (paced, 1 request/host) de dung chung cho
// ca boc stream truc tiep lan doc cau hinh stream-bootstrap. Tra ve ""
// neu tai loi (ke ca 403/429 — pacedFetch da ghi cooldown khi can).
function fetchEmbedHtml(embed) {
    var r = null;
    try {
        r = pacedFetch(embed, {
            referer: BASE_URL + "/",
            timeout: 45000
        });
    } catch (e) {
        return "";
    }
    if (!r || !r.ok || !r.res) return "";
    try { return String(r.res.text() || ""); } catch (e2) { return ""; }
}

// Doc URL API tu khoi cau hinh stream-bootstrap nhung trong trang embed
// (the script id="stream-bootstrap", JSON co truong "api" tro lai chinh
// URL embed). Regex la can thiet vi khoi nay nam trong the script, khong
// nam trong DOM text. Khong thay thi fallback ve chinh URL embed neu no
// co dang embed.php?hash=... (cung he player), nguoc lai tra "".
function bootstrapApiFromHtml(html, embed) {
    var t = String(html || "");
    var m = t.match(/id="stream-bootstrap"[^>]*>([^<]+)</i);
    if (m) {
        try {
            var cfg = JSON.parse(m[1]);
            if (cfg && cfg.api && String(cfg.api).indexOf("http") === 0) {
                return String(cfg.api);
            }
        } catch (e) {
        }
    }
    if (String(embed || "").indexOf("embed.php") !== -1) return String(embed);
    return "";
}

// POST mot payload JSON toi API cua trang embed, tra ve JSON da parse
// hoac null neu loi. Chi thu dung 1 lan (maxRetries 0): moi lan POST la
// mot lan xin cap quyen phat, thu lai dồn dập chi de bi rate-limit.
function postEmbedJson(api, payload, referer) {
    var r = null;
    try {
        r = pacedFetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            referer: referer,
            body: JSON.stringify(payload),
            timeout: 30000,
            maxRetries: 0
        });
    } catch (e) {
        console.log("postEmbedJson loi: " + e);
        return null;
    }
    if (!r || !r.ok || !r.res) {
        console.log("postEmbedJson HTTP " + (r ? r.status : 0));
        return null;
    }
    var text = "";
    try { text = String(r.res.text() || ""); } catch (e2) { return null; }
    if (!text) return null;
    try { return JSON.parse(text); } catch (e3) {
        console.log("postEmbedJson parse JSON loi: " + e3);
        return null;
    }
}

// Lay URL playlist phat duoc tu mot goi cap quyen (preissued hoac ket
// qua issue). Chi nhan playlist THUONG: format trong hoac "hls". Format
// "aesgcm"/"aesgcm-v2" la playlist bi niem phong AES-GCM cho player
// trong trang tu giai — trinh phat native cua app khong giai duoc nen
// phai bo, de caller di tiep sang browser/webview thay vi tra native hong.
function playlistFromGrant(grant) {
    if (!grant || typeof grant !== "object") return "";
    var url = grant.playlist ? String(grant.playlist) : "";
    if (!url || url.indexOf("http") !== 0) return "";
    var fmt = grant.playlistFormat;
    if (fmt === undefined || fmt === null || fmt === "") return url;
    if (String(fmt) === "hls") return url;
    console.log("playlist bi niem phong (" + fmt + "), bo qua native");
    return "";
}

// Xin link phat qua API cua trang embed JWPlayer (khao sat live 20/11
// tren embed1.streamc.xyz, file cdn-start/player r25):
//   POST {action:"bootstrap", referrer, frame_origins, request_grant,
//         playlist_format:"hls", pretty_url, path_chunks,
//         bootstrap_format:"json"}
//   -> JSON co the chua san "preissued" (playlist + playlistFormat), hoac
//      chua "bootstrap" (token) de POST tiep
//      {action:"issue", bootstrap, turnstile_response:"", ...} lay playlist.
// bootstrap_format "json" la duong fallback cua chinh player khi trinh
// duyet khong co WebCrypto — runtime Rhino cung khong co WebCrypto nen
// phai xin dang nay (dang "aesgcm-v1" bi ma hoa AES-GCM). Neu server bat
// Turnstile (turnstileEnabled) thi fetch thuong khong qua duoc, tra ""
// de caller dung browser/webview. URL playlist tra ve la path ky mo tren
// cung origin cua API, khong chua ".m3u8" — van la HLS thuong khi format
// la "hls" nen tra native voi mimeType HLS la dung.
function resolveViaBootstrap(api, embed) {
    var origins = [originOf(BASE_URL)];
    var boot = postEmbedJson(api, {
        action: "bootstrap",
        referrer: BASE_URL + "/",
        frame_origins: origins,
        request_grant: true,
        playlist_format: "hls",
        pretty_url: true,
        path_chunks: true,
        bootstrap_format: "json"
    }, embed);
    if (!boot) return "";
    var url = playlistFromGrant(boot.preissued);
    if (url) return url;
    url = playlistFromGrant(boot);
    if (url) return url;
    if (boot.turnstileEnabled === true) {
        console.log("embed doi Turnstile, fetch thuong khong qua duoc");
        return "";
    }
    if (!boot.bootstrap || typeof boot.bootstrap !== "string") return "";
    var issued = postEmbedJson(api, {
        action: "issue",
        bootstrap: boot.bootstrap,
        turnstile_response: "",
        playlist_format: "hls",
        pretty_url: true,
        path_chunks: true,
        frame_origins: origins
    }, embed);
    if (!issued) return "";
    return playlistFromGrant(issued);
}

// Chuyen danh sach URL trinh duyet da yeu cau thanh mang JS thuong.
// Runtime co the tra mang JS (length) hoac danh sach Java (size/get).
function browserUrlsToArray(urls) {
    var out = [];
    if (!urls) return out;
    var i = 0;
    try {
        if (typeof urls.length === "number") {
            for (i = 0; i < urls.length; i++) out.push(String(urls[i]));
            return out;
        }
    } catch (e) {
    }
    try {
        if (typeof urls.size === "function") {
            for (i = 0; i < urls.size(); i++) out.push(String(urls.get(i)));
        }
    } catch (e2) {
    }
    return out;
}

// Render trang embed bang trinh duyet headless cua app roi tim URL media
// that (.m3u8/.mp4) trong cac request trang da gui + src cua the video.
// Chi dung khi fetch thuong that su khong lay duoc stream (player chay
// JS/Turnstile). URL playlist ky mo khong co duoi media thi bo qua —
// khong biet no thuong hay bi niem phong, tra native bua se hong.
function resolveViaBrowser(embed) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") {
        return "";
    }
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(embed, 15000);
        try { browser.waitUrl([".*\\.m3u8.*", ".*\\.mp4.*"], 10000); } catch (e0) {
        }
        var urls = [];
        try { urls = browserUrlsToArray(browser.urls()); } catch (e1) {
        }
        var i = 0;
        for (i = 0; i < urls.length; i++) {
            var u = streamFromText(urls[i]);
            if (u) {
                try { if (browser.close) browser.close(); } catch (e2) {
                }
                return u;
            }
        }
        var src = "";
        try {
            var el = browser.callJs("(function(){var v=document.querySelector('video');return v?String(v.currentSrc||v.src||''):'';})()", 5000);
            if (el) src = String(el.text() || "");
        } catch (e3) {
        }
        try { if (browser.close) browser.close(); } catch (e4) {
        }
        return streamFromText(src);
    } catch (e) {
        try { if (browser && browser.close) browser.close(); } catch (e5) {
        }
        console.log("resolveViaBrowser loi: " + e);
        return "";
    }
}

function execute(data) {
    data = String(data || "");
    if (!data) return Response.error("Không có dữ liệu server để phát.");

    // Da la stream truc tiep.
    if (data.indexOf(".m3u8") !== -1 || data.indexOf(".mp4") !== -1) {
        return nativeResult(data, BASE_URL + "/");
    }

    if (data.indexOf("http") !== 0) return Response.error("Không giải được link phát từ dữ liệu server.");

    // Trang xem phim cua chinh site: goi lai player de lay embed/stream.
    if (data.indexOf("/tap-") !== -1 && data.indexOf(".html") !== -1) {
        var watchUrl = normalizeUrl(data);
        rateLimitDelay(siteOrigin(), 500, 1200);
        var doc = fetchDoc(watchUrl);
        if (doc) {
            var cfg = halimCfg(doc);
            var parsed = parseSources(fetchPlayerSources(cfg, watchUrl));
            if (parsed.stream) return nativeResult(parsed.stream, watchUrl);
            if (parsed.embed) data = parsed.embed;
            else {
                var um = watchUrl.match(/\/-?([^\/]+)\/(tap-[^\/\?\.]+?)(?:-sv(\d+))?\.html/i);
                var hhSlug = um ? um[1] : "";
                var epSlug = (cfg && cfg.episodeSlug) ? cfg.episodeSlug : (um ? um[2] : "");
                var sv = (cfg && cfg.server) ? cfg.server : (um && um[3] ? um[3] : "1");
                var targetEp = episodeNumber(epSlug);
                var isFull = /full/i.test(epSlug);
                var hhTitle = "";
                var h1 = doc.select("h1.entry-title").first();
                if (h1 !== null) {
                    hhTitle = cleanText(h1.text())
                        .replace(/\s*Tập\s+.*$/i, "")
                        .replace(/\s*(?:Vietsub|Thuyết Minh).*$/i, "")
                        .replace(/^\s+|\s+$/g, "");
                }
                var hhOrig = "";
                var orgEl = doc.select("p.org_title, h2.org_title").first();
                if (orgEl !== null) hhOrig = cleanText(orgEl.text());
                var isSeries = doc.select("li.halim-episode").size() > 2 || targetEp > 1;
                var preferDub = sv === "2";

                var phimRes = resolvePhimApiTracks(hhSlug, hhTitle, hhOrig, targetEp, isFull, isSeries, preferDub);
                if (phimRes.primary.length > 0) {
                    return nativeResult(phimRes.primary[0].data, "https://phimapi.com/");
                }
                if (phimRes.secondary.length > 0) {
                    return nativeResult(phimRes.secondary[0].data, "https://phimapi.com/");
                }
                return webviewResult(watchUrl);
            }
        } else {
            return webviewResult(watchUrl);
        }
    }

    // Trang embed ben thu ba: boc stream truc tiep truoc, sau do xin
    // playlist qua API bootstrap, sau do render bang trinh duyet, cuoi
    // cung nhung trang embed bang webview de phat trong player cua trang.
    var html = fetchEmbedHtml(data);
    var stream = streamFromText(html);
    if (stream) return nativeResult(stream, data);
    var api = bootstrapApiFromHtml(html, data);
    if (api) {
        var playlist = resolveViaBootstrap(api, data);
        if (playlist) return nativeResult(playlist, data);
    }
    var browserStream = resolveViaBrowser(data);
    if (browserStream) return nativeResult(browserStream, data);
    return webviewResult(data);
}
