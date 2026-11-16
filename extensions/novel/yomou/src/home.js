// home.js — Tab trang chu (chi tra tab tinh, khong fetch — quy tac nha
// muc 6.9: app chay tab dau tien ngay khi mo extension, fetch loi o do
// se chan ca trang chu). Cac tab la bang xep hang cua API tieu thuyet
// (api.syosetu.com), moi tab tro ve gen.js voi URL API day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        {
            title: "日間ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=dailypoint&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "週間ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=weeklypoint&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "月間ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=monthlypoint&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "四半期ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=quarterpoint&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "年間ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=yearlypoint&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "累計ランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=hyoka&of=t-n-gp-nt-ga&out=json&lim=100"
        },
        {
            title: "ブックマークランキング",
            script: "gen.js",
            input: "https://api.syosetu.com/novelapi/api/?order=favnovelcnt&of=t-n-f-gp-nt-ga&out=json&lim=100"
        }
    ]);
}
