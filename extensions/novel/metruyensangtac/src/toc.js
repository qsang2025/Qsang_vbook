// toc.js — Muc luc cua Me Truyen Sang Tac.
//
// API chinh: POST pages/load_chapters.php
//   id_truyen=<DECU_ID_TRUYEN>&offset=<n>&limit=1000&order=asc
// tra JSON {total, chapters: [{tenchuong, sochuong, thoigian,
// is_locked, has_access}]}. API POST bi treo tu IP datacenter VM
// (tarpit) nhung chay tren may that.
// Chuong khoa: is_locked=true va has_access=false — danh dau [VIP] +
// pay/lock, KHONG mo khoa. Chuong khoa van mo duoc bang chap.js nhung
// se bao loi tieng Viet (xem file chap.js).
// Du phong khi API that bai: sinh danh sach tuan tu tu tong so chuong
// doc duoc tren trang chi tiet (khong danh dau khoa — chap.js se bao
// loi khi mo chuong khoa).
load("config.js");
load("rate-limit.js");
load("safe-first.js");

function cleanChapNum(n) {
    var s = String(n || "").trim();
    s = s.replace(/\.00$/, "");
    return s;
}

function chapNameFromApi(ch) {
    var title = (ch.tenchuong || ch.tieude || ch.title || "").trim();
    var num = cleanChapNum(ch.sochuong || ch.so_chuong || ch.chuong || ch.number || "");
    if (!title) return num ? "Chương " + num : "";
    if (num && title.indexOf("Chương") !== 0) return "Chương " + num + ": " + title;
    return title;
}

function execute(url) {
    var storyUrl = resolveUrl(url);
    var slug = extractSlug(storyUrl);
    if (!slug) return Response.error("Không xác định được truyện");

    // Buoc 1: lay id_truyen + tong so chuong tu trang chi tiet.
    var idTruyen = "";
    var totalChapters = 0;
    var r = fetchMTS(storyUrl);
    if (r.ok && r.res) {
        var rawHtml = "";
        try { rawHtml = r.res.text() || ""; } catch (e) { rawHtml = ""; }
        if (rawHtml) {
            var idMatch = ID_TRUYEN_RE.exec(rawHtml);
            if (idMatch) idTruyen = idMatch[1];
            var totalMatch = /Chương<\/span>\s*<span>(\d[\d,.]*)<\/span>/i.exec(rawHtml);
            if (totalMatch) {
                totalChapters = parseInt(totalMatch[1].replace(/[,.]/g, ""), 10) || 0;
            }
        }
    }

    // Buoc 2: muc luc qua API (nhieu slice offset/limit 1000).
    if (idTruyen) {
        var chapters = [];
        var seenNum = {};
        var offset = 0;
        var guard = 0;
        // Site tu dung limit=50 cho moi lan tai ("Xem them chuong").
        // limit lon hon bi cat xuong 500 VA offset bi bo qua (kiem chung
        // tren may that 2026-11-14: limit=1000 chi tra 500 chuong dau
        // mai). Dung limit=50, lap toi khi offset >= tong so chuong.
        while (guard < 60) {
            guard++;
            var body = "id_truyen=" + idTruyen + "&offset=" + offset + "&limit=50&order=asc";
            var apiRes = fetchMTS(BASE_URL + "/pages/load_chapters.php", {
                method: "POST",
                body: body,
                referer: storyUrl,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "X-Requested-With": "XMLHttpRequest"
                }
            });
            if (!apiRes.ok || !apiRes.res) break;
            var data = null;
            try { data = apiRes.res.json(); } catch (e2) { data = null; }
            if (!data || !data.chapters) break;
            if (data.total) {
                var t = parseInt(data.total, 10);
                if (!isNaN(t) && t > 0) totalChapters = t;
            }
            var list = data.chapters;
            var i = 0;
            for (i = 0; i < list.length; i++) {
                var ch = list[i];
                var num = cleanChapNum(ch.sochuong || ch.so_chuong || ch.chuong || ch.number || "");
                if (!num) num = String(offset + i + 1);
                if (seenNum[num]) continue;
                seenNum[num] = true;
                var item = {
                    name: chapNameFromApi(ch),
                    url: BASE_URL + "/read/" + slug + "&chuong=" + (ch.sochuong || ch.so_chuong || ch.chuong || num),
                    host: BASE_URL
                };
                if (ch.is_locked && !ch.has_access) {
                    item.name = "[VIP] " + item.name;
                    item.lock = true;
                    item.pay = true;
                }
                chapters.push(item);
            }
            offset += list.length;
            if (list.length === 0) break;
            if (totalChapters > 0 && offset >= totalChapters) break;
        }
        if (chapters.length > 0) return Response.success(chapters);
    }

    // Buoc 3: khong co tong so chuong — thu trinh duyet lay tu trang
    // chi tiet (link chuong cao nhat hoac dong "Chương N").
    if (totalChapters === 0) {
        var doc = openInBrowser(storyUrl);
        if (doc) {
            var chapLinks = doc.select("a[href*='chuong=']");
            var ci = 0;
            for (ci = 0; ci < chapLinks.size(); ci++) {
                var numMatch = /chuong=(\d+)/.exec(chapLinks.get(ci).attr("href") || "");
                if (numMatch) {
                    var num = parseInt(numMatch[1], 10);
                    if (num > totalChapters) totalChapters = num;
                }
            }
            if (totalChapters === 0) {
                var bodyText = doc.text();
                var chapCountMatch = /Chương\s*(\d[\d,.]*)/i.exec(bodyText);
                if (chapCountMatch) {
                    totalChapters = parseInt(chapCountMatch[1].replace(/[,.]/g, ""), 10) || 0;
                }
            }
        }
    }

    // Buoc 4: sinh danh sach tuan tu tu tong so chuong.
    if (totalChapters > 0) {
        var result = [];
        var n = 0;
        for (n = 1; n <= totalChapters; n++) {
            result.push({
                name: "Chương " + n,
                url: BASE_URL + "/read/" + slug + "&chuong=" + n,
                host: BASE_URL
            });
        }
        return Response.success(result);
    }

    return Response.error("Không tải được mục lục");
}
