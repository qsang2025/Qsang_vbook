// detail.js — Chi tiet truyen: /<slug>.html.
// Trang thai doc tu dt "Trang thai" (vd. "Da du bo" = Hoan thanh,
// "Dang phat hanh" = Dang ra). The loai doc tu a.cate-item[itemprop=genre].
// Muc luc day du ngay tren trang chi tiet (ke ca 1.353 chuong).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function buildSuggests(authorUrl, detailUrl) {
    var suggests = [];
    var seen = {};

    function pushSuggest(title, input) {
        input = normalizeUrl(input);
        if (!input || seen[input]) return;
        seen[input] = true;
        suggests.push({
            title: title,
            input: input,
            script: 'gen.js'
        });
    }

    if (authorUrl) {
        pushSuggest('Cùng tác giả/nhóm dịch', authorUrl);
    }

    return suggests;
}

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchTruyenmoPage(url);
    if (r.error) return Response.error(r.error);

    var rawHtml = r.rawHtml;
    // Giai ma span chong copy (:before) tren CHUOI HTML truoc khi parse —
    // runtime vBook khong co Element.before() nen khong giai ma tren DOM
    // duoc (xem helper.js).
    var doc = Html.parse(decodeObfuscatedHtml(rawHtml, rawHtml));
    if (!doc) return Response.error('Không thể parse HTML');

    // --- Ten truyen ---
    var name = '';
    var nameEl = safeFirst(doc.select('h2.card-title[itemprop="name"], h1.story-title'));
    if (nameEl) name = cleanText(nameEl.text());
    if (!name) {
        var ogTitle = safeFirst(doc.select('meta[property="og:title"]'));
        if (ogTitle) name = cleanText(ogTitle.attr('content') || '');
    }

    // --- Anh bia ---
    var cover = '';
    var ogImg = safeFirst(doc.select('meta[property="og:image"]'));
    if (ogImg) cover = ogImg.attr('content') || '';
    if (!cover) {
        var coverEl = safeFirst(doc.select('.col-md-3 img.img-fluid, .card img, .book img'));
        if (coverEl) cover = coverEl.attr('data-src') || coverEl.attr('src') || '';
    }
    cover = normalizeUrl(cover);

    // --- Mo ta ---
    var description = '';
    var descEl = safeFirst(doc.select('.story-description .inner, .story-description [itemprop="description"]'));
    if (descEl) {
        description = descEl.html();
    } else {
        var descFallback = safeFirst(doc.select('.story-description'));
        if (descFallback) description = descFallback.html();
    }

    // --- Tac gia (uu tien link trong dong "Tac gia" cua bang thong tin) ---
    var author = 'Đang cập nhật';
    var authorUrl = '';
    var authorEl = safeFirst(doc.select('dt:contains(Tác giả) + dd a'));
    if (!authorEl) authorEl = safeFirst(doc.select('a[href*="/tac-gia/"]'));
    if (!authorEl) authorEl = safeFirst(doc.select('a[href*="/nhom-dich/"]'));
    if (authorEl) {
        author = cleanText(authorEl.text()) || author;
        authorUrl = normalizeUrl(authorEl.attr('href'));
    }

    // --- Trang thai (dt "Trang thai": "Da du bo" / "Dang phat hanh") ---
    var status = 'Đang ra';
    var statusEl = safeFirst(doc.select('dt:contains(Trạng thái) + dd'));
    if (statusEl) status = cleanText(statusEl.text());

    var ongoing = true;
    var statusText = String(status || '').toLowerCase();
    if (statusText.indexOf('hoàn') >= 0 || statusText.indexOf('full') >= 0 || statusText.indexOf('đủ bộ') >= 0) {
        ongoing = false;
        status = 'Hoàn thành';
    }

    // --- The loai ---
    var genres = [];
    var genreTexts = [];
    var genreLinks = doc.select('a.cate-item[itemprop="genre"], a[itemprop="genre"]');
    for (var gi = 0; gi < genreLinks.size(); gi++) {
        var ga = genreLinks.get(gi);
        var gtitle = cleanText(ga.text());
        var ghref = normalizeUrl(ga.attr('href'));
        if (!gtitle || !ghref) continue;
        genres.push({ title: gtitle, input: ghref, script: 'gen.js' });
        genreTexts.push(gtitle);
    }

    // --- Story ID (cho comment) ---
    var storyId = '';
    var storyIdEl = safeFirst(doc.select('#story_id, #report_story_id'));
    if (storyIdEl) {
        storyId = cleanText(String(storyIdEl.attr('value') || storyIdEl.text() || ''));
    }
    if (!storyId) {
        var commentBtn = safeFirst(doc.select('#loadCommentBtn, a[onclick*="loadComments("]'));
        if (commentBtn) {
            var onclick = commentBtn.attr('onclick') || '';
            var match = onclick.match(/loadComments\((\d+)\)/);
            if (match) storyId = match[1];
        }
    }

    // --- Detail block ---
    var detail = '';
    detail += '<p><strong>Tác giả:</strong> ' + author + '</p>';
    detail += '<p><strong>Trạng thái:</strong> ' + status + '</p>';

    var chapterCount = 0;
    var chapListEls = doc.select('#listChapters .list-chapters .item');
    if (chapListEls) chapterCount = chapListEls.size();
    if (!chapterCount) {
        var totalChapEl = safeFirst(doc.select('#totalChapter, .total-chapter, .story-info .chapters'));
        if (totalChapEl) chapterCount = parseInt(cleanText(totalChapEl.text()).replace(/\D+/g, ''), 10) || 0;
    }
    if (chapterCount) {
        detail += '<p><strong>Số chương:</strong> ' + chapterCount + '</p>';
    }
    if (genreTexts.length) {
        detail += '<p><strong>Thể loại:</strong> ' + genreTexts.join(', ') + '</p>';
    }

    // --- Suggests & Comments ---
    var suggests = buildSuggests(authorUrl, url);
    var comments = [];
    if (storyId) {
        var countEl = safeFirst(doc.select('#loadCommentBtn .count-items, .count-items'));
        var commentCountText = countEl ? cleanText(countEl.text()) : '';
        var commentTitle = 'Bình luận';
        if (commentCountText) commentTitle += ' (' + commentCountText + ')';
        comments.push({
            title: commentTitle,
            input: JSON.stringify({ storyId: storyId, page: 1 }),
            script: 'comment.js'
        });
    }

    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detail,
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: comments,
        host: BASE_URL
    });
}
