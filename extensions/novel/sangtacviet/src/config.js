// config.js — Cau hinh domain cho Sang Tac Viet
var BASE_URL = "https://sangtacviet.app";

try {
    if (typeof CONFIG_URL !== "undefined" && CONFIG_URL) {
        BASE_URL = CONFIG_URL;
    } else if (typeof DOMAIN !== "undefined" && DOMAIN) {
        BASE_URL = DOMAIN;
    }
} catch (e) {
}

var GENRES = [
    { title: "Huyền Huyễn", slug: "category=hh" },
    { title: "Đô Thị", slug: "category=dt" },
    { title: "Võng Du", slug: "category=vd" },
    { title: "Khoa Huyễn", slug: "category=kh" },
    { title: "Dị Năng", slug: "category=dna" },
    { title: "Đồng Nhân", slug: "category=dn" },
    { title: "Linh Dị", slug: "category=ld" },
    { title: "Ngôn Tình", slug: "category=nt" }
];
