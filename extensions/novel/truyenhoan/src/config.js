// config.js — Cau hinh va danh muc cho Truyen Hoan (ho tro mirror WeTruyen / DTruyen)
var BASE_URL = "https://truyenhoan.com";

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var CATEGORIES = [
    { title: "Truyện HOT", input: "truyen-hot" },
    { title: "Mới Cập Nhật", input: "truyen-moi-cap-nhat" },
    { title: "Đã Hoàn Thành", input: "truyen-full" },
    { title: "Truyện Mới Đăng", input: "truyen-moi-dang" }
];

var GENRES = [
    { title: "Tiên Hiệp", slug: "truyen-tien-hiep" },
    { title: "Kiếm Hiệp", slug: "truyen-kiem-hiep" },
    { title: "Huyền Huyễn", slug: "truyen-huyen-huyen" },
    { title: "Đô Thị", slug: "truyen-do-thi" },
    { title: "Võng Du", slug: "truyen-vong-du" },
    { title: "Khoa Huyễn", slug: "truyen-khoa-huyen" },
    { title: "Dị Giới", slug: "truyen-di-gioi" },
    { title: "Hệ Thống", slug: "truyen-he-thong" },
    { title: "Xuyên Không", slug: "truyen-xuyen-khong" },
    { title: "Trọng Sinh", slug: "truyen-trong-sinh" },
    { title: "Trinh Thám", slug: "truyen-trinh-tham" },
    { title: "Linh Dị", slug: "truyen-linh-di" },
    { title: "Ngôn Tình", slug: "truyen-ngon-tinh" },
    { title: "Cổ Đại", slug: "truyen-co-dai" },
    { title: "Mạt Thế", slug: "truyen-mat-the" },
    { title: "Quân Sự", slug: "truyen-quan-su" },
    { title: "Lịch Sử", slug: "truyen-lich-su" }
];
