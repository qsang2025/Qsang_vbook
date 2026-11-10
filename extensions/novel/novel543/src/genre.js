// genre.js — danh sach the loai cua 稷下書院 (novel543.com).
// DU 13 the loai (khao sat 2026-11-10, URL /bookstack/<slug>/):
// xuanhuan 玄幻, xiuzhen 修真, dushi 都市, lishi 歷史, wangyou 網遊,
// kehuan 科幻, nvpin 女頻, lingyi 靈異, tongren 同人, junshi 軍事,
// xuanyi 懸疑, chuanyue 穿越, other 其它.
// Moi muc tro ve book.js voi input /bookstack/<slug>/.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻", input: "/bookstack/xuanhuan/", script: "book.js" },
        { title: "修真", input: "/bookstack/xiuzhen/", script: "book.js" },
        { title: "都市", input: "/bookstack/dushi/", script: "book.js" },
        { title: "歷史", input: "/bookstack/lishi/", script: "book.js" },
        { title: "網遊", input: "/bookstack/wangyou/", script: "book.js" },
        { title: "科幻", input: "/bookstack/kehuan/", script: "book.js" },
        { title: "女頻", input: "/bookstack/nvpin/", script: "book.js" },
        { title: "靈異", input: "/bookstack/lingyi/", script: "book.js" },
        { title: "同人", input: "/bookstack/tongren/", script: "book.js" },
        { title: "軍事", input: "/bookstack/junshi/", script: "book.js" },
        { title: "懸疑", input: "/bookstack/xuanyi/", script: "book.js" },
        { title: "穿越", input: "/bookstack/chuanyue/", script: "book.js" },
        { title: "其它", input: "/bookstack/other/", script: "book.js" }
    ]);
}
