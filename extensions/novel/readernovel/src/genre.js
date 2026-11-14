// genre.js — Danh sach the loai doc live tu form loc tren /browse.
//
// Moi the loai la 1 div.form-check trong form #collapseFilter: input
// name="genre[]" (value = id so) + span.checkbox-text (ten). Cac radio
// trang thai (name="status") dung chung class span nen phai loc theo
// ten input. The loai co ten rong (id 42) bi bo.
//
// The loai 18+/nhay cam bi loc khoi danh sach (tien le FanMTL #68,
// NovelPhoenix #70): Adult, Adult romance, Ecchi, Erotic, Lolicon,
// Mature, Mature romance, Smut, Steamy stories. Dao nguoc duoc neu
// Anh quyet.
//
// Load: file config.js, file rate-limit.js.
load('config.js');
load('rate-limit.js');

var BLOCKED_GENRES = ["adult", "adult romance", "ecchi", "erotic", "lolicon", "mature", "mature romance", "smut", "steamy stories"];

function execute() {
    var rr = ttlFetchDoc(BASE_URL + "/browse");
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    var genres = [];
    var seen = {};
    var boxes = doc.select("#collapseFilter div.form-check");
    for (var i = 0; i < boxes.size(); i++) {
        var box = boxes.get(i);
        var input = selFirst(box, "input[name=genre[]]");
        if (!input) continue;
        var id = (input.attr("value") || "").trim();
        if (!id) continue;
        var title = cleanText(box.select("span.checkbox-text").text());
        if (!title) continue;
        if (seen[id]) continue;
        seen[id] = true;
        var lower = title.toLowerCase();
        var blocked = false;
        for (var b = 0; b < BLOCKED_GENRES.length; b++) {
            if (lower === BLOCKED_GENRES[b]) { blocked = true; break; }
        }
        if (blocked) continue;
        genres.push({ title: title, input: "/browse?sort=name&status=0&genre[]=" + id, script: "gen.js" });
    }
    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại");
    return Response.success(genres);
}
