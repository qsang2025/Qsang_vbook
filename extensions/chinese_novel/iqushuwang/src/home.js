// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 4 tab sap xep + 9 tab the loai (kiem chung live 2026-11-16):
// /list/0/ = moi nhat, /lastupdate_0_0_0_ = cap nhat,
// /allvisit_0_0_0_ = xep hang, /monthvisit_0_0_2_ = hoan thanh,
// /list/<1-9>/ = 9 the loai. Moi tab chay gen.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Mới nhất", input: "https://www.iqushuwang.com/list/0/1.html", script: "gen.js" },
        { title: "Cập nhật", input: "https://www.iqushuwang.com/lastupdate_0_0_0_1.html", script: "gen.js" },
        { title: "Xếp hạng", input: "https://www.iqushuwang.com/allvisit_0_0_0_1.html", script: "gen.js" },
        { title: "Hoàn thành", input: "https://www.iqushuwang.com/monthvisit_0_0_2_1.html", script: "gen.js" },
        { title: "玄幻奇幻", input: "https://www.iqushuwang.com/list/1/1.html", script: "gen.js" },
        { title: "修真武侠", input: "https://www.iqushuwang.com/list/2/1.html", script: "gen.js" },
        { title: "都市情感", input: "https://www.iqushuwang.com/list/3/1.html", script: "gen.js" },
        { title: "历史军事", input: "https://www.iqushuwang.com/list/4/1.html", script: "gen.js" },
        { title: "网游竞技", input: "https://www.iqushuwang.com/list/5/1.html", script: "gen.js" },
        { title: "科幻冒险", input: "https://www.iqushuwang.com/list/6/1.html", script: "gen.js" },
        { title: "浪漫言情", input: "https://www.iqushuwang.com/list/7/1.html", script: "gen.js" },
        { title: "耽美同人", input: "https://www.iqushuwang.com/list/8/1.html", script: "gen.js" },
        { title: "其他类型", input: "https://www.iqushuwang.com/list/9/1.html", script: "gen.js" }
    ]);
}
