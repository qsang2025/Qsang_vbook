// helper.js — Ham dung chung cho Ky Huyen (kyhuyen.com).
//
// Site HTML tinh phia server (kiem chung live 2026-11-18):
// - Danh sach truyen: the .one-third-responsive .media (trang /tim-kiem?...),
//   24 truyen/trang; anh bia o .media-left img.media-object (host
//   i.kyhuyen.com, tai duoc ca khi co/khong co Referer); tieu de o h4, the
//   a thu hai moi la link truyen (the a dau la tien to nguon "KH" dan ve
//   /tim-kiem?s=4, phai bo qua); tac gia o a[href*=/tac-gia/]; trang thai
//   o .story-stage p ("(Dang ra)" / "(Hoan thanh)").
// - Phan trang: link "Trang sau" (a[title="Trang sau"]) trong ul.pagination
//   (co 2 ul phan trang — desktop + mobile — cung href, lay cai dau tien);
//   li.next con lai la "Trang cuoi", khong dung lam token trang sau.
// - Chi tiet: /truyen/<slug>-<so>; muc luc nam ngay tren trang chi tiet,
//   chia tab 200 chuong (tab "Moi nhat" chi co 10 chuong moi, bo qua).
// - Chuong: /truyen/<slug>/chuong-<N>/<id>; noi dung o .story-content
//   article, <br/> tach doan; watermark chen trong <span class="d-none">
//   va the a dan ve trang chu (chap.js loc sach).
//
// LUU Y ve file lib: file nay duoc cac script khac tai len, nen KHONG duoc
// tai them file nao khac o day. Script nao dung helper nay phai tai truoc
// theo thu tu: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch 1 trang HTML co pacing chong rate-limit (AGENTS.md muc 6.11).
// Duong chinh: pacedFetch() (file rate-limit.js) — kiem tra cooldown, nghi
// jitter 0,5-1,5s, retry 429/405/503, tu ghi cooldown 60 phut khi bi chan.
// Tra ve { doc: Document } khi thanh cong, hoac { error: "tieng Viet" }.
function fetchKyDoc(url) {
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    if (!res) return { error: "Không tải được trang: " + url };
    if (res.error === "cooldown") {
        return { error: rateLimitErrorMessage("Kỳ Huyễn", pacedHostOf(url), res.cooldownRemainingMs) };
    }
    if (!res.ok) {
        var st = res.status || 0;
        if (st === 429 || st === 405) {
            return { error: rateLimitErrorMessage("Kỳ Huyễn", pacedHostOf(url), res.cooldownRemainingMs) };
        }
        if (st) return { error: "Không tải được trang (HTTP " + st + "): " + url };
        return { error: "Không tải được trang (lỗi mạng): " + url };
    }
    var doc = null;
    try {
        doc = docFromResponse(res.res, url);
    } catch (e2) {
        return { error: "Không đọc được nội dung trang: " + url };
    }
    if (!doc) return { error: "Không đọc được nội dung trang: " + url };
    return { doc: doc };
}

// Parser MOT dong truyen .media thanh doi tuong truyen
// { name, cover, link, description, author, host } hoac null.
function parseBookCard(media) {
    // Tieu de + link: the a trong h4 co href chua /truyen/ (the a dau
    // tien trong h4 la tien to nguon "KH", khong phai link truyen).
    var titleLink = null;
    var aTags = media.select("h4 a");
    var j = 0;
    for (j = 0; j < aTags.size(); j++) {
        var a = aTags.get(j);
        var href = a.attr("href") || "";
        if (href.indexOf("/truyen/") !== -1) {
            titleLink = a;
            break;
        }
    }
    if (!titleLink) return null;
    var link = absUrl(titleLink.attr("href") || "");
    if (!link) return null;

    // Cat bo span tien to nguon ("KH", "TTV"...) trong the a truoc khi
    // lay text, neu khong ten truyen se dinh kem "KH ".
    titleLink.select("span").remove();
    var name = cleanText(titleLink.text());
    if (!name) return null;

    var cover = "";
    var coverImg = safeFirst(media.select(".media-left img.media-object"));
    if (coverImg !== null) cover = absUrl(coverImg.attr("src") || "");

    var author = "";
    var authorEl = safeFirst(media.select("a[href*=\"/tac-gia/\"]"));
    if (authorEl !== null) author = cleanText(authorEl.text());

    var status = "";
    var statusEl = safeFirst(media.select(".story-stage p"));
    if (statusEl !== null) status = cleanText(statusEl.text());

    var description = "";
    if (author) description += author;
    if (status) description += (description ? " - " : "") + status;

    return {
        name: name,
        cover: cover,
        link: link,
        description: description,
        author: author || "Đang cập nhật",
        host: siteOrigin()
    };
}

// Parser ca trang danh sach (dung chung cho gen.js / search.js).
// Tra ve mang truyen (dedupe theo link).
function parseBookList(doc) {
    var items = [];
    var seen = {};
    var cards = doc.select(".one-third-responsive .media");
    cards.forEach(function (card) {
        var item = parseBookCard(card);
        if (item && !seen[item.link]) {
            seen[item.link] = true;
            items.push(item);
        }
    });
    return items;
}

// URL trang ke cua mot trang danh sach ("") = het. Site dung link
// "Trang sau" (title="Trang sau") trong ul.pagination; href cua no mang
// du tham so loc cua site (s/o/st/c/t/q) nen tra nguyen href tuyet doi
// lam token trang sau. Link "Trang cuoi" (cung li.next) khong dung.
function nextPageUrl(doc) {
    var nextEl = safeFirst(doc.select(".pagination li.next a[title=\"Trang sau\"]"));
    if (nextEl === null) return "";
    var href = cleanText(nextEl.attr("href") || "");
    if (!href || href === "#") return "";
    if (href.indexOf("http") === 0) return href;
    return absUrl(href);
}

// Gan / doi tham so page=N tren mot URL danh sach (dung cho token trang
// dang so "2" khi test tay; token URL day du duoc uu tien hon).
function withPageParam(url, pageNum) {
    var n = parseInt(pageNum, 10);
    if (isNaN(n) || n < 1) return url;
    if (/([?&])page=\d+/.test(url)) return url.replace(/([?&])page=\d+/, "$1page=" + n);
    return url + (url.indexOf("?") >= 0 ? "&" : "?") + "page=" + n;
}
