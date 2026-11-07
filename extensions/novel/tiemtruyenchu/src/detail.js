// detail.js — Thong tin chi tiet truyen Tiem Truyen Chu
load('config.js');

function execute(url) {
    var storyId = extractStoryId(url);
    if (storyId) {
        var apiUrl = BASE_URL + "/api/v1/stories/" + storyId;
        var json = fetchJson(apiUrl);
        var story = null;
        if (json) {
            if (json.story && json.story.id) {
                story = json.story;
            } else if (json.data && json.data.id) {
                story = json.data;
            } else if (json.id && json.title) {
                story = json;
            }
        }
        if (story) {
            var name = story.title || ("Truyện #" + story.id);
            var author = story.author || "Không rõ";
            var cover = story.cover_url || story.poster || "";
            if (cover && cover.indexOf("http") !== 0) {
                cover = BASE_URL + (cover.charAt(0) === "/" ? "" : "/") + cover;
            }

            var statusRaw = String(story.status || "").toLowerCase();
            var ongoing = !(statusRaw.indexOf("full") !== -1 || statusRaw.indexOf("hoan") !== -1 || statusRaw.indexOf("hoàn") !== -1 || statusRaw.indexOf("completed") !== -1);
            var statusText = ongoing ? "Đang ra" : "Hoàn thành";

            var genres = [];
            var catNames = [];
            if (story.category) {
                catNames.push(story.category);
                genres.push({
                    title: story.category,
                    input: "stories?cat=" + encodeURIComponent(String(story.category).toLowerCase()),
                    script: "gen.js"
                });
            }
            if (story.sub_categories && story.sub_categories.length) {
                for (var i = 0; i < story.sub_categories.length; i++) {
                    var sub = story.sub_categories[i];
                    if (sub) {
                        catNames.push(sub);
                    }
                }
            }
            var categoryText = catNames.length ? catNames.join(", ") : "Đang cập nhật";
            var totalChaps = story.total_chapters ? String(story.total_chapters) : "0";

            var detailText = "Tên truyện: " + name
                + "<br>Tác giả: " + author
                + "<br>Thể loại: " + categoryText
                + "<br>Trạng thái: " + statusText
                + "<br>Số chương: " + totalChaps;

            var desc = cleanText(story.description || "").replace(/\n/g, "<br>");
            if (!desc) desc = "Chưa có giới thiệu.";

            return Response.success({
                name: name,
                cover: cover,
                author: author,
                description: desc,
                detail: detailText,
                ongoing: ongoing,
                genres: genres,
                host: BASE_URL
            });
        }
    }

    // Fallback HTML
    var targetUrl = normalizeUrl(url);
    var res = fetch(targetUrl, { headers: buildHeaders() });
    if (!res || !res.ok) {
        return Response.error("Không thể tải thông tin truyện từ Tiệm Truyện Chữ.");
    }
    var doc = res.html();
    var titleEl = doc.select(".story-header h2 span.align-middle, h1.story-title, h1, h2").first();
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

    return Response.success({
        name: htmlName,
        cover: htmlCover,
        author: htmlAuthor,
        description: htmlDesc,
        detail: "Tên truyện: " + htmlName + "<br>Tác giả: " + htmlAuthor,
        ongoing: true,
        host: BASE_URL
    });
}
