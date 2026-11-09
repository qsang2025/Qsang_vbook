// qimao-des.js — giai ma chapterData PREVIEW tren trang chuong web cua 七猫免费小说.
//
// DINH DANG THAT (xac minh offline 2026-11-09 tu blob that ch.492, 760 ky tu):
//   blob = base64(base64(ciphertext-DES)) + key 32 ky tu cuoi
//   - 728 ky tu dau: base64 kep (giai 2 lan moi ra ciphertext)
//   - 32 ky tu cuoi: key; khoa DES = 8 byte dau cua chuoi hex MD5(key) dang ASCII
//   - DES-ECB, padding PKCS#7; giai xong la HTML co tag <p>, ~100 chu (BAN XEM TRUOC,
//     khong phai toan chuong — toan chuong lay qua API /api/v1/chapter/content).
//   (Theo bai CSDN "七猫小说 chapterdata解密" — ham decrypt_chapter_content; da kiem
//   chung bang Node crypto: giai ra dung mo dau chuong ch.492, 96 chu Han, padding
//   PKCS#7 dung.)
// Dung CryptoJS.DES co san trong lib/crypto.js (script goi phai load('crypto.js')
// TRUOC file nay). Chi dung var/function, noi chuoi bang +.
//
// execute() duoi day chi de linter validate — file la thu vien load-only.
function execute() {
    return Response.error("qimao-des.js là thư viện dùng chung, không chạy độc lập");
}

// Giai ma blob preview (760 ky tu) thanh HTML text. Tra ve "" khi sai dinh dang.
function qimaoDesDecryptPreview(blob) {
    if (!blob || blob.length < 64) return "";
    var keySuffix = blob.slice(-32);
    var ctPart = blob.slice(0, blob.length - 32);
    // atob(ctPart): base64-decode 1 lan -> chuoi base64 ben trong (ASCII).
    var innerBytes = qimaoBase64Decode(ctPart);
    if (!innerBytes || innerBytes.length < 16) return "";
    var inner = "";
    var i = 0;
    for (i = 0; i < innerBytes.length; i++) inner += String.fromCharCode(innerBytes[i]);
    // Base64.parse(inner): base64-decode lan 2 -> ciphertext tho.
    var ctWords = null;
    try {
        ctWords = CryptoJS.enc.Base64.parse(inner);
    } catch (e) {
        return "";
    }
    if (!ctWords || ctWords.sigBytes < 8) return "";
    // Khoa DES = 8 byte dau cua chuoi hex MD5(keySuffix) dang ASCII.
    var md5hex = "";
    try {
        md5hex = CryptoJS.MD5(keySuffix).toString();
    } catch (e2) {
        return "";
    }
    var keyWords = CryptoJS.enc.Utf8.parse(md5hex.slice(0, 8));
    var dec = null;
    try {
        dec = CryptoJS.DES.decrypt(
            { ciphertext: ctWords },
            keyWords,
            { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
        );
    } catch (e3) {
        return "";
    }
    if (!dec) return "";
    var text = "";
    try {
        text = dec.toString(CryptoJS.enc.Utf8);
    } catch (e4) {
        return "";
    }
    return text || "";
}
