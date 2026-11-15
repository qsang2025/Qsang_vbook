// genre.js — Danh sach the loai (chi tra muc tinh, khong fetch).
//
// 15 the loai song (kiem chung live tu nav trang chu + tung trang
// 2026-11-16, moi trang 10 muc). Cac trang the loai dung bo cuc
// .catalog .listbg (gen.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "穿越", input: "/txt/chuanyue/", script: "gen.js" },
        { title: "重生", input: "/txt/chongshengxiaoshuo/", script: "gen.js" },
        { title: "古代架空", input: "/txt/lsjs/", script: "gen.js" },
        { title: "现代言情", input: "/txt/young/", script: "gen.js" },
        { title: "总裁豪门", input: "/txt/qinggan/", script: "gen.js" },
        { title: "仙侠幻想", input: "/txt/wuxia/", script: "gen.js" },
        { title: "同人衍生", input: "/txt/tongrenxiaoshuo/", script: "gen.js" },
        { title: "无限流", input: "/txt/wuxianliu/", script: "gen.js" },
        { title: "耽于纯美", input: "/txt/dmtr/", script: "gen.js" },
        { title: "玄幻魔法", input: "/txt/xuanhuan/", script: "gen.js" },
        { title: "都市异能", input: "/txt/dushi/", script: "gen.js" },
        { title: "历史军事", input: "/txt/tiexue/", script: "gen.js" },
        { title: "网游小说", input: "/txt/juben/", script: "gen.js" },
        { title: "惊悚悬疑", input: "/txt/kongbu/", script: "gen.js" },
        { title: "文学名著", input: "/txt/gdmz/", script: "gen.js" }
    ]);
}
