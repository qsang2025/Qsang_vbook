load('config.js');
load('rate-limit.js');
load('safe-first.js');

// The two top-level sections in scope, then their sub-categories read live
// from the section pages. Audio and 18+ sub-categories are filtered out in
// sectionCategories (see config.js).
function execute() {
    var genres = [
        { title: "Truyện ma", input: siteOrigin() + "/tim-truyen-ma", script: "list.js" },
        { title: "Truyện cười", input: siteOrigin() + "/tim-truyen-cuoi", script: "list.js" }
    ];

    var ma = sectionCategories(siteOrigin() + "/tim-truyen-ma");
    if (ma === null) return Response.error("Không tải được thể loại truyện ma");
    var cuoi = sectionCategories(siteOrigin() + "/tim-truyen-cuoi");
    if (cuoi === null) return Response.error("Không tải được thể loại truyện cười");

    var i;
    for (i = 0; i < ma.length; i++) {
        genres.push({ title: ma[i].title, input: ma[i].input, script: "list.js" });
    }
    for (i = 0; i < cuoi.length; i++) {
        genres.push({ title: cuoi[i].title, input: cuoi[i].input, script: "list.js" });
    }
    return Response.success(genres);
}
