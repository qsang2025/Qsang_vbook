// home.js — Tab tinh (khong fetch, theo §6.9).
// Cac tab tro ve gen.js voi input la URL danh sach cua site.
load('config.js');
function execute() {
    return Response.success([
        { title: "Truyện Hot", input: BASE_URL + "/the-loai/tat-ca/truyen-hot.html", script: "gen.js" },
        { title: "Mới Cập Nhật", input: BASE_URL + "/the-loai/tat-ca/truyen-moi.html", script: "gen.js" },
        { title: "Truyện Full", input: BASE_URL + "/the-loai/tat-ca/truyen-full.html", script: "gen.js" }
    ]);
}
