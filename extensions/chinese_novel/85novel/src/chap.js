// chap.js — Noi dung chuong (execute(url) -> HTML + tieu de chuong).
//
// Trang chuong /book/<id>/<n>.html (kiem chung live 2026-11-14):
// - Noi dung trong div[data-chapter-content-block] (moi doan 1 <p>);
//   khoi quang cao la <script type="application/json" data-reader-ad>
//   (khong phai text — chon <p> la tranh duoc).
// - Doan cuoi trong khoi la <p>您最近閱讀過:</p> (tieu de footer) — loc.
// - Tieu de chuong KHONG co trong HTML tinh (render qua Alpine
//   x-text="chapter?.ChapterName") -> tra data2 rong, app dung ten
//   chuong tu muc luc (hop dong: data2 rong thi giu ten TOC).
// Load: file config.js, file rate-limit.js, file safe-first.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function execute(url) {
    url = normalizeInput(url);
    var r = pacedFetch(url, {
        headers: { "Accept-Language": "zh-TW,zh;q=0.9,zh-CN;q=0.8,en;q=0.7" },
        minDelayMs: 30000,
        maxDelayMs: 30500,
        maxRetries: 0
    });
    if (!r.ok) return Response.error(pacedErrorMessage(r));
    var doc = null;
    try {
        doc = r.res.html();
    } catch (e) {
        return Response.error("Không đọc được trang chương từ 85 Novel.");
    }
    var paras = [];
    var ps = doc.select("div[data-chapter-content-block] p");
    if (ps.size() === 0) ps = doc.select(".font-mono p");
    var i = 0;
    for (i = 0; i < ps.size(); i++) {
        var text = cleanText(ps.get(i).text());
        if (!text) continue;
        if (text === "您最近閱讀過:") continue;
        paras.push(text);
    }
    if (!paras.length) {
        var bodyText = "";
        try { bodyText = cleanText(doc.select("body").first().text()); } catch (e) {}
        if (/需要登錄|請先登錄|請登錄/.test(bodyText)) {
            return Response.error("Chương này trên 85 Novel yêu cầu đăng nhập. Extension chỉ đọc nội dung miễn phí, không đăng nhập hộ.");
        }
        if (/付費|收費|需要付費|VIP/.test(bodyText)) {
            return Response.error("Chương này trên 85 Novel là chương trả phí — extension không mở khóa, không lấy nội dung xem trước làm nội dung chương.");
        }
        return Response.error("Không tìm thấy nội dung chương trên trang này.");
    }
    var htmlParts = [];
    for (i = 0; i < paras.length; i++) {
        htmlParts.push("<p>" + escapeHtml(paras[i]) + "</p>");
    }
    return Response.success(htmlParts.join(""), "");
}

function escapeHtml(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
