// detail.js — Chi tiet truyen cua Me Truyen Sang Tac.
//
// Luu y: the loai cua truyen KHONG phai link theloai= (toan bo link do
// la menu dieu huong 130 the loai). The loai that nam trong cac span
// class "text-gray-500 hover:text-blue-600 transition" sau nhan
// "Thể loại:" — doi ten thanh id qua genreIdByName (file config.js).
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);

    var r = fetchMTS(storyUrl);
    var doc = null;
    if (r.ok && r.res) {
        try { doc = r.res.html(); } catch (e) { doc = null; }
    }
    if (!doc) doc = openInBrowser(storyUrl);
    if (!doc) return Response.error(pacedErrorMessage(r));

    var name = "";
    var cover = "";
    var author = "";
    var description = "";
    var detail = "";
    var ongoing = true;
    var genres = [];
    var suggests = [];

    // Ten truyen — h1.
    var h1 = safeFirst(doc.select("h1"));
    if (h1) name = h1.text().trim();

    // Anh bia — img alt chua "Ảnh truyện"; du phong: anh /uploads/ dau
    // tien khong phai banner/logo.
    var coverImg = safeFirst(doc.select("img[alt*='Ảnh truyện']"));
    if (!coverImg) {
        var imgs = doc.select("img[src*='/uploads/']");
        var ci = 0;
        for (ci = 0; ci < imgs.size(); ci++) {
            var imgSrc = imgs.get(ci).attr("src") || "";
            if (imgSrc.indexOf("banner") === -1 && imgSrc.indexOf("logo") === -1) {
                coverImg = imgs.get(ci);
                break;
            }
        }
    }
    if (coverImg) {
        cover = coverImg.attr("data-src") || coverImg.attr("src") || "";
        if (cover && cover.charAt(0) === "/") cover = BASE_URL + cover;
    }

    // Tac gia — link tim kiem theo ten (key=<ten>).
    var authorLink = safeFirst(doc.select("a[href*='key=']"));
    if (authorLink) author = authorLink.text().trim();

    // Mo ta — meta og:description; du phong: doan sau tieu de Gioi thieu.
    var metaDesc = safeFirst(doc.select("meta[property='og:description']"));
    if (metaDesc) description = metaDesc.attr("content") || "";
    if (!description) {
        var descEls = doc.select("h2:matchesOwn(Giới thiệu) ~ p, h2:matchesOwn(Giới thiệu) ~ div");
        var parts = [];
        var di = 0;
        for (di = 0; di < descEls.size(); di++) {
            var t = descEls.get(di).text().trim();
            if (t && t !== "Xem thêm") parts.push(t);
        }
        description = parts.join("\n");
    }

    // The loai — span class rieng cua muc "Thể loại:" (khong dung link
    // theloai= vi do la menu dieu huong).
    var allSpans = doc.select("span");
    var seenGid = {};
    var si = 0;
    for (si = 0; si < allSpans.size(); si++) {
        var sp = allSpans.get(si);
        if (sp.attr("class") !== "text-gray-500 hover:text-blue-600 transition") continue;
        var gn = sp.text().trim().replace(/,\s*$/, "");
        if (!gn || gn.length < 2) continue;
        var gid = genreIdByName(gn);
        if (!gid || seenGid[gid]) continue;
        seenGid[gid] = true;
        genres.push({ title: gn, input: gid, script: "genrecontent.js" });
    }

    // Trang thai / so chuong / luot doc / danh gia.
    var bodyText = doc.text();
    var statusMatch = /Tình trạng:\s*(Đang ra|Hoàn thành|Tạm dừng|Full)/i.exec(bodyText);
    if (statusMatch) {
        if (/Hoàn|Full/i.test(statusMatch[1])) ongoing = false;
    }
    var chapMatch = /Chương\s*(\d[\d,.]*)/i.exec(bodyText);
    var chapCount = chapMatch ? chapMatch[1].replace(/[,.]/g, "") : "";
    var viewMatch = /Lượt đọc\s*(\d[\d,.]*)/i.exec(bodyText);
    var views = viewMatch ? viewMatch[1] : "";
    var ratingMatch = /Đánh giá\s*([\d.]+\/\d+)/i.exec(bodyText);
    var rating = ratingMatch ? ratingMatch[1] : "";
    var detailParts = [];
    if (chapCount) detailParts.push("Số chương: " + chapCount);
    if (views) detailParts.push("Lượt đọc: " + views);
    if (rating) detailParts.push("Đánh giá: " + rating);
    detail = detailParts.join("\n");

    // Truyen goi y — link /truyen/ khac truyen hien tai, kem anh bia.
    var sugCoverMap = {};
    var sugAllEls = doc.select("a[href*='/truyen/'], img[src*='/uploads/']");
    var sugLastSlug = "";
    var sm = 0;
    for (sm = 0; sm < sugAllEls.size(); sm++) {
        var sugEl = sugAllEls.get(sm);
        var sugElHref = sugEl.attr("href") || "";
        var sugElSrc = sugEl.attr("src") || "";
        if (sugElHref && sugElHref.indexOf("/truyen/") !== -1 && !sugElSrc) {
            sugLastSlug = extractSlug(sugElHref) || "";
        } else if (sugElSrc && sugElSrc.indexOf("/uploads/") !== -1) {
            if (sugLastSlug && !sugCoverMap[sugLastSlug]) {
                var sugImgUrl = sugElSrc;
                if (sugImgUrl.charAt(0) === "/") sugImgUrl = BASE_URL + sugImgUrl;
                sugCoverMap[sugLastSlug] = sugImgUrl;
            }
        }
    }
    var suggestLinks = doc.select("a[href*='/truyen/']");
    var suggestSeen = {};
    if (slug) suggestSeen[slug] = true;
    var sj = 0;
    for (sj = 0; sj < suggestLinks.size(); sj++) {
        var sa = suggestLinks.get(sj);
        var sHref = sa.attr("href") || "";
        if (sHref.indexOf("index.php") !== -1) continue;
        var sSlug = extractSlug(sHref);
        if (!sSlug || suggestSeen[sSlug]) continue;
        var sName = sa.text().trim();
        if (!sName || sName === "Logo" || sName.length < 2) continue;
        if (sName.indexOf("Banner") !== -1) continue;
        suggestSeen[sSlug] = true;
        suggests.push({
            name: sName,
            link: "/truyen/" + sSlug,
            host: BASE_URL,
            cover: sugCoverMap[sSlug] || ""
        });
        if (suggests.length >= 10) break;
    }

    if (!name) return Response.error("Không tải được thông tin truyện");

    return Response.success({
        name: name,
        cover: cover,
        host: BASE_URL,
        author: author || "Không rõ",
        description: description,
        detail: detail,
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests,
        comments: []
    });
}
