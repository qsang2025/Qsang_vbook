// genre.js — Danh sach 12 the loai Bixiange (tinh, khong fetch).
// Ten Viet theo nav cua site; input la slug the loai, chay bang gen.js.
// Load: file config.js.
load('config.js');

function execute() {
    return Response.success([
        { title: "Ngôn tình đô thị", input: "dsyq", script: "gen.js" },
        { title: "Võ hiệp tu tiên", input: "wxxz", script: "gen.js" },
        { title: "Huyền huyễn kỳ ảo", input: "xhqh", script: "gen.js" },
        { title: "Xuyên không giá không", input: "cyjk", script: "gen.js" },
        { title: "Khoa huyễn cạnh kỹ", input: "khjj", script: "gen.js" },
        { title: "Quỷ thoại huyền nghi", input: "ghxy", script: "gen.js" },
        { title: "Quân sự lịch sử", input: "jsls", script: "gen.js" },
        { title: "Quan trường thương chiến", input: "guanchang", script: "gen.js" },
        { title: "Hương thổ phong tình", input: "xtfq", script: "gen.js" },
        { title: "Truyện BL", input: "dmtr", script: "gen.js" },
        { title: "Đồng nhân", input: "trxs", script: "gen.js" },
        { title: "Tinh phẩm", input: "jqxs", script: "gen.js" }
    ]);
}
