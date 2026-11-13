// home.js — Tab tinh (khong fetch, theo §6.9).
// Cac tab tro ve gen.js voi input la URL danh sach cua site.
load('config.js');
function execute() {
    return Response.success([
        { title: "Truyện Mới", input: BASE_URL + "/truyen-moi", script: "gen.js" },
        { title: "Thịnh Hành", input: BASE_URL + "/thinh-hanh", script: "gen.js" },
        { title: "Đề Cử", input: BASE_URL + "/de-cu", script: "gen.js" },
        { title: "Mới Cập Nhật", input: BASE_URL + "/moi-cap-nhat", script: "gen.js" },
        { title: "Bảng Xếp Hạng", input: BASE_URL + "/bang-xep-hang/tuan", script: "gen.js" }
    ]);
}
