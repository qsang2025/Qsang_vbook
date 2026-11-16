// toc.js — Muc luc truyen tu __NEXT_DATA__ cua trang chi tiet
// (execute(url) -> [{name, url, description}]). URL vao la /works/<id>.
// tableOfContentsV2 chua cac nhom chuong (TableOfContentsChapter), moi
// nhom co tieu de (Chapter.title, vd. 第1章 ...) va danh sach tap
// (episodeUnions -> Episode{id, title}). Toan bo muc luc co trong 1 lan
// goi — khong phan trang, khong can page.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('rate-limit.js');
load('helper.js');

function execute(url) {
    var workId = parseWorkId(url);
    if (!workId) return Response.error("Không đọc được đường dẫn truyện.");
    var detailUrl = BASE_URL + "/works/" + workId;
    var r = fetchKakuText(detailUrl);
    if (r.error) return Response.error(r.error);
    var nd = extractNextData(r.text);
    var state = apolloState(nd);
    if (!state) return Response.error("Không đọc được mục lục.");
    var work = state["Work:" + workId];
    if (!work || !work.tableOfContentsV2) return Response.error("Không đọc được mục lục.");
    var groups = work.tableOfContentsV2;
    var data = [];
    var i = 0;
    for (i = 0; i < groups.length; i++) {
        var gref = groups[i] && groups[i].__ref;
        if (!gref) continue;
        var group = state[gref];
        if (!group) continue;
        var groupTitle = "";
        if (group.chapter && group.chapter.__ref) {
            var ch = state[group.chapter.__ref];
            if (ch && ch.title) groupTitle = cleanText(ch.title);
        }
        var eps = group.episodeUnions || [];
        var j = 0;
        for (j = 0; j < eps.length; j++) {
            var eref = eps[j] && eps[j].__ref;
            if (!eref) continue;
            var ep = state[eref];
            if (!ep || !ep.title || !ep.id) continue;
            data.push({
                name: cleanText(ep.title),
                url: BASE_URL + "/works/" + workId + "/episodes/" + ep.id,
                description: groupTitle
            });
        }
    }
    if (data.length === 0) return Response.error("Truyện chưa có chương nào.");
    return Response.success(data);
}
