// genre.js — danh sach the loai (chi tra muc tinh, khong fetch).
//
// Site co 16 the loai that (nav trang chu): 8 nam + 8 nu. 3 muc trung ten
// (游戏, 科幻, 其他) nen them hau to (女) cho muc nu de phan biet.
// Moi muc tro ve book.js (giong tab home).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
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
        { title: "其他(女)", input: BASE_URL + "/mmqita/", script: "book.js" }
    ]);
}
