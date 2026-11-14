// gen.js — Danh sach truyen TruyenHD (truyenhdc.com).
//
// Dung chung cho tab trang chu, the loai va chip the loai o trang chi
// tiet. Hai che do tuy theo input:
// - SSR: "/truyen-dich", "/truyen-sang-tac" — bang
//   table.theloai-thumlist (18 truyen/trang). Trang 1 fetch truc
//   tiep; trang sau qua POST admin-ajax load_more_page_keyword
//   (current_page_tax, the_loai DICHEDIT/SANGTAC, option new-chap)
//   — POST nay treo tu VM (tarpit IP datacenter) nhung chay tren
//   may that, kiem chung o device test.
// - API: "/keyword/<slug>" — trang the loai khong co SSR (chi
//   skeleton) nen goi GET API_HOST/wp-json/v1/app/cache/book
//   ?post=12&page=N&taxonomy=keyword&slug=<slug>&filter=new-chap,
//   tra JSON [{slug, title, thumbnail, excerpt, time, full}].
//   API host cat TLS tu VM (000), chi kiem chung duoc tren may that.
// Moi muc: ten o h2 a (hoac title cua item API), bia o img
// (data-src truoc, src sau), link ve trang chi tiet, mo ta la doan
// trich / thoi gian cap nhat.
load("config.js");
load("rate-limit.js");

// Parse 1 dong trong bang SSR: ca <tr> (trang /truyen-dich) va <li>
// (trang tim kiem) deu co class col-md-6.
function parseSsrRow(el) {
    var nameEl = selFirst(el, "h2 a");
    if (!nameEl) return null;
    var name = cleanText(nameEl.text());
    if (!name) return null;
    var href = nameEl.attr("href") || "";
    if (!href) {
        var thumbEl = selFirst(el, "a.thumbnail");
        if (thumbEl) href = thumbEl.attr("href") || "";
    }
    if (!href) return null;
    var cover = "";
    var imgEl = selFirst(el, "a.thumbnail img");
    if (!imgEl) imgEl = selFirst(el, "img");
    if (imgEl) {
        cover = imgEl.attr("data-src") || imgEl.attr("src") || "";
        cover = normalizeUrl(cover);
    }
    var descEl = selFirst(el, ".content p");
    var desc = descEl ? cleanText(descEl.text()) : "";
    return {
        name: name,
        cover: cover,
        link: normalizeUrl(href),
        description: desc,
        tag: "",
        host: BASE_URL
    };
}

function parseSsrDoc(doc) {
    var items = [];
    var seen = {};
    var rows = doc.select(".theloai-thumlist .col-md-6");
    if (rows.size() > 0) {
        rows.forEach(function (el) {
            var item = parseSsrRow(el);
            if (item && !seen[item.link]) {
                seen[item.link] = true;
                items.push(item);
            }
        });
        return items;
    }
    // Phan hoi AJAX (load_more_page_keyword) tra cac muc nam TRAN:
    // <a class="thumbnail"><img></a> + <h2><a> + <div class="content">
    // lien tiep trong body, khong co <tr>/li.col-md-6/.theloai-thumlist
    // (kiem chung tren may that 2026-11-14: 14.502 ky tu, muc dau
    // "Mong Trung Nhan"). Dung h2 a lam moc, ghep bia + mo ta theo
    // thu tu xuat hien.
    var anchors = doc.select("h2 a");
    var covers = doc.select("a.thumbnail img");
    var descs = doc.select(".content p");
    for (var i = 0; i < anchors.size(); i++) {
        var a = anchors.get(i);
        var name = cleanText(a.text());
        var href = a.attr("href") || "";
        if (!name || !href) continue;
        var link = normalizeUrl(href);
        if (seen[link]) continue;
        seen[link] = true;
        var cover = "";
        if (i < covers.size()) {
            var im = covers.get(i);
            cover = normalizeUrl(im.attr("data-src") || im.attr("src") || "");
        }
        var desc = "";
        if (i < descs.size()) desc = cleanText(descs.get(i).text());
        items.push({
            name: name,
            cover: cover,
            link: link,
            description: desc,
            tag: "",
            host: BASE_URL
        });
    }
    return items;
}

// Danh sach SSR: trang 1 fetch truc tiep, trang sau POST admin-ajax.
function executeSsr(path, page) {
    var full = normalizeUrl(path);
    if (!full) return Response.error("Link danh sách không hợp lệ.");
    var pageNum = parseInt(page || "1", 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;

    if (pageNum === 1) {
        var r = thdFetchDoc(full);
        if (r.error) return Response.error(r.error);
        var items = parseSsrDoc(r.doc);
        if (items.length === 0) return Response.error("Không đọc được danh sách truyện: " + full);
        var next = "";
        var maxEl = selFirst(r.doc, ".load_more_tax [data-maxpage]");
        if (maxEl) {
            var maxPage = parseInt(maxEl.attr("data-maxpage") || "1", 10);
            if (!isNaN(maxPage) && maxPage > 1) next = "2";
        }
        return Response.success(items, next);
    }

    var theLoai = "";
    if (path === "/truyen-dich") theLoai = "DICHEDIT";
    else if (path === "/truyen-sang-tac") theLoai = "SANGTAC";
    if (!theLoai) return Response.error("Không hỗ trợ phân trang cho danh sách này: " + path);
    var r2 = thdFetchDoc(BASE_URL + "/wp-admin/admin-ajax.php", full, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "action=load_more_page_keyword&current_page_tax=" + pageNum + "&the_loai=" + theLoai + "&option_keyword_tax=new-chap"
    });
    if (r2.error) return Response.error(r2.error);
    // Phan hoi la HTML fragment — doc da parse san, khong boc them
    // <table> (parser HTML5 se day noi dung khong-phai-bang ra ngoai).
    var items2 = parseSsrDoc(r2.doc);
    if (items2.length === 0) return Response.error("Hết truyện ở trang " + pageNum + ".");
    // Trang AJAX khong co maxpage; 18 muc/trang — it hon thi la trang cuoi.
    var next2 = items2.length >= 18 ? String(pageNum + 1) : "";
    return Response.success(items2, next2);
}

// Danh sach the loai qua API JSON cua site.
function executeApi(slug, page) {
    var pageNum = parseInt(page || "1", 10);
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1;
    var url = API_HOST + "/wp-json/v1/app/cache/book?post=12&page=" + pageNum + "&taxonomy=keyword&slug=" + slug + "&filter=new-chap";
    var r = thdFetchJson(url);
    if (r.error) return Response.error(r.error);
    var data = r.json;
    if (!data || typeof data.length !== "number" || data.length === 0) {
        return Response.error("Không đọc được danh sách truyện của thể loại này.");
    }
    var items = [];
    var seen = {};
    for (var i = 0; i < data.length; i++) {
        var b = data[i];
        if (!b || !b.slug) continue;
        var link = BASE_URL + "/truyen/" + b.slug + "/";
        if (seen[link]) continue;
        seen[link] = true;
        var name = cleanText(b.title || "");
        if (!name) continue;
        var desc = cleanText(b.excerpt || "");
        var tag = (String(b.full || "") === "1") ? "Full" : "";
        items.push({
            name: name,
            cover: normalizeUrl(b.thumbnail || ""),
            link: link,
            description: desc,
            tag: tag,
            host: BASE_URL
        });
    }
    if (items.length === 0) return Response.error("Không đọc được danh sách truyện của thể loại này.");
    // API tra 12 muc/trang — du 12 thi co the con trang sau.
    var next = data.length >= 12 ? String(pageNum + 1) : "";
    return Response.success(items, next);
}

function execute(url, page) {
    var input = String(url || "").trim();
    if (!input) return Response.error("Link danh sách không hợp lệ.");
    var m = input.match(/\/keyword\/([a-z0-9-]+)/);
    if (m) return executeApi(m[1], page);
    return executeSsr(input, page);
}
