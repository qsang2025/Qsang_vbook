// home.js — Tab trang chu (tinh, khong fetch — quy tac 9 AGENTS.md).
// Tab BTV dung ?period=all vi trang thang nay dang rong (0 tac pham).
load("config.js");

function execute() {
    return Response.success([
        { title: "BTV đề cử", input: BASE_URL + "/btv-de-cu?period=all", script: "nominationList.js" },
        { title: "Truyện", input: BASE_URL + "/truyen", script: "bookList.js" },
        { title: "Top đọc nhiều", input: BASE_URL + "/bang-xep-hang?period=total&section=works&board=views", script: "topBook.js" },
        { title: "Top mới nổi", input: BASE_URL + "/bang-xep-hang?period=total&section=works&board=trending", script: "topBook.js" },
        { title: "Top hoàn thành nổi bật", input: BASE_URL + "/bang-xep-hang?period=total&section=works&board=completed", script: "topBook.js" }
    ]);
}
