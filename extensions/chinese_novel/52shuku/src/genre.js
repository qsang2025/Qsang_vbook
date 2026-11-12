// genre.js — Danh sach the loai 52书库 (52shuku.net).
//
// Danh sach cung (hardcode) cac trang the loai co layout article.excerpt,
// da kiem chung live 2026-11-13 (moi trang 25-27 truyen/trang 1).
// /nan/, /DanMei/, /QiTa/, /Top/, /tuijian/, /zuozhe/ la trang goi y /
// xep hang, khong co article.excerpt nen khong dua vao day.
function execute() {
    return Response.success([
        { title: "言情小说", input: "/yanqing/", script: "gen.js" },
        { title: "综漫同人", input: "/bl/", script: "gen.js" },
        { title: "GL百合", input: "/gl/", script: "gen.js" },
        { title: "穿越耽美", input: "/chongsheng/", script: "gen.js" },
        { title: "古架耽美", input: "/jiakong/", script: "gen.js" },
        { title: "现代耽美", input: "/xiandaidushi/", script: "gen.js" },
        { title: "科幻架空", input: "/KeHuan/", script: "gen.js" },
        { title: "武侠玄幻", input: "/wuxia/", script: "gen.js" },
        { title: "穿越重生", input: "/chuanyue/", script: "gen.js" },
        { title: "军事历史", input: "/jiakonglishi/", script: "gen.js" },
        { title: "现代都市_男频", input: "/xiandai/", script: "gen.js" },
        { title: "网游竞技_男频", input: "/wangyou/", script: "gen.js" },
        { title: "悬疑推理小说", input: "/tuili/", script: "gen.js" },
        { title: "恐怖灵异小说", input: "/kongbulingyi/", script: "gen.js" },
        { title: "文学著作", input: "/wenxue/", script: "gen.js" }
    ]);
}
