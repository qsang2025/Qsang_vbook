// home.js — 6 tab tinh, khong fetch (AGENTS.md muc 6.9: home.js chi tra
// tab tinh). Moi tab tro ve list.js voi URL danh muc day du.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

function execute() {
    return Response.success([
        {title: "Văn học Việt Nam", input: BASE_URL + "/danh-muc/van-hoc-viet-nam", script: "list.js"},
        {title: "Văn học nước ngoài", input: BASE_URL + "/danh-muc/van-hoc-nuoc-ngoai", script: "list.js"},
        {title: "Kiếm hiệp - Tiên hiệp", input: BASE_URL + "/danh-muc/kiem-hiep-tien-hiep", script: "list.js"},
        {title: "Tiểu thuyết Trung Quốc", input: BASE_URL + "/danh-muc/tieu-thuyet-trung-quoc", script: "list.js"},
        {title: "Lịch sử", input: BASE_URL + "/danh-muc/lich-su", script: "list.js"},
        {title: "Sách Nổi Bật", input: BASE_URL + "/danh-muc/sach-noi-bat", script: "list.js"}
    ]);
}
