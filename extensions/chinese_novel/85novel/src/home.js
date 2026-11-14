// home.js — Tab trang chu tinh (khong fetch).
// 5 tab: moi cap nhat + 3 kenh Nam/Nu/Van hoc + bang xep hang.
// Load: file config.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");

function execute() {
    return Response.success([
        { title: "最新更新", input: "/list/index", script: "gen.js" },
        { title: "男生小說", input: "/list/1/", script: "gen.js" },
        { title: "女生小說", input: "/list/2/", script: "gen.js" },
        { title: "文學刊物", input: "/list/3/", script: "gen.js" },
        { title: "排行榜", input: "/top/index", script: "gen.js" }
    ]);
}
