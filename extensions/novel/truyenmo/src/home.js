// home.js — Tab tinh cho Truyen Mo (khong fetch, theo AGENTS.md muc 6.9).
// Tab dau tien tro ve danh sach /truyen-moi.html (URL danh sach, khong
// parse trang chu "/") — tab "Hot thang nay" (parse trang chu) de thu 2.
load('config.js');

function execute() {
    return Response.success([
        {
            title: 'Truyện Mới Cập Nhật',
            input: BASE_URL + '/truyen-moi.html',
            script: 'gen.js'
        },
        {
            title: 'Truyện Hot Tháng Này',
            input: BASE_URL,
            script: 'gen.js'
        },
        {
            title: 'Truyện Hoàn Thành',
            input: BASE_URL + '/truyen-hoan-thanh.html',
            script: 'gen.js'
        }
    ]);
}
