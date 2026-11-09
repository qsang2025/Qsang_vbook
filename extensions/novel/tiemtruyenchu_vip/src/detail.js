// detail.js — Thong tin chi tiet truyen Tiem Truyen Chu
load('config.js');

function execute(url) {
    var storyId = resolveStoryId(url);
    if (storyId) {
        var apiUrl = BASE_URL + "/api/v1/stories/" + storyId;
        var json = fetchJson(apiUrl);
        var wrapped = unwrapStory(json);
        var story = wrapped.story;
        if (story) {
            var name = story.title || ("Truyện #" + story.id);
            var author = story.author || "Không rõ";
            var cover = story.cover_url || story.poster || "";
            if (cover && cover.indexOf("http") !== 0) {
                cover = BASE_URL + (cover.charAt(0) === "/" ? "" : "/") + cover;
            }

            // Trang thai doc that tu API: "full" -> Hoan thanh, "ongoing" -> Dang ra.
            // API khong tra trang thai thi hien "Chua ro" (ongoing mac dinh true
            // de app hien thi, nhung detail ghi ro la chua ro thay vi khang dinh).
            var statusRaw = String(story.status || "").toLowerCase();
            var ongoing = true;
            var statusText = "Chưa rõ";
            if (statusRaw.indexOf("full") !== -1 || statusRaw.indexOf("hoan") !== -1 || statusRaw.indexOf("hoàn") !== -1 || statusRaw.indexOf("completed") !== -1) {
                ongoing = false;
                statusText = "Hoàn thành";
            } else if (statusRaw.indexOf("ongoing") !== -1 || statusRaw.indexOf("đang ra") !== -1 || statusRaw.indexOf("dang ra") !== -1) {
                ongoing = true;
                statusText = "Đang ra";
            }

            var genres = [];
            var catNames = [];
            var mainCat = categoryName(story.category);
            if (mainCat) {
                catNames.push(mainCat);
                // Chip the loai phai gui SLUG (cat=huyen-huyen); gui ten hien
                // thi lowercase (cat=huyen huyễn) thi API tra total 0.
                var slug = categorySlug(mainCat);
                if (slug) {
                    genres.push({
                        title: mainCat,
                        input: "stories?cat=" + slug,
                        script: "gen.js"
                    });
                }
            }
            if (isArray(story.sub_categories)) {
                var mainSlug = slug || "";
                var seenSlugs = {};
                if (mainSlug) seenSlugs[mainSlug] = true;
                for (var i = 0; i < story.sub_categories.length; i++) {
                    var subName = categoryName(story.sub_categories[i]);
                    if (subName) {
                        catNames.push(subName);
                        // Thể loại phụ cũng tạo chip bấm được như thể loại
                        // chính (gửi slug); tên nào không có trong bảng slug
                        // thì chỉ hiện trong chuỗi thể loại, không tạo chip.
                        var subSlug = categorySlug(subName);
                        if (subSlug && !seenSlugs[subSlug]) {
                            seenSlugs[subSlug] = true;
                            genres.push({
                                title: subName,
                                input: "stories?cat=" + subSlug,
                                script: "gen.js"
                            });
                        }
                    }
                }
            }
            var categoryText = catNames.length ? catNames.join(", ") : "Đang cập nhật";
            var totalChaps = story.total_chapters ? String(story.total_chapters) : "0";

            var detailText = "Tên truyện: " + name
                + "<br>Tác giả: " + author
                + (story.uploader && story.uploader.display_name ? "<br>Người đăng: " + story.uploader.display_name : "")
                + "<br>Thể loại: " + categoryText
                + "<br>Trạng thái: " + statusText
                + "<br>Số chương: " + totalChaps;
            if (story.views) detailText += "<br>Lượt xem: " + story.views;
            if (story.follows) detailText += "<br>Theo dõi: " + story.follows;
            if (story.avg_rating) detailText += "<br>Đánh giá: " + story.avg_rating + " ⭐ (" + (story.rating_count || 0) + " đánh giá)";

            var desc = cleanText(story.description || "").replace(/\n/g, "<br>");
            if (!desc) desc = "Chưa có giới thiệu.";

            var commentConfig = {
                title: "Bình luận",
                input: String(storyId),
                script: "comment.js"
            };

            var comments = [];
            try {
                var cJson = fetchJson(BASE_URL + "/api/v1/stories/" + storyId + "/comments?page=1");
                if (cJson && cJson.items && cJson.items.length > 0) {
                    for (var ci = 0; ci < cJson.items.length; ci++) {
                        var cItem = cJson.items[ci];
                        var uName = cItem.display_name || cItem.username || "Thành viên";
                        var uAva = cItem.avatar || "";
                        if (uAva && uAva.indexOf("http") !== 0) {
                            uAva = BASE_URL + (uAva.charAt(0) === "/" ? "" : "/") + uAva;
                        }
                        var cDesc = cItem.created_at ? cItem.created_at.substring(0, 10) : "";
                        if (cItem.likes && cItem.likes > 0) {
                            cDesc += (cDesc ? " • " : "") + cItem.likes + " thích";
                        }
                        var cContent = cItem.content || "";
                        if (cItem.replies && cItem.replies.length > 0) {
                            for (var ri = 0; ri < cItem.replies.length; ri++) {
                                var rep = cItem.replies[ri];
                                var rName = rep.display_name || rep.username || "Thành viên";
                                cContent += "\n↪ " + rName + ": " + (rep.content || "");
                            }
                        }
                        comments.push({
                            name: uName,
                            content: cContent,
                            avatar: uAva,
                            description: cDesc
                        });
                    }
                }
            } catch (eC) {}

            return Response.success({
                name: name,
                url: BASE_URL + "/truyen/" + storyId,
                cover: cover,
                author: author,
                description: desc,
                detail: detailText,
                ongoing: ongoing,
                type: "novel",
                format: "novel",
                genres: genres,
                host: BASE_URL,
                comment: commentConfig,
                comments: comments
            });
        }
    }

    // Fallback HTML
    var targetUrl = normalizeUrl(url);
    var res = null;
    try {
        res = fetch(targetUrl, { headers: buildHeaders() });
    } catch (eFetch) {
        res = null;
    }
    if (!res || !res.ok) {
        return Response.error("Không thể tải thông tin truyện từ Tiệm Truyện Chữ.");
    }
    var doc = res.html();
    if (isInterstitialDoc(doc)) {
        return Response.error("Trang chi tiết truyện trên Tiệm Truyện Chữ hiện chỉ mở được trong ứng dụng (trang tải app). Hãy mở truyện từ kết quả tìm kiếm trong vBook rồi thử lại.");
    }
    var titleEl = doc.select(".story-header h2 span.align-middle, h1.story-title").first();
    var htmlName = titleEl ? titleEl.text().trim() : "";
    if (!htmlName || htmlName.indexOf("Đăng nhập") !== -1) {
        return Response.error("Không tìm thấy thông tin truyện (ID: " + (storyId || url) + ").");
    }
    var authorEl = doc.select("a[href*='/tac-gia/'], a[href*='author']").first();
    var htmlAuthor = authorEl ? authorEl.text().trim() : "Không rõ";
    var imgEl = doc.select("img.story-poster").first();
    var htmlCover = imgEl ? (imgEl.attr("data-src") || imgEl.attr("src") || "") : "";
    if (htmlCover && htmlCover.indexOf("http") !== 0) {
        htmlCover = normalizeUrl(htmlCover);
    }
    var descEl = doc.select("#tab-info, .content-text, .story-desc").first();
    var htmlDesc = descEl ? descEl.html() : "Chưa có giới thiệu.";

    // Trang thai o fallback HTML: chi doc trong khoi story-header, khong co
    // thi ghi "Chua ro" thay vi khang dinh "Dang ra".
    var htmlOngoing = true;
    var htmlStatus = "Chưa rõ";
    var headerEl = doc.select(".story-header").first();
    var headerText = headerEl ? headerEl.text() : "";
    if (headerText.indexOf("Hoàn thành") !== -1) {
        htmlOngoing = false;
        htmlStatus = "Hoàn thành";
    } else if (headerText.indexOf("Đang ra") !== -1) {
        htmlOngoing = true;
        htmlStatus = "Đang ra";
    }

    var htmlCommentConfig = null;
    if (storyId) {
        htmlCommentConfig = {
            title: "Bình luận",
            input: String(storyId),
            script: "comment.js"
        };
    }

    return Response.success({
        name: htmlName,
        url: targetUrl,
        cover: htmlCover,
        author: htmlAuthor,
        description: htmlDesc,
        detail: "Tên truyện: " + htmlName + "<br>Tác giả: " + htmlAuthor + "<br>Trạng thái: " + htmlStatus,
        ongoing: htmlOngoing,
        type: "novel",
        format: "novel",
        host: BASE_URL,
        comment: htmlCommentConfig
    });
}
