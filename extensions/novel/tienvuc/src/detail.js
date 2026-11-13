// detail.js — Chi tiet truyen: GET /api/reading/<slug>.
// Trang thai: status "D" = Hoan thanh, khac "D" = Dang ra.
// The loai tro ve cate.js; binh luan tro ve comment.js (input la URL truyen).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
url = normalizeUrl(url);
var slug = slugOf(url);
if (!slug) return Response.error("Không xác định được truyện từ đường dẫn.");

var r = fetchTvApi("/api/reading/" + encodeURIComponent(slug));
if (r.error) return Response.error(r.error);

var detail = r.json || {};
if (!detail.name) return Response.error("Không thể tải thông tin truyện.");

var ongoing = detail.status!== "D";
var statusText = ongoing? "Đang ra": "Hoàn thành";
var authorName = "Đang cập nhật";
if (detail.author && detail.author.name) {
authorName = cleanText(detail.author.name);
} else if (detail.createdBy && detail.createdBy.name) {
authorName = cleanText(detail.createdBy.name);
}

// The loai (chip tren man hinh chi tiet).
var genres = [];
var genreNames = [];
if (detail.categories && detail.categories.length > 0) {
for (var i = 0; i < detail.categories.length; i++) {
var cat = detail.categories[i];
if (cat && cat.name && cat.slug) {
genres.push({ title: cat.name, input: cat.slug, script: "cate.js"});
genreNames.push(cat.name);
}
}
}

// Anh bia.
var cover = "";
if (detail.cover) {
if (typeof detail.cover === "string") {
cover = detail.cover;
} else if (detail.cover.domain && detail.cover.url) {
cover = detail.cover.domain + "/" + detail.cover.url;
}
}

// Khoi thong tin chi tiet.
var detailInfo = "";
detailInfo += "Tác giả: " + authorName;
detailInfo += "<br>Trạng thái: " + statusText;
if (detail.vip === true) {
detailInfo += " ";
}
if (detail.views) {
detailInfo += "<br>Lượt xem: " + detail.views;
}
if (genreNames.length > 0) {
detailInfo += "<br>Thể loại: " + genreNames.join(", ");
}
if (detail.updatedAt) {
detailInfo += "<br>Cập nhật: " + String(detail.updatedAt).split("T")[0];
}

return Response.success({
name: detail.name,
cover: normalizeUrl(cover),
author: authorName,
description: stripHtml(detail.intro || ""),
detail: detailInfo,
url: url,
type: "novel",
format: "novel",
ongoing: ongoing,
genres: genres,
comments: [
{ title: "Bình luận", input: url, script: "comment.js"}
]
});
}
