// genre.js — Danh sach the loai Ky Huyen (kyhuyen.com).
//
// Site co 16 the loai (kiem chung live 2026-11-18, form tim kiem tren
// /tim-kiem): 1 Ky huyen, 2 Vong du, 3 Linh di, 4 Huyen huyen, 5 Khoa
// huyen, 6 Do thi, 7 Tien hiep, 8 Vo hiep, 9 Lich su, 10 Quan su,
// 11 Dong nhan, 12 Canh ky, 13 Mat the, 14 Trinh tham, 15 Co dai,
// 16 Tay huyen. Nav trang chu chi hien 8 the, form tim kiem hien du 16
// nen lay truc tiep tu form tim kiem; neu fetch loi thi dung danh sach
// cung da kiem chung live lam fallback — the loai nao thieu o form thi
// lay tu fallback, dam bao du 16.
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// 16 the loai da kiem chung live 2026-11-18 (form tim kiem /tim-kiem).
var FALLBACK_GENRES = [
    { id: "1", title: "Kỳ huyễn" },
    { id: "2", title: "Võng du" },
    { id: "3", title: "Linh dị" },
    { id: "4", title: "Huyền huyễn" },
    { id: "5", title: "Khoa huyễn" },
    { id: "6", title: "Đô thị" },
    { id: "7", title: "Tiên hiệp" },
    { id: "8", title: "Võ hiệp" },
    { id: "9", title: "Lịch sử" },
    { id: "10", title: "Quân sự" },
    { id: "11", title: "Đồng nhân" },
    { id: "12", title: "Cạnh kỹ" },
    { id: "13", title: "Mạt thế" },
    { id: "14", title: "Trinh thám" },
    { id: "15", title: "Cổ đại" },
    { id: "16", title: "Tây huyễn" }
];

function execute() {
    var byId = {};

    // (1) Cac option the loai trong form tim kiem tren /tim-kiem.
    var r = fetchKyDoc(BASE_URL + "/tim-kiem");
    if (r.doc) {
        try {
            var html = r.doc.html() || "";
            var re = /<option[^>]*value="(\d+)"[^>]*>([^<]*)</g;
            var m = null;
            // Chi lay nhom option the loai (id 1-16): form co 3 nhom select
            // (nguon, the loai, tag) — phan biet bang vi tri: nhom the loai
            // nam ngay sau nhom nguon; don gian hon: lay theo ten da biet.
            var known = {};
            var fi = 0;
            for (fi = 0; fi < FALLBACK_GENRES.length; fi++) {
                known[FALLBACK_GENRES[fi].title] = FALLBACK_GENRES[fi].id;
            }
            while ((m = re.exec(html)) !== null) {
                var optTitle = cleanText(m[2]).replace(/^&nbsp;\s*/, "");
                var optId = m[1];
                if (known[optTitle] && known[optTitle] === optId) {
                    byId[optId] = optTitle;
                }
            }
        } catch (e) {
        }
    }

    // (2) Ghep voi danh sach cung da kiem chung live.
    var out = [];
    var i = 0;
    for (i = 0; i < FALLBACK_GENRES.length; i++) {
        var g = FALLBACK_GENRES[i];
        var title = byId[g.id] || g.title;
        out.push({ title: title, input: "/tim-kiem?cats=" + g.id, script: "gen.js" });
    }
    if (out.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(out);
}
