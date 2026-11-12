// chap.js — Noi dung 1 chuong truyen Me Doc Truyen (medoctruyen.vn).
//
// Trang chuong `/<slug>/chuong-<N>` (HTML tinh, kiem chung live 2026-11-12):
// doan van o `p[data-line]`; tieu de chuong o h1 (du phong the <title>).
//
// LUU Y QUAN TRONG — CHUONG CHI CO BAN XEM TRUOC KHI CHUA DANG NHAP:
// khi chua dang nhap, site chi tra 3-9 doan dau cua chuong roi hien
// div[data-preview-gate] nhac "Dang nhap de doc tiep noi dung day du".
// Day KHONG phai loi doc — chap.js tra ban xem truoc kem ghi chu dang
// nhap o cuoi (khong bao loi), de nguoi doc biet can dang nhap. Neu
// nguoi dung da dan cookie phien vao config COOKIE thi fetch gui kem
// Cookie va co the tra du chuong (CHUA kiem chung — khong co tai khoan
// de thu; xem ghi chu trong file config.js).
// Chi bao loi khi hoan toan khong co doan van ban nao. execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    // Site luc luc tra trang chuong khong co doan van nao (trang xem
    // truoc rong — gap 2/7 lan goi tren may that 2026-11-12, cung URL
    // luc co luc khong, trong khi fetch tu VM luon on dinh). Thu lai
    // toi da 3 lan, cach nhau ~1,5s (mau retry cua sstruyen/STV). Chi
    // retry khi fetch OK nhung khong co doan van; loi fetch (mang/HTTP)
    // thi bao ngay nhu cu (pacedFetch da retry 429/405/503 ben trong).
    var html = "";
    var title = "";
    var gated = false;
    var attempt = 0;
    for (attempt = 0; attempt < 3; attempt++) {
        var r = fetchMdDoc(chapUrl);
        if (r.error) return Response.error(r.error);
        var doc = r.doc;

        title = "";
        var h1 = safeFirst(doc.select("h1"));
        if (h1 !== null) title = cleanText(h1.text());
        if (!title) {
            var titleEl = safeFirst(doc.select("title"));
            if (titleEl !== null) title = cleanText(titleEl.text()).split(" - ")[0];
        }

        html = "";
        doc.select("p[data-line]").forEach(function (p) {
            var inner = p.html() || "";
            if (cleanText(p.text())) html += "<p>" + inner + "</p>";
        });
        gated = safeFirst(doc.select("div[data-preview-gate]")) !== null;
        if (html) break;
        if (attempt < 2) sleepMs(1500);
    }
    if (!html) return Response.error("Không đọc được nội dung chương: " + chapUrl);

    if (gated) {
        html += "<p><i>Đây là bản xem trước. Đăng nhập trên web medoctruyen.vn để đọc đầy đủ chương này (hoặc dán cookie phiên vào cấu hình COOKIE của nguồn).</i></p>";
    }
    return Response.success(html, title);
}
