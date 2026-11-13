// genrecontent.js — Danh sach truyen cua 1 the loai (loc phia client
// vi API bo qua tham so genre — xem ghi chu trong file config.js).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(input, page) {
    return parseNovels(input, page);
}
