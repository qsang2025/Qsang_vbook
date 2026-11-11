// search.js — Tim kiem truyen (Zongheng).
// Contract: execute(key, page) -> [{ name*, link*, cover?, description?, host? }], nextPage?
// Dung API JSON cong khai cua site (kiem chung 2026-11-11):
//   GET https://search.zongheng.com/search/book?keyword={kw}&sort=&pageNo={p}&pageNum=20&isFromHuayu=0
//   -> {"code":0,"data":{"datas":{"total":59,"totalPage":3,"list":[{bookId,name,coverUrl,authorName,description,chapterName,totalWord,updateTime,...}]}}}
// Ten trong API kem highlight <font color="RED"> — can strip tag.
// Scrape HTML trang /s da chet (vo rong, ket qua render bang JS) nen
// khong dung cach cu cua base v4 nua.
// Load: file rate-limit.js (pacing + retry).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load("config.js");
load("rate-limit.js");

function stripTags(s) {
    if (!s) return "";
    return String(s).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function execute(key, page) {
    page = page || "1";
    var pageNo = parseInt(page, 10);
    if (isNaN(pageNo) || pageNo < 1) pageNo = 1;
    var url = "https://search.zongheng.com/search/book?keyword=" + encodeURIComponent(key || "") + "&sort=&pageNo=" + pageNo + "&pageNum=20&isFromHuayu=0";
    var pf = pacedFetch(url, { headers: zhHeaders("https://www.zongheng.com/") });
    if (!pf.ok) {
        if (pf.error === "cooldown" || pf.status === 405 || pf.status === 429) {
            return Response.error(rateLimitErrorMessage("Zongheng", "search.zongheng.com", pf.cooldownRemainingMs));
        }
        return Response.error("Không tải được kết quả tìm kiếm (HTTP " + pf.status + ")");
    }
    var text = "";
    try { text = pf.res.text(); } catch (e) { text = ""; }
    if (!text) return Response.error("Không đọc được kết quả tìm kiếm");
    var json = null;
    try { json = JSON.parse(text); } catch (e) { return Response.error("Không đọc được kết quả tìm kiếm (site trả dữ liệu lạ)"); }
    if (!json || json.code !== 0 || !json.data) {
        return Response.error("Không đọc được kết quả tìm kiếm");
    }
    // Tu khoa khong co ket qua: API tra recDataList (goi y) thay vi datas
    // — coi la 0 ket qua, khong phai loi.
    if (!json.data.datas) return Response.success([], "");
    var datas = json.data.datas;
    var list = datas.list || [];
    var items = [];
    var seen = {};
    var i = 0;
    for (i = 0; i < list.length; i++) {
        var it = list[i];
        if (!it || !it.bookId) continue;
        var link = "https://www.zongheng.com/detail/" + it.bookId;
        if (seen[link]) continue;
        seen[link] = true;
        var name = zhCleanText(stripTags(it.name || ""));
        if (!name) continue;
        var cover = (it.coverUrl || "") + "";
        if (cover.indexOf("//") === 0) cover = "https:" + cover;
        else if (cover && cover.indexOf("http") !== 0) cover = "https://static.zongheng.com" + (cover.charAt(0) === "/" ? "" : "/") + cover;
        var descParts = [];
        if (it.authorName) descParts.push(String(it.authorName));
        if (it.chapterName) descParts.push("Mới nhất: " + stripTags(it.chapterName));
        if (it.totalWord) descParts.push(it.totalWord + "字");
        items.push({
            name: name,
            link: link,
            cover: cover,
            description: descParts.join(" • "),
            host: BASE_URL
        });
    }
    var next = "";
    if (datas.totalPage && pageNo < datas.totalPage) next = String(pageNo + 1);
    return Response.success(items, next);
}
