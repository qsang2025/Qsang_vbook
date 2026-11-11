load("config.js");
load("crypto.js");

function execute(url) {
    url = normalizeUrl(url);
    var response = request(url);
    if (!response || !response.ok) {
        var st = response ? response.status : 0;
        return Response.error("Không thể mở trang chương (HTTP " + st + ")");
    }

    var html = response.text();
    var contentUrl = html.match(/var contentUrl = "([^"]+)"/);
    var contentToken = html.match(/var contentToken = "([^"]+)"/);
    if (!contentUrl || !contentToken) {
        return Response.error("Chương chưa mở khóa hoặc cần đăng nhập tài khoản");
    }

    var csrf = Html.parse(html).select("meta[name=csrf-token]").attr("content");
    var res = request(BASE_URL + contentUrl[1].replace(/\\\//g, "/"), {
        headers: {
            "Accept": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": csrf,
            "X-Content-Token": contentToken[1],
            "Referer": url
        }
    });

    if (!res) {
        return Response.error("Không thể kết nối đến máy chủ nội dung chương");
    }

    var payload = null;
    try {
        payload = res.json();
    } catch (eJ) {}

    if (!res.ok) {
        var reason = (payload && payload.reason) ? payload.reason : ("HTTP " + res.status);
        return Response.error("Lỗi tải nội dung: " + reason);
    }

    if (!payload || !payload.d || !payload.k) {
        return Response.error("Nội dung chương chưa sẵn sàng hoặc bị khóa");
    }

    var decrypted = xorDecode(payload.d, payload.k);
    if (!decrypted) {
        return Response.error("Không thể giải mã nội dung chương");
    }

    var cleanText = decrypted.replace(/<img[^>]*>/gi, "");
    return Response.success(cleanText);
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
