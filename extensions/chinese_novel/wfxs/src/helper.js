// helper.js — ham dung chung cho extension wfxs.tw.
// File helper (khong co execute), duoc nap boi cac script khac.
// Luu y: khong duoc viet lenh nap file trong comment o day (runtime
// vBook quet ca comment, se loi UniqueTag).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Loi cua lan fetch gan nhat (tieng Viet, de caller bao loi ro rang).
var lastFetchError = "";

// Fetch co pacing (rate-limit.js): 1 request/lan, jitter truoc moi
// request, backoff toi da 3 lan voi 429/405/503, ghi cooldown khi bi chan.
// Tra ve Document (jsoup) hoac null khi that bai; ly do nam o lastFetchError.
function fetchDocPaced(url) {
    lastFetchError = "";
    var r = null;
    try {
        r = pacedFetch(url, {});
    } catch (e) {
        lastFetchError = "lỗi mạng";
        return null;
    }
    if (!r) {
        lastFetchError = "lỗi mạng";
        return null;
    }
    if (!r.ok) {
        if (r.error === "cooldown") {
            var mins = Math.ceil((r.cooldownRemainingMs || 0) / 60000);
            if (mins < 1) mins = 1;
            lastFetchError = "đang tạm chặn, thử lại sau " + mins + " phút";
        } else {
            lastFetchError = "HTTP " + r.status;
        }
        return null;
    }
    if (!r.res) {
        lastFetchError = "lỗi mạng";
        return null;
    }
    try {
        return r.res.html();
    } catch (e2) {
        lastFetchError = "không đọc được trang";
        return null;
    }
}

// Doc so trang tu khoi phan trang cua site.
// Trang danh sach: ".pages" co dang "第 N / M 頁".
// Trang tim kiem: ".pagination .page-current" co dang "N / M".
// Tra ve {current, total}; khong doc duoc thi {1, 1}.
function parsePageInfo(doc) {
    var info = { current: 1, total: 1 };
    var el = safeFirst(doc.select(".pages"));
    var text = "";
    if (el) text = el.text();
    if (!text) {
        var cur = safeFirst(doc.select(".pagination .page-current"));
        if (cur) text = cur.text();
    }
    if (!text) return info;
    var m = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) {
        info.current = parseInt(m[1], 10);
        info.total = parseInt(m[2], 10);
        if (isNaN(info.current) || info.current < 1) info.current = 1;
        if (isNaN(info.total) || info.total < 1) info.total = 1;
    }
    return info;
}

// Escape HTML cho mot dong text truoc khi boc <p>.
function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// Dong rac can loai khoi noi dung chuong: quang cao/dan site.
function isJunkLine(line) {
    if (/微風小說網/.test(line)) return true;
    if (/^本章完$/.test(line)) return false;
    return false;
}

// Cat HTML tho cua khoi noi dung chuong thanh cac dong sach.
// Bo script/style/comment/a; <br> va </p> thanh xuong dong; bo the.
// Chuong tren wfxs.tw co 2 dang: nhieu <p> rieng, hoac 1 <p> lon chua
// toan bo chuong ngan cach bang \n — ca 2 deu tach dung o day.
function toLines(fragment) {
    var s = String(fragment)
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<a[\s>][\s\S]*?<\/a>/gi, "")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<\/(p|div|li|h\d|tr)>/gi, "\n")
        .replace(/<[^>]+>/g, "");
    var out = [];
    var parts = s.split(/\r?\n/);
    var i = 0;
    for (i = 0; i < parts.length; i++) {
        var line = parts[i].replace(/^[\s\u3000\u2000-\u200B\uFEFF]+|[\s\u3000\u2000-\u200B\uFEFF]+$/g, "");
        if (!line || isJunkLine(line)) continue;
        out.push(line);
    }
    return out;
}
