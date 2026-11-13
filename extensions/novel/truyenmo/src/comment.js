// comment.js — Binh luan: GET /ajax/showComment?story_id=<id>
// &btnComment=1&num=1&page=N&type=comment.
// LUU Y: API bo qua tham so page (page 2 tra dung 9 binh luan nhu page 1,
// kiem chung tu VM 2026-11-13) — nen KHONG bao gio tra next token.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(input, page) {
    var parsed = parseCommentInput(input, page);
    var storyId = parsed.storyId;
    var currentPage = String(parsed.page || '1');

    if (!storyId) return Response.success([], '');

    var apiUrl = BASE_URL + '/ajax/showComment?story_id=' + encodeURIComponent(storyId) + '&btnComment=1&num=1&page=' + encodeURIComponent(currentPage) + '&type=comment';
    var r = null;
    try {
        r = pacedFetch(apiUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
    } catch (e) {
        return Response.error('Không tải được bình luận (lỗi mạng).');
    }

    if (!r) return Response.error('Không tải được bình luận.');
    if (r.error === 'cooldown') {
        return Response.error(rateLimitErrorMessage('Truyện Mơ', pacedHostOf(apiUrl), r.cooldownRemainingMs));
    }
    if (!r.ok) return Response.error('Không tải được bình luận (HTTP ' + (r.status || 0) + ').');

    var rawHtml = '';
    try {
        rawHtml = r.res.text();
    } catch (e2) {
        return Response.success([], '');
    }
    if (!rawHtml) return Response.success([], '');

    var doc = Html.parse(rawHtml);
    if (!doc) return Response.success([], '');

    var comments = [];
    var seen = {};

    var items = doc.select('ul > li');
    for (var i = 0; i < items.size(); i++) {
        var item = items.get(i);
        var contentEl = safeFirst(item.select('p'));
        var metaEl = null;
        var ps = item.select('p');
        if (ps && ps.size() > 0) metaEl = ps.get(ps.size() - 1);
        if (!contentEl || !metaEl) continue;

        var content = cleanText(contentEl.text());
        if (!content) continue;

        var authorEl = safeFirst(metaEl.select('a'));
        var author = authorEl ? cleanText(authorEl.text()) : '';
        if (!author) author = 'Ẩn danh';

        var timeText = cleanText(metaEl.text().replace(author, '').replace('Trả lời', '').replace('·', ''));
        var key = author + '|' + content + '|' + timeText;
        if (seen[key]) continue;
        seen[key] = true;

        comments.push({
            name: author,
            content: content,
            avatar: '',
            description: timeText
        });
    }

    // API bo qua page (page 2 = page 1) nen khong co trang ke.
    return Response.success(comments, '');
}

function parseCommentInput(input, page) {
    var out = { storyId: '', page: 1 };

    function readValue(value) {
        if (!value) return null;
        var str = String(value);
        if (str.charAt(0) === '{') {
            try { return JSON.parse(str); } catch (e) { return null; }
        }
        return str;
    }

    var a = readValue(input);
    var b = readValue(page);

    if (typeof a === 'string') {
        out.storyId = a.replace(/\D+/g, '');
    } else if (a) {
        out.storyId = String(a.storyId || a.story_id || a.id || '').replace(/\D+/g, '');
        out.page = parseInt(String(a.page || a.currentPage || a.current_page || '1'), 10) || 1;
    }

    if (typeof b === 'string') {
        out.page = parseInt(b, 10) || out.page;
    } else if (b) {
        var sid = String(b.storyId || b.story_id || b.id || '').replace(/\D+/g, '');
        if (sid) out.storyId = sid;
        out.page = parseInt(String(b.page || b.currentPage || b.current_page || out.page), 10) || out.page;
    }

    if (out.page < 1) out.page = 1;
    return out;
}
