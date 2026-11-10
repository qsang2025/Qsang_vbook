// detail.js — Chi tiet truyen SangtacvietApp
// Uu tien toi da API noi bo cua Mobile App (/mobile/bookinfo.php) tra ve JSON truc tiep,
// toc do phan hoi sieu toc (<100ms) va payload sieu nhe (<2KB) thay vi tai ca trang web HTML 200KB.
// Tu dong fallback ve HTML parser neu can.

load('config.js');
load('rate-limit.js');
load('challenge-handler.js');

function execute(url) {
    if (url.indexOf("http") !== 0) {
        if (url.charAt(0) !== '/') url = '/' + url;
        url = BASE_URL + url;
    }
    url = url.replace(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n?]+)/img, BASE_URL);
    if (url.charAt(url.length - 1) !== '/') url = url + '/';

    var hostId = "";
    var bookId = "";
    var m = url.match(/truyen\/([^\/]+)\/\d+\/([^\/]+)\/?/);
    if (m) {
        hostId = m[1];
        bookId = m[2];
    }

    // 1. Phap toi uu: Goi API Mobile App bookinfo.php
    if (hostId && bookId) {
        var apiMobileUrl = BASE_URL + "/mobile/bookinfo.php?host=" + encodeURIComponent(hostId) + "&hid=" + encodeURIComponent(bookId);
        try {
            var apiRes = fetchWithMirrors(apiMobileUrl, {
                method: "GET",
                headers: {
                    "x-stv-transport": "app",
                    "x-requested-with": "com.sangtacviet.mobilereader"
                }
            });
            if (apiRes && apiRes.ok) {
                var jsonText = String(apiRes.text() || "");
                if (jsonText && jsonText.charAt(0) === '{') {
                    var json = JSON.parse(jsonText);
                    if (json && (json.code === 100 || json.code === 1) && json.book) {
                        var b = json.book;
                        var bName = (b.tname || "").trim() || b.name || "";
                        var bAuthor = (b.hauthor || "").trim() || b.author || "Chưa rõ";
                        var bCover = b.thumb || "";
                        if (bCover && bCover.indexOf("//") === 0) bCover = "https:" + bCover;
                        if (bCover && bCover.indexOf("http://") === 0) bCover = "https://" + bCover.substring(7);

                        // Trang thai that tu bookinfo.php (API cua Mobile App):
                        // so "0"/"1"/"2"/"3" (search API tra so) hoac chu
                        // "Không xác định"/"Còn tiếp"/"Tạm ngưng"/"Hoàn thành".
                        // Khao sat 10 truyen 10/11: search so va bookinfo chu
                        // khop nhau 9/9 (0=Khong xac dinh, 1=Con tiep,
                        // 2=Tam ngung, 3=Hoan thanh). "Tạm ngưng" van la
                        // ongoing=true + ghi chu, khong doan la hoan thanh.
                        var bOngoing = true;
                        var bStatus = String(b.status || "").trim();
                        var bStatusNote = "";
                        var bStatusLow = bStatus.toLowerCase();
                        if (bStatus === "3" || bStatus.indexOf("Hoàn thành") !== -1 || bStatusLow.indexOf("complete") !== -1) {
                            bOngoing = false;
                        } else if (bStatus === "2" || bStatus.indexOf("Tạm ngưng") !== -1) {
                            bStatusNote = "Tạm ngưng";
                        } else if (bStatus !== "" && bStatus !== "1" && bStatus.indexOf("Còn tiếp") === -1) {
                            // "0"/"Không xác định" hoac gia tri la: ghi lai
                            // dung gia tri goc, khong doan ongoing=false.
                            bStatusNote = bStatus;
                        }

                        var bDesc = b.info || "";
                        var bDetail = "Lượt đọc: " + (b.view || 0) + "<br>Số chương: " + (b.chaptercount || 0) + "<br>Cập nhật: " + (b.lastupdate || "");
                        if (bStatusNote) bDetail += "<br>Trạng thái: " + bStatusNote;

                        var bGenres = [];
                        if (b.category) {
                            var catText = String(b.category).trim().toLowerCase();
                            for (var gi = 0; gi < GENRES.length; gi++) {
                                if (catText.indexOf(GENRES[gi].title.toLowerCase()) !== -1) {
                                    bGenres.push({ title: GENRES[gi].title, input: GENRES[gi].slug, script: "gen.js" });
                                }
                            }
                            if (bGenres.length === 0) {
                                var rawTags = String(b.category).replace(/tiểu thuyết|loại hình|truyện/gi, "").split(/[;,\/\|\-]/g);
                                for (var ti = 0; ti < rawTags.length; ti++) {
                                    var tagClean = rawTags[ti].replace(/^\s+|\s+$/g, "");
                                    if (tagClean) {
                                        bGenres.push({ title: tagClean, input: "tag=" + encodeURIComponent(tagClean), script: "gen.js" });
                                    }
                                }
                            }
                        }

                        if (bName) {
                            var commentConfig = {
                                title: "Bình luận",
                                input: url,
                                script: "comment.js"
                            };

                            return Response.success({
                                name: bName,
                                cover: bCover,
                                author: bAuthor,
                                description: bDesc,
                                detail: bDetail,
                                ongoing: bOngoing,
                                host: BASE_URL,
                                url: url,
                                type: "novel",
                                format: "novel",
                                genres: bGenres,
                                comment: commentConfig,
                                comments: [commentConfig]
                            });
                        }
                    }
                }
            }
        } catch (eApi) {
        }
    }

    // 2. Fallback: Parse trang HTML web truyen thong khi API khong kha dung
    var response = null;
    var text = "";
    try {
        response = fetchWithMirrors(url);
        if (response) {
            text = String(response.text() || "");
        }
    } catch (e) {
        return Response.error("Không kết nối được tới Sáng Tác Việt: " + e);
    }

    if (!response || !response.ok || isCloudflareChallenge(text, response ? response.headers : null)) {
        var blockedMsg = stvBlockedMessage();
        if (blockedMsg) return Response.error(blockedMsg);
        var browserDoc = fetchViaBrowser(url);
        if (browserDoc) {
            try {
                var bHtml = String(browserDoc.html() || "");
                if (bHtml && !isCloudflareChallenge(bHtml, null)) {
                    text = bHtml;
                }
            } catch (e2) {}
        }
    }

    if (isCloudflareChallenge(text, response ? response.headers : null)) {
        return Response.error(formatChallengeError("Sáng Tác Việt", url));
    }

    if (!response || !response.ok) return Response.error("Không tải được trang truyện (HTTP " + (response ? response.status : 0) + ")");
    var doc = Html.parse(text);

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";

    // Fallback HTML: og:novel:status KHONG dang tin nhu bookinfo.php
    // (khao sat 10 truyen 10/11: og "Hoàn thành" khop voi bookinfo
    // "Tạm ngưng" 4/4; og "Còn tiếp" khop ca "Còn tiếp"/"Hoàn thành"/
    // "Không xác định"). Nen og "Hoàn thành" = TAM NGUNG (van ongoing,
    // ghi chu), khong bao gio doan ongoing=false o day.
    var ongoing = true;
    var statusNote = "";
    var statusMeta = doc.select("meta[property='og:novel:status']").first();
    if (statusMeta) {
        var statusText = (statusMeta.attr("content") || "").trim();
        if (statusText) {
            statusNote = statusText;
            if (statusText.indexOf("Hoàn thành") !== -1 || statusText.toLowerCase().indexOf("complete") !== -1) {
                statusNote = "Tạm ngưng (web ghi: " + statusText + ")";
            }
        }
    }

    var regex = /var\s+bookinfo\s*=\s*(\{[\s\S]*?\});/;
    var match = text.match(regex);
    if (match) {
        try {
            var bookInfoJson = JSON.parse(match[1]);
            name = (bookInfoJson.namevi || "").trim() || bookInfoJson.name || "";
            cover = bookInfoJson.thumb || "";
            author = bookInfoJson.author || "";
        } catch (eJson) {}
    }

    if (!name) {
        var h1 = doc.select("h1, .book-title").first();
        if (h1) name = h1.text().trim();
    }
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var ogAuthor = doc.select("meta[property='og:novel:author']").first();
    if (ogAuthor && (ogAuthor.attr("content") || "").trim()) {
        author = ogAuthor.attr("content").trim();
    }

    if (cover && cover.indexOf("//") === 0) cover = "https:" + cover;
    if (cover && cover.indexOf("http://") === 0) cover = "https://" + cover.substring(7);

    var desEl = doc.select(".blk:has(.fa-water) .blk-body, .intro, .desc").first();
    if (desEl) description = desEl.html();
    if (!description) {
        var ogDesc = doc.select("meta[property='og:description']").first();
        if (ogDesc) description = (ogDesc.attr("content") || "").trim();
    }

    doc.select(".blk-body.ib-100").forEach(function(e) {
        detail += "<br>" + e.text().trim();
    });
    if (statusNote) detail += "<br>Trạng thái: " + statusNote;

    var genres = [];
    var ogCat = doc.select("meta[property='og:novel:category']").first();
    if (ogCat) {
        var catText2 = (ogCat.attr("content") || "").trim().toLowerCase();
        if (catText2) {
            for (var gi2 = 0; gi2 < GENRES.length; gi2++) {
                if (catText2.indexOf(GENRES[gi2].title.toLowerCase()) !== -1) {
                    genres.push({ title: GENRES[gi2].title, input: GENRES[gi2].slug, script: "gen.js" });
                }
            }
        }
    }

    var commentConfig2 = {
        title: "Bình luận",
        input: url,
        script: "comment.js"
    };

    return Response.success({
        name: name,
        cover: cover,
        author: author || "Chưa rõ",
        description: description,
        detail: detail,
        ongoing: ongoing,
        host: BASE_URL,
        url: url,
        type: "novel",
        format: "novel",
        genres: genres,
        comment: commentConfig2,
        comments: [commentConfig2]
    });
}
