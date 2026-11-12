// chap.js — Noi dung 1 trang truyen 52书库 (52shuku.net).
//
// Trang chuong /<cat>/<NN>_b/<hash>_<N>.html (HTML tinh, kiem chung live
// 2026-11-13): noi dung o .article-content, ~87 the <p> — NHUNG 7 doan
// dau lap lai khoi gioi thieu sach (tieu de, "简介：", 4 cau tho) va doan
// cuoi la "传送门" + dong quang cao — cat bo ca hai dau: bo cac doan mo
// dau cho den khi gap tieu de chuong dau tien (dang "第N章 ...", "楔子",
// "序章"...), bo cac doan cuoi chua "传送门" hoac "如果觉得52书库不错".
// Chuong doc DU ma KHONG can dang nhap (kiem chung trang 2 cua 裂天空骑:
// 80 doan that, mo dau "高低起伏不停的茫茫兴都枯什山脉中..." — dung noi
// dung goc, khong phai van ban ghep). Tieu de tra ve (data2) la tieu de
// chuong dau tien tim duoc tren trang (neu trang bat dau giua chuong thi
// data2 = ""). Chi bao loi khi khong co doan van nao; neu trang day chu
// "Đăng nhập" thi bao ro chuong co the yeu cau dang nhap.
// execute(url).
//
// Load: file config.js, file config-helpers.js, file fetch-helpers.js,
// file rate-limit.js, file safe-first.js, file helper.js.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('helper.js');

function execute(url) {
    var chapUrl = normalizeUrl(url);
    if (!chapUrl) return Response.error("Link chương không hợp lệ.");

    var r = fetch52Doc(chapUrl);
    if (r.error) return Response.error(r.error);
    var doc = r.doc;

    var contentEl = safeFirst(doc.select(".article-content"));
    if (contentEl === null) {
        var fullText = cleanText(doc.text()).toLowerCase();
        if (fullText.indexOf("đăng nhập") !== -1 || fullText.indexOf("dang nhap") !== -1) {
            return Response.error("Chương này có thể yêu cầu đăng nhập.");
        }
        return Response.error("Không tìm thấy nội dung chương.");
    }

    // Bo khoi hieu chinh loi (#lineCorrect) va the span rac nhu base cu.
    doc.select("#lineCorrect").remove();
    doc.select(".article-content span").remove();

    var paras = doc.select(".article-content p");
    var texts = [];
    var i = 0;
    for (i = 0; i < paras.size(); i++) {
        texts.push(cleanText(paras.get(i).text()));
    }

    // Cat khoi gioi thieu lap lai o dau: bo den khi gap tieu de chuong
    // dau tien; neu khong thay trong 20 doan dau thi chi bo 2 doan dau
    // ("《ten》作者：..." va "简介：").
    var start = 0;
    var found = -1;
    var limit = texts.length < 20 ? texts.length : 20;
    for (i = 0; i < limit; i++) {
        if (isChapterHeading(texts[i])) {
            found = i;
            break;
        }
    }
    if (found !== -1) {
        start = found;
    } else {
        start = 2;
    }

    // Cat dong quang cao o cuoi: "传送门", "如果觉得52书库不错", "如果觉得52不错".
    var end = texts.length;
    for (i = texts.length - 1; i >= start; i--) {
        var t = texts[i];
        if (t.indexOf("传送门") !== -1 || t.indexOf("如果觉得52书库不错") !== -1 || t.indexOf("如果觉得52不错") !== -1) {
            end = i;
        } else if (t) {
            break;
        }
    }

    var title = "";
    if (found !== -1) title = texts[found];

    var html = "";
    var count = 0;
    for (i = start; i < end; i++) {
        if (!texts[i]) continue;
        html += "<p>" + texts[i] + "</p>\n";
        count++;
    }
    if (count === 0) {
        return Response.error("Nội dung chương trống.");
    }
    return Response.success(html, title);
}
