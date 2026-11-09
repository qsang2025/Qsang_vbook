// toc.js — Lay danh sach chuong ma hoa AES tu /api/chapters/list-chapters tren La Ca Truyen
load('crypto.js');
load('config.js');

var DEFAULT_TOC_SIZE = 500;
var MAX_TOC_PAGES = 50;

function fetchEncryptedChapterPage(storyId, pageNum, pageSize, storyUrl) {
    var payload = {
        id_story: aesEncrypt(String(storyId), MASTER_KEY),
        page: aesEncrypt(String(pageNum), MASTER_KEY),
        items_per_page: aesEncrypt(String(pageSize), MASTER_KEY),
        order: aesEncrypt("ASC", MASTER_KEY)
    };

    try {
        var res = fetch(BASE_URL + "/api/chapters/list-chapters", {
            method: "POST",
            headers: buildAuthHeaders({
                "Content-Type": "application/json",
                "Referer": storyUrl || (BASE_URL + "/")
            }),
            body: JSON.stringify(payload)
        });
        if (!res || !res.ok) return { ok: false, list: [] };
        var json = res.json();
        if (!json || !json.data) return { ok: false, list: [] };
        var decStr = aesDecrypt(json.data, MASTER_KEY);
        if (!decStr) return { ok: false, list: [] };
        var rows = JSON.parse(decStr);
        if (!Array.isArray(rows)) return { ok: false, list: [] };
        return { ok: true, list: rows };
    } catch (e) {
        return { ok: false, list: [] };
    }
}

function mapChapterList(rows) {
    var out = [];
    if (!Array.isArray(rows)) return out;
    for (var i = 0; i < rows.length; i++) {
        var item = rows[i];
        if (!item || !item.slug) continue;
        var slug = String(item.slug).trim().replace(/^\/+/, "");
        var title = String(item.title || ("Chương " + (item.chapter_order || (out.length + 1)))).trim();
        var isPay = !!(item.locked || item.is_locked || item.not_free === true || item.not_free === "true" || parseInt(item.fee || 0, 10) > 0);
        out.push({
            name: title,
            url: BASE_URL + "/chapter/" + slug,
            host: BASE_URL,
            // N1: chuong tra phi vua la chuong khoa (lock) vua la chuong tra phi (pay) theo
            // hop dong toc trong extension-api.md; chi dat pay truoc day app co the khong
            // hien icon khoa. Kiem chung live 2026-11-09: API list-chapters khong tra
            // locked/is_locked/not_free/fee tren 7 truyen (~3.000 chuong) nen hien tai
            // isPay luon false — them lock khong doi hanh vi hien tai, chi de app hien
            // dung icon khi site bat dau danh dau chuong tra phi.
            lock: isPay,
            pay: isPay
        });
    }
    return out;
}

function execute(url) {
    var rawUrl = normalizeUrl(url);
    var storyUrl = stripQueryAndHash(rawUrl).replace(/\/+$/, "");
    if (!storyUrl) return Response.error("URL mục lục truyện không hợp lệ.");

    var storyId = getQueryParam(rawUrl, "story_id");
    var reqPage = parseInt(getQueryParam(rawUrl, "page") || getQueryParam(rawUrl, "laca_toc_page") || 0, 10);
    var reqSize = parseInt(getQueryParam(rawUrl, "size") || getQueryParam(rawUrl, "laca_toc_size") || DEFAULT_TOC_SIZE, 10);
    if (isNaN(reqSize) || reqSize < 1 || reqSize > 1000) reqSize = DEFAULT_TOC_SIZE;

    var firstChapterFallback = [];

    if (!storyId) {
        var pageRes = null;
        try {
            pageRes = fetch(storyUrl, {
                method: "GET",
                headers: buildAuthHeaders()
            });
        } catch (e) {
            return Response.error("Không thể tải trang truyện để lấy mục lục (lỗi mạng).");
        }
        if (!pageRes || !pageRes.ok) {
            return Response.error("Không thể tải trang truyện để lấy mục lục.");
        }
        var rawHtml = "";
        try {
            rawHtml = String(pageRes.text() || "");
        } catch (e) {
        }
        var nextData = rawHtml ? extractNextData(rawHtml) : null;
        if (!nextData) {
            try {
                nextData = extractNextData(pageRes.html());
            } catch (e2) {
            }
        }
        var pageProps = (nextData && nextData.props && nextData.props.pageProps) ? nextData.props.pageProps : null;
        if (!pageProps || !pageProps.story || !pageProps.story.id) {
            return Response.error("Không tìm thấy mã truyện (story.id) từ trang.");
        }
        storyId = String(pageProps.story.id);
        if (Array.isArray(pageProps.firstChapter)) {
            firstChapterFallback = pageProps.firstChapter;
        }
    }

    // Tripwire MASTER_KEY (N2): khoa xoay thi fetchEncryptedChapterPage giai ma ra rong
    // mot cach lang le (ok:false). Kiem tra som bang mau da biet, bao loi ro rang thay vi
    // tra muc luc rong / loi chung chung. Chi chay sau khi da co storyId de loi mang khi
    // tai trang truyen van duoc bao dung truoc.
    if (!verifyMasterKey()) {
        return Response.error("Khóa giải mã của La Cà Truyện đã thay đổi, extension cần được cập nhật.");
    }

    // Truong hop duoc goi tu page.js voi tham so page cu the
    if (!isNaN(reqPage) && reqPage > 0) {
        var singleRes = fetchEncryptedChapterPage(storyId, reqPage, reqSize, storyUrl);
        if (!singleRes.ok) {
            if (reqPage === 1 && firstChapterFallback.length > 0) {
                return Response.success(mapChapterList(firstChapterFallback));
            }
            return Response.error("Không thể tải danh sách chương trang " + reqPage + ".");
        }
        var mappedSingle = mapChapterList(singleRes.list);
        if (mappedSingle.length === 0 && reqPage === 1 && firstChapterFallback.length > 0) {
            mappedSingle = mapChapterList(firstChapterFallback);
        }
        return Response.success(mappedSingle);
    }

    // Truong hop goi truc tiep toc.js voi URL truyen (lap qua cac trang de lay toan bo chuong).
    // Dung reqSize (da clamp 1-1000, mac dinh 500) thay vi cung DEFAULT_TOC_SIZE; cap 50 trang
    // khop voi page.js (toi da 25.000 chuong).
    var allChapters = [];
    for (var p = 1; p <= MAX_TOC_PAGES; p++) {
        var pageResult = fetchEncryptedChapterPage(storyId, p, reqSize, storyUrl);
        if (!pageResult.ok) {
            if (p === 1 && firstChapterFallback.length > 0) {
                return Response.success(mapChapterList(firstChapterFallback));
            }
            if (p === 1) {
                return Response.error("Không thể tải mục lục truyện.");
            }
            break;
        }
        var rows = pageResult.list;
        if (!rows || rows.length === 0) break;
        var mapped = mapChapterList(rows);
        for (var i = 0; i < mapped.length; i++) {
            allChapters.push(mapped[i]);
        }
        if (rows.length < reqSize) break;
    }

    // Fetch thanh cong nhung truyen chua co chuong nao: tra danh sach rong, khong bao loi
    // (quy uoc 0 ket qua — chi dung Response.error cho loi mang/HTTP/parse).
    if (allChapters.length === 0) {
        return Response.success([]);
    }

    return Response.success(allChapters);
}
