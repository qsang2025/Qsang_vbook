// toc.js — Danh sach chuong TruyenHD (truyenhdc.com).
//
// Nhan 1 muc tu page.js: payload JSON (dang chuoi) thi POST
// admin-ajax roi doc .listchap li trong HTML tra ve; URL trang chi
// tiet thi doc truc tiep #dsc .listchap li. Moi dong: ten chuong o
// a, link chuong o href; chuong VIP co img alt="vip" trong dong thi
// danh dau pay + lock (khong mo khoa — chap.js se bao loi tieng
// Viet khi mo). Kiem chung live 2026-11-14: truyen mau 50 chuong
// trang 1, ch.31-50 VIP.
load("config.js");
load("rate-limit.js");

function parseTocDoc(doc, baseUrl) {
    var chapters = [];
    var seen = {};
    doc.select("#dsc .listchap li, .listchap li").forEach(function (el) {
        var aEl = selFirst(el, "a");
        if (!aEl) return;
        var name = cleanText(aEl.text());
        var href = aEl.attr("href") || "";
        if (!name || !href) return;
        var link = normalizeUrl(href);
        if (seen[link]) return;
        seen[link] = true;
        var vip = false;
        el.select("img").forEach(function (img) {
            if (String(img.attr("alt") || "").toLowerCase() === "vip") vip = true;
        });
        var entry = { name: name, url: link, host: BASE_URL };
        if (vip) {
            entry.pay = true;
            entry.lock = true;
        }
        chapters.push(entry);
    });
    return chapters;
}

function execute(url) {
    var input = String(url || "").trim();
    if (!input) return Response.error("Link mục lục không hợp lệ.");

    // Payload JSON tu page.js: POST admin-ajax lay chuong trang do.
    if (input.charAt(0) === "{") {
        var body = null;
        try {
            body = JSON.parse(input);
        } catch (e) {
            return Response.error("Dữ liệu phân trang mục lục không hợp lệ.");
        }
        // admin-ajax cua WordPress doc bien POST dang form-urlencoded
        // (khong phai JSON) — giong mau POST tim kiem cua truyenhoangdung.
        var form = "action=" + encodeURIComponent(body.action || "") +
            "&page=" + encodeURIComponent(String(body.page || "1")) +
            "&type=" + encodeURIComponent(String(body.type || "")) +
            "&id=" + encodeURIComponent(String(body.id || "")) +
            "&slug=" + encodeURIComponent(String(body.slug || ""));
        var r = thdFetchDoc(BASE_URL + "/wp-admin/admin-ajax.php", BASE_URL + "/", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: form
        });
        if (r.error) return Response.error(r.error);
        var chapters = parseTocDoc(r.doc, BASE_URL);
        if (chapters.length === 0) return Response.error("Không đọc được danh sách chương.");
        return Response.success(chapters);
    }

    // URL trang chi tiet: doc #dsc truc tiep.
    var full = normalizeUrl(input);
    var r2 = thdFetchDoc(full);
    if (r2.error) return Response.error(r2.error);
    var chapters2 = parseTocDoc(r2.doc, full);
    if (chapters2.length === 0) return Response.error("Không đọc được danh sách chương: " + full);
    return Response.success(chapters2);
}
