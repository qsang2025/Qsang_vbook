// genre.js — Danh sach the loai.
// 54 the loai that doc tu API (quet toan bo 232 truyen, kiem chung tu
// VM 2026-11-14), tru 2 the loai nguoi lon "Incest" / "Netorare" theo
// quy tac nha (khong dua noi dung NSFW vao catalog chung). API khong
// loc theo the loai nen moi muc tro ve genrecontent.js loc phia client.
load('config.js');

var GENRES = [
    "AI-assisted", "AI-translated", "Action", "Adventure", "Age Gap",
    "Character Growth", "Chinese Novel", "Comedy", "Cooking",
    "Different Social Status", "Drama", "Ecchi", "English Novel",
    "Fantasy", "Female Protagonist", "Game", "Gender Bender", "Harem",
    "Historical", "Horror", "Isekai", "Japanese Novel", "Josei",
    "Korean Novel", "Magic", "Martial Arts", "Mature", "Mecha",
    "Military", "Mystery", "One shot", "Otome Game", "Parody",
    "Psychological", "Romance", "School Life", "Science Fiction",
    "Seinen", "Shoujo", "Shounen", "Slice of Life", "Slow Life",
    "Sports", "Super Power", "Supernatural", "Suspense", "Tragedy",
    "Vietnamese Novel", "Wars", "Web Novel", "Workplace", "Yuri"
];

function execute() {
    var items = [];
    for (var i = 0; i < GENRES.length; i++) {
        items.push({
            title: GENRES[i],
            input: BASE_URL + "/api/novels?limit=100#genre=" + encodeURIComponent(GENRES[i]),
            script: "genrecontent.js"
        });
    }
    return Response.success(items);
}
