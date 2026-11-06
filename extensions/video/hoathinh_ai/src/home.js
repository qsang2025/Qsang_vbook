// home.js — cac tab trang chu cua Hoat Hinh AI Trung Quoc (Dailymotion).
// Tab TINH, khong fetch (AGENTS.md §6 quy tac 9): moi tab tro ve search.js
// voi input la tu khoa da chon san (khao sat 2026-11-06, explorer_r1_3
// muc 1.5). App chay tab dau tien ngay khi mo extension — fetch o day
// se chan ca trang chu neu loi.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('helper.js');

function execute() {
    var tabs = [];
    var i = 0;
    for (i = 0; i < CURATED_QUERIES.length; i++) {
        tabs.push({
            title: CURATED_QUERIES[i].title,
            input: CURATED_QUERIES[i].input,
            script: "search.js"
        });
    }
    return Response.success(tabs);
}
