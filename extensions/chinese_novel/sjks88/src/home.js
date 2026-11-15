// home.js — Tab tinh tren trang chu (execute() -> tabs).
//
// 6 tab tinh (kiem chung live 2026-11-16): 最新 /latest/, 总排行榜
// /ranking/, 玄幻 /xuanhuan/, 都市 /ds/, 穿越 /chuanyue/, 武侠 /wuxia/.
// Tat ca deu la trang danh sach ul.list li, gen.js xu ly. Trang chu
// cua site khong co danh sach truyen nen khong fetch trang chu.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
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
        { title: "最新", input: "/latest/", script: "gen.js" },
        { title: "排行", input: "/ranking/", script: "gen.js" },
        { title: "玄幻", input: "/xuanhuan/", script: "gen.js" },
        { title: "都市", input: "/ds/", script: "gen.js" },
        { title: "穿越", input: "/chuanyue/", script: "gen.js" },
        { title: "武侠", input: "/wuxia/", script: "gen.js" }
    ]);
}
