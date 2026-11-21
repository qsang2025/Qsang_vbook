// config.js — cau hinh domain cho Kho Truyen Chu (khotruyenchu.fun).
// DOMAIN (select): https://khotruyenchu.fun | https://khotruyenchu.space
// MIRRORS (input): danh sach mirror du phong, cach nhau bang dau phay.
// Site chinh khotruyenchu.fun; mirror khotruyenchu.space 301 ve .fun (cung
// backend, da kiem chung 21/11). Chi khai bao var o day, khong goi ham.
var BASE_URL = "https://khotruyenchu.fun";
var MIRROR_LIST = ["https://khotruyenchu.space"];
var DEFAULT_COVER = "";
var DEFAULT_TYPE = "novel";

if (typeof DOMAIN !== "undefined" && DOMAIN) {
    BASE_URL = String(DOMAIN).replace(/\/+$/, "");
}
if (typeof MIRRORS !== "undefined" && MIRRORS) {
    var _raw = String(MIRRORS).split(",");
    var _list = [];
    for (var i = 0; i < _raw.length; i++) {
        var _m = _raw[i].replace(/^\s+|\s+$/g, "").replace(/\/+$/, "");
        if (_m && _m !== BASE_URL && _list.indexOf(_m) === -1) _list.push(_m);
    }
    if (_list.length > 0) MIRROR_LIST = _list;
}
