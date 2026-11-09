// chap.js — Bóc tách nội dung chương và giải mã AES-128-CBC từ Native API 七猫
load('config.js');
load('crypto.js');

function decryptContent(cipherBase64) {
    if (!cipherBase64) return "";

    // Chuyển Base64 sang chuỗi Hex
    var hexStr = CryptoJS.enc.Base64.parse(cipherBase64).toString();
    if (!hexStr || hexStr.length <= 32) return "";

    // 32 ký tự Hex đầu tiên là IV (16 bytes = 128 bit)
    var ivHex = hexStr.slice(0, 32);
    // Phần Hex còn lại là Ciphertext
    var cipherHex = hexStr.slice(32);

    // Khóa AES-128 cố định của Qimao: Hex của "242ccb8230d709e1"
    var key = CryptoJS.enc.Hex.parse("32343263636238323330643730396531");
    var iv = CryptoJS.enc.Hex.parse(ivHex);

    // Chuyển ciphertext hex sang WordArray rồi sang Base64 để CryptoJS giải mã
    var cipherWords = CryptoJS.enc.Hex.parse(cipherHex);
    var cipherB64 = CryptoJS.enc.Base64.stringify(cipherWords);

    var decrypted = CryptoJS.AES.decrypt(cipherB64, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
}

function execute(url) {
    if (!url) {
        return Response.error("Đường dẫn chương không hợp lệ");
    }

    // URL chương có dạng: https://www.qimao.com/shuku/<book_id>/<chapter_id>/
    // hoặc tương đối: /shuku/<book_id>/<chapter_id>/
    var match = url.match(/\/shuku\/(\d+)\/(\d+)/);
    var bookId = "";
    var chapterId = "";

    if (match) {
        bookId = match[1];
        chapterId = match[2];
    } else {
        // Fallback kiểm tra chuỗi query dạng chapterId=...&id=...
        var chMatch = url.match(/chapterId=(\d+)/);
        var idMatch = url.match(/id=(\d+)/);
        if (chMatch && idMatch) {
            chapterId = chMatch[1];
            bookId = idMatch[1];
        }
    }

    if (!bookId || !chapterId) {
        return Response.error("Không thể xác định mã truyện và mã chương từ URL");
    }

    // Chuỗi tham số ký sign theo quy tắc sắp xếp: "chapterId=" + chapterId + "id=" + bookId
    var signStr = "chapterId=" + chapterId + "id=" + bookId;
    var sign = signQuery(signStr);

    var apiUrl = API_KS_URL + "/api/v1/chapter/content?chapterId=" + chapterId + "&id=" + bookId + "&sign=" + sign;

    var response = fetch(apiUrl, {
        method: "GET",
        headers: buildHeaders()
    });

    if (!response.ok) {
        return Response.error("Không thể kết nối máy chủ chương 七猫 (HTTP " + response.status + ")");
    }

    var json = response.json();

    // Kiểm tra lỗi từ API (ví dụ 44010120 hoặc chương yêu cầu mở khóa VIP)
    if (json.errors) {
        var errTitle = json.errors.title || json.errors.details || "";
        if (errTitle.indexOf("验签") >= 0) {
            return Response.error("Lỗi xác thực chữ ký API七猫 (" + errTitle + ")");
        }
        return Response.error("Chương yêu cầu mở khóa trong ứng dụng 七猫: " + errTitle);
    }

    if (!json || !json.data || !json.data.content) {
        return Response.error("Chương yêu cầu mở khóa hoặc nội dung chưa được cập nhật trong ứng dụng 七猫");
    }

    var decryptedText = decryptContent(json.data.content);
    if (!decryptedText) {
        return Response.error("Không thể giải mã nội dung chương (AES-128-CBC)");
    }

    // Làm sạch và bọc trong các đoạn văn <p>...</p>
    var rawLines = decryptedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    var formattedLines = [];

    for (var i = 0; i < rawLines.length; i++) {
        var line = rawLines[i].replace(/^[\s\u3000\u2000-\u200B\uFEFF]+|[\s\u3000\u2000-\u200B\uFEFF]+$/g, "");
        if (line) {
            // Loại bỏ các dòng quảng cáo app 七猫 nếu có
            if (line.indexOf("七猫免费小说") >= 0 && line.length < 50) continue;
            formattedLines.push("<p>" + cleanText(line) + "</p>");
        }
    }

    var cleanHtml = formattedLines.join("");
    var chapterTitle = json.data.title || "";

    return Response.success(cleanHtml, chapterTitle);
}
