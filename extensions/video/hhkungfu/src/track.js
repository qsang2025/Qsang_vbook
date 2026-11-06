load('config.js');
load('config-helpers.js');
load('helper.js');

// track.js (video: buoc 2 cua chuoi chap -> track) — HHKUNGFU.
// Nhan payload JSON hoac URL tu chap.js.
// streamfree.vip dung co che ma hoa chunk, MediaSource va WebWorker,
// bat buoc kiem tra window.self !== window.top (phai nam trong iframe)
// va co Referer tu site nguon.
// De phat video trong vBook ma khong bi vBook boc tach iframe src ra thanh top-level webview,
// script tra ve HTML container tao iframe dong thoi gian thuc bang JavaScript.

function createPlayerHtml(embedUrl) {
    return '<!DOCTYPE html><html><head>' +
        '<meta charset="utf-8">' +
        '<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">' +
        '<style>* { margin:0; padding:0; box-sizing:border-box; } html,body { width:100%; height:100%; background:#000; overflow:hidden; } #p-wrap { width:100%; height:100%; }</style>' +
        '</head><body>' +
        '<div id="p-wrap"></div>' +
        '<script>' +
        'var ifr = document.createElement("iframe");' +
        'ifr.src = ' + JSON.stringify(embedUrl) + ';' +
        'ifr.setAttribute("allowfullscreen", "true");' +
        'ifr.setAttribute("webkitallowfullscreen", "true");' +
        'ifr.setAttribute("mozallowfullscreen", "true");' +
        'ifr.setAttribute("allow", "autoplay; fullscreen; encrypted-media");' +
        'ifr.style.width = "100%";' +
        'ifr.style.height = "100%";' +
        'ifr.style.border = "none";' +
        'document.getElementById("p-wrap").appendChild(ifr);' +
        '</script>' +
        '</body></html>';
}

function execute(input) {
    input = String(input === undefined || input === null ? "" : input).trim();
    if (!input) return Response.error("Thiếu thông tin máy chủ");

    var params = null;
    try {
        if (input.indexOf("{") === 0) {
            params = JSON.parse(input);
        }
    } catch (e) {
        params = null;
    }

    // 1. Truong hop chon "Webview Trang Nguon": mo thang URL trang xem
    if (params && params.type === "web" && params.url) {
        return Response.success({
            type: "webview",
            data: params.url,
            host: siteOrigin(),
            headers: {
                "User-Agent": UserAgent.chrome(),
                "Referer": BASE_URL + "/"
            }
        });
    }

    // 2. Truong hop da la stream truc tiep (.m3u8 hoac .mp4)
    if (input.indexOf(".m3u8") !== -1 || input.indexOf(".mp4") !== -1) {
        return Response.success({
            type: "native",
            data: input,
            host: siteOrigin(),
            mimeType: input.indexOf(".mp4") !== -1 ? "video/mp4" : "application/x-mpegURL",
            headers: { "User-Agent": UserAgent.chrome(), "Referer": BASE_URL + "/" }
        });
    }

    var fallbackUrl = (params && params.url) ? params.url : (input.indexOf("http") === 0 ? input : BASE_URL);

    // 3. Goi AJAX player.php de lay iframe embed
    var playerApi = "";
    if (params && params.postId && params.chapter && params.type) {
        playerApi = BASE_URL + "/player/player.php?action=dox_ajax_player" +
            "&post_id=" + params.postId +
            "&chapter_st=" + params.chapter +
            "&type=" + params.type +
            "&sv=" + (params.sv || "1");
    } else if (input.indexOf("player.php") !== -1) {
        playerApi = input;
    }

    if (playerApi) {
        try {
            var r = fetch(playerApi, {
                headers: {
                    "Referer": fallbackUrl,
                    "User-Agent": UserAgent.chrome()
                }
            });
            if (r && r.ok) {
                var html = r.text();
                var m = html.match(/src="([^"]+)"/i);
                if (m && m[1]) {
                    var embed = m[1].replace(/&amp;/g, "&");
                    if (embed.indexOf("//") === 0) embed = "https:" + embed;

                    if (embed.indexOf("not-found") !== -1) {
                        return Response.error("Tập này chưa có video ở server này, hãy thử server khác hoặc chọn Webview Trang Nguồn.");
                    }

                    return Response.success({
                        type: "webview",
                        data: createPlayerHtml(embed),
                        host: siteOrigin(),
                        headers: {
                            "User-Agent": UserAgent.chrome(),
                            "Referer": BASE_URL + "/"
                        }
                    });
                }
            }
        } catch (err) {
            // Neu AJAX player loi, tu dong chuyen xuong fallback ben duoi
        }
    }

    // Fallback an toan tuyet doi: Mo webview trang nguon
    return Response.success({
        type: "webview",
        data: fallbackUrl,
        host: siteOrigin(),
        headers: {
            "User-Agent": UserAgent.chrome(),
            "Referer": BASE_URL + "/"
        }
    });
}
