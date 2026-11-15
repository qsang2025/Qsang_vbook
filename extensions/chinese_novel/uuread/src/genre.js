// genre.js — uu看書 (uuread.tw): danh sach the loai.
// Viet moi (base alexsonxxx v1 khong co genre.js).
// 9 muc lay tu tab trang chu (xem home.js): 玄幻, 仙俠, 都市, 歷史,
// 遊戲, 科幻, 靈異, 言情, 其它. Moi muc tro ve search.js voi input la
// duong dan /sort/N/1.html — chua kiem chung truc tiep tu VM (site
// chan Cloudflare), can test may xac nhan.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "玄幻", input: "/sort/1/1.html", script: "search.js" },
        { title: "仙俠", input: "/sort/2/1.html", script: "search.js" },
        { title: "都市", input: "/sort/3/1.html", script: "search.js" },
        { title: "歷史", input: "/sort/4/1.html", script: "search.js" },
        { title: "遊戲", input: "/sort/5/1.html", script: "search.js" },
        { title: "科幻", input: "/sort/6/1.html", script: "search.js" },
        { title: "靈異", input: "/sort/7/1.html", script: "search.js" },
        { title: "言情", input: "/sort/8/1.html", script: "search.js" },
        { title: "其它", input: "/sort/9/1.html", script: "search.js" }
    ]);
}
