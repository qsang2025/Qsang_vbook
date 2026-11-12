// home.js — Cac tab trang chu 52书库 (52shuku.net).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Cac tab la trang the loai co layout article.excerpt (kiem chung live
// 2026-11-13); /nan/, /DanMei/, /QiTa/, /Top/, /tuijian/ la trang goi y,
// khong co article.excerpt nen khong dung lam tab.
function execute() {
    return Response.success([
        { title: "言情小说", input: "/yanqing/", script: "gen.js" },
        { title: "综漫同人", input: "/bl/", script: "gen.js" },
        { title: "GL百合", input: "/gl/", script: "gen.js" },
        { title: "穿越耽美", input: "/chongsheng/", script: "gen.js" },
        { title: "科幻架空", input: "/KeHuan/", script: "gen.js" },
        { title: "武侠玄幻", input: "/wuxia/", script: "gen.js" }
    ]);
}
