// chap.js (video: buoc 1 cua chap -> track) — tra ve danh sach lua chon luong phat
// cho mot tap phim FQ Video. URL stream qznovelvod.com co han su dung (~1 gio), nen
// chap.js dong goi payload JSON { seriesId, itemId, mode } de track.js goi API lay
// link MP4 moi nhat dung luc nguoi dung bam phat.
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var ids = extractPlayerIds(url);
    if (!ids.itemId) {
        return Response.error("URL tập phim không hợp lệ (không tìm thấy mã tập): " + String(url || ""));
    }

    return Response.success([
        {
            title: "HD Trực tiếp (Tự động)",
            data: JSON.stringify({
                seriesId: ids.seriesId,
                itemId: ids.itemId,
                mode: "hd"
            })
        },
        {
            title: "MP4 Tiêu chuẩn (Dự phòng)",
            data: JSON.stringify({
                seriesId: ids.seriesId,
                itemId: ids.itemId,
                mode: "fallback"
            })
        }
    ]);
}
