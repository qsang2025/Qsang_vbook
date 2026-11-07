// config.js — Cau hinh va the loai cho TruyenC
var BASE_URL = "https://truyenc.net";

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var GENRES = [
    { title: "Tiên Hiệp", slug: "/the-loai/tien-hiep" },
    { title: "Kiếm Hiệp", slug: "/the-loai/kiem-hiep" },
    { title: "Huyền Huyễn", slug: "/the-loai/huyen-huyen" },
    { title: "Đô Thị", slug: "/the-loai/do-thi" },
    { title: "Võng Du", slug: "/the-loai/vong-du" },
    { title: "Hệ Thống", slug: "/the-loai/he-thong" },
    { title: "Xuyên Không", slug: "/the-loai/xuyen-khong" },
    { title: "Trọng Sinh", slug: "/the-loai/trong-sinh" },
    { title: "Khoa Huyễn", slug: "/the-loai/khoa-huyen" },
    { title: "Dị Giới", slug: "/the-loai/di-gioi" },
    { title: "Đồng Nhân", slug: "/the-loai/dong-nhan" },
    { title: "Dã Sử", slug: "/the-loai/da-su" },
    { title: "Ngôn Tình", slug: "/the-loai/ngon-tinh" },
    { title: "Đam Mỹ", slug: "/the-loai/dam-my" },
    { title: "Linh Dị", slug: "/the-loai/linh-di" },
    { title: "Mạt Thế", slug: "/the-loai/mat-the" }
];
