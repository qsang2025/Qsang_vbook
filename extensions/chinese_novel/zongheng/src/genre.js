// genre.js — Danh sach the loai Zongheng (纵横中文网).
// Lay tu API cong khai cua app Zongheng (khong can dang nhap, khong can
// chu ky): GET https://api2.zongheng.com/api/catefine/searchConf
// (kiem chung 2026-11-11: code 200, 12 the loai 8101-8111 + "全部" 0).
// Moi the loai tro ve book.js voi input la URL API catefine/search;
// book.js goi POST JSON {cateFineId, pageNo: 1, pageNum: <so trang>}
// — CHU Y: server dung pageNum lam SO TRANG (1-based) va bo qua
// pageNo (kiem chung 2026-11-11: pageNum=1..39 khac nhau, trang 39
// chi 2 truyen, pageNum=40 rong); phan trang theo hasNext, 20
// truyen/trang co dinh do server tra.
// Duong doc chinh (search/detail/toc/chap) van dung web v1 — API app
// chi bo sung the loai + bang xep hang, vi cac endpoint noi dung cua
// app deu tra 602 Unauthorized (xem ZONGHENG-APP-API.md). KHONG dung
// cac endpoint 602, KHONG be chu ky.
// Load: file config.js, file rate-limit.js (pacing + retry). Build se
// inline file lib nay vao zip; test tren may doc truc tiep tu src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

var ZH_API2 = "https://api2.zongheng.com";

// Danh sach du phong khi searchConf tam loi — ID da kiem chung truc
// tiep tu API ngay 2026-11-11 (GET searchConf tra code 200).
var ZH_CATEGORIES_FALLBACK = [
    { id: 0, name: "全部" },
    { id: 8101, name: "玄幻奇幻" },
    { id: 8102, name: "武侠仙侠" },
    { id: 8103, name: "都市" },
    { id: 8104, name: "历史" },
    { id: 8105, name: "科幻" },
    { id: 8106, name: "奇闻异事" },
    { id: 8107, name: "游戏" },
    { id: 8108, name: "N次元" },
    { id: 8109, name: "现实题材" },
    { id: 8110, name: "体育" },
    { id: 8111, name: "军事" }
];

function zhGenreEntries(list) {
    var out = [];
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var id = list[i].id;
        var name = list[i].name;
        if (name === undefined || name === null || String(name) === "") continue;
        if (id === undefined || id === null || isNaN(parseInt(id, 10))) continue;
        out.push({
            title: String(name),
            input: ZH_API2 + "/api/catefine/search?cateFineId=" + parseInt(id, 10),
            script: "book.js"
        });
    }
    return out;
}

function execute() {
    var list = null;
    var pf = pacedFetch(ZH_API2 + "/api/catefine/searchConf", {
        headers: { "Accept": "application/json" }
    });
    if (pf.ok) {
        try {
            var json = pf.res.json();
            if (json && json.code === 200 && json.result && json.result.categoryList) {
                var raw = json.result.categoryList.list;
                if (raw && raw.length > 0) {
                    list = [];
                    var i = 0;
                    for (i = 0; i < raw.length; i++) {
                        list.push({
                            id: parseInt(raw[i].paramValue, 10),
                            name: String(raw[i].name || "")
                        });
                    }
                }
            }
        } catch (e) {
            list = null;
        }
    }
    // searchConf tam loi (mang / server): dung danh sach du phong da
    // kiem chung, the loai van mo duoc thay vi tra loi trang.
    if (!list || list.length === 0) list = ZH_CATEGORIES_FALLBACK;
    var entries = zhGenreEntries(list);
    if (entries.length === 0) {
        return Response.error("Không tải được danh sách thể loại Zongheng (API app tạm lỗi, thử lại sau).");
    }
    return Response.success(entries);
}
