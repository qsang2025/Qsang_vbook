// genre.js — Danh sach the loai (execute() -> 16 tag).
// Tag lay tu GENRES (file helper.js) — 16 tag con sach tren /m_tags.html,
// mo qua /e/tags/?tagid=<id>. Link dep /tags-<id>-0.html CHET
// ("此TAG不存在", kiem chung 6 id 2026-11-16) nen khong dung.
// Tag 181 bo: 0 sach + ten mojibake tren chinh site.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute() {
    var out = [];
    for (var i = 0; i < GENRES.length; i++) {
        out.push({ title: GENRES[i].title, input: GENRES[i].input, script: "gen.js" });
    }
    return Response.success(out);
}
