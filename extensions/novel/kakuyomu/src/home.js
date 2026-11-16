// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha
// muc 6.9: app chay tab dau tien ngay khi mo extension, fetch loi o do
// se chan ca trang chu). Cac tab la bang xep hang ngay/tuan/thang/nam/
// tich luy cua Kakuyomu, moi tab tro ve gen.js voi URL ranking day du.
// URL ranking luon kem work_variation=long (server redirect 307 neu
// thieu — gui thang de tranh redirect).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        {
            title: "日間ランキング",
            script: "gen.js",
            input: "https://kakuyomu.jp/rankings/all/daily?page=1&work_variation=long"
        },
        {
            title: "週間ランキング",
            script: "gen.js",
            input: "https://kakuyomu.jp/rankings/all/weekly?page=1&work_variation=long"
        },
        {
            title: "月間ランキング",
            script: "gen.js",
            input: "https://kakuyomu.jp/rankings/all/monthly?page=1&work_variation=long"
        },
        {
            title: "年間ランキング",
            script: "gen.js",
            input: "https://kakuyomu.jp/rankings/all/yearly?page=1&work_variation=long"
        },
        {
            title: "累計ランキング",
            script: "gen.js",
            input: "https://kakuyomu.jp/rankings/all/entire?page=1&work_variation=long"
        }
    ]);
}
