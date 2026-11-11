// page.js — Mục lục không phân trang, trả URL detail cho toc.js
// Contract: execute(url) → [urlString, ...]
load("config.js");
function execute(url) {
    url = wikiNormalizeUrl(url);
    if (url.slice(-1) === "/") url = url.slice(0, -1);
    return Response.success([url]);
}