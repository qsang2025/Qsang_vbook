// chap.js — noi dung chuong tu #nr1, tieu de tu h1#nr_title
// ("寄生 - 第一章出访" -> 第一章出访).
// Kiem chung live 2026-11-16 (寄生 ch.1 /novel/105011/27813640.html):
// #nr1 ~1.948 ky tu van xuoi that, mo dau "媒光灯一闪一烁，裴知秦…",
// khong co script ben trong.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url) {
    url = normalizeUrl(url);
    var r = fetchPoDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("#nr1"));
    if (contentEl === null) return Response.error("Không tìm thấy nội dung chương");

    var scripts = contentEl.select("script, style");
    for (var i = scripts.size() - 1; i >= 0; i--) {
        scripts.get(i).remove();
    }
    var content = contentEl.html();
    if (!cleanText(content)) return Response.error("Chương trống");

    var titleEl = safeFirst(doc.select("h1#nr_title"));
    var title = titleEl === null ? "" : cleanText(titleEl.text());
    var separator = title.indexOf(" - ");
    if (separator !== -1) title = title.substring(separator + 3);

    return Response.success(content, title);
}
