// detail.js — Thong tin chi tiet truyen Me Truyen Chu
load('config.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn truyện.");
    url = normalizeUrl(url);

    var response = fetchWithMirrors(url);
    if (!response || !response.ok) return Response.error("HTTP Error: " + (response ? response.status : "không kết nối được máy chủ"));
    var doc = response.html();

    var name = "";
    var titleEl = doc.select("h1[itemprop='name']").first();
    if (!titleEl) titleEl = doc.select("h1").first();
    if (titleEl) name = titleEl.text().trim();
    if (!name) return Response.error("Không đọc được tên truyện: " + url);

    var cover = "";
    var coverEl = doc.select(".book-info-pic img").first();
    if (!coverEl) coverEl = doc.select("img[src*='/media/']").first();
    // KHONG fallback ve <img> dau tien nua: anh dau tien cua trang la
    // logo (/images/logo.png), khong phai bia truyen.
    if (coverEl) {
        cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
        if (cover.indexOf("logo") !== -1) cover = "";
    }

    var author = "";
    var authorEl = doc.select("a[href*='/tac-gia/']").first();
    if (authorEl) {
        author = authorEl.text().trim();
    }

    // Lay mo ta o selector dau tien NAO CO NOI DUNG that: trang tra ve
    // cho app co mot phan tu [itemprop='description'] RONG (probe tren
    // may that 2026-11-08) — lay thang no se lam description rong du
    // .intro ben duoi co du text. Chi nhan khi html() khong rong.
    var description = "";
    var descSelectors = ["[itemprop='description']", ".intro", ".desc-text", ".description"];
    for (var d = 0; d < descSelectors.length; d++) {
        var de = doc.select(descSelectors[d]).first();
        if (de) {
            var dh = de.html();
            if (dh && dh.trim()) { description = dh; break; }
        }
    }

    // Trang thai: doc dung phan tu <span class="label-status"> trong khoi
    // thong tin truyen ("Full" / "Đang cập nhật"), KHONG regex tren toan
    // bo doc.text() nua — regex cu nuot ca trang nen ongoing sai (truyen
    // Full van bao dang ra) va detail phinh to.
    var ongoing = true;
    var statusText = "";
    var statusEl = doc.select(".label-status").first();
    if (statusEl) {
        statusText = statusEl.text().trim();
        var stLower = statusText.toLowerCase();
        if (stLower.indexOf("hoàn thành") !== -1 || stLower.indexOf("full") !== -1 || stLower.indexOf("hoàn") !== -1) {
            ongoing = false;
        }
    }

    // The loai: chi lay trong khoi ".li--genres" cua truyen, khong lay
    // link /the-loai/ o menu dieu huong hay tag cuoi trang.
    var genres = [];
    var seen = {};
    doc.select(".li--genres a[href*='/the-loai/']").forEach(function (e) {
        var title = e.text().trim();
        var href = e.attr("href");
        if (title && href && !seen[title]) {
            seen[title] = true;
            genres.push({
                title: title,
                input: href,
                script: "gen.js"
            });
        }
    });

    // So chuong: doc trong tung <li> cua khoi ".book-info-text", khong
    // regex tren toan bo text cua trang.
    var chapterCount = "";
    var infoItems = doc.select(".book-info-text li");
    for (var k = 0; k < infoItems.size(); k++) {
        var liText = infoItems.get(k).text();
        if (liText.indexOf("Số chương") !== -1) {
            var cm = liText.match(/(\d[\d.]*)/);
            if (cm) chapterCount = cm[1];
        }
    }

    var detailLines = [];
    if (author) detailLines.push("<b>Tác giả:</b> " + author);
    if (statusText) detailLines.push("<b>Trạng thái:</b> " + statusText);
    if (chapterCount) detailLines.push("<b>Số chương:</b> " + chapterCount);
    if (genres.length > 0) {
        var gNames = [];
        for (var i = 0; i < genres.length; i++) gNames.push(genres[i].title);
        detailLines.push("<b>Thể loại:</b> " + gNames.join(", "));
    }

    // Trang detail khong co muc "truyen cung the loai / cung tac gia"
    // (chi co TOP Truyen De Cu chung va Chuong moi nhat), nen KHONG co
    // suggests — khong che suggests tu danh sach chung.
    return Response.success({
        name: name,
        cover: cover,
        author: author,
        description: description,
        detail: detailLines.join("<br>"),
        host: BASE_URL,
        url: url,
        type: "novel",
        format: "novel",
        genres: genres,
        ongoing: ongoing
    });
}
