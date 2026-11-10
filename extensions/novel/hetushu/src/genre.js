// genre.js — danh sach the loai cua 和图书 (hetushu.com).
// DU 13 the loai (khao sat 2026-11-10, URL /book/index.php?type=):
// 玄幻小说, 仙侠小说, 网游小说, 穿越小说, 都市小说, 科幻小说, 武侠小说,
// 历史小说, 竞技小说, 言情小说, 悬疑小说, 军事小说, 灵异小说.
// Moi muc tro ve book.js voi input la duong dan danh sach (type da
// percent-encode san vi ten the loai la tieng Trung).
// Khong can load config.js vi genre.js khong fetch gi ca.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻小说", input: "/book/index.php?type=%E7%8E%84%E5%B9%BB%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "仙侠小说", input: "/book/index.php?type=%E4%BB%99%E4%BE%A0%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "网游小说", input: "/book/index.php?type=%E7%BD%91%E6%B8%B8%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "穿越小说", input: "/book/index.php?type=%E7%A9%BF%E8%B6%8A%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "都市小说", input: "/book/index.php?type=%E9%83%BD%E5%B8%82%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "科幻小说", input: "/book/index.php?type=%E7%A7%91%E5%B9%BB%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "武侠小说", input: "/book/index.php?type=%E6%AD%A6%E4%BE%A0%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "历史小说", input: "/book/index.php?type=%E5%8E%86%E5%8F%B2%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "竞技小说", input: "/book/index.php?type=%E7%AB%9E%E6%8A%80%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "言情小说", input: "/book/index.php?type=%E8%A8%80%E6%83%85%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "悬疑小说", input: "/book/index.php?type=%E6%82%AC%E7%96%91%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "军事小说", input: "/book/index.php?type=%E5%86%9B%E4%BA%8B%E5%B0%8F%E8%AF%B4", script: "book.js" },
        { title: "灵异小说", input: "/book/index.php?type=%E7%81%B5%E5%BC%82%E5%B0%8F%E8%AF%B4", script: "book.js" }
    ]);
}
