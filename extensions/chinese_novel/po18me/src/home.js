// home.js — cac tab trang chu (chi tra tab tinh, khong fetch).
// Moi tab co input truyen sang search.js (xem search.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "今日热榜", input: "rank:0", script: "search.js" },
        { title: "本周热榜", input: "rank:1", script: "search.js" },
        { title: "本月热榜", input: "rank:2", script: "search.js" },
        { title: "总热榜", input: "rank:3", script: "search.js" },
        { title: "最新小说", input: "home", script: "search.js" }
    ]);
}
