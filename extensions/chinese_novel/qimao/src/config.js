// config.js — Cấu hình và helper tiện ích cho Qimao (七猫免费小说)
// Lưu ý: Tuyệt đối không chứa lệnh load() trong file này (Rhino load constraint).

var BASE_URL = "https://www.qimao.com";
var API_BC_URL = "https://api-bc.wtzw.com";
var API_KS_URL = "https://api-ks.wtzw.com";
var API_SALT = "d3dGiJc651gSQ8w1";

/**
 * Ký chuỗi query parameters cho request của Qimao.
 * Quy tắc: Chuỗi params (ví dụ: 'wd=kiemhiep' hoặc 'id=1803136') + muối bảo mật API_SALT.
 * Băm chuỗi bằng thuật toán MD5.
 */
function signQuery(queryStr) {
    var raw = (queryStr || "") + API_SALT;
    return CryptoJS.MD5(raw).toString();
}

/**
 * Xây dựng app headers chuẩn cho các request gọi tới Native API của 七猫.
 */
function buildHeaders() {
    var appSign = CryptoJS.MD5("app-version=71900application-id=com.kmxs.readerplatform=android" + API_SALT).toString();
    return {
        "platform": "android",
        "app-version": "71900",
        "application-id": "com.kmxs.reader",
        "sign": appSign,
        "user-agent": "webviewversion/0"
    };
}

/**
 * Làm sạch chuỗi HTML / text trả về từ nội dung chương hoặc giới thiệu.
 */
function cleanText(text) {
    if (!text) return "";
    var res = text.replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, "\"")
        .replace(/&#39;/g, "'")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .trim();
    return res;
}
