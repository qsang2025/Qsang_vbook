// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 4 tab tinh (kiem chung live 2026-11-19): 最新更新
// (bookbase_slave.php?orderstr=1, theo thoi gian cap nhat), 免费文库
// (booktype=free, thu vien mien phi), 完结作品 (endstr=2&orderstr=1,
// truyen da xong), 作品积分榜 (orderstr=2, theo diem tac pham).
// Tat ca deu la trang danh sach bang tr, gen.js xu ly.
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
    return Response.success([
        { title: "最新更新", input: "/bookbase_slave.php?orderstr=1", script: "gen.js" },
        { title: "免费文库", input: "/bookbase_slave.php?booktype=free", script: "gen.js" },
        { title: "完结作品", input: "/bookbase_slave.php?endstr=2&orderstr=1", script: "gen.js" },
        { title: "作品积分榜", input: "/bookbase_slave.php?orderstr=2", script: "gen.js" }
    ]);
}
