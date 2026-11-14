// chap.js — Noi dung chuong Xa Lo Sach (xalosach.com).
// Input: URL trang chuong /doc-truyen/<slug>-chuong-<n>.html.
// Duong chinh: POST API cua site lay noi dung day du (ChapContent).
// API nay treo o buoc TLS tu VM (tarpit IP datacenter), chi chay tren
// may that — vi vay chap.js LUON thu API truoc, chi dung preview tren
// web (#lst_content) khi API khong tra ve.
// Chuong khoa (ChapStatus=4 hoac noi dung chua "da bi khoa" / "mo khoa
// de doc", kem gia xu ChapPrice): bao loi tieng Viet ro rang, KHONG mo
// khoa, KHONG tra preview lam noi dung chuong.

load("config.js");
load("rate-limit.js");

function extractChapterId(html) {
    var m = /baoloitruyen\('([0-9a-f]{24})'/i.exec(html);
    if (m) return m[1];
    m = /'([0-9a-f]{24})','-1'\)/i.exec(html);
    if (m) return m[1];
    return "";
}

function isLockedChapter(chap) {
    if (!chap) return false;
    if (chap.ChapStatus === 4) return true;
    if (!chap.ChapContent) return false;
    var c = String(chap.ChapContent).toLowerCase();
    return c.indexOf("da bi khoa") >= 0 || c.indexOf("mo khoa de doc") >= 0;
}

function fetchChapterFromApi(chapterId) {
    // API chi chap nhan POST JSON toi thieu: pacedFetch gui kem header
    // Accept: text/html... lam API ASP.NET loi 500 (khong serialize
    // duoc response sang text/html), va GET 405 con bi pacedFetch ghi
    // cooldown 60 phut cho host. Dung fetch tran + rateLimitDelay de
    // giu pacing (1 request/lan/host) ma khong dinh 2 bay tren.
    rateLimitDelay("5xu.g5manhua.com");
    var res = null;
    try {
        res = fetch(API_BASE + "/api/tieuthuyet/getdetailchuongtieuthuyet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sChapterID: chapterId })
        });
    } catch (e) {
        return null;
    }
    if (!res || !res.ok) return null;
    var text = "";
    try { text = res.text(); } catch (e2) { return null; }
    if (!text) return null;
    var json = null;
    try { json = JSON.parse(text); } catch (e3) { return null; }
    if (!json || !json.success || !json.data || !json.data.currentchap) return null;
    return json.data.currentchap;
}

function execute(url) {
    var t = xlsFetchText(url, BASE_URL + "/");
    if (t.error) return Response.error(t.error);
    var html = t.text;
    var doc = Html.parse(html);

    var title = "";
    var h1El = selFirst(doc, "h1");
    if (h1El) {
        title = cleanText(h1El.text());
        var dash = title.lastIndexOf(" - ");
        if (dash !== -1) title = title.substring(dash + 3);
    }

    var previewEl = selFirst(doc, "#lst_content");
    var previewContent = "";
    if (previewEl) previewContent = previewEl.html() || "";
    var hasAppOnlyBlock = doc.select("#android, .wrap_taiapp.bgtaiapp, #hotro").size() > 0;

    var chapterId = extractChapterId(html);
    var apiLen = 0;
    if (chapterId) {
        var apiChap = fetchChapterFromApi(chapterId);
        if (apiChap) {
            if (apiChap.ChapContent) apiLen = String(apiChap.ChapContent).length;
            if (apiChap.ChapContent && !isLockedChapter(apiChap)) {
                console.log("xls chap: api ok len=" + apiLen + " preview=" + previewContent.length);
                return Response.success(apiChap.ChapContent, title);
            }
            if (isLockedChapter(apiChap)) {
                var msg = "Chương này đang bị khóa trên Xa Lộ Sách";
                if (apiChap.ChapPrice > 0) msg += " (giá mở khóa trong app: " + apiChap.ChapPrice + " xu)";
                msg += ", plugin không thể hiển thị nội dung chưa mở khóa.";
                return Response.error(msg);
            }
        }
    }
    console.log("xls chap: api fail len=" + apiLen + " preview=" + previewContent.length + " appOnly=" + hasAppOnlyBlock);
    if (previewContent) {
        if (hasAppOnlyBlock) {
            previewContent += "<hr /><p><em>Ghi chú: Xa Lộ Sách chỉ công khai một đoạn trích của chương này trên web. Nội dung đầy đủ chỉ có qua API của site.</em></p>";
        }
        return Response.success(previewContent, title);
    }
    return Response.error("Không tìm thấy nội dung chương, có thể do cấu trúc trang web đã thay đổi.");
}
