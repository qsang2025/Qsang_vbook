load('config.js');

// The site's 7 genres are fixed categories; return them statically (no
// fetch needed — the list is the site's own genre menu, verified live).
function execute() {
    var genres = [];
    for (var i = 0; i < GENRES.length; i++) {
        genres.push({ title: GENRES[i].title, input: siteOrigin() + "/" + GENRES[i].slug + "/", script: "list.js" });
    }
    return Response.success(genres);
}
