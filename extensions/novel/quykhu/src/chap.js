// chap.js — Noi dung chuong: URL/token nam trong inline script, noi dung
// tra ve dang JSON base64 da XOR (khoa trong payload.k).
load("config.js");
load("rate-limit.js");
load("crypto.js");

function execute(url) {
    rateLimitDelay("quykhu.com");
    url = normalizeUrl(url);
    var response = request(url);
    if (!response.ok) return Response.error("Không tải được chương (HTTP " + response.status + ")");
    var html = response.text();
    var contentUrl = html.match(/var contentUrl = "([^"]+)"/);
    var contentToken = html.match(/var contentToken = "([^"]+)"/);
    if (!contentUrl || !contentToken) return Response.error("Chương chưa mở khóa hoặc cần đăng nhập");
    var csrf = Html.parse(html).select("meta[name=csrf-token]").attr("content");
    var res = request(BASE_URL + contentUrl[1].replace(/\\\//g, "/"), {
        headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrf,
            "X-Content-Token": contentToken[1],
            Referer: url
        }
    });
    var payload = null;
    try { payload = res.json(); } catch (e) {}
    // Khach chi doc duoc cac chuong dau; server giai thich ly do trong `reason`.
    if (!res.ok) return Response.error((payload && payload.reason) || "Không tải được nội dung chương (HTTP " + res.status + ")");
    if (!payload || !payload.d || !payload.k) return Response.error("Nội dung chương chưa sẵn sàng");
    // Vá từ bản AG: giải mã lỗi thì báo rõ thay vì throw.
    var decrypted = xorDecode(payload.d, payload.k);
    if (!decrypted) return Response.error("Không thể giải mã nội dung chương");
    return Response.success(decrypted.replace(/<img[^>]*>/gi, ""));
}

function xorDecode(data, key) {
    try {
        var words = CryptoJS.enc.Base64.parse(data);
        for (var i = 0; i < words.sigBytes; i++) {
            var shift = 24 - (i % 4) * 8;
            var k = key.charCodeAt(i % key.length) & 0xff;
            words.words[i >>> 2] ^= k << shift;
        }
        return CryptoJS.enc.Utf8.stringify(words);
    } catch (e) {
        return "";
    }
}
