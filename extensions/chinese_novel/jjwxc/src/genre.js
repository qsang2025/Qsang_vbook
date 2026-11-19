// genre.js — Danh sach the loai (execute() -> cac muc).
//
// 5 nhom theo tham so xx cua bookbase.php (言情/纯爱/百合/无CP/多元,
// lay tu form loc tren trang truyen, kiem chung live 2026-11-19),
// cong 免费文库 va 完结作品 cua bookbase_slave.php. Danh sach xx
// cung co trong file helper.js (CATEGORIES) de detail.js doi ten
// the loai thanh link. Tat ca deu do gen.js xu ly.
//
// Tai len: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
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
    var i = 0;
    for (i = 0; i < CATEGORIES.length; i++) {
        out.push({ title: CATEGORIES[i].title, input: CATEGORIES[i].input, script: "gen.js" });
    }
    out.push({ title: "免费文库", input: "/bookbase_slave.php?booktype=free", script: "gen.js" });
    out.push({ title: "完结作品", input: "/bookbase_slave.php?endstr=2&orderstr=1", script: "gen.js" });
    return Response.success(out);
}
