// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha:
// app chay tab dau tien ngay khi mo extension, fetch loi o do se chan ca
// trang chu). Cac tab tro ve gen.js voi URL danh sach day du cua site
// (phan trang 0-based, 10 muc/trang).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        {
            title: "Latest",
            script: "gen.js",
            input: BASE_URL + "/en/novel-list"
        },
        {
            title: "Daily Ranking",
            script: "gen.js",
            input: BASE_URL + "/en/ranking/daily"
        },
        {
            title: "Weekly Ranking",
            script: "gen.js",
            input: BASE_URL + "/en/ranking/weekly"
        },
        {
            title: "Monthly Ranking",
            script: "gen.js",
            input: BASE_URL + "/en/ranking/monthly"
        }
    ]);
}
