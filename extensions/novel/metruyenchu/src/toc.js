// toc.js — Danh sach chuong Me Truyen Chu (ho tro phan trang AJAX /get/listchap)
//
// Load fetch-helpers.js + challenge-handler.js + helper.js (v4, N1):
// trang 1 fetch qua fetchPageDoc() (fetchDocWithFallback + kiem
// challenge, tra loi tieng Viet co huong dan khi gap Cloudflare/login).
// Cac trang AJAX doc text 1 lan roi JSON.parse (khong goi ca .text() va
// .json() tren cung response): neu body la trang challenge Cloudflare
// (isChallengeText) thi dung vong lap va tra phan muc luc da gom duoc,
// khong tiep tuc goi cac trang sau nua.
load('config.js');
load('fetch-helpers.js');
load('challenge-handler.js');
load('helper.js');

function execute(url) {
    if (!url || !String(url).trim()) return Response.error("Thiếu đường dẫn truyện.");
    url = normalizeUrl(url);

    var r = fetchPageDoc(url);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;
    var data = [];

    // Parse trang 1 tu HTML ban dau
    var el = doc.select("#chapter-list li a");
    if (el.size() === 0) {
        el = doc.select("#chapter-list a");
    }
    for (var i = 0; i < el.size(); i++) {
        var e = el.get(i);
        var name = e.text().trim();
        var chapterUrl = e.attr("href");
        if (name && chapterUrl) {
            data.push({
                name: name,
                url: chapterUrl,
                host: BASE_URL
            });
        }
    }

    // Trich xuat storyId va tong so trang tu page(storyId, pageNum) — CHI
    // trong khoi phan trang ".paging" cua muc luc, khong regex tren toan
    // bo HTML nua (trang qua gioi han ma van lay page() o cho khac se
    // dem thua trang va lap chuong: AJAX trang vuot gioi han tra lai
    // noi dung trang 1, kiem chung bang curl 2026-11-08).
    var pagingEl = doc.select(".paging").first();
    var pagingHtml = pagingEl ? pagingEl.html() : "";
    var storyIdMatch = pagingHtml.match(/page\((\d+),/);
    if (storyIdMatch) {
        var storyId = storyIdMatch[1];
        var totalPages = 1;
        var pageMatches = pagingHtml.match(/page\(\d+,\s*(\d+)\)/g);
        if (pageMatches) {
            for (var p = 0; p < pageMatches.length; p++) {
                var numMatch = pageMatches[p].match(/page\(\d+,\s*(\d+)\)/);
                if (numMatch) {
                    var pageNum = parseInt(numMatch[1], 10);
                    if (pageNum > totalPages) {
                        totalPages = pageNum;
                    }
                }
            }
        }

        // Fetch cac trang tiep theo qua AJAX API, TUAN TU tung trang (C2):
        // giu nguyen chu khong chay song song — site chua biet gioi han
        // toc do, truyen 1.844 chuong da chay xong tren may that
        // 2026-11-08; khong co delay giua cac trang. Neu Anh bao muc luc
        // truyen dai tai cham thi moi can nhac do thoi gian tung trang /
        // tang items_per_page cua API (neu API cho), khong toi uu mu.
        // Mot trang loi thi thu lai 1 lan roi BO QUA trang do va tiep tuc
        // cac trang sau — khong break toan bo muc luc nua (tru khi trang
        // tra 0 chuong, nghia la da het danh sach that). Rieng khi gap
        // trang challenge Cloudflare thi DUNG vong lap (cac trang sau
        // cung se challenge) va tra phan muc luc da gom duoc.
        for (var pNum = 2; pNum <= totalPages; pNum++) {
            var apiUrl = BASE_URL + "/get/listchap/" + storyId + "?page=" + pNum;
            var apiResponse = null;
            var tries = 0;
            while (tries < 2 && !(apiResponse && apiResponse.ok)) {
                try {
                    apiResponse = fetchWithMirrors(apiUrl);
                } catch (err) {
                    apiResponse = null;
                }
                tries++;
            }
            if (!apiResponse || !apiResponse.ok) {
                console.log("toc.js bo qua trang AJAX " + pNum + " (loi " + (apiResponse ? apiResponse.status : "mang") + "), tiep tuc trang sau.");
                continue;
            }
            var apiText = "";
            try {
                apiText = String(apiResponse.text() || "");
            } catch (errT) {
                apiText = "";
            }
            if (apiText && isChallengeText(apiText)) {
                console.log("toc.js gap trang challenge Cloudflare o trang AJAX " + pNum + ", dung vong lap, tra " + data.length + " chuong da gom.");
                break;
            }
            var json = null;
            try {
                json = JSON.parse(apiText);
            } catch (err2) {
                json = null;
            }
            if (!json || !json.data) {
                console.log("toc.js bo qua trang AJAX " + pNum + " (JSON loi/rong), tiep tuc trang sau.");
                continue;
            }
            var chapterDoc = Html.parse(json.data);
            var chapters = chapterDoc.select("li a");
            if (chapters.size() === 0) {
                chapters = chapterDoc.select("a");
            }
            if (chapters.size() === 0) break;
            for (var j = 0; j < chapters.size(); j++) {
                var c = chapters.get(j);
                var cName = c.text().trim();
                var cUrl = c.attr("href");
                if (cName && cUrl) {
                    data.push({
                        name: cName,
                        url: cUrl,
                        host: BASE_URL
                    });
                }
            }
        }
    }

    if (data.length === 0) {
        return Response.error("Không tìm thấy danh sách chương.");
    }

    return Response.success(data);
}
