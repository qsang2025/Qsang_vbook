// homecontent.js — Noi dung cac tab trang chu cua TruyenCv.
//
// Cac tab chay qua API JSON rieng cua site (khong can dang nhap):
//   - latest:    GET /story/stories/?page_size=20&page=N
//   - completed: GET /story/stories/completed/?page_size=20&page=N
//   - top:       GET /story/top/nominations/?page_size=20&page=N
// Phan trang theo data.next cua API.
load("config.js");
load("rate-limit.js");

function execute(url, page) {
    var p = page ? parseInt(page, 10) : 1;
    if (isNaN(p) || p < 1) p = 1;

    var path = "";
    if (url === "latest") path = "/story/stories/";
    else if (url === "completed") path = "/story/stories/completed/";
    else if (url === "top") path = "/story/top/nominations/";
    else return Response.error("Tab không hợp lệ");

    var apiUrl = BASE_URL + path + "?page_size=20&page=" + p;
    var r = fetchTT(apiUrl, { headers: defaultHeaders() });
    if (!r.ok || !r.res) return Response.error(pacedErrorMessage(r));
    var data = null;
    try { data = r.res.json(); } catch (e) { data = null; }
    if (!data || !data.results) return Response.error("Không tải được danh sách truyện");

    var items = [];
    var i = 0;
    for (i = 0; i < data.results.length; i++) {
        var item = storyToItem(data.results[i]);
        if (item) items.push(item);
    }
    if (items.length === 0) return Response.success([], "");
    return Response.success(items, nextFromApi(data, p));
}
