// chap.js — Cứu Truyện: ảnh chương qua /api/v2/chapters/{id}.
// Mỗi trang có image_url + drm_data (base64): ảnh trên CDN đã bị xáo
// trộn theo cơ chế hiển thị của chính site — giải mã bằng file
// image_decode.js (thư viện cuudrm của site, chạy trong trình duyệt
// headless của app), rồi ráp lại bằng file image.js (Graphics) khi hiển
// thị. Nội dung đọc ẩn danh, không cần đăng nhập, không mở khóa trả phí.
// Trang nào không có drm_data thì trả URL ảnh gốc (không cần giải mã).
load('config.js');
load('rate-limit.js');
load('image_decode.js');

function execute(url) {
    var m = String(url).match(/\/chapters\/(\d+)/);
    if (!m || !m[1]) return Response.error("Thiếu mã định danh chương.");
    var chapterId = m[1];
    var result = fetchJson(BASE_URL + "/api/v2/chapters/" + chapterId);
    if (!result.ok || !result.data || !result.data.data) {
        return Response.error(apiErrorMessage(result, "nội dung chương"));
    }
    var pages = result.data.data.pages;
    if (!Array.isArray(pages) || pages.length === 0) {
        return Response.error("Chương này chưa có ảnh. Thử lại sau.");
    }
    var drmList = [];
    var hasDrm = false;
    var firstDrm = "";
    for (var i = 0; i < pages.length; i++) {
        var drm = pages[i].drm_data || "";
        drmList.push(drm);
        if (drm) {
            hasDrm = true;
            if (!firstDrm) firstDrm = drm;
        }
    }
    var slices = null;
    if (hasDrm) {
        // Điền chỗ trống bằng một drm thật để trình giải mã không vấp
        // (trang không có drm sẽ trả URL gốc ở dưới, không dùng lát cắt).
        for (var k = 0; k < drmList.length; k++) {
            if (!drmList[k]) drmList[k] = firstDrm;
        }
        var decoded = imageDecode(JSON.stringify(drmList));
        if (!decoded) {
            return Response.error("Không giải mã được ảnh chương này. Thử lại sau.");
        }
        try {
            slices = JSON.parse(decoded);
        } catch (e) {
            slices = null;
        }
        if (!slices || !Array.isArray(slices) || slices.length !== pages.length) {
            return Response.error("Không giải mã được ảnh chương này. Thử lại sau.");
        }
    }
    var images = [];
    for (var j = 0; j < pages.length; j++) {
        var page = pages[j];
        if (!page.image_url) continue;
        if (hasDrm && pages[j].drm_data && slices[j] && Array.isArray(slices[j]) && slices[j].length > 0) {
            images.push({
                link: page.image_url + " " + JSON.stringify(slices[j]),
                script: "image.js",
                width: page.width || 0,
                height: page.height || 0
            });
        } else {
            images.push(page.image_url);
        }
    }
    if (images.length === 0) {
        return Response.error("Chương này chưa có ảnh. Thử lại sau.");
    }
    return Response.success(images);
}
