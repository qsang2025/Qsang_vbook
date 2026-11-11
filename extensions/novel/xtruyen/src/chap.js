// chap.js — doc noi dung mot chuong tren XTruyen.
//
// CO CHE HIEN TAI (xac minh 2026-11-11): trang chuong KHONG con chua noi
// dung trong HTML tinh — bien data_x cu da bi site go bo. Noi dung nam
// trong window.readingChapterConfig.encodedData va duoc giai ma truc tiep:
//   1) doi tung ky tu qua bang chu cai tuy chinh cua site (lay tu file
//      reading-page.js that, ver 1.0.4, khong con obfuscate):
//      c = "pNRzya673WkGnLJofwlDOEuhv4Q_CSiAxt0VgBH2d-PZsXMU8Ijbcre19qmF5KTY"
//      -> base64 chuan "ABC...XYZabc...xyz012...789+/"
//   2) base64 decode -> byte zlib (dau 78 9c) -> bo 2 byte header + 4 byte
//      Adler cuoi -> inflate DEFLATE tho (inflate.js) -> UTF-8.
// Da kiem chung offline: chuong 50 giai ra dung 19.360 ky tu, mo dau
// "Tong Me noi :", ket "HET", khop ban WebView cu.
// Du phong: fetch tinh (data_x cu / DOM tinh), roi Headless WebView
// (Engine.newBrowser) neu giai ma truc tiep that bai.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('safe-first.js');
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

// Bang chu cai tuy chinh cua encodedData (lay tu file reading-page.js
// that cua site, ver 1.0.4, ham decodeChapterContent). Moi ky tu trong
// encodedData duoc doi qua bang nay sang base64 chuan truoc khi decode.
var XT_ENC_ALPHABET = "pNRzya673WkGnLJofwlDOEuhv4Q_CSiAxt0VgBH2d-PZsXMU8Ijbcre19qmF5KTY";

// Giai ma encodedData thanh text tho. Tra ve "" khi loi.
// Buoc: doi bang chu cai -> base64 -> byte zlib -> bo header/trailer ->
// inflate DEFLATE tho (inflate.js) -> UTF-8.
function decodeEncodedData(encodedData) {
    var s = String(encodedData).replace(/\s+/g, "");
    if (s.length < 100) return "";
    var t = "";
    var i = 0;
    for (i = 0; i < s.length; i++) {
        var idx = XT_ENC_ALPHABET.indexOf(s.charAt(i));
        t += idx > -1 ? XT_B64.charAt(idx) : s.charAt(i);
    }
    var bytes = xtB64ToBytes(t);
    if (bytes.length < 6) return "";
    var raw = bytes.slice(2, bytes.length - 4);
    var text = xtBytesToUtf8(xtInflate(raw));
    return text || "";
}

// Doi text da giai ma (chi co the <br/> ngan doan) thanh HTML <p>...</p>.
// Giu nguyen dinh dang inline neu co; bo dong trong + dong quang cao.
function encodedToHtml(text) {
    text = String(text).replace(/<\/?content[^>]*>/gi, "");
    var parts = text.split(/<br\s*\/?>/gi);
    var out = "";
    var count = 0;
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var part = parts[i].trim();
        if (!part) continue;
        var plain = part.replace(/<[^>]*>/g, "").trim();
        if (!plain) continue;
        var low = plain.toLowerCase();
        var isAd = false;
        var k = 0;
        for (k = 0; k < AD_LINES.length; k++) {
            if (low.indexOf(AD_LINES[k]) !== -1) { isAd = true; break; }
        }
        if (isAd) continue;
        out += "<p>" + part + "</p>";
        count++;
    }
    return count > 0 ? out : "";
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
// Luu y 2: HTML tinh cua site co the chua BAN XEM TRUOC (preview) trong
// container co thuoc tinh data-seo-preview — chi ~2.000 ky tu, cat giua
// cau. Phai bo qua (tra "") de duong giai ma truc tiep / WebView lay du
// noi dung; sau khi JS cua site render xong thi thuoc tinh nay bi go bo
// nen duong WebView khong anh huong.
function extractFromDoc(doc) {
    if (!doc) return "";
    var container = safeFirst(doc.select("#chapter-reading-content"));
    if (!container) container = safeFirst(doc.select(".chapter-content, .reading-content"));
    if (!container) return "";
    if (container.attr("data-seo-preview") !== "") return "";
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

    // 1) Fetch tinh: lay tieu de + thu data_x cu / giai ma truc tiep /
    // DOM tinh. Thu tu quan trong: giai ma truc tiep encodedData PHAI
    // chay truoc extractFromDoc — HTML tinh co ban xem truoc (preview)
    // trong container data-seo-preview, extractFromDoc se tra ve noi dung
    // cat ngan neu chay truoc.
    var doc = fetchDoc(url);
    if (doc) {
        var t = safeFirst(doc.select(".chapter-title"));
        if (!t) t = safeFirst(doc.select("h1"));
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
        // 1b) Giai ma truc tiep encodedData (nhanh, khong can WebView).
        var mEnc = html.match(/encodedData["']?\s*[:=]\s*["']([^"']{100,})["']/);
        if (mEnc && mEnc[1]) {
            try {
                var text = decodeEncodedData(mEnc[1]);
                var bodyEnc = text ? encodedToHtml(text) : "";
                if (bodyEnc) return Response.success(bodyEnc, title);
            } catch (e) {
                console.log("chap encodedData loi: " + e);
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
