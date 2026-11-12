// home.js — cac tab bang xep hang cua 17k (trang chu tinh, khong fetch).
// Moi tab tro ve gen.js voi input la URL template cua API rank
// api.17k.com/book/rank/client; gen.js thay ${page} va ${appKey}.
// type: 2 畅销榜, 15 礼物榜, 3 红包榜, 9 新书榜, 10 人气榜, 11 完本榜,
// 5 热评榜, 6 更新榜 (theo ban goc hajljnopera v3).
function execute() {
    return Response.success([
        { title: "畅销榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=2&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "礼物榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=15&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "红包榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=3&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "新书榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=9&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "人气榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=10&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "完本榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=11&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "热评榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=5&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" },
        { title: "更新榜", input: "https://api.17k.com/book/rank/client?classId=2&orderBy=1&page=${page}&type=6&clientType=1&cpsOpid=0&_filterData=1&channel=0&_versions=1070&merchant=17Kyyb&appKey=${appKey}&cpsSource=0&platform=2", script: "gen.js" }
    ]);
}
