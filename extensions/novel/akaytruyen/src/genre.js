// genre.js — Danh sach the loai AkayTruyen (akaytruyen.com).
//
// Site co 23 the loai (kiem chung live 2026-11-13), doc tu nav trang chu:
// link dang /the-loai/<slug>, ten hien dang "Ten The Loai (so truyen)"
// nen cat bo hau to " (N)". Neu doc live that bai hoac thieu thi bo sung
// tu danh sach cung da kiem chung live lam fallback, dam bao du 23.
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// 23 the loai da kiem chung live 2026-11-13 (nav trang chu, kem so truyen
// hien tren nav luc do: Tien Hiep 16, Huyen Huyen ...). Thu tu theo nav.
var FALLBACK_GENRES = [
    { slug: "co-dai", title: "Cổ Đại" },
    { slug: "tien-hiep", title: "Tiên Hiệp" },
    { slug: "huyen-huyen", title: "Huyền Huyễn" },
    { slug: "goc-cam-ky-thi-hoa", title: "Góc cầm kỳ thi họa" },
    { slug: "gia-tuong", title: "Giả tưởng" },
    { slug: "hai-huoc", title: "Hài Hước" },
    { slug: "tam-linh", title: "Tâm Linh" },
    { slug: "kinh-di", title: "Kinh Dị" },
    { slug: "hien-dai", title: "Hiện Đại" },
    { slug: "noi-tam", title: "Nội Tâm" },
    { slug: "ngon-tinh", title: "Ngôn Tình" },
    { slug: "hoc-duong", title: "Học Đường" },
    { slug: "xuyen-khong", title: "Xuyên Không" },
    { slug: "event", title: "Event" },
    { slug: "nu-cuong", title: "Nữ Cường" },
    { slug: "trung-sinh", title: "Trùng Sinh" },
    { slug: "vong-du", title: "Võng Du" },
    { slug: "giai-tri", title: "Giải Trí" },
    { slug: "khoa-huyen", title: "Khoa Huyễn" },
    { slug: "hac-am", title: "Hắc Ám" },
    { slug: "tu-chan-sinh-hoc", title: "Tu Chân Sinh Học" },
    { slug: "co-tich-bien-tau", title: "Cổ Tích Biên Tàu" },
    { slug: "di-gioi", title: "Dị Giới" }
];

function execute() {
    var bySlug = {};
    var order = [];

    var r = fetchAkDoc(BASE_URL + "/");
    if (r.doc) {
        r.doc.select("a[href*=\"/the-loai/\"]").forEach(function (el) {
            var href = el.attr("href") || "";
            var m = href.match(/\/the-loai\/([a-z0-9-]+)/i);
            if (!m) return;
            var slug = m[1].toLowerCase();
            var title = cleanText(el.text()).replace(/\s*\(\d+\)\s*$/, "");
            if (!title || bySlug[slug]) return;
            bySlug[slug] = title;
            order.push(slug);
        });
    }

    var out = [];
    var i = 0;
    for (i = 0; i < order.length; i++) {
        out.push({ title: bySlug[order[i]], input: BASE_URL + "/the-loai/" + order[i], script: "gen.js" });
    }
    // The loai nao doc live khong thay thi lay tu fallback (giu thu tu nav).
    for (i = 0; i < FALLBACK_GENRES.length; i++) {
        var g = FALLBACK_GENRES[i];
        if (!bySlug[g.slug]) {
            out.push({ title: g.title, input: BASE_URL + "/the-loai/" + g.slug, script: "gen.js" });
        }
    }
    if (out.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(out);
}
