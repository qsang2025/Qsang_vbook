// detail.js — Zumi Novel: chi tiet truyen.
// Thu tu: JSON API cong khai /api/novels/<slug> truoc, roi RSC, ld+json, DOM.
// Khong can dang nhap cho API; neu trang chi tiet hien tuong dang nhap thi
// tra loi tieng Viet huong dan mo trinh duyet trong app de dang nhap.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function formatNumber(num) {
    if (!num) return '0';
    var n = parseInt(num, 10);
    if (isNaN(n)) return String(num);
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function execute(url) {
    var novelSlug = '';
    var m = String(url).match(/\/novel\/([^\/\?#]+)/);
    if (m && m[1]) {
        novelSlug = m[1];
    }

    if (!novelSlug) return Response.error('Thiếu mã định danh truyện');

    var name = '';
    var cover = '';
    var author = '';
    var description = '';
    var status = 'ongoing';
    var genresList = [];
    var views = 0;
    var wordCount = 0;
    var followers = 0;
    var bookmarks = 0;
    var nominations = 0;
    var rating = 0;
    var ratingCount = 0;
    var novelType = '';
    var uploaderName = '';
    var apiSuccess = false;

    // Buoc 1: JSON API cong khai — chinh xac nhat, du metadata nhat.
    try {
        var apiUrl = BASE_URL + '/api/novels/' + novelSlug;
        var res = fetchPage(apiUrl, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
            var json = JSON.parse(res.text());
            if (json && json.success && json.data) {
                var novelObj = json.data;
                apiSuccess = true;
                name = novelObj.title || novelObj.name || '';
                cover = novelObj.coverUrl || novelObj.cover || '';
                author = novelObj.author || '';
                description = novelObj.description || '';
                status = novelObj.status || 'ongoing';
                genresList = novelObj.genres || [];
                views = novelObj.views || 0;
                wordCount = novelObj.wordCount || 0;
                followers = novelObj.followers || 0;
                bookmarks = novelObj.bookmarks || 0;
                nominations = novelObj.nominations || 0;
                rating = novelObj.rating || 0;
                ratingCount = novelObj.ratingCount || 0;
                novelType = novelObj.novelType || '';
                if (novelObj.uploader && novelObj.uploader.username) {
                    uploaderName = novelObj.uploader.username;
                }
            }
        }
    } catch (e) {
        // bo qua, roi xuong parse HTML
    }

    if (!apiSuccess) {
        // Buoc 2: parse HTML (RSC -> ld+json -> DOM).
        var result = fetchPageWithBrowserFallback(url);
        if (!result.ok || !result.doc) {
            return Response.error('Không tải được thông tin chi tiết truyện. Lỗi kết nối mạng.');
        }

        var doc = result.doc;

        var hasRsc = false;
        try {
            var rscStr = extractRscStrings(doc);
            if (rscStr && rscStr.length > 0) {
                var novelObj = extractJsonObject(rscStr, '"initialNovel"');
                if (novelObj) {
                    hasRsc = true;
                    name = novelObj.title || novelObj.name || '';
                    cover = novelObj.coverUrl || novelObj.cover || novelObj.image || '';
                    author = novelObj.author || novelObj.authorName || '';
                    description = novelObj.description || novelObj.summary || '';
                    status = novelObj.status || 'ongoing';
                    genresList = novelObj.genres || novelObj.tags || [];
                }
            }
        } catch (e) {
            // bo qua
        }

        // Kiem tra tuong dang nhap (chi khi khong co du lieu RSC).
        if (!hasRsc) {
            var loginElements = doc.select('input[type="password"], button:contains(Đăng nhập), a:contains(Đăng nhập)').size();
            if (loginElements > 0) {
                return Response.error('YÊU CẦU ĐĂNG NHẬP: Vui lòng mở Trình duyệt vBook trong app, truy cập zuminovel.com và đăng nhập tài khoản của bạn để đọc truyện.');
            }
        }

        // ld+json (schema.org/Book).
        if (!name || !cover || !author) {
            var ldScript = safeFirst(doc.select('script[type="application/ld+json"]'));
            if (ldScript && ldScript.html()) {
                try {
                    var ldHtml = ldScript.html();
                    if (ldHtml && ldHtml.length > 0) {
                        var ld = JSON.parse(ldHtml);
                        if (ld.name && !name) name = ld.name;
                        if (ld.image && !cover) cover = ld.image;
                        if (ld.author && ld.author.name && !author) author = ld.author.name;
                        if (ld.description && !description) description = ld.description;
                        if (ld.genre && genresList.length === 0) {
                            if (ld.genre instanceof Array) {
                                genresList = ld.genre;
                            } else if (typeof ld.genre === 'string') {
                                genresList = [ld.genre];
                            }
                        }
                    }
                } catch (e) {}
            }
        }

        // DOM chuan.
        if (!name) {
            var h1El = safeFirst(doc.select('h1'));
            if (h1El) name = h1El.text().trim();
        }
        if (!name) {
            var ogTitleEl = safeFirst(doc.select('meta[property="og:title"]'));
            if (ogTitleEl) name = ogTitleEl.attr('content');
        }
        if (!cover) {
            var ogImageEl = safeFirst(doc.select('meta[property="og:image"]'));
            if (ogImageEl) cover = ogImageEl.attr('content');
        }
        if (!author) {
            var authorEl = safeFirst(doc.select('a[href*="/tac-gia/"], a[href*="/author/"], .author-link'));
            if (authorEl) author = authorEl.text().trim();
        }
        if (!author) author = 'Đang cập nhật';
        if (!description) {
            var descEl = safeFirst(doc.select('[itemprop="description"], .prose, .description, .summary'));
            if (descEl) description = descEl.html();
        }
    }

    // Don dep mo ta: bo style/class/bi_skin_checked/script/style.
    if (description && description.length > 0) {
        description = String(description)
            .replace(/&nbsp;/gi, ' ')
            .replace(/style\s*=\s*"[^"]*"/gi, '')
            .replace(/style\s*=\s*'[^']*'/gi, '')
            .replace(/class\s*=\s*"[^"]*"/gi, '')
            .replace(/class\s*=\s*'[^']*'/gi, '')
            .replace(/bis_skin_checked\s*=\s*"[^"]*"/gi, '')
            .replace(/bis_skin_checked\s*=\s*'[^']*'/gi, '')
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .trim();
    }

    var isOngoing = String(status).toLowerCase() === 'ongoing' || String(status).toLowerCase() === 'đang ra';
    var statusText = isOngoing ? 'Đang ra' : 'Hoàn thành';

    var detailParts = [];
    detailParts.push('<p><strong>Tác giả:</strong> ' + author + '</p>');
    detailParts.push('<p><strong>Trạng thái:</strong> ' + statusText + '</p>');
    if (views) detailParts.push('<p><strong>Lượt xem:</strong> ' + formatNumber(views) + '</p>');
    if (wordCount) detailParts.push('<p><strong>Số chữ:</strong> ' + formatNumber(wordCount) + '</p>');
    if (followers) detailParts.push('<p><strong>Theo dõi:</strong> ' + formatNumber(followers) + '</p>');
    if (bookmarks) detailParts.push('<p><strong>Đánh dấu:</strong> ' + formatNumber(bookmarks) + '</p>');
    if (nominations) detailParts.push('<p><strong>Đề cử:</strong> ' + formatNumber(nominations) + '</p>');
    if (rating) detailParts.push('<p><strong>Đánh giá:</strong> ' + rating + '★ (' + formatNumber(ratingCount) + ' lượt)</p>');
    if (novelType) detailParts.push('<p><strong>Phân loại:</strong> ' + (novelType === 'original' ? 'Truyện Sáng Tác' : 'Truyện Dịch') + '</p>');
    if (uploaderName) detailParts.push('<p><strong>Người đăng:</strong> ' + uploaderName + '</p>');

    var genres = [];
    if (genresList && genresList.length > 0) {
        genresList.forEach(function(g) {
            if (!g) return;
            genres.push({
                title: g,
                input: '/list?tag=' + encodeURIComponent(g),
                script: 'gen.js'
            });
        });
    }

    var comment = null;
    if (novelSlug) {
        comment = {
            title: 'Bình luận',
            input: novelSlug,
            script: 'comment.js'
        };
    }

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author,
        description: description,
        detail: detailParts.join('<br>'),
        ongoing: isOngoing,
        genres: genres,
        comment: comment
    });
}
