// gen.js — Zumi Novel: danh sach truyen theo tab/the loai (parseNovelList
// trong file config.js: API /api/novels truoc, RSC roi DOM).
load('config.js');
load('rate-limit.js');
load('safe-first.js');

function execute(url, page) {
    return parseNovelList(url, page);
}
