// chap.js — Zumi Novel: noi dung chuong.
// Uu tien 1: RSC "initialChapter".content (giai tham chieu stream $id ->
// chunk id:T...). Uu tien 2: DOM (.read-content, #chapter-content,
// #read-content, .prose, .chapter-content, article, [contenteditable],
// .content). Chuong khong co noi dung (VIP/khoa/dang nhap) tra loi tieng
// Viet ro rang — khong mo khoa, khong gia lap dang nhap.
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    var target = String(url || '');
    if (target.indexOf('http') !== 0) {
        if (target.charAt(0) !== '/') target = '/' + target;
        target = BASE_URL + target;
    }

    var result = fetchPageWithBrowserFallback(target);
    if (!result.ok || !result.doc) {
        return Response.error('Không tải được nội dung chương. Lỗi kết nối mạng.');
    }

    var doc = result.doc;
    var hasContent = false;

    // Uu tien 1: RSC stream cua Next.js App Router.
    try {
        var rsc = extractRscStrings(doc);
        if (rsc && rsc.length > 0) {
            var initialChapter = extractJsonObject(rsc, '"initialChapter"');
            var rawContent = null;

            if (initialChapter && initialChapter.content) {
                rawContent = initialChapter.content;

                // Giai tham chieu stream: "$28" -> chunk "28:T5150,HTML..."
                if (String(rawContent).indexOf('$') === 0) {
                    var refId = String(rawContent).substring(1);
                    var refKey = refId + ':T';
                    var refIdx = rsc.indexOf(refKey);

                    if (refIdx !== -1) {
                        var commaIdx = rsc.indexOf(',', refIdx);
                        if (commaIdx !== -1) {
                            var nextChunkRegex = /[\r\n]*([0-9a-fA-F]+):([TIEM\[\{])/g;
                            nextChunkRegex.lastIndex = commaIdx + 1;
                            var nextMatch = nextChunkRegex.exec(rsc);

                            var endIdx = rsc.length;
                            if (nextMatch) {
                                endIdx = nextMatch.index;
                            }

                            rawContent = rsc.substring(commaIdx + 1, endIdx);
                        }
                    }
                }
            }

            // Fallback: chunk :T lon nhat trong stream chua HTML doan van.
            if (!rawContent || String(rawContent).indexOf('$') === 0) {
                var pos = 0;
                var bestChunk = null;
                var maxLen = 0;
                while (pos < rsc.length) {
                    var tIdx = rsc.indexOf(':T', pos);
                    if (tIdx === -1) break;

                    var commaIdx = rsc.indexOf(',', tIdx + 2);
                    if (commaIdx !== -1 && commaIdx < tIdx + 15) {
                        var lenStr = rsc.substring(tIdx + 2, commaIdx);
                        var length = parseInt(lenStr, 16);
                        if (!isNaN(length) && length > 200) {
                            var nextChunkRegex = /[\r\n]*([0-9a-fA-F]+):([TIEM\[\{])/g;
                            nextChunkRegex.lastIndex = commaIdx + 1;
                            var nextMatch = nextChunkRegex.exec(rsc);

                            var endIdx = rsc.length;
                            if (nextMatch) {
                                endIdx = nextMatch.index;
                            }

                            var chunkContent = rsc.substring(commaIdx + 1, endIdx);
                            if (chunkContent && (
                                chunkContent.indexOf('<p>') !== -1 || chunkContent.indexOf('</p>') !== -1 ||
                                chunkContent.indexOf('<p ') !== -1 || chunkContent.indexOf('\\u003cp') !== -1 ||
                                chunkContent.indexOf('<br') !== -1 || chunkContent.indexOf('\\u003cbr') !== -1
                            )) {
                                if (chunkContent.length > maxLen) {
                                    maxLen = chunkContent.length;
                                    bestChunk = chunkContent;
                                }
                            }
                        }
                    }
                    pos = tIdx + 2;
                }
                if (bestChunk && bestChunk.length > 20) {
                    rawContent = bestChunk;
                }
            }

            if (rawContent && String(rawContent).indexOf('$') !== 0 && String(rawContent).length > 20) {
                var cleaned = cleanHtml(String(rawContent));
                if (cleaned && cleaned.length > 20) {
                    hasContent = true;
                    return Response.success(cleaned);
                }
            }
        }
    } catch (e) {
        // bo qua, roi xuong DOM fallback
    }

    // Uu tien 2: DOM.
    if (!hasContent) {
        var selectors = [
            '.read-content',
            '#chapter-content',
            '#read-content',
            '.prose',
            '.chapter-content',
            'article',
            '[contenteditable]',
            '.content'
        ];

        for (var si = 0; si < selectors.length; si++) {
            if (hasContent) break;
            var contentEl = safeFirst(doc.select(selectors[si]));
            if (contentEl) {
                var htmlContent = contentEl.html();
                if (htmlContent && htmlContent.length >= 100) {
                    var cleaned = cleanHtml(htmlContent);
                    if (cleaned && cleaned.length > 20) {
                        hasContent = true;
                        return Response.success(cleaned);
                    }
                }
            }
        }
    }

    // Kiem tra tuong dang nhap.
    if (!hasContent) {
        var loginElements = doc.select('input[type="password"], button:contains(Đăng nhập), a:contains(Đăng nhập)').size();
        if (loginElements > 0) {
            return Response.error('YÊU CẦU ĐĂNG NHẬP: Vui lòng mở Trình duyệt vBook trong app, truy cập zuminovel.com và đăng nhập tài khoản của bạn để đọc truyện.');
        }
    }

    return Response.error('Không lấy được nội dung chương. VIP hoặc yêu cầu đăng nhập tài khoản.');
}

// Don dep HTML chuong: bo nut/script/style/iframe, doi anh tuong doi
// thanh tuyet doi, xoa ky tu thua.
function cleanHtml(htm) {
    if (!htm) return '';

    try {
        var doc = Html.parse(htm);

        doc.select('button').remove();
        doc.select('[title*="bình luận"]').remove();

        doc.select('img').forEach(function(img) {
            var src = img.attr('src') || img.attr('data-src') || img.attr('data-srcset') || img.attr('srcset') || img.attr('data-original') || '';
            src = src.trim();
            if (src) {
                if (src.indexOf(' ') !== -1) {
                    src = src.split(' ')[0];
                }
                if (src.indexOf('http') !== 0) {
                    if (src.charAt(0) === '/') {
                        src = BASE_URL + src;
                    } else {
                        src = BASE_URL + '/' + src;
                    }
                }
                img.attr('src', src);
                img.removeAttr('data-src');
                img.removeAttr('srcset');
                img.removeAttr('data-srcset');
            }
        });

        htm = doc.select('body').html() || htm;
    } catch (err) {
        // bo qua loi parse khi don dep
    }

    return htm
        .replace(/·/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/<p>\s*(?:&nbsp;)?\s*<\/p>/gi, '')
        .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<br>')
        .replace(/<button[\s\S]*?<\/button>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '')
        .trim();
}
