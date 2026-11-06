// explore.js — trang kham pha theo muc: banner + cac hang danh sach (template comic).
// Y tuong: Darkrai9x explore.js. Moi muc chon dang tinh hoac dong tuy theo
// site: du lieu da co trong response nay -> `items`; du lieu can trang/API
// rieng -> `script`/`input`. Banner/moi cap nhat duoi day la tinh, xep hang
// la dong; doi chieu tuy site.
// Tat ca SELECTOR_ doi theo giao dien site that.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    var response = fetch(BASE_URL);
    if (!response.ok) return Response.error("Lỗi HTTP " + response.status);
    var doc = response.html();

    var bannerItems = doc.select("SELECTOR_BANNER_SLIDES").map(function (el) {
        return {
            name: el.select("SELECTOR_BANNER_TITLE").text(),
            cover: el.select("SELECTOR_BANNER_IMAGE img").attr("src"),
            link: el.select("SELECTOR_BANNER_LINK a").attr("href")
        };
    });

    var latestItems = doc.select("SELECTOR_LATEST_ITEMS").map(function (el) {
        return {
            name: el.select("SELECTOR_ITEM_NAME").text(),
            cover: el.select("SELECTOR_ITEM_COVER img").attr("src"),
            link: el.select("SELECTOR_ITEM_LINK a").attr("href"),
            description: el.select("SELECTOR_ITEM_LAST_CHAP").text(),
            tag: el.select("SELECTOR_ITEM_STATUS").text()
        };
    });

    return Response.success([
        {
            id: "banner",
            title: "",
            subtitle: "",
            type: "banner",
            items: bannerItems
        },
        {
            id: "latest",
            title: "Mới cập nhật",
            subtitle: "Truyện tranh vừa cập nhật chương mới",
            type: "grid",
            items: latestItems,
            more: { type: "list", name: "Danh sách", script: "search.js", input: "/truyen-moi-cap-nhat" }
        },
        {
            id: "ranking",
            title: "Xem nhiều",
            subtitle: "",
            type: "ranking",
            // Dong: app goi search.js dang execute(input, "") sau khi trang hien.
            // Neu du lieu nay co tren trang chu, parse o tren roi dung `items`.
            script: "search.js",
            input: "/top-ngay",
            more: { type: "list", name: "Danh sách", script: "search.js", input: "/top-ngay" }
        }
    ]);
}
