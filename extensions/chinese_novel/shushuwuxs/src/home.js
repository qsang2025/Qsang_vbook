// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
//
// Cac chuyen muc that cua site (nav trang chu):
// - Nam: /xuanhuan/ 玄幻, /wuxia/ 武侠, /dushi/ 都市, /lishi/ 历史,
//   /youxi/ 游戏, /kehuan/ 科幻, /xuanyi/ 恐怖, /qita/ 其他
// - Nu: /guyan/ 古代, /xianyan/ 现代, /huanqing/ 幻想, /zongcai/ 游戏,
//   /qingchun/ 浪漫, /wangluo/ 言情, /mmkehuan/ 科幻, /mmqita/ 其他
//   (3 muc trung ten voi nam nen them hau to (nu) de phan biet)
// - Bang xep hang: /allvisit/ 点击榜, /allvote/ 推荐榜, /goodnum/ 收藏榜,
//   /quanben/ 完结榜, /postdate/ 新书榜; /lastupdate/ 最近更新;
//   /all/ 全部小说.
// Moi tab tro ve book.js voi input la URL chuyen muc day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "最近更新", input: BASE_URL + "/lastupdate/", script: "book.js" },
        { title: "玄幻", input: BASE_URL + "/xuanhuan/", script: "book.js" },
        { title: "武侠", input: BASE_URL + "/wuxia/", script: "book.js" },
        { title: "都市", input: BASE_URL + "/dushi/", script: "book.js" },
        { title: "历史", input: BASE_URL + "/lishi/", script: "book.js" },
        { title: "游戏", input: BASE_URL + "/youxi/", script: "book.js" },
        { title: "科幻", input: BASE_URL + "/kehuan/", script: "book.js" },
        { title: "恐怖", input: BASE_URL + "/xuanyi/", script: "book.js" },
        { title: "其他", input: BASE_URL + "/qita/", script: "book.js" },
        { title: "古代", input: BASE_URL + "/guyan/", script: "book.js" },
        { title: "现代", input: BASE_URL + "/xianyan/", script: "book.js" },
        { title: "幻想", input: BASE_URL + "/huanqing/", script: "book.js" },
        { title: "游戏(女)", input: BASE_URL + "/zongcai/", script: "book.js" },
        { title: "浪漫", input: BASE_URL + "/qingchun/", script: "book.js" },
        { title: "言情", input: BASE_URL + "/wangluo/", script: "book.js" },
        { title: "科幻(女)", input: BASE_URL + "/mmkehuan/", script: "book.js" },
        { title: "其他(女)", input: BASE_URL + "/mmqita/", script: "book.js" },
        { title: "点击榜", input: BASE_URL + "/allvisit/", script: "book.js" },
        { title: "推荐榜", input: BASE_URL + "/allvote/", script: "book.js" },
        { title: "收藏榜", input: BASE_URL + "/goodnum/", script: "book.js" },
        { title: "完结榜", input: BASE_URL + "/quanben/", script: "book.js" },
        { title: "新书榜", input: BASE_URL + "/postdate/", script: "book.js" },
        { title: "全部小说", input: BASE_URL + "/all/", script: "book.js" }
    ]);
}
