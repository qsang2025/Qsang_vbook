// gbk.js — LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Quy tac build (xem thiet ke khung xuong muc 6.9): file nay chi la nguon mau
// o repo root. Buoc build PHAI copy/inline no vao thu muc src/ cua tung
// extension truoc khi dong plugin.zip, vi load() cua vBook chi load file o
// top level src/ trong cung extension, khong de quy, va file duoc load
// khong duoc load them file khac. Trong script dung no, viet o dau file:
//     load('config.js');
//     load('gbk.js');
//
// CHI DUNG CHO NGUON TRUNG (web tieng Trung, ma hoa GBK/GB2312).
// Cac site Viet/Nhat/Anh dung UTF-8 mac dinh, KHONG can file nay.
// Y tuong: Evamirion/TuanHai03 (response.html('gbk') explicit) va
// extension-api.md cua Darkrai9x (response.text('gbk') / response.html('gbk')).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Ma hoa mac dinh cho nguon Trung cua extension nay. Doi thanh "gb2312"
// neu site cu chi dung GB2312 (hiem; hau het site GBK doc duoc ca hai).
var GBK_CHARSET = "gbk";

// Lay Document tu response da fetch, giai ma theo GBK.
// Dung thay cho response.html() khi site Trung tra HTML ma GBK.
function htmlGbk(response) {
    if (!response || !response.ok) return null;
    try {
        return response.html(GBK_CHARSET);
    } catch (e) {
        Console.log("htmlGbk loi: " + e);
        return null;
    }
}

// Lay text tho tu response, giai ma theo GBK. Dung khi can doc JSON/XML
// hoac cat chuoi tho (vd. dual extraction trong chap.js) tren site Trung.
function textGbk(response) {
    if (!response || !response.ok) return "";
    try {
        return String(response.text(GBK_CHARSET));
    } catch (e) {
        Console.log("textGbk loi: " + e);
        return "";
    }
}

// Fetch mot URL roi tra ve Document da giai ma GBK (ket hop fetch thuong;
// neu bi chan thi tra null — phan trang/chi tiet Trung hiem khi can
// Engine.newBrowser, nhung co the them fetchViaBrowser o fetch-helpers.js
// neu site yeu cau render JS).
function fetchDocGbk(url, options) {
    options = options || {};
    var headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
    };
    if (options.referer) headers["Referer"] = options.referer;
    try {
        var res = fetch(url, { headers: headers });
        return htmlGbk(res);
    } catch (e) {
        Console.log("fetchDocGbk loi: " + e);
        return null;
    }
}
