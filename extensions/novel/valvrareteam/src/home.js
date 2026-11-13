// home.js — Cac tab trang chu (chi tra tab tinh, khong fetch).
// "Dang tien hanh" / "Hoan thanh" loc phia client vi API bo qua tham
// so status (xem ghi chu trong file config.js).
load('config.js');

function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: BASE_URL + "/api/novels?limit=20", script: "homecontent.js" },
        { title: "Truyện hot", input: BASE_URL + "/api/novels/hot?timeRange=week&limit=15", script: "homecontent.js" },
        { title: "Đang tiến hành", input: BASE_URL + "/api/novels?limit=100#status=Ongoing", script: "homecontent.js" },
        { title: "Hoàn thành", input: BASE_URL + "/api/novels?limit=100#status=Completed", script: "homecontent.js" }
    ]);
}
