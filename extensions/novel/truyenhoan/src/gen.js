// gen.js — Danh sach truyen theo danh muc / the loai
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v3, N1):
// fetch qua fetchPageDoc() (fetchDoc + kiem challenge, tra loi tieng Viet
// co huong dan khi gap Cloudflare/login). Trang list trong (0 truyen) la
// ket qua binh thuong, tra success rong (N2), khong bao error.
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function normalizeCategoryInput(input) {
    if (input === null || input === undefined) return "";
    var s = String(input).trim();
    if (!s) return "";
    s = s.replace(/^\/+/, "");
    s = s.replace(/\/+$/, "");
    return s;
}

function execute(input, page) {
    page = page ? String(page) : "1";

    var raw = normalizeCategoryInput(input);
    if (!raw) {
        return Response.error("Thiếu danh mục hoặc thể loại.");
    }

    var url = BASE_URL + "/" + raw + "/";
    if (page !== "1") {
        url = BASE_URL + "/" + raw + "/trang-" + page + "/";
    }

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var novels = parseNovelRows(doc);
    // Trang list trong (the loai/trang khong co truyen) la ket qua binh
    // thuong: tra success rong thay vi error (N2).
    if (novels.length === 0) {
        return Response.success([], "");
    }

    var nextPage = findNextPage(doc);
    return Response.success(novels, nextPage);
}
