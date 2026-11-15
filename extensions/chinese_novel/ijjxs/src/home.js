// home.js — Tab trang chu (chi tra tab tinh, khong fetch).
//
// 6 tab tinh (kiem chung live 2026-11-16): cac trang the loai dung bo
// cuc .catalog .listbg (gen.js), 10 truyen/trang, phan trang
// /txt/<cat>/index_<N>.html.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻魔法", input: "/txt/xuanhuan/", script: "gen.js" },
        { title: "穿越", input: "/txt/chuanyue/", script: "gen.js" },
        { title: "仙侠幻想", input: "/txt/wuxia/", script: "gen.js" },
        { title: "同人衍生", input: "/txt/tongrenxiaoshuo/", script: "gen.js" },
        { title: "耽于纯美", input: "/txt/dmtr/", script: "gen.js" },
        { title: "现代言情", input: "/txt/young/", script: "gen.js" }
    ]);
}
