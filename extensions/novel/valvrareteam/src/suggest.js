// suggest.js — Goi y: 10 truyen moi cap nhat nhat.
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    var r = fetchApiJson("/api/novels?limit=10");
    if (r.error) return Response.error(r.error);
    var data = r.data || {};
    var novels = data.novels || [];
    var items = [];
    for (var i = 0; i < novels.length; i++) {
        items.push(novelToItem(novels[i]));
    }
    return Response.success(items, "");
}
