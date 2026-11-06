// genre.js — danh sach the loai cua App Truyen Chu.
// Site khong co trang /the-loai rieng; chip the loai tren trang /truyen la
// cac <button> (khong phai <a>, khong co href cate=) — bam chip chi loc
// bang JS tren trang. Vi vay doc ten the loai tu cac <button> (chay lien
// nhau tu "Tat ca" toi "Kinh di", khao sat tren may that 2026-11-06) roi
// tu tao URL /truyen?cate=<slug> (slug = slugify, da kiem chung: "He
// thong" -> he-thong, "Dien van" -> dien-van...). Moi muc tro ve book.js.
// "Tat ca" tro ve /truyen (khong co cate=).
//
// Load: build se copy config.js, config-helpers.js, fetch-helpers.js,
// helper.js vao src/.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('helper.js');

function execute() {
    var doc = fetchDoc(BASE_URL + "/truyen");
    if (!doc) return Response.error("Không tải được danh sách thể loại: " + BASE_URL + "/truyen");

    // Cac nut khong phai the loai, dung lam moc cat day the loai.
    var STOP = { "Trạng thái": true, "Loại": true, "Lọc": true };

    var genres = [];
    var seen = {};
    var inGenres = false;
    doc.select("button").forEach(function (el) {
        var title = cleanText(el.text());
        if (!title) return;
        if (title === "Tất cả") { inGenres = true; }
        if (!inGenres) return;
        if (STOP[title] || title.indexOf("Sắp xếp") === 0) { inGenres = false; return; }
        if (seen[title]) return;
        seen[title] = true;
        var url = title === "Tất cả"
            ? BASE_URL + "/truyen"
            : BASE_URL + "/truyen?cate=" + slugify(title);
        genres.push({ title: title, input: url, script: "book.js" });
    });

    if (genres.length === 0) return Response.error("Không đọc được danh sách thể loại (site có thể đã đổi giao diện)");
    return Response.success(genres);
}
