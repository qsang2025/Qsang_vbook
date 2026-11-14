// chap.js — Noi dung 1 chuong qua API.
// URL dang /read/<storyId>/<chapterNumber>?v=<versionId> (v do toc.js gan).
// Neu thieu v thi tu giai quyet qua translate-versions.
// Chuong VIP: has_access=false, content rong — tra loi tieng Viet ro rang,
// KHONG mo khoa, khong lay teaser lam noi dung.
// Dong quang cao cuoi chuong ("Trang Nạp Xu dự phòng... napxu...") duoc loc bo.
load("config.js");
load("rate-limit.js");

function parseReadUrl(url) {
    if (!url) return null;
    var m = String(url).match(/read\/(\d+)\/(\d+)/);
    if (!m) return null;
    var vm = String(url).match(/[?&]v=(\d+)/);
    return {
        storyId: m[1],
        chapterNumber: m[2],
        versionId: vm ? vm[1] : null
    };
}

// Loc dong quang cao Nap Xu cuoi chuong + chuan hoa thanh cac doan <p>.
function formatContent(content) {
    var text = String(content || "");
    var lines = text.split(/\r\n|\r|\n/);
    var kept = [];
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var low = line.toLowerCase();
        if (low.indexOf("napxu") >= 0) continue;
        if (low.indexOf("nạp xu dự phòng") >= 0) continue;
        kept.push(line);
    }
    text = kept.join("\n");
    if (text.indexOf("<p") >= 0 || text.indexOf("<br") >= 0 || text.indexOf("<div") >= 0) {
        return text;
    }
    var paras = text.split(/\n\s*\n/);
    var html = "";
    for (var j = 0; j < paras.length; j++) {
        var p = paras[j].replace(/^\s+|\s+$/g, "").replace(/\n/g, "<br>");
        if (p) html += "<p>" + p + "</p>";
    }
    return html;
}

function execute(url) {
    var info = parseReadUrl(url);
    if (!info) return Response.error("Link chương không hợp lệ");

    var versionId = info.versionId;
    if (!versionId) {
        var rv = resolveVersionId(info.storyId);
        if (rv.error) return Response.error(rv.error);
        versionId = String(rv.versionId);
    }

    var api = API_URL + "/api/chapters/" + versionId + "/read/" + info.chapterNumber + "?story_id=" + info.storyId;
    var rr = stvFetchJson(api, { referer: url });
    if (rr.error) return Response.error(rr.error);
    var json = rr.json;
    if (!json || !json.data) return Response.error("Không đọc được nội dung chương");
    var d = json.data;

    if (d.has_access === false) {
        var msg = "Chương VIP — cần đăng nhập hoặc mua trên sitruyencv.com.";
        if (d.vip_from_chapter) {
            msg = "Chương VIP (từ chương " + d.vip_from_chapter + ") — cần đăng nhập hoặc mua trên sitruyencv.com.";
        }
        return Response.error(msg);
    }

    var content = d.content || "";
    if (!content) {
        return Response.error("Nội dung chương trống.");
    }
    var title = d.title ? String(d.title) : "";
    return Response.success(formatContent(content), title);
}
