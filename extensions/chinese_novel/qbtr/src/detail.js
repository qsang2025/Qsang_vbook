// detail.js — Chi tiet truyen (execute(url) -> detail).
//
// Trang chi tiet /tongren/<id>.html (kiem chung live 2026-11-16):
// - Ten: .book_info .infos h1.
// - Tac gia: .date span ("作者：Elof"); ngay dang trong .date.
// - Mo ta: .book_info .infos p (ngat <br/>).
// - KHONG co anh bia (img src="" rong + cover.js tra 0 byte — site khong
//   co bia; tien le sjks88/powanjuan: bo cover khi site khong co).
// - KHONG co trang thai/word-count tren trang chi tiet — ongoing mac dinh
//   true (phan biet 全本/连载 chi co trong danh sach tag, khong co tren
//   trang chi tiet). Khong co genres tren trang chi tiet (tag cua truyen
//   khong hien) — genres ve [].
// - App cat "/" cuoi cua URL doi so — normalizeQbUrl khoi phuc; URL chi
//   tiet dang .html nen khong anh huong.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file gbk.js, file cleanHtml.js,
// file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    url = normalizeQbUrl(url);
    if (!url) return Response.error("Đường dẫn truyện không hợp lệ.");
    var r = fetchQbDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var nameEl = safeFirst(doc.select(".book_info .infos h1"));
    var name = nameEl !== null ? cleanText(nameEl.text()) : "";
    if (!name) {
        var ti = String(doc.select("title").text() || "");
        name = cleanText(ti.split("_")[0].split("-")[0]);
    }
    if (!name) return Response.error("Không đọc được tên truyện.");

    var author = "";
    var dateText = "";
    var dateEl = safeFirst(doc.select(".book_info .infos .date"));
    if (dateEl !== null) {
        var dt = cleanText(dateEl.text());
        var au = safeFirst(dateEl.select("span"));
        if (au !== null) author = cleanText(au.text()).replace(/^作者：\s*/, "");
        var dm = dt.match(/日期：\s*(.+)$/);
        if (dm) dateText = cleanText(dm[1]);
    }

    var desc = "";
    var deEl = safeFirst(doc.select(".book_info .infos p"));
    if (deEl !== null) desc = cleanText(deEl.text());

    return Response.success({
        name: name,
        author: author,
        cover: "",
        description: desc,
        detail: dateText ? ("Ngày đăng: " + dateText) : "",
        url: url,
        type: "novel",
        format: "novel",
        ongoing: true,
        genres: [],
        suggests: []
    });
}
