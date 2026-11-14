load('config.js');

// Static tabs only (house rule: home.js must not fetch). Two sections in
// scope: ghost stories and jokes; each tab is paged by list.js.
function execute() {
    return Response.success([
        { title: "Truyện ma mới nhất", input: "/tim-truyen-ma", script: "list.js" },
        { title: "Truyện cười mới nhất", input: "/tim-truyen-cuoi", script: "list.js" }
    ]);
}
