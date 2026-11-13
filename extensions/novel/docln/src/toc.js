// toc.js — muc luc chuong cua mot truyen (execute(url) -> [{name, url, description}]).
//
// Muc luc nam tren trang chi tiet, chia theo volume:
//   section.volume-list
//     header                    ten volume ("Quyển 1: ...", "Tập 01: ...")
//     ul.list-chapters > li > a[href="/truyen/<id>-<slug>/c<cid>-<ten>"]
//                             hoac /sang-tac/<id>-<slug>/c<cid>-<ten>
// Tat ca chuong deu co san trong HTML (cac li class "none" chi an tren
// mobile — nut "Xem tiep (N chương)" chi bo class an), nen khong can page.js.
// Chuong minh hoa (anh) van co trong muc luc; chuong trung link duoc loai
// trung theo URL.
//
// Tai len: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var id = bookId(url);
    if (!id) return Response.error("URL không hợp lệ: " + url);
    var target = toSiteUrl(url);

    var r = fetchDoclnDoc(target);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    // Ten volume theo thu tu cac section; so li moi ul de ghep volume cho
    // tung chuong (khong dung parent() — runtime khong co).
    var headers = doc.select("section.volume-list header");
    var uls = doc.select("ul.list-chapters");
    var volNames = [];
    var volCounts = [];
    var h = 0;
    for (h = 0; h < headers.size(); h++) {
        volNames.push(cleanText(headers.get(h).text()).replace(/\s*\*$/, ""));
    }
    for (h = 0; h < uls.size(); h++) {
        var inner = String(uls.get(h).html() || "");
        var cnt = inner.split("<li").length - 1;
        if (cnt < 0) cnt = 0;
        volCounts.push(cnt);
    }

    var data = [];
    var seen = {};
    var sel = doc.select("ul.list-chapters li a[href]");
    var idx = 0;
    var volIdx = 0;
    var volUsed = 0;
    for (var i = 0; i < sel.size(); i++) {
        var a = sel.get(i);
        var href = String(a.attr("href") || "");
        if (!href) continue;
        var link = toSiteUrl(href);
        if (seen[link]) continue;
        // Ghep volume: dem so chuong da lay trong volume hien tai.
        while (volIdx < volCounts.length && volUsed >= volCounts[volIdx]) {
            volIdx++;
            volUsed = 0;
        }
        var vol = "";
        if (volIdx < volNames.length) vol = volNames[volIdx];
        volUsed++;
        var name = cleanText(a.text()) || cleanText(a.attr("title"));
        if (!name) name = "Chương " + (idx + 1);
        seen[link] = 1;
        idx++;
        var item = { name: name, url: link, host: BASE_URL };
        if (vol) item.description = vol;
        data.push(item);
    }

    if (data.length === 0) return Response.error("Không tìm thấy danh sách chương cho truyện " + id);
    return Response.success(data);
}
