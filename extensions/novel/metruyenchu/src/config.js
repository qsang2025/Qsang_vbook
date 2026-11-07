// config.js — Cau hinh va danh muc cho Me Truyen Chu VN
var BASE_URL = "https://metruyenchu.com.vn";

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
    { title: "Huyền Huyễn", slug: "/the-loai/huyen-huyen" },
    { title: "Đô Thị", slug: "/the-loai/do-thi" },
    { title: "Khoa Huyễn", slug: "/the-loai/khoa-huyen" },
    { title: "Võng Du", slug: "/the-loai/vong-du" },
    { title: "Đồng Nhân", slug: "/the-loai/dong-nhan" },
    { title: "Dã Sử", slug: "/the-loai/da-su" },
    { title: "Cạnh Kỹ", slug: "/the-loai/canh-ky" },
    { title: "Huyền Nghi", slug: "/the-loai/huyen-nghi" },
    { title: "Kiếm Hiệp", slug: "/the-loai/kiem-hiep" },
    { title: "Kỳ Ảo", slug: "/the-loai/ky-ao" }
];
