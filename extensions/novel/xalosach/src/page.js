// page.js — Cac trang muc luc Xa Lo Sach (xalosach.com).
// Input: URL trang chi tiet. Moi trang muc luc 100 chuong (?P=N);
// tong so chuong doc tu tieu de "Danh sach chuong (N)" (mau: 4078
// chuong = 41 trang). Neu khong doc duoc tong thi dung max trang
// trong pager.

load("config.js");
load("rate-limit.js");

function execute(url) {
    var reqUrl = url;
    var q = reqUrl.indexOf("?");
    if (q !== -1) reqUrl = reqUrl.substring(0, q);
    var t = xlsFetchText(reqUrl, BASE_URL + "/");
    if (t.error) return Response.success([reqUrl]);
    var total = 0;
    var m = t.text.match(/Danh s[aá]ch chương \((\d+)\)/);
    if (m) total = parseInt(m[1], 10);
    var maxPage = 1;
    if (total > 0) {
        maxPage = Math.ceil(total / 100);
    } else {
        var re = /\?P=(\d+)#/g;
        var mm;
        while ((mm = re.exec(t.text)) !== null) {
            var p = parseInt(mm[1], 10);
            if (p > maxPage) maxPage = p;
        }
    }
    if (maxPage < 1) maxPage = 1;
    if (maxPage > 200) maxPage = 200;
    var list = [];
    for (var i = 1; i <= maxPage; i++) {
        list.push(reqUrl + "?P=" + i);
    }
    return Response.success(list);
}
