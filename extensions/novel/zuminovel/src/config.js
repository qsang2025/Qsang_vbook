// config.js — Zumi Novel (zuminovel.com), Next.js App Router.
// Port tu kychi v1 (xem work/ext-review/zipcheck5/zuminovel/src).
// Luong du lieu chinh: JSON API cong khai /api/novels (+ RSC fallback + DOM).
// Site dung Cloudflare: KHONG gan co dinh User-Agent (clearance cf_clearance
// cua nguoi dung gan voi UA cua trinh duyet trong app) — dung UA mac dinh
// cua runtime; khi fetch truc tiep khong qua thi dung trinh duyet headless
// cua app (fetchPageWithBrowserFallback).
// Khong co co che mo khoa VIP, khong gia lap dang nhap: chuong VIP (neu co)
// chi duoc danh dau [VIP] o muc luc; chuong khong doc duoc tra loi tieng Viet
// ro rang o chap.js. Cookie (neu co) chi doc tu kho cookie cua app hoac tu
// muc COOKIE do chinh nguoi dung dan vao.

var BASE_URL = 'https://zuminovel.com';
try {
    if (typeof DOMAIN !== 'undefined' && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
    // ignore
}

// Cookie phien cua app (gom ca cf_clearance neu nguoi dung da qua challenge
// trong trinh duyet cua app) hoac COOKIE do nguoi dung tu dan vao cai dat.
function getAuthCookie() {
    try {
        var autoCookie = localCookie.getCookie();
        if (autoCookie && typeof autoCookie === 'string' && autoCookie.trim().length > 0) {
            return autoCookie;
        }
    } catch (e) {
        // localCookie khong co san
    }
    try {
        if (typeof CONFIG_COOKIE !== 'undefined' && CONFIG_COOKIE) {
            return CONFIG_COOKIE;
        }
    } catch (e) {
        // CONFIG_COOKIE chua dinh nghia
    }
    return '';
}

// Fetch co pacing (1 request/lan, jitter, retry 429/405/503 toi da 3 lan,
// cooldown 60 phut khi bi chan) — xem rate-limit.js.
// Tra ve response tho cua runtime khi thanh cong; khi loi tra ve shim co
// cung interface toi thieu (.ok/.status/.text()/.html()) de caller khong crash.
function fetchPage(url, options) {
    if (!options) options = {};
    var headers = {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8'
    };
    var cookie = getAuthCookie();
    if (cookie) {
        headers['Cookie'] = cookie;
    }
    if (options.headers) {
        for (var key in options.headers) {
            headers[key] = options.headers[key];
        }
    }
    var pf = pacedFetch(url, {
        headers: headers,
        method: options.method || 'GET',
        body: options.body
    });
    if (pf && pf.ok && pf.res) {
        return pf.res;
    }
    return {
        ok: false,
        status: (pf && pf.status) || 0,
        text: function() { return ''; },
        html: function() { return null; }
    };
}

// Fetch trang: thu fetch truc tiep truoc; neu HTML chua co RSC (__next_f)
// hoac co dau hieu trang dang nhap thi dung trinh duyet headless cua app
// (chia se session/cookie da dang nhap + cf_clearance).
function fetchPageWithBrowserFallback(url) {
    var response = null;
    try {
        response = fetchPage(url);
        if (response.ok) {
            var doc = response.html();
            var html = (doc && doc.html()) || '';
            if (html.indexOf('__next_f') !== -1 && html.indexOf('đăng nhập') === -1 && html.indexOf('Đăng nhập') === -1) {
                return { ok: true, doc: doc, viaBrowser: false };
            }
        }
    } catch (e) {
        // bo qua loi fetch, roi xuong browser fallback
    }
    try {
        var browser = Engine.newBrowser();
        var bdoc = browser.launch(url, 15000);
        if (bdoc) {
            var bhtml = bdoc.html();
            browser.close();
            return { ok: true, doc: Html.parse(bhtml), viaBrowser: true };
        }
        browser.close();
    } catch (err) {
        // bo qua loi browser
    }
    if (response) {
        return { ok: response.ok, doc: response.html(), viaBrowser: false };
    }
    return { ok: false, doc: null, viaBrowser: false };
}

// Giai ma luong RSC (React Server Component) cua Next.js: noi cac chuoi
// trong script __next_f.push([...]) lai thanh mot chuoi duy nhat.
function extractRscStrings(doc) {
    if (!doc) return '';
    var rsc = '';
    doc.select('script').forEach(function(script) {
        var js = script.html() || '';
        if (js.indexOf('__next_f') === -1) return;
        var idx = 0;
        while (idx < js.length) {
            var pushIdx = js.indexOf('push([', idx);
            if (pushIdx === -1) break;
            var strStart = js.indexOf('"', pushIdx);
            var isDouble = true;
            var singleStart = js.indexOf("'", pushIdx);
            if (singleStart !== -1 && (strStart === -1 || singleStart < strStart)) {
                strStart = singleStart;
                isDouble = false;
            }
            if (strStart !== -1 && strStart < pushIdx + 30) {
                var quoteChar = isDouble ? '"' : "'";
                var startPos = strStart + 1;
                var endPos = startPos;
                var escape = false;
                while (endPos < js.length) {
                    var char = js.charAt(endPos);
                    if (escape) {
                        escape = false;
                        endPos++;
                    } else if (char === '\\') {
                        escape = true;
                        endPos++;
                    } else if (char === quoteChar) {
                        break;
                    } else {
                        endPos++;
                    }
                }
                var rawStr = js.substring(startPos, endPos);
                try {
                    var decoded = '';
                    if (isDouble) {
                        decoded = JSON.parse('"' + rawStr + '"');
                    } else {
                        var prepared = rawStr.replace(/\\'/g, "'").replace(/"/g, '\\"');
                        decoded = JSON.parse('"' + prepared + '"');
                    }
                    rsc += decoded;
                } catch (e) {
                    var val = rawStr
                        .replace(/\\"/g, '"')
                        .replace(/\\'/g, "'")
                        .replace(/\\\\/g, '\\')
                        .replace(/\\n/g, '\n')
                        .replace(/\\r/g, '\r')
                        .replace(/\\t/g, '\t');
                    val = val.replace(/\\u([0-9a-fA-F]{4})/g, function(match, grp) {
                        return String.fromCharCode(parseInt(grp, 16));
                    });
                    rsc += val;
                }
                idx = endPos + 1;
            } else {
                idx = pushIdx + 6;
            }
        }
    });
    return rsc;
}

// Parse an toan mot object JSON chua khoa cho truoc tu luong RSC.
function extractJsonObject(str, key) {
    if (!str) return null;
    var index = str.indexOf(key);
    if (index === -1) return null;
    var startPos = str.indexOf('{', index + key.length);
    if (startPos === -1) return null;
    var braceCount = 0;
    var inString = false;
    var escape = false;
    for (var i = startPos; i < str.length; i++) {
        var char = str.charAt(i);
        if (escape) {
            escape = false;
            continue;
        }
        if (char === '\\') {
            escape = true;
            continue;
        }
        if (char === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    var jsonStr = str.substring(startPos, i + 1);
                    try {
                        return JSON.parse(jsonStr);
                    } catch (e) {
                        // bo qua, tiep tuc tim
                    }
                }
            }
        }
    }
    return null;
}

function normalizeLink(href) {
    if (!href) return '';
    if (String(href).indexOf('http') === 0) return String(href);
    if (String(href).charAt(0) === '/') return BASE_URL + href;
    return BASE_URL + '/' + href;
}

// Chuyen ten volume/arc tieng Viet thanh slug ASCII cho URL chuong.
function slugify(text) {
    if (!text) return '';
    return text.toString().toLowerCase()
        .replace(/[áàảãạăắằẳẵặâấầẩẫậ]/g, 'a')
        .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
        .replace(/[íìỉĩị]/g, 'i')
        .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
        .replace(/[úùủũụưứừửữự]/g, 'u')
        .replace(/[ýỳỷỹỵ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

// Quet luong RSC tim cac object truyen (co slug + title/name + cover/author).
function extractNovelsFromRsc(rsc) {
    var novels = [];
    var seenSlug = {};
    var pos = 0;
    while (pos < rsc.length) {
        var slugIdx = rsc.indexOf('"slug":', pos);
        if (slugIdx === -1) break;
        var startPos = rsc.lastIndexOf('{', slugIdx);
        if (startPos !== -1) {
            var braceCount = 0;
            var inString = false;
            var escape = false;
            var endPos = -1;
            for (var i = startPos; i < rsc.length; i++) {
                var char = rsc.charAt(i);
                if (escape) { escape = false; continue; }
                if (char === '\\') { escape = true; continue; }
                if (char === '"') { inString = !inString; continue; }
                if (!inString) {
                    if (char === '{') braceCount++;
                    else if (char === '}') {
                        braceCount--;
                        if (braceCount === 0) { endPos = i; break; }
                    }
                }
            }
            if (endPos !== -1) {
                var jsonStr = rsc.substring(startPos, endPos + 1);
                try {
                    var obj = JSON.parse(jsonStr);
                    if (obj && obj.slug && (obj.title || obj.name)) {
                        var isNovel = (obj.coverUrl || obj.cover || obj.author || obj.genres);
                        if (isNovel && !seenSlug[obj.slug]) {
                            seenSlug[obj.slug] = true;
                            novels.push(obj);
                        }
                    }
                } catch (e) {}
                pos = endPos + 1;
            } else {
                pos = slugIdx + 7;
            }
        } else {
            pos = slugIdx + 7;
        }
    }
    return novels;
}

// Danh sach truyen dung chung cho gen.js / search.js.
// Thu tu: JSON API truc tiep -> RSC -> DOM.
function parseNovelList(url, page) {
    var target = String(url || '');
    if (target.indexOf('/list') !== -1) {
        target = target.replace('/list', '/api/novels');
    }
    if (target.indexOf('/api/novels') !== -1) {
        target = target.replace('tag=', 'genre=');
    }
    if (target.indexOf('http') !== 0) {
        if (target.charAt(0) !== '/') target = '/' + target;
        target = BASE_URL + target;
    }
    if (page) {
        target = target.replace(/([?&])page=\d+/, '');
        target += (target.indexOf('?') >= 0 ? '&' : '?') + 'page=' + page;
    }

    if (target.indexOf('/api/novels') !== -1) {
        try {
            var response = fetchPage(target, { headers: { 'Accept': 'application/json' } });
            if (response.ok) {
                var json = JSON.parse(response.text());
                if (json && json.success && Array.isArray(json.data)) {
                    var data = [];
                    json.data.forEach(function(novel) {
                        var title = novel.title || novel.name || '';
                        var slug = novel.slug || '';
                        if (!title || !slug) return;
                        data.push({
                            name: String(title).trim(),
                            link: normalizeLink('/novel/' + slug),
                            cover: novel.coverUrl || novel.cover || '',
                            description: novel.description || novel.author || '',
                            host: BASE_URL
                        });
                    });
                    var next = null;
                    if (json.data.length >= 10) {
                        next = String(parseInt(page || '1', 10) + 1);
                    }
                    if (data.length > 0) {
                        return Response.success(data, next);
                    }
                }
            }
        } catch (e) {
            // roi xuong fallback HTML/RSC/DOM
        }
    }

    var result = fetchPageWithBrowserFallback(target);
    if (!result.ok || !result.doc) return Response.error('Không tải được danh sách truyện.');

    var doc = result.doc;
    var data = [];
    var seen = {};

    try {
        var rsc = extractRscStrings(doc);
        if (rsc && rsc.length > 0) {
            var novels = extractNovelsFromRsc(rsc);
            novels.forEach(function(novel) {
                var title = novel.title || novel.name || '';
                var slug = novel.slug || '';
                if (!title || !slug) return;
                var link = normalizeLink('/novel/' + slug);
                if (!seen[link]) {
                    var item = {
                        name: String(title).trim(),
                        link: link,
                        cover: novel.coverUrl || novel.cover || novel.image || '',
                        description: novel.description || novel.author || '',
                        host: BASE_URL
                    };
                    seen[link] = item;
                    data.push(item);
                }
            });
        }
    } catch (e) {}

    if (data.length === 0) {
        var novelLinks = doc.select('a[href*="/novel/"]');
        novelLinks.forEach(function(e) {
            var href = e.attr('href');
            var link = normalizeLink(href);
            if (!link) return;
            if (link.indexOf('/novel/') === -1 || link.endsWith('/chapters') || link.endsWith('/reviews') || link.indexOf('/read/') !== -1) return;
            var cover = '';
            var imgEl = safeFirst(e.select('img'));
            if (imgEl) {
                cover = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-srcset') || imgEl.attr('srcset') || imgEl.attr('data-original') || '';
            }
            var name = '';
            if (imgEl) {
                name = imgEl.attr('alt') || '';
            }
            if (!name) {
                name = e.attr('title') || '';
            }
            if (!name) {
                var heading = safeFirst(e.select('h1, h2, h3, h4, p, span'));
                if (heading) name = heading.text().trim();
            }
            if (!name) {
                name = e.text().trim();
            }
            name = name.trim();
            if (name && (name.toLowerCase() === 'đọc ngay' || name.toLowerCase() === 'đọc truyện')) {
                name = '';
            }
            if (seen[link]) {
                var existing = seen[link];
                if (!existing.cover && cover) {
                    existing.cover = cover;
                }
                return;
            }
            if (name && name.length > 1) {
                var item = {
                    name: name,
                    link: link,
                    cover: cover,
                    description: '',
                    host: BASE_URL
                };
                seen[link] = item;
                data.push(item);
            }
        });
    }

    var next = null;
    var nextEl = safeFirst(doc.select("a[aria-label='Go to next page'], a[rel='next'], li.next a, .pagination a.next, a.next"));
    if (nextEl) {
        var nextHref = nextEl.attr('href') || '';
        if (nextHref) {
            var match = String(nextHref).match(/page=(\d+)/);
            if (match) {
                next = match[1];
            } else {
                var pageMatch = String(nextHref).match(/(?:page|p)\/(\d+)|(\d+)/);
                if (pageMatch) {
                    next = pageMatch[1] || pageMatch[2];
                }
            }
        }
    }
    if (!next && data.length >= 10) {
        next = String(parseInt(page || '1', 10) + 1);
    }
    if (data.length === 0) return Response.error('Không tìm thấy truyện nào.');
    return Response.success(data, next);
}
