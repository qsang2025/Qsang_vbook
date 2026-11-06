// similar.js — truyen tuong tu (template comic).
// Y tuong: Darkrai9x similar.js. Duoc goi tu detail.js qua truong
// `suggests` ({title, input, script}). `input` o day la doan HTML tho
// (da cat san cung trang detail), khong phai URL — parse thang, khong fetch.
// Tat ca SELECTOR_ doi theo giao dien site that.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute(input) {
    var doc = Html.parse(input);

    var items = doc.select("SELECTOR_SIMILAR_ITEMS").map(function (el) {
        return {
            name: el.select("SELECTOR_ITEM_NAME").text(),
            cover: el.select("SELECTOR_ITEM_COVER img").attr("src"),
            link: el.select("SELECTOR_ITEM_LINK a").attr("href"),
            description: el.select("SELECTOR_ITEM_LAST_CHAP").text()
        };
    });

    return Response.success(items, "");
}
