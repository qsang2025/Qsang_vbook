// search.js — Tim kiem theo tu khoa (execute(key, page) -> items, nextPage).
//
// Site luu moi thu bang GBK, nen tu khoa phai gui dang GBK thi
// backend moi khop (kiem chung live 2026-11-19: search.php?kw=
// <GBK percent-encode>&t=1 tra dung 25 ket qua, kw UTF-8 tra
// mojibake). WebView encode form GET theo charset cua document
// (GBK) nen trang ket qua chay qua form tim kiem cua chinh site
// bang Engine.newBrowser(): form form8, input name=kw (id
// autoComplete), action search.php, t=1 (tim theo ten tac pham).
// Form chi co tren trang danh sach/truyen (trang chu khong co) nen
// mo trang danh sach mien phi roi submit form.
// Ket qua: cac khoi h3.title > a + div.intro + div.info (ghep theo
// thu tu). Trang ket qua khong thay link phan trang (kiem chung
// 2026-11-19) nen chi tra 1 trang, next de trong.
//
// Tai len: file config.js, file config-helpers.js, file
// fetch-helpers.js, file rate-limit.js, file safe-first.js, file
// gbk.js, file cleanHtml.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('gbk.js');
load('cleanHtml.js');
load('helper.js');

// Parse ket qua tim kiem: h3.title (ten + link), ghep div.intro va
// div.info theo cung thu tu xuat hien.
function parseSearchResults(doc) {
    var items = [];
    var seen = {};
    var titles = doc.select("h3.title");
    var intros = doc.select("div.intro");
    var infos = doc.select("div.info");
    var i = 0;
    for (i = 0; i < titles.size(); i++) {
        var a = safeFirst(titles.get(i).select("a"));
        if (a === null) continue;
        var link = normalizeStoryUrl(jjAbsUrl(a.attr("href")));
        if (!link || !novelIdFromUrl(link) || seen[link]) continue;
        var name = cleanText(a.text());
        if (!name) continue;
        seen[link] = true;
        var desc = "";
        if (i < intros.size()) desc = cleanText(intros.get(i).text());
        var info = "";
        if (i < infos.size()) info = cleanText(infos.get(i).text());
        if (info) desc = desc ? desc + " ┃ " + info : info;
        items.push({
            name: name,
            cover: "",
            link: link,
            description: desc,
            tag: "",
            host: siteOrigin()
        });
    }
    return items;
}

function execute(key, page) {
    var k = cleanText(key);
    if (!k) return Response.error("Thiếu từ khoá tìm kiếm.");
    var pRaw = (page === undefined || page === null) ? "" : String(page).replace(/\s/g, "");
    var pn = parseInt(pRaw, 10);
    if (isNaN(pn) || pn < 1) pn = 1;
    if (pn > 1) {
        return Response.error("Tìm kiếm trên jjwxc.net chỉ trả 1 trang kết quả.");
    }
    if (typeof Engine === "undefined") {
        return Response.error("Tìm kiếm cần WebView của app (Engine không khả dụng).");
    }

    var doc = null;
    var b = Engine.newBrowser();
    try {
        b.launch(BASE_URL + "/bookbase_slave.php?booktype=free", 15000);
        b.callJs("(function(){var i=document.querySelector('input[name=kw]');if(!i){return 'NOINPUT';}i.value=" + JSON.stringify(k) + ";var f=i.form;if(!f){return 'NOFORM';}f.submit();return 'SUBMITTED';})()", 8000);
        // Trang ket qua ve sau ~0.5-2s; poll toi khi title chua
        // "搜索" (trang ket qua) thay vi sleep co dinh dai.
        for (var t = 0; t < 10; t++) {
            sleep(600);
            doc = b.html(6000);
            if (!doc) continue;
            var ti = String(doc.select("title").text() || "");
            if (ti.indexOf("搜索") !== -1) break;
        }
    } catch (e) {
        return Response.error("Lỗi trình duyệt tìm kiếm: " + e);
    } finally {
        b.close();
    }

    if (!doc) return Response.error("Không đọc được trang kết quả tìm kiếm.");
    var data = parseSearchResults(doc);
    if (data.length === 0) return Response.error("Không tìm thấy \"" + k + "\"");
    return Response.success(data, "");
}
