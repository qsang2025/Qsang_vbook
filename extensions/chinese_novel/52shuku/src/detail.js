// detail.js — Chi tiet truyen 52书库 (52shuku.net).
//
// Trang chi tiet /<cat>/<NN>_b/<hash>.html (hoac dang rut gon
// /<cat>/<hash>.html), HTML tinh (kiem chung live 2026-11-13):
// - Ten + tac gia + trang thai o h1.article-title, dang
// "<ten>_<tac gia>" / "" / "".
// - Mo ta o article.article-content p[1]: chi co ~160 ky tu (gioi thieu +
// 2 doan dau ch.1) — cat bo tu tieu de chuong dau tien tro di, chi giu
// phan gioi thieu.
// - Chuyen muc o doan "所属专题：<tag>" trong article-content.
// - Thoi gian cap nhat o.meta (vd "2025年12月20日 16:40:15").
// - Site KHONG co anh bia (detail khong co <img>).
// - Site gan nhu chi co truyen HOAN THANH (kiem chung: 0 chu "连载" tren
// trang chu + 3 trang the loai) nen duong ongoing=true chua gap case
// that; ongoing = false khi h1 co "完结", true khi co "连载".
// execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
var detailUrl = normalizeUrl(url);
if (!detailUrl) return Response.error("Link truyện không hợp lệ.");

var r = fetch52Doc(detailUrl);
if (r.error) return Response.error(r.error);
var doc = r.doc;

var h1El = safeFirst(doc.select("h1.article-title"));
if (h1El === null) {
return Response.error("Không tìm thấy thông tin truyện.");
}
var parsed = parseTitleAuthor(h1El.text());
if (!parsed.name) {
return Response.error("Không tìm thấy tên truyện.");
}

var ongoing = true;
if (parsed.status.indexOf("完结")!== -1) ongoing = false;

var description = "";
var paras = doc.select("article.article-content p");
if (paras.size() > 1) {
var raw = cleanText(paras.get(1).text());
// Cat bo tu tieu de chuong dau tien tro di, chi giu phan gioi thieu.
var cut = raw.search(/第[0-9一二三四五六七八九十百千]+章/);
if (cut > 0) raw = cleanText(raw.substring(0, cut));
// Bo phan mo dau "《ten》作者：... 简介：" neu con.
var introAt = raw.indexOf("简介：");
if (introAt!== -1) raw = cleanText(raw.substring(introAt + 3));
description = raw;
}
if (!description) description = parsed.name;

var genres = [];
var i = 0;
for (i = 0; i < paras.size(); i++) {
var t = cleanText(paras.get(i).text());
if (t.indexOf("所属专题：") === 0) {
var tag = cleanText(t.substring("所属专题：".length));
if (tag) {
genres.push({ title: tag, input: tag, script: "search.js"});
}
break;
}
}

var metaEl = safeFirst(doc.select(".meta"));
var meta = metaEl === null? "": cleanText(metaEl.text());
var detail = "作者： " + (parsed.author || "Không rõ");
if (parsed.status) detail += "<br>状态： " + parsed.status;
if (meta) detail += "<br>更新： " + meta;

return Response.success({
name: parsed.name,
author: parsed.author,
cover: "",
description: description,
detail: detail,
url: detailUrl,
type: "novel",
format: "novel",
ongoing: ongoing,
genres: genres,
suggests: []
});
}
