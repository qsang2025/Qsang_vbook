// toc.js — muc luc danh sach tap cua mot bo phim FQ Video.
// Lay day du vid_list va accessible_episode_cnt tu hongguoduanju.com/detail,
// dong thoi lam giau ten tap tieng Trung tu fanqienovel.com/api/reader/directory/detail
// (fallback an toan ve "第N集" neu API directory khong tra ve).
// Danh dau lock: true cho cac tap vuot qua accessible_episode_cnt (tap 6+ tren web).
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var seriesId = extractSeriesId(url);
    if (!seriesId) {
        return Response.error("URL phim không hợp lệ (không tìm thấy mã series_id): " + String(url || ""));
    }

    var res = fetchSeriesDetail(seriesId);
    if (!res.ok) return Response.error(res.error);

    var sd = res.detail;
    var accessibleCnt = parseInt(sd.accessible_episode_cnt, 10);
    if (isNaN(accessibleCnt) || accessibleCnt < 0) accessibleCnt = 5;

    var vidList = sd.vid_list instanceof Array ? sd.vid_list : [];
    var dir = fetchFanqieDirectory(seriesId);
    var titleMap = dir.titleMap || {};

    if (vidList.length === 0 && dir.itemIds && dir.itemIds.length > 0) {
        vidList = dir.itemIds;
    }

    var chapters = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < vidList.length; i++) {
        var vid = String(vidList[i] || "").replace(/^\s+|\s+$/g, "");
        if (!vid || seen[vid]) continue;
        seen[vid] = true;

        var idx = chapters.length;
        var epTitle = titleMap[vid] ? titleMap[vid] : ("第" + (idx + 1) + "集");
        var locked = idx >= accessibleCnt;

        chapters.push({
            name: epTitle,
            url: canonicalEpisodeUrl(seriesId, vid),
            description: locked ? "Cần app Fanqie / Hồng Quả (web mở " + accessibleCnt + " tập đầu)" : "",
            lock: locked,
            pay: false
        });
    }

    if (chapters.length === 0) {
        return Response.error("Không tìm thấy danh sách tập cho phim này (ID " + seriesId + ").");
    }

    return Response.success(chapters);
}
