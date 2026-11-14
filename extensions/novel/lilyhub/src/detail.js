// detail.js — Thong tin truyen LilyHub.
// url co the la https://www.lilyhub.top/truyen/<uuid> hoac chi uuid.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

// Chan doan 1 lan: status that + 120 ky tu dau body, de loi hien ra trong app.
function lilyDiag() {
    var parts = [];
    try {
        var r = pacedFetch(LILY_API_HOSTS[0] + "novels?select=id&limit=1", {
            headers: lilyHeaders(),
            timeout: 15000,
            maxRetries: 0
        });
        if (!r.res) {
            parts.push("fetch=null,status=" + r.status);
        } else {
            parts.push("status=" + r.status + ",ok=" + r.ok);
            var t = "";
            try { t = r.res.text() + ""; } catch (e) { t = ""; }
            parts.push("len=" + t.length + ",head=" + t.substring(0, 120));
        }
    } catch (e) {
        parts.push("exception=" + (e + ""));
    }
    return parts.join(" ");
}

function execute(url) {
    var id = "";
    var rows = null;
    try {
        id = lilyNovelId(url);
        if (!id) return Response.error("Không đọc được mã truyện từ URL này: " + url);
        rows = lilyQuery("novels?select=*&id=eq." + id + "&limit=1");
    } catch (e) {
        return Response.error("Lỗi khi gọi LilyHub: " + (e + ""));
    }

    if (!rows) {
        // Bao kem chan doan de biet la loi mang / khoa / parse chu khong phai "im lang".
        return Response.error("Không lấy được dữ liệu. id=" + id + " | " + lilyDiag());
    }
    if (!rows.length) return Response.error("Không tìm thấy truyện này trên LilyHub. id=" + id);

    var n = rows[0];
    var desc = lilyCleanDesc(n.description);
    if (!desc) desc = "Chưa có mô tả.";

    var author = (n.author ? n.author + "" : "Ẩn danh");
    if (n.translator) author = author + " (Dịch: " + n.translator + ")";

    var genres = [];
    if (n.category) genres.push({ title: n.category + "", input: "cat:" + n.category, script: "gen.js" });
    var suggests = [];
    if (n.category) suggests.push({ title: "Cùng thể loại: " + n.category, input: "cat:" + n.category, script: "gen.js" });
    var tags = [];
    if (n.tags && n.tags.length) {
        for (var i = 0; i < n.tags.length; i++) {
            if (n.tags[i]) tags.push(n.tags[i] + "");
        }
    }

    var chCount = parseInt(n.chapter_count, 10);
    if (isNaN(chCount)) chCount = 0;
    var info = [];
    info.push("Tác giả: " + author);
    info.push("Tình trạng: " + lilyStatusText(n.status));
    info.push("Số chương: " + chCount);
    if (tags.length) info.push("Nhãn: " + tags.join(", "));
    if (n.votes) info.push("Lượt thích: " + n.votes);
    if (n.views) info.push("Lượt xem: " + n.views);
    if (n.rating) info.push("Điểm: " + n.rating);

    return Response.success({
        name: n.title + "",
        cover: lilyCover(n.cover_url),
        host: "https://www.lilyhub.top",
        author: author,
        description: desc,
        detail: info.join("<br>"),
        url: BASE_URL + "/truyen/" + id,
        type: "novel",
        format: "novel",
        ongoing: n.status === "ongoing",
        genres: genres,
        suggests: suggests
    });
}
