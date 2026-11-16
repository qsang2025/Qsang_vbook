// genre.js — Danh sach the loai tinh (khong fetch). 30 muc tu bang the
// loai cua API tieu thuyet: 5 loc loai truyen + 4 the loai lon + 21 the
// loai nho. Moi muc tro ve gen.js voi URL API (sap xep theo danh gia
// tich luy, 100 muc/trang, co phan trang qua st).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    var base = "https://api.syosetu.com/novelapi/api/?order=hyoka&of=t-n-gp-nt-ga&out=json&lim=100";
    return Response.success([
        { title: "「短編」", input: base + "&type=t", script: "gen.js" },
        { title: "「連載中」", input: base + "&type=r", script: "gen.js" },
        { title: "「完結済連載小説」", input: base + "&type=er", script: "gen.js" },
        { title: "「すべての連載小説(連載中および完結済)」", input: base + "&type=re", script: "gen.js" },
        { title: "「短編と完結済連載小説」", input: base + "&type=ter", script: "gen.js" },
        { title: "〔恋愛〕", input: base + "&biggenre=1", script: "gen.js" },
        { title: "〔ファンタジー〕", input: base + "&biggenre=2", script: "gen.js" },
        { title: "〔文芸〕", input: base + "&biggenre=3", script: "gen.js" },
        { title: "〔SF〕", input: base + "&biggenre=4", script: "gen.js" },
        { title: "異世界〔恋愛〕", input: base + "&genre=101", script: "gen.js" },
        { title: "現実世界〔恋愛〕", input: base + "&genre=102", script: "gen.js" },
        { title: "ハイファンタジー〔ファンタジー〕", input: base + "&genre=201", script: "gen.js" },
        { title: "ローファンタジー〔ファンタジー〕", input: base + "&genre=202", script: "gen.js" },
        { title: "純文学〔文芸〕", input: base + "&genre=301", script: "gen.js" },
        { title: "ヒューマンドラマ〔文芸〕", input: base + "&genre=302", script: "gen.js" },
        { title: "歴史〔文芸〕", input: base + "&genre=303", script: "gen.js" },
        { title: "推理〔文芸〕", input: base + "&genre=304", script: "gen.js" },
        { title: "ホラー〔文芸〕", input: base + "&genre=305", script: "gen.js" },
        { title: "アクション〔文芸〕", input: base + "&genre=306", script: "gen.js" },
        { title: "コメディー〔文芸〕", input: base + "&genre=307", script: "gen.js" },
        { title: "VRゲーム〔SF〕", input: base + "&genre=401", script: "gen.js" },
        { title: "宇宙〔SF〕", input: base + "&genre=402", script: "gen.js" },
        { title: "空想科学〔SF〕", input: base + "&genre=403", script: "gen.js" },
        { title: "パニック〔SF〕", input: base + "&genre=404", script: "gen.js" },
        { title: "童話〔その他〕", input: base + "&genre=9901", script: "gen.js" },
        { title: "詩〔その他〕", input: base + "&genre=9902", script: "gen.js" },
        { title: "エッセイ〔その他〕", input: base + "&genre=9903", script: "gen.js" },
        { title: "リプレイ〔その他〕", input: base + "&genre=9904", script: "gen.js" },
        { title: "その他〔その他〕", input: base + "&genre=9999", script: "gen.js" },
        { title: "ノンジャンル〔ノンジャンル〕", input: base + "&genre=9801", script: "gen.js" }
    ]);
}
