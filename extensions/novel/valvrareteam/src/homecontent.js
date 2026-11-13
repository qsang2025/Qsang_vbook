// homecontent.js — Noi dung 1 tab trang chu (danh sach truyen).
load('config.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(input, page) {
    return parseNovels(input, page);
}
