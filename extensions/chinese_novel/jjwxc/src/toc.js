// toc.js — Muc luc chuong cua mot truyen (execute(url) -> [{name, url}]).
//
// Muc luc DAY DU tren trang truyen onebook.php?novelid=<id> (kiem
// chung live 2026-11-19 voi 砸锅卖铁去上学: 338 chuong):
// - Moi chuong la 1 dong tr[itemprop*="chapter"] (dong chuong moi
//   nhat co itemprop "chapter newestChapter" nen phai dung *=).
// - Link chuong: a[itemprop="url"] dau tien trong dong. Chuong mien
//   phi co href onebook.php?novelid=&chapterid=; chuong VIP khong
//   co href, thay bang rel my.jjwxc.net/onebook_vip.php?... +
//   onclick vip_buy(...) + nhan [VIP] do.
// - Ten chuong: text link "第 N 章" (co khoang trang) + phu de o td
//   thu 3 (vd "捡了一个月垃圾") neu co.
// - Chuong VIP: ten co tien to "[VIP] ", lock/pay = true. URL van
//   dung dang www onebook.php?novelid=&chapterid= de chap.js nhan
//   dien trang dang nhap va bao loi ro — KHONG bypass VIP.
// - Muc luc khong phan trang nen khong co page.js.
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

function execute(url) {
    var storyUrl = normalizeStoryUrl(String(url || ""));
    var nid = novelIdFromUrl(storyUrl);
    if (!nid) {
        return Response.error("Đường dẫn truyện không hợp lệ: " + String(url || ""));
    }
    var r = fetchJjDoc(storyUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var rows = doc.select('tr[itemprop*="chapter"]');
    if (rows.size() === 0) {
        return Response.error("Không tìm thấy mục lục: " + storyUrl);
    }

    var data = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < rows.size(); i++) {
        var row = rows.get(i);
        var a = safeFirst(row.select('a[itemprop="url"]'));
        if (a === null) continue;
        var href = String(a.attr("href") || "");
        var rel = String(a.attr("rel") || "");
        var onclick = String(a.attr("onclick") || "");
        var cm = /[?&]chapterid=(\d+)/.exec(href);
        if (!cm) cm = /[?&]chapterid=(\d+)/.exec(rel);
        if (!cm) continue;
        var cid = cm[1];
        if (seen[cid]) continue;
        seen[cid] = true;
        var isVip = rel.indexOf("onebook_vip") !== -1 || onclick.indexOf("vip_buy") !== -1;
        var name = cleanText(a.text());
        var tds = row.select("td");
        var subtitle = "";
        if (tds.size() > 2) subtitle = cleanText(tds.get(2).text());
        if (subtitle) name = name ? name + " " + subtitle : subtitle;
        if (!name) name = "第 " + cid + " 章";
        if (isVip && name.indexOf("[VIP]") !== 0) name = "[VIP] " + name;
        data.push({
            name: name,
            url: BASE_URL + "/onebook.php?novelid=" + nid + "&chapterid=" + cid,
            host: siteOrigin(),
            lock: isVip,
            pay: isVip,
            type: "chapter"
        });
    }
    if (data.length === 0) {
        return Response.error("Không tìm thấy chương nào trong mục lục: " + storyUrl);
    }
    return Response.success(data);
}
