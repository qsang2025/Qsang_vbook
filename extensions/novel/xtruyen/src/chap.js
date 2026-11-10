// chap.js — doc noi dung mot chuong tren XTruyen.
//
// CO CHE HIEN TAI (xac minh tren may that 2026-11-10): trang chuong KHONG
// con chua noi dung trong HTML tinh — bien data_x cu da bi site go bo.
// Noi dung nam trong window.readingChapterConfig.encodedData (chuoi
// base64url, giai ma xong van la du lieu ma hoa/xao tron, chua giai duoc
// truc tiep) va duoc file JS cua site (reading-page.js, da obfuscate)
// giai ma bang pako roi chen vao #chapter-reading-content sau khi tai trang.
// Vi vay duong doc chinh la Headless WebView (Engine.newBrowser): mo trang,
// cho JS cua site chay xong, roi doc DOM da render.
//
// Du phong: fetch tinh (neu site tra lai data_x hoac DOM tinh co noi dung).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('challenge-handler.js');
load('cleanHtml.js');
load('inflate.js');

var AD_LINES = [
    "voucher chill",
    "quảng cáo",
    "xtruyện",
    "xtruyen.vn",
    "ủng hộ",
    "donate",
    "mời bạn đọc",
    "truyện được dịch",
    "truyenfull",
    "truyenchu",
    "metruyenchu"
];

function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Giai ma data_x CU thanh HTML <p>...</p>. Tra ve "" khi noi dung qua ngan.
function decodeDataXToHtml(dataX) {
    var text = xtDecodeDataX(dataX);
    if (!text || text.length < 20) return "";
    var lines = text.split("\n");
    var out = "";
    var count = 0;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        var low = line.toLowerCase();
        var isAd = false;
        for (var k = 0; k < AD_LINES.length; k++) {
            if (low.indexOf(AD_LINES[k]) !== -1) { isAd = true; break; }
        }
        if (isAd) continue;
        out += "<p>" + escapeHtml(line) + "</p>";
        count++;
    }
    return count > 0 ? out : "";
}

// Doc noi dung tu mot Document (tinh hoac browser). Tra ve HTML da loc
// hoac "" khi container chua co noi dung that (vd. chi co spinner).
// Luu y: site render moi doan bang <div>; phai doi dong </div> thanh <br>
// TRUOC khi cleanHtml (no chi boc the div, khong them dau ngat doan).
function extractFromDoc(doc) {
    if (!doc) return "";
    var container = doc.select("#chapter-reading-content").first();
    if (!container) container = doc.select(".chapter-content, .reading-content").first();
    if (!container) return "";
    var text = container.text() || "";
    if (text.length < 200) return "";
    var raw = container.html().replace(/<\/(div|p|h\d|li|tr)>/gi, "<br>");
    var cleaned = cleanHtml(raw);
    return (cleaned && cleaned.length >= 200) ? cleaned : "";
}

// Doc chuong qua Headless WebView: cho JS cua site tai + giai ma noi dung.
// Kiem tra moi 2s, toi da ~12s.
function readViaBrowser(url) {
    if (typeof Engine === "undefined" || !Engine || typeof Engine.newBrowser !== "function") return "";
    var browser = null;
    try {
        browser = Engine.newBrowser();
        browser.launch(url, 20000);
        for (var i = 0; i < 6; i++) {
            var doc = browser.html(2000);
            if (!doc) continue;
            var body = extractFromDoc(doc);
            if (body) {
                if (browser.close) browser.close();
                return body;
            }
        }
        if (browser.close) browser.close();
        return "";
    } catch (e) {
        console.log("chap browser loi: " + e);
        try { if (browser && browser.close) browser.close(); } catch (e2) {}
        return "";
    }
}

function execute(url) {
    url = normalizeUrl(url);
    rateLimitDelay("xtruyen.vn");
    var title = "";
    var mSlug = url.match(/chuong-(\d+)/);
    if (mSlug) title = "Chương " + mSlug[1];

    // 1) Fetch tinh: lay tieu de + thu data_x cu / DOM tinh.
    var doc = fetchDoc(url);
    if (doc) {
        var t = doc.select(".chapter-title").first();
        if (!t) t = doc.select("h1").first();
        if (t) title = cleanText(t.text()) || title;
        var html = doc.html();
        var mData = html.match(/data_x\s*=\s*["']([^"']+)["']/);
        if (mData && mData[1]) {
            try {
                var body0 = decodeDataXToHtml(mData[1]);
                if (body0) return Response.success(body0, title);
            } catch (e) {
                console.log("chap data_x loi: " + e);
            }
        }
        var body1 = extractFromDoc(doc);
        if (body1) return Response.success(body1, title);
    }

    // 2) Trinh duyet headless: cho JS cua site tai + giai ma noi dung.
    var body2 = readViaBrowser(url);
    if (body2) return Response.success(body2, title);

    return Response.error("Không đọc được nội dung chương. XTruyện tải nội dung chương bằng JavaScript; nếu lỗi còn tiếp diễn, thử mở chương này trong trình duyệt của app rồi quay lại.");
}
