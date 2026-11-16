// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha 6.9).
// 7 muc chinh cua site (kiem chung live 2026-11-16 trong nav trang chu).
// Moi tab tro ve gen.js.
load('config.js');

function execute() {
    return Response.success([
        { title: "现代耽美", input: BASE_URL + "/xiandai/", script: "gen.js" },
        { title: "古代耽美", input: BASE_URL + "/gudai/", script: "gen.js" },
        { title: "穿越重生", input: BASE_URL + "/chuanyue/", script: "gen.js" },
        { title: "玄幻灵异", input: BASE_URL + "/qihuan/", script: "gen.js" },
        { title: "网游竞技", input: BASE_URL + "/wangyou/", script: "gen.js" },
        { title: "同人耽美", input: BASE_URL + "/tongren/", script: "gen.js" },
        { title: "GL百合", input: BASE_URL + "/baihe/", script: "gen.js" }
    ]);
}
