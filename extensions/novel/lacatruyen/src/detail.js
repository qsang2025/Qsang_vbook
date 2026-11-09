// detail.js — Lay thong tin chi tiet truyen tu __NEXT_DATA__ tren La Ca Truyen
load('config.js');

function cleanDescription(html) {
    if (!html) return "Đang cập nhật mô tả.";
    // Mo ta tra ve la plain text: bo het tag roi gom khoang trang (ban cu chen <br> roi lai
    // strip het tag nen doan xu ly <br> la code chet).
    var s = String(html)
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    return s || "Đang cập nhật mô tả.";
}

function buildGenres(pageProps, story) {
    var cats = [];
    if (pageProps && Array.isArray(pageProps.categories) && pageProps.categories.length > 0) {
        cats = pageProps.categories;
    } else if (story && Array.isArray(story.story_categories) && story.story_categories.length > 0) {
        cats = story.story_categories;
    }
    var genres = [];
    var seen = {};
    for (var i = 0; i < cats.length; i++) {
        var c = cats[i];
        if (!c) continue;
        var title = String(c.category_title || c.title || c.name || "").trim();
        var slug = String(c.category_slug || c.slug || "").trim();
        if (!title || !slug) continue;
        var key = slug.toLowerCase();
        if (seen[key]) continue;
        seen[key] = true;
        genres.push({
            title: title,
            input: "/category/" + slug,
            script: "gen.js"
        });
    }
    return genres;
}

function fetchSimilarStories(storyId) {
    if (!storyId) return [];
    try {
        var res = fetch(BASE_URL + "/api/stories/similar?story_id=" + encodeURIComponent(String(storyId)) + "&limit=12", {
            method: "GET",
            headers: buildAuthHeaders()
        });
        if (!res || !res.ok) return [];
        var json = res.json();
        var rows = (json && Array.isArray(json.data)) ? json.data : [];
        var out = [];
        for (var i = 0; i < rows.length; i++) {
            var mapped = mapStoryItem(rows[i]);
            if (mapped && mapped.name && mapped.link) {
                out.push(mapped);
            }
        }
        return out;
    } catch (e) {
        return [];
    }
}

function execute(url) {
    var storyUrl = stripQueryAndHash(normalizeUrl(url)).replace(/\/+$/, "");
    if (!storyUrl) return Response.error("URL truyện không hợp lệ.");

    var res = null;
    try {
        res = fetch(storyUrl, {
            method: "GET",
            headers: buildAuthHeaders()
        });
    } catch (e) {
        return Response.error("Không thể tải trang chi tiết truyện (lỗi mạng).");
    }
    if (!res || !res.ok) {
        return Response.error("Không thể tải trang chi tiết truyện.");
    }

    var rawHtml = "";
    try {
        rawHtml = String(res.text() || "");
    } catch (e) {
    }
    var nextData = rawHtml ? extractNextData(rawHtml) : null;
    if (!nextData) {
        try {
            nextData = extractNextData(res.html());
        } catch (e2) {
        }
    }
    if (!nextData || !nextData.props || !nextData.props.pageProps) {
        return Response.error("Không đọc được dữ liệu truyện từ trang.");
    }

    var pageProps = nextData.props.pageProps;
    if (pageProps.storyExists === false) {
        return Response.error("Truyện không tồn tại trên hệ thống.");
    }

    var story = pageProps.story || {};
    var name = String(story.title || story.story_title || story.name || "").trim();
    if (!name) {
        return Response.error("Không tìm thấy tiêu đề truyện.");
    }

    var author = pickAuthor(story);
    var cover = resolveCover(story.image || story.story_image || "");
    var statusText = translateStatus(story.status || story.story_status || "");
    // Suy ongoing tu gia tri status tho (complete/completed/full) thay vi chuoi hien thi da dich,
    // de status la khong bi coi nham la dang ra.
    var rawStatus = String(story.status || story.story_status || "").trim().toLowerCase();
    var ongoing = !(rawStatus === "complete" || rawStatus === "completed" || rawStatus === "full");
    var chapCount = parseInt(story.count_chapter || story.count_chap || pageProps.count_chapter || 0, 10);
    var views = story.view || "";

    var uploader = story.pen_name_user || story.name_user || "";
    var followers = pageProps.countFollowers || 0;

    var detailLines = [
        "Tên truyện: " + name,
        "Tác giả: " + author
    ];
    if (uploader) {
        detailLines.push("Người đăng: " + uploader);
    }
    detailLines.push("Trạng thái: " + statusText);
    if (!isNaN(chapCount) && chapCount > 0) {
        detailLines.push("Số chương: " + chapCount);
    }
    if (views !== undefined && views !== null && String(views) !== "") {
        detailLines.push("Lượt xem: " + views);
    }
    if (followers) {
        detailLines.push("Theo dõi: " + followers);
    }
    if (story.updated_at) {
        detailLines.push("Cập nhật: " + story.updated_at);
    }

    var genres = buildGenres(pageProps, story);
    // Chip "Truyen cung the loai": input la story_id, gen.js co nhanh rieng goi
    // /api/stories/similar?story_id=... (truoc day input la JSON chuoi danh sach truyen ma
    // gen.js khong hieu nen bam chip se loi, va suggests con bi vut khoi ket qua tra ve).
    var suggests = [];
    if (story.id) {
        var similarList = fetchSimilarStories(story.id);
        if (similarList.length > 0) {
            suggests.push({
                title: "Truyện cùng thể loại",
                input: "/api/stories/similar?story_id=" + encodeURIComponent(String(story.id)),
                script: "gen.js"
            });
        }
    }

    var commentConfig = {
        title: "Bình luận",
        input: String(story.id || storyUrl),
        script: "comment.js"
    };

    var comments = [];
    if (story.id) {
        try {
            var cHeaders = buildAuthHeaders();
            cHeaders["Content-Type"] = "application/json";
            var cRes = fetch(BASE_URL + "/api/stories/get-comments", {
                method: "POST",
                headers: cHeaders,
                body: JSON.stringify({
                    story_id: parseInt(story.id, 10),
                    page: 1,
                    items_per_page: 10,
                    sort: "newest"
                })
            });
            if (cRes && cRes.ok) {
                var cJson = cRes.json();
                if (cJson && cJson.data && cJson.data.length > 0) {
                    for (var ci = 0; ci < cJson.data.length; ci++) {
                        var cItem = cJson.data[ci];
                        var cName = cItem.pen_name_user || cItem.name_user || "Thành viên";
                        var cAva = cItem.image_user || "";
                        if (cAva && cAva.indexOf("//") === 0) cAva = "https:" + cAva;
                        var cDesc = cItem.created_at || "";
                        if (cItem.chapter_title) cDesc += (cDesc ? " • " : "") + cItem.chapter_title;
                        if (cItem.like_count && cItem.like_count > 0) cDesc += (cDesc ? " • " : "") + cItem.like_count + " thích";
                        comments.push({
                            name: cName,
                            content: cItem.content || "",
                            avatar: cAva,
                            description: cDesc
                        });
                    }
                }
            }
        } catch (eComments) {}
    }

    return Response.success({
        name: name,
        url: storyUrl,
        type: "novel",
        format: "novel",
        cover: cover,
        author: author,
        description: cleanDescription(story.detail || story.description || ""),
        detail: detailLines.join("<br>"),
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comment: commentConfig,
        comments: comments
    });
}
