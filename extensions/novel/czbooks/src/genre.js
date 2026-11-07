// genre.js — danh sach the loai cua 小說狂人 (czbooks.net).
// DU 25 muc (khao sat 2026-11-07, hard-code theo bang cua site — slug
// lech ten hien thi, KHONG suy tu ten):
//   玄幻奇幻 /c/xuanhuan, 言情 /c/yanqing, 武俠仙俠 /c/xianxia,
//   軍事歷史 /c/lishi, 科幻未來 /c/wangyou (slug wangyou nhung ten la
//   科幻未來, khong phai 网游), 靈異玄幻 /c/lingyi, 女生同人 /c/tongren,
//   原創同人 /c/erciyuan, 耽美 /c/danmei, 百合 /c/baihe, 日系 /c/japan,
//   奇幻冒險 /c/fanatsy (slug sai chinh ta, giu nguyen), 電視劇 /c/drama,
//   情色工口 /c/herotic (NSFW), 耽美工口 /c/blerotic (NSFW),
//   經典文學 /c/classicbook, 推理 /c/suspense, 女性向 /c/girl,
//   短篇 /c/short, 狂人原創 /c/creator,
//   精選排行 /c/normal, 人氣榜 /c/all, 收藏榜 /c/favorite,
//   完本榜 /c/finish, 工口榜 /c/hot (NSFW, bang).
// KHONG co muc 都市 rieng — KHONG bia tab 都市.
// Moi muc tro ve book.js voi input /c/{slug} (trang the loai mac dinh
// sort 最新; bang xep hang mac dinh /day).
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻奇幻", input: "/c/xuanhuan", script: "book.js" },
        { title: "言情", input: "/c/yanqing", script: "book.js" },
        { title: "武俠仙俠", input: "/c/xianxia", script: "book.js" },
        { title: "軍事歷史", input: "/c/lishi", script: "book.js" },
        { title: "科幻未來", input: "/c/wangyou", script: "book.js" },
        { title: "靈異玄幻", input: "/c/lingyi", script: "book.js" },
        { title: "女生同人", input: "/c/tongren", script: "book.js" },
        { title: "原創同人", input: "/c/erciyuan", script: "book.js" },
        { title: "耽美", input: "/c/danmei", script: "book.js" },
        { title: "百合", input: "/c/baihe", script: "book.js" },
        { title: "日系", input: "/c/japan", script: "book.js" },
        { title: "奇幻冒險", input: "/c/fanatsy", script: "book.js" },
        { title: "電視劇", input: "/c/drama", script: "book.js" },
        { title: "情色工口", input: "/c/herotic", script: "book.js" },
        { title: "耽美工口", input: "/c/blerotic", script: "book.js" },
        { title: "經典文學", input: "/c/classicbook", script: "book.js" },
        { title: "推理", input: "/c/suspense", script: "book.js" },
        { title: "女性向", input: "/c/girl", script: "book.js" },
        { title: "短篇", input: "/c/short", script: "book.js" },
        { title: "狂人原創", input: "/c/creator", script: "book.js" },
        { title: "精選排行", input: "/c/normal", script: "book.js" },
        { title: "人氣榜", input: "/c/all", script: "book.js" },
        { title: "收藏榜", input: "/c/favorite", script: "book.js" },
        { title: "完本榜", input: "/c/finish", script: "book.js" },
        { title: "工口榜", input: "/c/hot", script: "book.js" }
    ]);
}
