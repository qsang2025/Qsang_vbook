// home.js — cac tab trang chu cua 稷下書院 (novel543.com).
// Tab TINH, khong fetch (AGENTS.md quy tac 9): moi tab tro ve book.js
// voi input la duong dan danh sach. Tab dau: moi cap nhat (bookstack),
// sau do cac bang xep hang, roi 3 the loai lon.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "最新更新", input: "/bookstack/", script: "book.js" },
        { title: "大熱榜", input: "/ranking/0-8-8001.html", script: "book.js" },
        { title: "新書榜", input: "/ranking/0-8-8002.html", script: "book.js" },
        { title: "完結榜", input: "/ranking/0-8-8003.html", script: "book.js" },
        { title: "更新榜", input: "/ranking/0-8-8005.html", script: "book.js" },
        { title: "玄幻", input: "/bookstack/xuanhuan/", script: "book.js" },
        { title: "都市", input: "/bookstack/dushi/", script: "book.js" },
        { title: "同人", input: "/bookstack/tongren/", script: "book.js" }
    ]);
}
