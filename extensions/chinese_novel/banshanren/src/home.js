// home.js — cac tab trang chu (tinh, khong fetch).
// Moi tab co input truyen sang list.js: duong dan /all/ hoac "rank:<n>".
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "最新更新", input: "/all/0-0-0-0-0-0-2-1/", script: "list.js" },
        { title: "热门浏览", input: "/all/0-0-0-0-0-0-3-1/", script: "list.js" },
        { title: "新书上架", input: "/all/0-0-0-0-0-0-1-1/", script: "list.js" },
        { title: "周榜", input: "rank:1", script: "list.js" },
        { title: "新作榜", input: "rank:4", script: "list.js" }
    ]);
}
