// comment.js — Zumi Novel: binh luan cua truyen (tu detail.js).
// Thu tu: JSON API cong khai /api/novels/<id>/comments truoc, roi RSC,
// roi DOM (#comments). Binh luan doc cong khai, khong can dang nhap.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function formatTimestamp(ts) {
    if (!ts) return '';
    try {
        var parts = ts.split('T');
        if (parts.length === 2) {
            var date = parts[0];
            var time = parts[1].split('.')[0];
            return date + ' ' + time;
        }
    } catch(e) {}
    return ts;
}

function cleanCommentContent(str) {
    if (!str) return '';
    return str
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .trim();
}

function execute(input, next) {
    var slug = String(input || '').trim();
    if (!slug) return Response.error('Thiếu mã định danh truyện');

    var comments = [];
    var nextPage = null;
    var apiSuccess = false;

    // Buoc 1: API cong khai (can _id cua truyen truoc).
    try {
        var novelId = '';
        var apiNovelUrl = BASE_URL + '/api/novels/' + slug;
        var resNovel = fetchPage(apiNovelUrl, { headers: { 'Accept': 'application/json' } });
        if (resNovel.ok) {
            var jsonNovel = JSON.parse(resNovel.text());
            if (jsonNovel && jsonNovel.success && jsonNovel.data && jsonNovel.data._id) {
                novelId = jsonNovel.data._id;
            }
        }

        if (novelId) {
            var pageNum = next ? next : '1';
            var apiCommentsUrl = BASE_URL + '/api/novels/' + novelId + '/comments?page=' + pageNum;
            var resComments = fetchPage(apiCommentsUrl, { headers: { 'Accept': 'application/json' } });
            if (resComments.ok) {
                var jsonComments = JSON.parse(resComments.text());
                if (jsonComments && jsonComments.success && Array.isArray(jsonComments.data)) {
                    apiSuccess = true;
                    jsonComments.data.forEach(function(c) {
                        comments.push({
                            name: c.username || 'Thành viên',
                            content: cleanCommentContent(c.content || ''),
                            description: formatTimestamp(c.timestamp)
                        });

                        if (c.replies && Array.isArray(c.replies)) {
                            c.replies.forEach(function(rp) {
                                comments.push({
                                    name: '  ↳ ' + (rp.username || 'Thành viên'),
                                    content: cleanCommentContent(rp.content || ''),
                                    description: formatTimestamp(rp.timestamp)
                                });
                            });
                        }
                    });

                    if (jsonComments.data.length > 0) {
                        nextPage = String(parseInt(pageNum, 10) + 1);
                    }
                }
            }
        }
    } catch (e) {
        // bo qua, roi xuong fallback HTML
    }

    if (apiSuccess) {
        return Response.success(comments, nextPage);
    }

    // Buoc 2: HTML fallback — trang /novel/<slug>/reviews.
    var pagePath = '/novel/' + slug + '/reviews';
    if (next) {
        pagePath += '?page=' + next;
    }

    var target = pagePath;
    if (target.indexOf('http') !== 0) {
        if (target.charAt(0) !== '/') target = '/' + target;
        target = BASE_URL + target;
    }

    var result = fetchPageWithBrowserFallback(target);
    if (!result.ok || !result.doc) {
        return Response.error('Không tải được bình luận/đánh giá. Vui lòng kiểm tra đăng nhập.');
    }

    var doc = result.doc;

    var bodyHtml = doc.html() || '';
    if (bodyHtml.indexOf('Chưa có bình luận') >= 0 || bodyHtml.indexOf('Chưa có đánh giá') >= 0) {
        return Response.success([], null);
    }

    // RSC truoc.
    var rscComments = null;
    try {
        var rscStr = extractRscStrings(doc);
        if (rscStr && rscStr.length > 0) {
            rscComments = extractJsonObject(rscStr, '"comments"');
            if (!rscComments) rscComments = extractJsonObject(rscStr, '"initialComments"');
        }
    } catch (e) {
        // bo qua loi RSC
    }

    if (rscComments && (rscComments instanceof Array || typeof rscComments.length === 'number')) {
        rscComments.forEach(function(c) {
            if (!c) return;
            var authorName = 'Thành viên';
            if (c.user && (c.user.name || c.user.username)) {
                authorName = c.user.name || c.user.username;
            } else if (c.author) {
                authorName = c.author;
            } else if (c.name) {
                authorName = c.name;
            } else if (c.userName) {
                authorName = c.userName;
            }

            comments.push({
                name: authorName,
                content: cleanCommentContent(c.content || c.text || c.message || ''),
                description: c.time || c.date || c.createdAt || ''
            });
        });
    }

    // DOM fallback.
    if (comments.length === 0) {
        var items = doc.select('#comments .comment-item, #comments .comment, #comments [role="article"], #comments .flex.items-start');

        if (items.size() === 0) {
            items = doc.select('#comments');
            if (items.size() > 0) {
                items = safeFirst(items).select('div');
            } else {
                items = doc.select('[class*="comment"]');
            }
        }

        for (var i = 0; i < items.size(); i++) {
            var e = items.get(i);
            try {
                var author = '';
                var authorEl = safeFirst(e.select('.username, .name, strong, a[href*="/user/"], .font-bold, [class*="author"]'));
                if (authorEl) {
                    author = authorEl.text().trim();
                }

                var content = '';
                var elContent = safeFirst(e.select('.comment-content, .content, p, .text-sm, [class*="content"]'));
                if (elContent) {
                    content = elContent.text().trim();
                }
                if (!content) {
                    content = e.text().trim();
                }

                if (content && author && content.indexOf(author) === 0) {
                    content = content.substring(author.length).trim();
                }

                var meta = '';
                var metaEl = safeFirst(e.select('.time, .date, .meta, span, [class*="time"], [class*="date"]'));
                if (metaEl) {
                    meta = metaEl.text().trim();
                }

                if (content && content.length > 0) {
                    comments.push({
                        name: author || 'Thành viên',
                        content: cleanCommentContent(content),
                        description: meta || ''
                    });
                }
            } catch (err) {
                // bo qua item loi
            }
        }
    }

    // Phan trang.
    var pager = safeFirst(doc.select('a.next, .pagination a.next, .pager a.next, a[rel="next"]'));
    if (pager && pager.attr('href')) {
        var dp = pager.attr('data-page') || pager.attr('data-page-number') || pager.attr('href') || '';
        var m = String(dp).match(/page=(\d+)/);
        if (m) {
            nextPage = m[1];
        } else {
            var mNum = String(dp).match(/(\d+)/);
            if (mNum) nextPage = mNum[1];
        }
    }

    return Response.success(comments, nextPage);
}
