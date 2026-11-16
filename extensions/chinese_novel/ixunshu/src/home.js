// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha 6.9).
// Cac tab tro ve gen.js voi duong dan danh sach that (khong parse trang
// chu / o tab dau — bai hoc novels.com.tw):
// - /ranking_list/month (月排行榜, the .item)
// - /aggregation/2 (社会都市), /aggregation/3 (豪门总裁),
//   /aggregation/4 (现代言情) — the loai co luong sach lon.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        { title: "月排行榜", input: BASE_URL + "/ranking_list/month", script: "gen.js" },
        { title: "社会都市", input: BASE_URL + "/aggregation/2", script: "gen.js" },
        { title: "豪门总裁", input: BASE_URL + "/aggregation/3", script: "gen.js" },
        { title: "现代言情", input: BASE_URL + "/aggregation/4", script: "gen.js" }
    ]);
}
