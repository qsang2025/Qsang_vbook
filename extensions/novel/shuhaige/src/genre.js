// genre.js — danh sach the loai cua 书海阁 (shuhaige.tw).
// DU 16 the loai (khao sat 2026-11-07, nav trang chu + /sort.html):
// xuanhuan 玄幻奇幻, wuxia 武侠仙侠, dushi 都市生活, lishi 历史军事,
// youxi 游戏竞技, kehuan 科幻未来, xuanyi 恐怖悬疑, qita 其他类型,
// guyan 古代言情, xianyan 现代言情, huanqing 幻想奇缘, zongcai 游戏情缘,
// qingchun 浪漫青春, wangluo 言情美文, mmkehuan 科幻灵异, mmqita 其他类型.
// Moi muc tro ve book.js voi input /<slug>/.
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻奇幻", input: "/xuanhuan/", script: "book.js" },
        { title: "武侠仙侠", input: "/wuxia/", script: "book.js" },
        { title: "都市生活", input: "/dushi/", script: "book.js" },
        { title: "历史军事", input: "/lishi/", script: "book.js" },
        { title: "游戏竞技", input: "/youxi/", script: "book.js" },
        { title: "科幻未来", input: "/kehuan/", script: "book.js" },
        { title: "恐怖悬疑", input: "/xuanyi/", script: "book.js" },
        { title: "其他类型", input: "/qita/", script: "book.js" },
        { title: "古代言情", input: "/guyan/", script: "book.js" },
        { title: "现代言情", input: "/xianyan/", script: "book.js" },
        { title: "幻想奇缘", input: "/huanqing/", script: "book.js" },
        { title: "游戏情缘", input: "/zongcai/", script: "book.js" },
        { title: "浪漫青春", input: "/qingchun/", script: "book.js" },
        { title: "言情美文", input: "/wangluo/", script: "book.js" },
        { title: "科幻灵异", input: "/mmkehuan/", script: "book.js" },
        { title: "其他类型", input: "/mmqita/", script: "book.js" }
    ]);
}
