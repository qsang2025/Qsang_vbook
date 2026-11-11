// safe-first.js — LIB DUNG CHUNG (NGUON MAU, KHONG CHAY TRUC TIEP).
//
// Helper lay phan tu dau tien cua mot Elements mot cach an toan.
//
// QUIRK RUNTIME vBook (kiem chung tren may that 2026-11-11, xem
// WIKICV-PROGRESS.md §10): Elements.first() KHONG bao gio tra null —
// select rong van tra mot object rong truthy (attr/text deu rong).
// Vi vay khong duoc dung kieu `if (!el.select(...).first())` de kiem
// tra ton tai hay lam fallback — chuoi fallback se khong bao gio chay.
// safeFirst tra ve element that neu co, null neu khong co — kiem tra
// bang size() thay vi tin first().
//
// Cach dung trong script: file nay phai duoc load truoc khi goi,
// dat sau file config.js trong danh sach load o dau script. Vi du:
//     var titleEl = safeFirst(el.select("h1"));
//     if (titleEl) { name = titleEl.text(); }
// Luu y: safeFirst tra null khi rong, nen CHI goi .text()/.attr()
// sau khi da guard null (if (titleEl) / titleEl !== null). Goi truc
// tiep tren ket qua co the null se crash — code cu dung .first()
// thi goi truc tiep duoc (tra ""), code moi phai co guard.
//
// Quy tac build (AGENTS.md muc 6.9): file nay chi la nguon mau o
// repo root. Buoc build PHAI copy/inline no vao thu muc src/ cua
// tung extension truoc khi dong plugin.zip, vi load cua vBook chi
// load file o top level src/ trong cung extension, khong de quy,
// va file duoc load khong duoc load them file khac. File nay khong
// load them file nao.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function safeFirst(els) {
    if (!els) return null;
    try {
        if (els.size() > 0) return els.first();
    } catch (e) {}
    return null;
}
