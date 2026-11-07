// detail.js — Lay thong tin chi tiet truyen tu __NEXT_DATA__ tren La Ca Truyen
load('config.js');

function cleanDescription(html) {
    if (!html) return "Đang cập nhật mô tả.";
    var s = String(html)
        .replace(/<\/?strong\b[^>]*>/gi, "")
        .replace(/<\/?em\b[^>]*>/gi, "")
        .replace(/<p\b[^>]*>/gi, "<br>")
        .replace(/<\/p>/gi, "<br>")
        .replace(/<br\s*\/?>/gi, "<br>")
        .replace(/<[^>]+>/g, " ")
        .replace(/(?:<br>\s*){3,}/gi, "<br><br>")
        .replace(/^(?:<br>\s*)+/i, "")
        .replace(/(?:<br>\s*)+$/i, "")
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

    var res = fetch(storyUrl, {
        method: "GET",
        headers: buildAuthHeaders()
    });
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
    var ongoing = statusText !== "Hoàn thành";
    var chapCount = parseInt(story.count_chapter || story.count_chap || pageProps.count_chapter || 0, 10);
    var views = story.view || "";

    var detailLines = [
        "Tên truyện: " + name,
        "Tác giả: " + author,
        "Trạng thái: " + statusText
    ];
    if (!isNaN(chapCount) && chapCount > 0) {
        detailLines.push("Số chương: " + chapCount);
    }
    if (views !== undefined && views !== null && String(views) !== "") {
        detailLines.push("Lượt xem: " + views);
    }
    if (story.updated_at) {
        detailLines.push("Cập nhật: " + story.updated_at);
    }

    var genres = buildGenres(pageProps, story);
    var suggests = [];
    var similarList = fetchSimilarStories(story.id);
    if (similarList.length > 0) {
        suggests.push({
            title: "Truyện cùng thể loại",
            input: JSON.stringify(similarList),
            script: "gen.js"
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: cleanDescription(story.detail || story.description || ""),
        detail: detailLines.join("<br>"),
        ongoing: ongoing,
        genres: genres
    });
}
