load('config.js');

// Static tabs only (house rule: home.js must not fetch). One tab per genre;
// each tab is paged by list.js.
function execute() {
    var tabs = [];
    for (var i = 0; i < GENRES.length; i++) {
        tabs.push({ title: GENRES[i].title, input: "/" + GENRES[i].slug + "/", script: "list.js" });
    }
    return Response.success(tabs);
}
