// comment.js — Danh sách bình luận của một truyện (CHỈ ĐỌC, không ghi/like)
// Contract: execute(bookId, page) → [{name*, cover?, link?, description?, tag?, host?}], nextPage?
// API: GET /comment?bookId=..&start=..&order=newest — 10 mục/trang, KHÔNG cần
// đăng nhập, không Cloudflare, không ràng buộc IP (khảo sát §12).
// page = token start (offset) dạng chuỗi; lần đầu "" → start 0; nextPage =
// start kế tiếp (dạng chuỗi) hoặc "" khi hết. nextPage PHẢI là string!
// Một bình luận: user {fullname, picture}, chapter {name_vi, link} (HOẶC chỉ
// {$oid} trần khi gọi theo chương — xử lý cả 2 dạng), level (0=gốc, 1+=trả
// lời), message (HTML <p> + <blockquote>), interval (giây từ lúc đăng),
// children[] (trả lời lồng nhau — làm phẳng, thụt bằng tiền tố theo level).
// Không có đánh giá sao / like bình luận trên site này; ghi bình luận cần
// đăng nhập nên ngoài phạm vi v5.
// Tuân thủ Rhino ES6: chỉ var/function, nối chuỗi bằng +.
load("config.js");
load("rate-limit.js");

// "Cách đây X" từ số giây — cùng cách tính của site (hàm timeSince).
function wikiTimeSince(seconds) {
    var s = Math.floor(seconds);
    if (isNaN(s) || s < 0) s = 0;
    if (s < 60) return "Cách đây " + s + " giây";
    var m = Math.floor(s / 60);
    if (m < 60) return "Cách đây " + m + " phút";
    var h = Math.floor(m / 60);
    if (h < 24) return "Cách đây " + h + " giờ";
    var d = Math.floor(h / 24);
    if (d < 30) return "Cách đây " + d + " ngày";
    var mo = Math.floor(d / 30);
    if (mo < 12) return "Cách đây " + mo + " tháng";
    return "Cách đây " + Math.floor(mo / 12) + " năm";
}

// Bỏ thẻ HTML khỏi message; trích dẫn trong <blockquote> nối vào cuối.
function wikiStripMessage(html) {
    var s = (html || "") + "";
    var quote = "";
    var qm = s.match(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/i);
    if (qm) {
        quote = qm[1].replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
    }
    s = s.replace(/<blockquote[^>]*>[\s\S]*?<\/blockquote>/gi, " ");
    s = s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
    if (quote) s += " — Trích: " + quote;
    return s;
}

function wikiAvatarUrl(picture) {
    var p = (picture || "") + "";
    if (!p) return BASE_URL + "/static/img/default-avatar.png";
    if (p.indexOf("//") === 0) return "https:" + p;
    if (p.indexOf("http") !== 0) return BASE_URL + (p.charAt(0) === "/" ? "" : "/") + p;
    return p;
}

// Làm phẳng 1 bình luận + cây children của nó vào mảng items.
function wikiFlattenComment(c, level, items) {
    if (!c || c.is_deleted) return;
    var user = c.user || {};
    var fullname = ((user.fullname || "Vô danh") + "").trim() || "Vô danh";
    var seconds = c.interval;
    if (typeof seconds !== "number" || isNaN(seconds)) {
        // Dự phòng khi thiếu interval: tính từ created_at (epoch ms).
        var created = (c.created_at && c.created_at.$date) ? c.created_at.$date : 0;
        seconds = created ? (Date.now() - created) / 1000 : 0;
    }
    var prefix = "";
    for (var i = 0; i < level; i++) prefix += "↳ ";
    var name = prefix + fullname + " • " + wikiTimeSince(seconds);

    var text = wikiStripMessage(c.message);
    if (!text) return;

    // Chương đính kèm: dạng object đầy đủ {name_vi, link} khi gọi theo
    // truyện; dạng {$oid} trần khi gọi theo chương (không có link/tên).
    var chap = c.chapter || {};
    var chapName = (chap.name_vi || "") + "";
    var chapLink = (chap.link || "") + "";
    if (chapName) text += " — " + chapName;
    if (chapLink && chapLink.indexOf("http") !== 0) chapLink = BASE_URL + chapLink;

    var item = {
        name: name,
        cover: wikiAvatarUrl(user.picture),
        description: text,
        host: BASE_URL
    };
    if (chapLink) item.link = chapLink;
    if (level > 0) item.tag = "Trả lời";
    items.push(item);

    var kids = c.children || [];
    for (var j = 0; j < kids.length; j++) wikiFlattenComment(kids[j], level + 1, items);
}

function execute(query, page) {
    var bookId = (query || "") + "";
    if (!bookId) return Response.error("Thiếu mã truyện để tải bình luận.");
    var start = parseInt(page, 10);
    if (isNaN(start) || start < 0) start = 0;

    var apiUrl = BASE_URL + "/comment?bookId=" + encodeURIComponent(bookId)
        + "&start=" + start + "&order=newest";
    // Lay API qua pacedFetch (file rate-limit.js): nghi jitter truoc
    // request, retry 429/405/503 toi da 3 lan, ghi cooldown khi bi chan.
    var pf = pacedFetch(apiUrl, { headers: wikiHeaders(apiUrl) });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Wiki Dịch", "wikicv.org", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được bình luận (HTTP " + pf.status + ")");
    }
    // Body doc 1 lan: res.text() roi JSON.parse (tien le qimao-api.js).
    var raw = pf.res.text() + "";
    var data = null;
    try { data = JSON.parse(raw); } catch (e) { data = null; }
    if (!data || data.err !== 0 || !data.data) {
        return Response.error("Không đọc được bình luận — site đổi định dạng trả về.");
    }
    var d = data.data;
    var comments = d.comments || [];
    var items = [];
    for (var i = 0; i < comments.length; i++) wikiFlattenComment(comments[i], 0, items);

    // Trang ke: dung current_page/last_page tu response (KHONG dung counter
    // so binh luan cua site — counter lech ~1-2 so voi so muc API tra).
    var nextPage = "";
    if (d.current_page && d.last_page && d.current_page < d.last_page) {
        nextPage = String(start + 10);
    }
    return Response.success(items, nextPage);
}
