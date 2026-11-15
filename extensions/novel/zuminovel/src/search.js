// search.js — Zumi Novel: tim kiem qua /list?search= (parseNovelList
// trong file config.js doi thanh /api/novels?search=).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(key, page) {
    var q = encodeURIComponent(key);
    var url = BASE_URL + '/list?search=' + q;
    return parseNovelList(url, page);
}
