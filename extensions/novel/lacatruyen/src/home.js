// home.js — Danh sach tab tinh trang chu La Ca Truyen (khong fetch mang)
function execute() {
    return Response.success([
        { title: "Mới cập nhật", input: "/api/stories/new-updates", script: "gen.js" },
        { title: "Top ngày", input: "/api/stories/top-view-day", script: "gen.js" },
        { title: "Thịnh hành tuần", input: "/api/stories/top-view-weeks", script: "gen.js" },
        { title: "Top tháng", input: "/api/stories/top-view-months", script: "gen.js" },
        { title: "Top thịnh hành", input: "/api/stories/top-trending-month", script: "gen.js" },
        { title: "Biên tập đề cử", input: "/api/stories/top-view-editor", script: "gen.js" },
        { title: "Sao mới nổi", input: "/api/stories/rising-stars", script: "gen.js" },
        { title: "Ra chương nhanh", input: "/api/stories/chapter-speed", script: "gen.js" }
    ]);
}
