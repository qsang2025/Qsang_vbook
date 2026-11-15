// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha 6.9).
// Cac muc cua site (kiem chung live 2026-11-16): /tongren/ (同人小说),
// /changgui/ (常规小说), /hot/ (热门排行) + trang chu / (最新更新, 20 sach,
// khong phan trang). Moi tab tro ve gen.js.
load('config.js');

function execute() {
    return Response.success([
        { title: "同人小说", input: BASE_URL + "/tongren/", script: "gen.js" },
        { title: "常规小说", input: BASE_URL + "/changgui/", script: "gen.js" },
        { title: "热门排行", input: BASE_URL + "/hot/", script: "gen.js" },
        { title: "最新更新", input: BASE_URL + "/", script: "gen.js" }
    ]);
}
