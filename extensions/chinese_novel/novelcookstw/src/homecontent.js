// homecontent.js — Danh sach "Noi Bat": API /novel/hot (chi 6 truyen,
// khong phan trang).
load("config.js");
load("rate-limit.js");
function execute(url, page) {
    var path = url || "/novel/hot";
    var r = fetchApi(path, path === "/novel/hot");
    if (!r.json) return Response.error(r.error);

    var json = r.json;
    if (json.code !== 200 || !json.data) return Response.error("Không có dữ liệu");

    var items = buildItems(json.data);
    if (!items.length) return Response.error("Không có dữ liệu");
    return Response.success(items, "");
}
