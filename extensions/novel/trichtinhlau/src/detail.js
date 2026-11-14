// detail.js — Chi tiet truyen: /xem-truyen/<slug>.
// Luu y (kiem chung tu HTML that 2026-11-14):
// - Tac gia nam trong <p> chua "Tac Gia:", link <a> ben trong moi la ten
//   tac gia (span dau tien trong <p> la nhan "Tac Gia:" — lay span dau
//   se sai).
// - Anh bia: lay trong khoi section.infobook .book3d img; du phong meta
//   og:image. Khong dung img dau tien trong trang (anh banner nam truoc).
// - Trang thai: chi "So Chuong: N/M" (N==M -> hoan thanh). Truyen nao
//   cung ghi "N/??" nen mac dinh ongoing=true. Badge "Hoan Thanh"
//   trong comment HTML la CHU THICH CUNG CUA TEMPLATE (co ca o truyen
//   dang ra — kiem chung tren may that bang debug.js 2026-11-14: ca 2
//   truyen mau deu co dung 1 lan "Hoan Thanh", trong comment) nen KHONG
//   dung lam dau hieu. Trang chi tiet khong co tin hieu trang thai nao
//   khac (nut "Hoan thanh" viet thuong chu t la nut loc TTS; chu "Dang
//   ra" xuat hien o ca 2 trang). Truyen da hoan thanh nhung ghi "N/??"
//   se hien ongoing=true — han che da biet, ghi trong PROGRESS.
// - The loai rieng cua truyen chi co trong section.infobook (9/6 muc);
//   doc a[href*='/the-loai/'] tren ca trang se lan ca menu dieu huong
//   (91 muc) — phai gioi han vao section.infobook.
load("config.js");
load("fetch-helpers.js");
load("rate-limit.js");

function execute(url) {
    var storyUrl = normalizeUrl(url);
    if (!storyUrl) return Response.error("URL truyện không hợp lệ");
    var rr = ttlFetchDoc(storyUrl);
    if (rr.error) return Response.error(rr.error);
    var doc = rr.doc;

    // Ten truyen
    var nameEl = selFirst(doc, "h1.text-danger");
    var name = nameEl ? cleanText(nameEl.text()) : "";
    if (!name) {
        nameEl = selFirst(doc, "h1");
        name = nameEl ? cleanText(nameEl.text()) : "";
    }
    if (!name) return Response.error("Không tìm thấy tên truyện");

    // Anh bia
    var cover = "";
    var coverEl = selFirst(doc, "section.infobook .book3d img, .infobook img");
    if (coverEl) cover = coverEl.attr("data-src") || coverEl.attr("src") || "";
    if (!cover) {
        var ogEl = selFirst(doc, "meta[property='og:image']");
        if (ogEl) cover = ogEl.attr("content") || "";
    }
    if (cover && cover.charAt(0) === 47) cover = BASE_URL + cover;

    // Tac gia / Editor / So chuong / Doi full / Cap nhat (khoi thong tin).
    var author = "";
    var editor = "";
    var soChuong = "";
    var doiFull = "";
    var capNhat = "";
    var ps = doc.select("p");
    for (var i = 0; i < ps.size(); i++) {
        var pEl = ps.get(i);
        var pText = pEl.text();
        if ((pText.indexOf("Tác Giả") !== -1 || pText.indexOf("Tác giả") !== -1) && !author) {
            var aEl = selFirst(pEl, "a");
            if (aEl) author = cleanText(aEl.text());
            if (!author) {
                var spanEl = selFirst(pEl, "span.font-weight-bold");
                if (spanEl) author = cleanText(spanEl.text());
            }
            if (!author) author = cleanText(pText.replace(/Tác [Gg]iả\s*[:：]?\s*/g, ""));
        } else if (pText.indexOf("Editor") !== -1 && !editor) {
            var eaEl = selFirst(pEl, "a");
            if (eaEl) editor = cleanText(eaEl.text());
            if (!editor) editor = cleanText(pText.replace(/Editor\s*[:：]?\s*/g, ""));
        } else if ((pText.indexOf("Số Chương") !== -1 || pText.indexOf("Số chương") !== -1) && !soChuong) {
            var spanS = selFirst(pEl, "span.heading");
            soChuong = spanS ? cleanText(spanS.text()) : cleanText(pText.replace(/Số [Cc]hương\s*[:：]?\s*/g, ""));
        } else if (pText.indexOf("Đổi full") !== -1 && !doiFull) {
            var spanD = selFirst(pEl, "span.heading");
            doiFull = spanD ? cleanText(spanD.text()) : cleanText(pText.replace(/Đổi full\s*[:：]?\s*/g, ""));
        } else if (pText.indexOf("Cập nhật") !== -1 && !capNhat) {
            var spanC = selFirst(pEl, "span.heading");
            capNhat = spanC ? cleanText(spanC.text()) : cleanText(pText.replace(/Cập nhật\s*[:：]?\s*/g, ""));
        }
    }

    // Mo ta
    var descEl = selFirst(doc, "#infomanga");
    var description = descEl ? cleanText(descEl.text()) : "";

    // The loai (chip tren trang chi tiet) — chi trong section.infobook
    // (toan trang co ca menu dieu huong 91 muc). Input la slug the loai.
    var genreEls = doc.select("section.infobook a[href*='/the-loai/']");
    var genres = [];
    var seenG = {};
    for (var g = 0; g < genreEls.size(); g++) {
        var gHref = genreEls.get(g).attr("href") || "";
        var gm = gHref.match(/\/the-loai\/([a-z0-9-]+)/);
        if (!gm) continue;
        var gSlug = gm[1];
        if (seenG[gSlug]) continue;
        var gName = cleanText(genreEls.get(g).text());
        if (!gName) continue;
        seenG[gSlug] = true;
        genres.push({ title: gName, input: gSlug, script: "genrecontent.js" });
    }

    // Trang thai: chi tin "So Chuong: N/M" (N==M -> hoan thanh).
    // Mac dinh ongoing=true ("N/??" khong ket luan duoc — xem ghi chu
    // dau file ve badge "Hoan Thanh" trong comment).
    var ongoing = true;
    var m = soChuong.match(/(\d+)\s*\/\s*(\d+)/);
    if (m && m[1] === m[2]) ongoing = false;

    // Chuoi thong tin hien o man hinh chi tiet.
    var detailParts = [];
    if (author) detailParts.push("Tác giả: " + author);
    if (editor) detailParts.push("Editor: " + editor);
    if (soChuong) detailParts.push("Số chương: " + soChuong);
    if (doiFull) detailParts.push("Đổi full: " + doiFull + " Kim Cương");
    if (capNhat) detailParts.push("Cập nhật: " + capNhat);

    // Goi y: truyen cung tac gia (tim kiem theo ten tac gia).
    var suggests = [];
    if (author) {
        suggests.push({ title: "Cùng tác giả: " + author, input: author, script: "search.js" });
    }

    return Response.success({
        name: name,
        author: author,
        cover: cover,
        description: description,
        detail: detailParts.join(" | "),
        url: storyUrl,
        type: "novel",
        format: "novel",
        ongoing: ongoing,
        genres: genres,
        suggests: suggests
    });
}
