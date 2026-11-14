// gen.js — Danh sach truyen LilyHub (danh sach chung cho moi tab).
// input: latest | completed | ongoing | cat:<ten the loai>
//        most-chapters | most-votes | most-views | recently-updated
// page: 1-based (nhu VBook truyen vao).
//
// Luu y: API PostgREST cua LilyHub doi luc tra 500 tam thoi
// (Cloudflare/proxy), nen moi request deu co retry + fallback host
// (xem file config.js). Truyen chua co chuong nao thi khong doc duoc
// trong VBook (toc.js se rong), nen danh sach luon loai tru chung.

load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

var LILY_SELECT = "id,title,cover_url,description,status,chapter_count,views,rating,votes,category,author,updated_date,created_date";

function execute(input, page) {
    var mode = input + "";
    var pn = parseInt(page + "", 10);
    if (!pn || pn < 1) pn = 1;

    // --- cac che do sap xep server-side (cot co kieu so/timestamp that) ---
    var serverOrder = "";
    if (mode === "completed" || mode === "ongoing") {
        serverOrder = "status=eq." + mode + "&order=created_date.desc";
    } else if (mode === "most-chapters") {
        serverOrder = "order=chapter_count.desc";
    } else if (mode === "recently-updated") {
        serverOrder = "order=updated_date.desc";
    } else {
        serverOrder = "order=created_date.desc";
    }

    // Truyen chua co chuong nao thi khong doc duoc trong VBook.
    var readable = "&is_hidden=eq.false&chapter_count=gt.0";

    if (mode.indexOf("cat:") === 0) {
        // The loai so khop ca "Bach Hop" lan "BÁCH HỢP" -> loc client-side.
        var all = lilyQuery("novels?select=" + LILY_SELECT + readable + "&limit=200");
        if (!all) return Response.error("Không lấy được danh sách truyện từ LilyHub.");
        var want = lilyFoldName(mode.substring(4));
        var hit = [];
        for (var i = 0; i < all.length; i++) {
            if (lilyFoldName(all[i].category) === want) hit.push(all[i]);
        }
        if (!hit.length && mode === "cat:Bách Hợp") hit = all;
        var from = (pn - 1) * LILY_PAGE_SIZE;
        var slice = [];
        for (var j = from; j < hit.length && slice.length < LILY_PAGE_SIZE; j++) slice.push(hit[j]);
        var items = [];
        for (var k = 0; k < slice.length; k++) items.push(lilyItem(slice[k]));
        var catNext = (from + LILY_PAGE_SIZE < hit.length) ? String(pn + 1) : "";
        return Response.success(items, catNext);
    }

    if (mode === "most-votes" || mode === "most-views") {
        // votes/views la cot TEXT -> order server ra sai ("9" > "1727"), sap client-side.
        var list = lilyQuery("novels?select=" + LILY_SELECT + readable + "&limit=200");
        if (!list) return Response.error("Không lấy được danh sách truyện từ LilyHub.");
        var field = mode === "most-votes" ? "votes" : "views";
        for (var m = 0; m < list.length; m++) list[m].__num = parseFloat(list[m][field] || 0) || 0;
        var tmp = [];
        for (var n = 0; n < list.length; n++) tmp.push(list[n]);
        tmp.sort(function (a, b) { return b.__num - a.__num; });
        var start = (pn - 1) * LILY_PAGE_SIZE;
        var out = [];
        for (var q = start; q < tmp.length && out.length < LILY_PAGE_SIZE; q++) out.push(lilyItem(tmp[q]));
        var sNext = (start + LILY_PAGE_SIZE < tmp.length) ? String(pn + 1) : "";
        return Response.success(out, sNext);
    }

    // --- phan trang chuan: xin them 1 dong de biet con trang sau khong ---
    var rows = lilyQuery("novels?select=" + LILY_SELECT + readable + "&" + serverOrder + "&limit=" + (LILY_PAGE_SIZE + 1) + "&offset=" + ((pn - 1) * LILY_PAGE_SIZE));
    if (!rows) return Response.error("Không lấy được danh sách truyện từ LilyHub.");
    var hasMore = rows.length > LILY_PAGE_SIZE;
    var result = [];
    var count = hasMore ? LILY_PAGE_SIZE : rows.length;
    for (var z = 0; z < count; z++) result.push(lilyItem(rows[z]));
    return Response.success(result, hasMore ? String(pn + 1) : "");
}
