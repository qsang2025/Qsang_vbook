// cleanHtml.js — LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Quy tac build (xem thiet ke khung xuong muc 6.9): file nay chi la nguon mau
// o repo root. Buoc build PHAI copy/inline no vao thu muc src/ cua tung
// extension truoc khi dong plugin.zip, vi load() cua vBook chi load file o
// top level src/ trong cung extension, khong de quy, va file duoc load
// khong duoc load them file khac. Trong script dung no, viet o dau file:
//     file cleanHtml.js;
// Khong load file nay tu trong config.js hay bat ky file lib nao khac.
//
// Y tuong: cleanHtml trong truyenfull (Darkrai9x) + cleanHtml trong libs.js
// cua hajljnopera (qidian). Viet lai thanh 1 ban chuan duy nhat, co ghi chu
// ro cho nao co y bo bot so voi ban goc (xem ghi chu o cuoi ham cleanHtml).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

function stripTags(html) {
    var s = String(html === undefined || html === null ? "" : html);
    s = s.replace(/<script[\s\S]*?<\/script>/gi, "");
    s = s.replace(/<style[\s\S]*?<\/style>/gi, "");
    s = s.replace(/<!--[\s\S]*?-->/g, "");
    s = s.replace(/<[^>]+>/g, "");
    return s;
}

function cleanHtml(html) {
    var text = String(html === undefined || html === null ? "" : html);

    // 1. Bo the script/style/iframe/noscript va the quang cao an.
    text = text.replace(/<script[\s\S]*?<\/script>/gi, "");
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
    text = text.replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
    text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
    text = text.replace(/<[^>]*style\s*=\s*["'][^"']*font-size\s*:\s*0px[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, "");

    // 2. Bo comment HTML va the <a> (giua lai van ban ben trong thi tuy site;
    // ban chuan bo ca the a vi hau het a trong noi dung chuong la quang cao).
    text = text.replace(/<!--[\s\S]*?-->/g, "");
    text = text.replace(/<a[^>]*>[\s\S]*?<\/a>/gi, "");

    // 3. Bo vo div/span thua nhung GIU van ban ben trong.
    text = text.replace(/<\/?(?:div|span)[^>]*>/gi, "");

    // 4. Bo &nbsp; va cac entity khoang trang, chuan hoa <br>.
    text = text.replace(/&nbsp;/gi, " ");
    text = text.replace(/&#160;/g, " ");
    text = text.replace(/<br\s*\/?>/gi, "<br>");
    text = text.replace(/(<br>\s*){2,}/g, "<br>");
    text = text.replace(/^(?:<br>\s*)+|(?:<br>\s*)+$/g, "");

    // 5. Bo dau ngoac kep lech chuan, gon khoang trang thua giua cac the.
    text = text.replace(/[\u201c\u201d]/g, '"');
    text = text.replace(/>\s+</g, "><");
    text = text.replace(/[ \t\r]+/g, " ");

    // 6. Go kiem duyet kieu ch*t -> chet, gi*t -> giet, s*t -> sat.
    // (Danh sach lay tu ban truyenfull; them tu moi vao day khi gap.)
    text = text.replace(/ch\*t/gi, "ch\u1ebft");
    text = text.replace(/gi\*t/gi, "gi\u1ebft");
    text = text.replace(/s\*t/gi, "s\u00e1t");
    text = text.replace(/v\*n/gi, "v\u1eabn");
    text = text.replace(/th\*/gi, "thi");
    text = text.replace(/\u01b0/g, "\u01b0");

    // 7. Noi tu bi tach bang dau cham trong cung mot tu (vd. "ch.u.y.e.n"
    // -> "chuyen"), lap 3 lan cho cac tu bi tach nhieu cho. Chi noi khi
    // hai ben dau cham deu la chu thuong, khong xoa dau cau giua cac cau.
    var i = 0;
    for (i = 0; i < 3; i++) {
        text = text.replace(/([a-z\u00e0-\u1ef9])\s*\.\s*([a-z\u00e0-\u1ef9])/g, "$1$2");
    }

    return text.trim();
}

// Ghi chu ve cho da bo so voi ban goc truyenfull (co y, khong phai quen):
// - Ban goc co .replace(/\//g, '') xoa MOI dau "/" trong van ban, lam hong
//   ca ngay thang va cum tu co "/". Ban chuan nay KHONG xoa "/" nua.
// - Ban goc xoa moi dau backslash; ban chuan chi giu lai neu that su can,
//   vi backslash co the nam trong duong dan/noi dung goc.
