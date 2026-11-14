// chap.js — Noi dung chuong qua AJAX cua site.
// Trang chuong chi co khung rong (closed shadow root); noi dung lay qua
// POST sources/ajax/load-chapter-content.php {pnvn_token, id_truyen,
// id_chapter, nonce} -> JSON {status:"success", noi_dung}. id_chapter +
// nonce lay tu #noi_dung_truyen (data-mt-*), token moi lay tu hidden
// input tren trang chuong. Token co the bi xoay nen gap loi thi lay token
// moi qua get-csrf-token.php roi thu lai 1 lan. Chuong VIP/co phi tra ve
// loi hoac rong -> Response.error tieng Viet ro rang, KHONG mo khoa.
load("config.js");
load("rate-limit.js");

function cleanChapterHtml(htmlContent) {
    var doc = null;
    try {
        doc = Html.parse(htmlContent);
    } catch (e) {
        return "";
    }
    try {
        doc.select(".mt-hidden-watermark").remove();
    } catch (e2) {
    }
    var html = "";
    try {
        html = doc.html();
    } catch (e3) {
        html = htmlContent;
    }
    // noi_dung co the chua thuc the HTML thoat lan 2 (vd &lt;p&gt;).
    if (html.indexOf("&lt;p") !== -1 || html.indexOf("&lt;br") !== -1) {
        html = html.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
        try {
            doc = Html.parse(html);
        } catch (e4) {
        }
    }
    var paras = doc.select("p");
    var out = [];
    for (var i = 0; i < paras.size(); i++) {
        var t = cleanText(paras.get(i).text());
        if (t) out.push(t);
    }
    if (out.length > 0) return out.join("\n\n");
    return cleanText(doc.text());
}

function loadChapterContent(chapterUrl, idTruyen, idChapter, nonce, token) {
    var pr = ttlFetchPost(BASE_URL + "/sources/ajax/load-chapter-content.php",
        { pnvn_token: token, id_truyen: idTruyen, id_chapter: idChapter, nonce: nonce }, chapterUrl);
    if (pr.error) {
        // 403 tren endpoint nay la cua khoa VIP cua server (chuong mien phi
        // tra 200); dich thanh loi mo khoa ro rang thay vi loi tai chung.
        if (pr.status === 403) return { error: "vip" };
        return { error: pr.error };
    }
    var resJson = null;
    try {
        resJson = pr.res.json();
    } catch (e) {
        return { error: "Không đọc được nội dung chương (site trả về không phải JSON)" };
    }
    if (!resJson) return { error: "Không đọc được nội dung chương (site trả về rỗng)" };
    if (resJson.status !== "success" || !resJson.noi_dung) {
        var code = resJson.code ? String(resJson.code) : "";
        var msg = resJson.message ? String(resJson.message) : "";
        if (code === "invalid_token" || code === "token_expired") return { error: "invalid_token" };
        if (msg) return { error: msg };
        return { error: "empty" };
    }
    return { content: resJson.noi_dung };
}

function execute(url) {
    var chapterUrl = normalizeUrl(url);
    if (!chapterUrl) return Response.error("URL chương không hợp lệ");
    var rr = ttlFetchDoc(chapterUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var contentTag = selFirst(doc, "#noi_dung_truyen");
    if (!contentTag) return Response.error("Không đọc được trang chương (thiếu khung nội dung): " + chapterUrl);
    var idTruyen = contentTag.attr("data-mt-id-truyen") || "";
    var idChapter = contentTag.attr("data-mt-id-chapter") || "";
    var nonce = contentTag.attr("data-mt-nonce") || "";
    if (!idTruyen || !idChapter || !nonce) return Response.error("Không đọc được mã chương để tải nội dung: " + chapterUrl);

    var htmlText = "";
    try {
        htmlText = doc.html();
    } catch (e) {
    }
    var auth = extractStoryAuth(doc, htmlText);
    var token = auth.token || "";
    if (!token) {
        try {
            var m = /let pnvnToken\s*=\s*"([0-9a-f]{32})"/.exec(htmlText);
            if (m) token = m[1];
        } catch (e2) {
        }
    }
    if (!token) token = refreshPnvnToken();
    if (!token) return Response.error("Không đọc được mã bảo mật để tải nội dung chương: " + chapterUrl);

    var r = loadChapterContent(chapterUrl, idTruyen, idChapter, nonce, token);
    if (r.error === "invalid_token") {
        var newToken = refreshPnvnToken();
        if (newToken) r = loadChapterContent(chapterUrl, idTruyen, idChapter, nonce, newToken);
    }
    if (r.error) {
        if (r.error === "invalid_token" || r.error === "empty" || r.error === "vip") {
            return Response.error("Chương này chưa mở khóa hoặc cần tài khoản VIP — extension không mở khóa chương trả phí.");
        }
        return Response.error("Không tải được nội dung chương: " + r.error);
    }
    var content = cleanChapterHtml(r.content);
    if (!content || content.length < 10) {
        return Response.error("Chương này chưa mở khóa hoặc cần tài khoản VIP — extension không mở khóa chương trả phí.");
    }
    if (content.indexOf("Đang tải nội dung") !== -1 && content.length < 100) {
        return Response.error("Không tải được nội dung chương (site trả về khung chờ). Thử lại sau.");
    }

    var title = "";
    var titleEl = selFirst(doc, "title");
    if (titleEl) {
        title = cleanText(titleEl.text()).replace(/\s*-\s*Mộng Truyện\s*$/i, "");
    }
    return Response.success(content, title);
}
