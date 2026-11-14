// rankcontent.js — Bang xep hang: API /novel/rank/fanqie tra toan bo
// nhom bang (moi nhom 30 truyen), cat thanh trang 20 truyen/trang o day.
load("config.js");
load("rate-limit.js");
var RANK_PAGE_SIZE = 20;

function collectRank(rankName, start, end) {
    var r = fetchApi("/novel/rank/fanqie", true);
    if (!r.json) return { error: r.error };

    var json = r.json;
    if (json.code !== 200) return { error: "Tải bảng xếp hạng thất bại" };

    var groups = json.data;
    if (!groups || !groups.length) return { error: "Không có dữ liệu" };

    var result = [], seen = {};
    var uniqueCount = 0, hasNext = false, done = false;
    for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        if (rankName && group.rank_name !== rankName) continue;
        var books = group.books;
        if (!books || !books.length) continue;
        for (var j = 0; j < books.length; j++) {
            var b = books[j];
            var id = b.my_novel_id || b.articleid;
            var name = b.title || b.articlename;
            var key = "id_" + id;
            if (!id || !name || seen[key]) continue;
            if (uniqueCount >= end) {
                hasNext = true;
                done = true;
                break;
            }
            seen[key] = true;

            if (uniqueCount >= start) {
                var desc = b.author || "";
                if (group.category_name) desc = desc ? desc + " · " + group.category_name : group.category_name;
                result.push({
                    name: name,
                    link: BASE_URL + "/novel.html?articleid=" + id,
                    host: BASE_URL,
                    cover: coverUrl(id),
                    description: desc
                });
            }
            uniqueCount++;
        }
        if (done) break;
    }
    return { items: result, hasNext: hasNext, hasItems: uniqueCount > 0 };
}

function execute(rankName, page) {
    var p = parseInt(page, 10) || 1;
    if (p < 1) p = 1;
    var start = (p - 1) * RANK_PAGE_SIZE;
    var collected = collectRank(rankName || "", start, start + RANK_PAGE_SIZE);
    if (collected.error) return Response.error(collected.error);
    if (!collected.hasItems) return Response.error("Không có dữ liệu");

    return Response.success(collected.items, collected.hasNext ? String(p + 1) : "");
}
