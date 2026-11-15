// chap.js — Doc noi dung mot chuong (execute(url) -> html, ten chuong).
//
// Trang chuong /<slug>-chapter-<n>/ (kiem chung live 2026-11-15):
// noi dung o div.entry-content, cac doan la <p>; co chuong gom 1 <p>
// lon duy nhat voi cac dong tach nhau bang <br> (ch.1 Slit-Eyed:
// 2 <p>, 10.250 ky tu). Cuoi chuong co doan quang cao bat dau bang
// "–TL Notes–" + patreon/discord — cat bo tu marker "–TL Notes–"
// tro di va xoa cac doan chi chua quang cao (patreon.com, discord.gg).
// Chuong doc DU, KHONG can dang nhap, khong VIP, khong preview
// (ch.1 Tyrant: 139 <p>, 10.087 ky tu, mo dau "I fucking did it!";
// ch.1 Slit-Eyed: mo dau "Why am I inside a game?").
// Chuong 1 trang duy nhat (khong chia trang).
// Ten chuong lay tu <title> dang "{truyen} – Chapter N – MattReading".
// Dung absUrl() thay cho normalizeUrl(): normalizeUrl() khong xu ly
// URL chi co path — fetch nhan URL tuong doi thi tra fake 504
// (bai hoc biqugezz 2026-11-15).
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

// Doan chi chua quang cao (khong phai noi dung truyen)?
function isPromoText(text) {
    var t = text || "";
    if (t.indexOf("patreon.com") !== -1) return true;
    if (t.indexOf("discord.gg") !== -1) return true;
    if (t.indexOf("Join my Discord") !== -1) return true;
    if (t.indexOf("Hope you enjoyed this chapter") !== -1) return true;
    return false;
}

// Cat 1 doan (HTML) tai marker "–TL Notes–" — phan sau marker la
// ghi chu cua dich gia + quang cao, khong phai noi dung chuong.
function cutAtTlNotes(html) {
    var idx = html.indexOf("–TL Notes–");
    if (idx !== -1) return html.substring(0, idx);
    var idx2 = html.indexOf("TL Notes");
    if (idx2 !== -1) return html.substring(0, idx2);
    return html;
}

function execute(url) {
    var chapUrl = absUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");
    var r = fetchMrDoc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select("div.entry-content"));
    if (contentEl === null) {
        return Response.error("Không tìm thấy nội dung chương (site có thể đã đổi giao diện): " + chapUrl);
    }
    var paras = contentEl.select("p");
    if (paras.size() === 0) {
        return Response.error("Chương này không có nội dung.");
    }
    // Moi <p> co the chua nhieu dong tach bang <br> (chuong 1 <p> lon
    // cua Slit-Eyed); cat tung dong tai marker TL Notes, bo doan quang
    // cao, giu cac dong truyen that — moi dong thanh 1 <p>.
    var html = "";
    var i = 0;
    var j = 0;
    for (i = 0; i < paras.size(); i++) {
        var inner = paras.get(i).html() || "";
        var segs = inner.split(/<br\s*\/?>/i);
        for (j = 0; j < segs.length; j++) {
            var seg = cutAtTlNotes(segs[j]);
            var segText = cleanText(seg.replace(/<[^>]+>/g, " "));
            if (!segText) continue;
            if (isPromoText(segText)) continue;
            html = html + "<p>" + seg + "</p>";
        }
    }
    if (!cleanText(html.replace(/<[^>]+>/g, " "))) {
        return Response.error("Chương này không có nội dung.");
    }

    var title = "";
    var t = doc.select("title").first();
    if (t !== null) {
        title = cleanText(t.text()).replace(/ – MattReading$/, "").replace(/ - MattReading$/, "");
    }
    return Response.success(html, title);
}
