// genre.js — The loai: 2 muc co dinh (Convert / Dich) + the loai lay live
// tu API /api/categories/ (chu y trailing slash — khong co slash thi 307).
// Neu API loi thi dung danh sach du phong cung (id da kiem chung tu VM).
load("config.js");
load("rate-limit.js");

function execute() {
    var list = [];
    list.push({ title: "Convert", input: BASE_URL + "/type/Convert", script: "gen.js" });
    list.push({ title: "Dịch", input: BASE_URL + "/type/Dich", script: "gen.js" });

    var rr = stvFetchJson(API_URL + "/api/categories/?page=1&limit=100");
    var items = [];
    if (!rr.error && rr.json && rr.json.data && rr.json.data.items) {
        items = rr.json.data.items;
    }
    if (!items.length) {
        items = [
            { id: 1, name: "Đô Thị" },
            { id: 2, name: "Tiên Hiệp" },
            { id: 3, name: "Khoa Huyễn" },
            { id: 4, name: "Huyền Huyễn" },
            { id: 5, name: "Võng Du" },
            { id: 6, name: "Đồng Nhân" },
            { id: 7, name: "Dã Sử" },
            { id: 9, name: "Huyền Nghi" },
            { id: 10, name: "Kiếm Hiệp" },
            { id: 13, name: "Hệ Thống" },
            { id: 32, name: "Ngôn Tình" },
            { id: 39, name: "Hiện Đại Ngôn Tình" },
            { id: 42, name: "Cổ Đại Ngôn Tình" }
        ];
    }

    items.sort(function (a, b) {
        var na = (a && a.name) ? a.name : "";
        var nb = (b && b.name) ? b.name : "";
        if (na < nb) return -1;
        if (na > nb) return 1;
        return 0;
    });

    for (var i = 0; i < items.length; i++) {
        var c = items[i];
        if (!c || !c.id) continue;
        var name = c.name || String(c.id);
        var count = c.story_count != null ? " (" + c.story_count + ")" : "";
        list.push({
            title: name + count,
            input: BASE_URL + "/category/" + c.id,
            script: "gen.js"
        });
    }
    return Response.success(list);
}
