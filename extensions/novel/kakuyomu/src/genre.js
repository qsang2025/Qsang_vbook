// genre.js — Danh sach the loai tinh (khong fetch). 12 the loai cua
// Kakuyomu, moi muc tro ve gen.js voi URL bang xep hang tich luy cua
// the loai do (kem work_variation=long — xem home.js).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    var base = "https://kakuyomu.jp/rankings/";
    var tail = "/entire?page=1&work_variation=long";
    return Response.success([
        { title: "「異世界ファンタジー」", input: base + "fantasy" + tail, script: "gen.js" },
        { title: "「現代ファンタジー」", input: base + "action" + tail, script: "gen.js" },
        { title: "「SF」", input: base + "sf" + tail, script: "gen.js" },
        { title: "「恋愛」", input: base + "love_story" + tail, script: "gen.js" },
        { title: "「ラブコメ」", input: base + "romance" + tail, script: "gen.js" },
        { title: "「現代ドラマ」", input: base + "drama" + tail, script: "gen.js" },
        { title: "「ホラー」", input: base + "horror" + tail, script: "gen.js" },
        { title: "「ミステリー」", input: base + "mystery" + tail, script: "gen.js" },
        { title: "「エッセイ・ノンフィクション」", input: base + "nonfiction" + tail, script: "gen.js" },
        { title: "「歴史・時代・伝奇」", input: base + "history" + tail, script: "gen.js" },
        { title: "「創作論・評論」", input: base + "criticism" + tail, script: "gen.js" },
        { title: "「詩・童話・その他」", input: base + "others" + tail, script: "gen.js" }
    ]);
}
