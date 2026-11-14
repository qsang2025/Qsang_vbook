// genre.js — Danh sach the loai doc live tu API /novel/categories
// (kiem chung 2026-11-14: 36 muc, sortid 1-36). The loai 36 (出版圖書)
// bi loai vi endpoint danh sach cua no tra rong (kiem chung 2026-11-14:
// /novel/list?sortid=36 tra body rong). Khi API loi thi dung danh sach
// cung duoi day (ten goc tieng Trung cua site).
load("config.js");
load("rate-limit.js");

var FALLBACK_GENRES = [
    { title: "西方奇幻", input: "1" },
    { title: "東方仙俠", input: "2" },
    { title: "科幻末世", input: "3" },
    { title: "都市日常", input: "4" },
    { title: "都市修真", input: "5" },
    { title: "都市高武", input: "6" },
    { title: "歷史古代", input: "7" },
    { title: "戰神贅婿", input: "8" },
    { title: "都市種田", input: "9" },
    { title: "傳統玄幻", input: "10" },
    { title: "歷史腦洞", input: "11" },
    { title: "懸疑腦洞", input: "12" },
    { title: "都市腦洞", input: "13" },
    { title: "玄幻腦洞", input: "14" },
    { title: "懸疑靈異", input: "15" },
    { title: "抗戰諜戰", input: "16" },
    { title: "遊戲體育", input: "17" },
    { title: "動漫衍生", input: "18" },
    { title: "男頻衍生", input: "19" },
    { title: "古風世情", input: "20" },
    { title: "女頻衍生", input: "21" },
    { title: "玄幻言情", input: "22" },
    { title: "種田", input: "23" },
    { title: "年代", input: "24" },
    { title: "現言腦洞", input: "25" },
    { title: "宮鬥宅鬥", input: "26" },
    { title: "古言腦洞", input: "27" },
    { title: "快穿", input: "28" },
    { title: "青春甜寵", input: "29" },
    { title: "星光璀璨", input: "30" },
    { title: "女頻懸疑", input: "31" },
    { title: "職場婚戀", input: "32" },
    { title: "豪門總裁", input: "33" },
    { title: "民國言情", input: "34" },
    { title: "其他", input: "35" }
];

function execute() {
    var r = fetchApi("/novel/categories", true);
    if (r.json && r.json.code === 200 && r.json.data && r.json.data.length) {
        var items = [];
        for (var i = 0; i < r.json.data.length; i++) {
            var c = r.json.data[i];
            var id = parseInt(c.sortid, 10);
            if (!id || id < 1) continue;
            if (id === 36) continue;
            var name = c.name || c.sortname || "";
            if (!name) continue;
            items.push({ title: name, input: String(id), script: "genrecontent.js" });
        }
        if (items.length) return Response.success(items);
    }
    var fb = [];
    for (var j = 0; j < FALLBACK_GENRES.length; j++) {
        fb.push({ title: FALLBACK_GENRES[j].title, input: FALLBACK_GENRES[j].input, script: "genrecontent.js" });
    }
    return Response.success(fb);
}
