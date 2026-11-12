// genre.js — Danh sach the loai Me Doc Truyen (medoctruyen.vn).
//
// Site co 17 the loai (kiem chung live 2026-11-12), nhung nav trang chu
// chi hien 8 the; mang genres trong RSC cua /browse co 15 the; hop cua
// 2 nguon la du 19 (nav bo sung them Ky Ao Phuong Tay, Tien Hiep Phuong
// Dong, Do Thi Cao Vo, Huyen Nghi Nao Dong so voi mang RSC). Vi vay ghep
// 3 nguon: (1) link nav trang chu, (2) mang genres trong RSC cua
// /browse, (3) danh sach cung da kiem chung live lam fallback — the
// loai nao thieu o 2 nguon tren thi lay tu fallback, dam bao du 19.
//
// Mang genres trong RSC nam trong chuoi JSON thoat ky tu (dang
// \"genres\":[{\"name\":\"...\",\"slug\":\"...\"}...]) nen phai dung regex
// tren HTML tho (khong phai DOM): cat dung doan mang (tu "genres" toi
// dau ] dau tien — object the loai khong co mang long nhau) roi bat cap
// name/slug. Regex chi la du phong, co try/catch; neu hong thi fallback
// van du.
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

// 19 the loai da kiem chung live 2026-11-12 (hop cua nav trang chu
// + mang genres RSC o /browse 15 the). Thu tu theo mang RSC, 4 the
// chi co o nav de cuoi.
var FALLBACK_GENRES = [
    { slug: "huyen-huyen", title: "Huyền Huyễn" },
    { slug: "tien-hiep", title: "Tiên Hiệp" },
    { slug: "do-thi", title: "Đô Thị" },
    { slug: "khoa-huyen", title: "Khoa Huyễn" },
    { slug: "vo-hiep", title: "Võ Hiệp" },
    { slug: "hien-dai", title: "Hiện Đại" },
    { slug: "co-dai", title: "Cổ Đại" },
    { slug: "huyen-nghi", title: "Huyền Nghi" },
    { slug: "linh-di", title: "Linh Dị" },
    { slug: "vong-du", title: "Võng Du" },
    { slug: "dong-nhan", title: "Đồng Nhân" },
    { slug: "canh-ky", title: "Cạnh Kỹ" },
    { slug: "kiem-hiep", title: "Kiếm Hiệp" },
    { slug: "tay-huyen", title: "Tây Huyễn" },
    { slug: "khoai-xuyen", title: "Khoái Xuyên" },
    { slug: "ky-ao-phuong-tay", title: "Kỳ Ảo Phương Tây" },
    { slug: "tien-hiep-phuong-dong", title: "Tiên Hiệp Phương Đông" },
    { slug: "do-thi-cao-vo", title: "Đô Thị Cao Võ" },
    { slug: "huyen-nghi-nao-dong", title: "Huyền Nghi Não Động" }
];

function execute() {
    var bySlug = {};

    // (1) Link the loai o nav trang chu.
    var r = fetchMdDoc(BASE_URL + "/");
    if (r.doc) {
        r.doc.select("a[href*=\"/browse?genre=\"]").forEach(function (el) {
            var href = el.attr("href") || "";
            var m = href.match(/genre=([a-z0-9-]+)/);
            var name = cleanText(el.text());
            if (m && name && name !== "Xem tất cả" && !bySlug[m[1]]) {
                bySlug[m[1]] = name;
            }
        });
    }

    // (2) Mang genres trong payload RSC cua /browse.
    var r2 = fetchMdDoc(BASE_URL + "/browse");
    if (r2.doc) {
        try {
            var html = r2.doc.html() || "";
            var gi = html.indexOf("genres");
            if (gi >= 0) {
                var end = html.indexOf("]", gi);
                if (end > gi) {
                    var chunk = html.substring(gi, end + 1);
                    var re = /name[^A-Za-z0-9\u00C0-\u1EF9]+([^"\\]+)[^A-Za-z0-9]+slug[^a-z0-9]+([a-z0-9-]+)/g;
                    var m2 = null;
                    while ((m2 = re.exec(chunk)) !== null) {
                        if (!bySlug[m2[2]]) bySlug[m2[2]] = cleanText(m2[1]);
                    }
                }
            }
        } catch (e) {
        }
    }

    // (3) Bo sung cung cac the loai da kiem chung live.
    var out = [];
    var i = 0;
    for (i = 0; i < FALLBACK_GENRES.length; i++) {
        var g = FALLBACK_GENRES[i];
        var title = bySlug[g.slug] || g.title;
        out.push({ title: title, input: "/browse?genre=" + g.slug, script: "gen.js" });
    }
    // The loai moi site them sau nay (chi co o nav/RSC, chua co trong
    // fallback) thi them vao cuoi.
    for (var slug in bySlug) {
        if (bySlug.hasOwnProperty(slug)) {
            var known = false;
            for (var j = 0; j < FALLBACK_GENRES.length; j++) {
                if (FALLBACK_GENRES[j].slug === slug) known = true;
            }
            if (!known) {
                out.push({ title: bySlug[slug], input: "/browse?genre=" + slug, script: "gen.js" });
            }
        }
    }
    if (out.length === 0) return Response.error("Không đọc được danh sách thể loại.");
    return Response.success(out);
}
