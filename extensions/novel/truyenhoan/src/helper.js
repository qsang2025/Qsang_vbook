// helper.js — Ham dung chung cho Truyen Hoan (N1, v3).
//
// LUU Y load(): file nay duoc load() boi cac script khac, nen KHONG duoc
// load() them file nao khac o day (load khong de quy). Script nao dung
// helper nay phai load truoc theo thu tu:
//     file config.js;
//     file fetch-helpers.js;
//     file challenge-handler.js;
//     file helper.js;
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

// Fetch trang HTML co xu ly Cloudflare challenge.
//
// Duong chinh: fetchDoc(url) tu fetch-helpers.js (retry 429, quet marker
// challenge ca khi HTTP 200, thu browser fallback truoc khi bo cuoc) —
// khong parse trang challenge nhu trang that nua. KHONG dung
// fetchDocWithFallback/fetchWithMirrors o day: ma truyen KHAC NHAU giua
// truyenhoan.com va wetruyen.com (.4780 la truyen khac nhau o 2 host) nen
// doi host se tra nham truyen; moi truyen chi doc tren dung host cua link
// goc (xem config.js). Site hien chua bat challenge (kiem chung bang curl
// 2026-11-09: home/search/detail/chap deu 200, khong co marker challenge);
// helper nay la phong thu cho ngay site bat challenge.
//
// Tra ve { doc: Document } khi thanh cong, hoac { error: "thong bao tieng
// Viet" } khi that bai. Caller dung:
//     var r = fetchPageDoc(url);
//     if (r.error) return Response.error(r.error);
//     var doc = r.doc;
//
// Khi duong chinh that bai, fetch lai 1 lan bang safeFetch() (khong doi
// host) de phan biet challenge/login voi loi mang/HTTP: gap challenge thi
// tra huong dan vuot qua cua formatChallengeError(), gap trang yeu cau
// dang nhap thi tra formatLoginError(), con lai thi bao loi HTTP chung.
// KHONG tu y tra ve trang challenge da parse thanh doc that.
function fetchPageDoc(url) {
    var doc = fetchDoc(url);
    if (doc) return { doc: doc };

    var res = null;
    var text = "";
    try {
        res = safeFetch(url);
        if (res) {
            try { text = String(res.text() || ""); } catch (e1) {}
        }
    } catch (e) {
        res = null;
    }
    if (isCloudflareChallenge(text, res ? res.headers : null)) {
        return { error: formatChallengeError("Truyện Hoàn", url) };
    }
    if (isLoginRequired(text, url)) {
        return { error: formatLoginError("Truyện Hoàn", url) };
    }
    return { error: "Không tải được trang (HTTP " + (res ? res.status : "không kết nối được máy chủ") + "): " + url };
}
