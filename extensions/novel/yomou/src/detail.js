// detail.js — Chi tiet truyen qua API tieu thuyet (khong can of — API
// tra day du truong khi khong chi dinh of). URL vao la URL trang chi
// tiet ncode (/ncode/ hoac /ncode/<so>/ — chi lay ma truyen).
// Luu y: truyen co the mang co R15 / 残酷な描写あり — chi la co bao
// noi dung, khong phai khoa tra phi; co hien trong dong detail de
// nguoi doc thay truoc. Site khong co anh bia (bo qua cover).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');
load('safe-first.js');
load('cleanHtml.js');
load('helper.js');

function execute(url) {
    var ncode = extractNcode(url);
    if (!ncode) return Response.error("Không đọc được mã truyện từ đường dẫn.");
    var apiUrl = queryBuilder({ ncode: ncode });
    var r = fetchSyJson(apiUrl);
    if (r.error) return Response.error(r.error);
    var json = r.json;
    if (json.length < 2 || !json[1]) return Response.error("Không tìm thấy truyện.");
    var novel = json[1];

    var status = "";
    if (NOVEL_STATUS.end[novel.end]) status = NOVEL_STATUS.end[novel.end].jp;
    if (NOVEL_STATUS.isstop[novel.isstop]) {
        status = status ? status + "・" + NOVEL_STATUS.isstop[novel.isstop].jp : NOVEL_STATUS.isstop[novel.isstop].jp;
    }
    var typeText = "";
    // novel_type (co gach duoi) la DUNG o day: detail.js goi API
    // full-field (khong of) — xem quirk trong helper.js. Dung doi
    // thanh noveltype.
    if (NOVEL_TYPE[novel.novel_type]) typeText = NOVEL_TYPE[novel.novel_type].jp;
    var points = [];
    var pkeys = Object.keys(NOVEL_POINTS);
    for (var i = 0; i < pkeys.length; i++) {
        var pk = pkeys[i];
        if (novel[pk] !== undefined && novel[pk] !== null) {
            points.push(NOVEL_POINTS[pk].jp + "：" + novel[pk]);
        }
    }
    var flags = flagText(novel);
    var detail = "作者名： " + (novel.writer || "") + "<br>" +
        "Nコード： " + String(novel.ncode || "").toLowerCase() + "<br>" +
        "状況： " + status + "<br>" +
        "タイプ： " + typeText + "<br>";
    if (novel.novel_type === 1) {
        detail += "全掲載部分数： " + (novel.general_all_no || 0) + "部分<br>";
    }
    detail += "小説文字数： " + (novel.length || 0) + "<br>" +
        "会話率： " + (novel.kaiwaritu || 0) + "%<br>" +
        "初回掲載日： " + (novel.general_firstup || "") + " JST<br>" +
        "最終掲載日： " + (novel.general_lastup || "") + " JST<br>" +
        "小説の更新日時： " + (novel.novelupdated_at || "") + " JST";
    if (flags) detail += "<br>注意： " + flags;
    detail += "<br>=======ポイント=======<br>" + points.join("<br>");

    var story = String(novel.story || "").replace(/\n/g, "<br>");
    return Response.success({
        name: htmlDecode(novel.title || ""),
        author: novel.writer || "",
        description: story,
        detail: detail,
        url: BASE_URL + "/" + ncode + "/",
        type: "novel",
        format: "novel",
        ongoing: novel.end !== 0,
        genres: convertGenres(novel),
        suggests: []
    });
}
