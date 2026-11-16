// helper.js — Bang the loai + ham dung chung cua API tieu thuyet
// (api.syosetu.com/novelapi/api/). Port tu bang cua base khoa301020 v6,
// viet lai dang var/function (base dung const/arrow/template literal —
// vuot gioi han Rhino ES6 cua runtime vBook).
//
// API: GET api.syosetu.com/novelapi/api/?<params>&out=json
// Tra mang JSON: [0] = {allcount: N}, [1..] = truyen.
// Tham so dung o day: ncode, word, title, genre, biggenre, type,
// order (dailypoint/weeklypoint/monthlypoint/quarterpoint/yearlypoint/
// hyoka/favnovelcnt), of (truong muon lay), lim (toi da 500), st
// (offset phan trang). Khong can khoa API, khong can dang nhap.
// QUIRK API (kiem chung live 2026-11-16): ten truong loai truyen
// DOI theo cach goi — goi co of=...nt... tra "noveltype" (khong gach
// duoi), goi full-field (khong of, nhu detail.js) tra "novel_type".
// Dung sai ten la mat am tham loai truyen / toc truyen ngan loi.
// File nay khong nap them file nao.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var API_FIELDS_LIST = "t-n-gp-nt-ga";

var BIG_GENRES = {
    1: { jp: "恋愛", en: "Love" },
    2: { jp: "ファンタジー", en: "Fantasy" },
    3: { jp: "文芸", en: "Literature" },
    4: { jp: "SF", en: "Science fiction" },
    98: { jp: "ノンジャンル", en: "Non genre" },
    99: { jp: "その他", en: "Other" }
};

var GENRES = {
    101: { jp: "異世界〔恋愛〕", en: "Isekai (Love)" },
    102: { jp: "現実世界〔恋愛〕", en: "Real world (Love)" },
    201: { jp: "ハイファンタジー〔ファンタジー〕", en: "High fantasy (Fantasy)" },
    202: { jp: "ローファンタジー〔ファンタジー〕", en: "Low fantasy (Fantasy)" },
    301: { jp: "純文学〔文芸〕", en: "Pure literature (Literature)" },
    302: { jp: "ヒューマンドラマ〔文芸〕", en: "Human drama (Literature)" },
    303: { jp: "歴史〔文芸〕", en: "History (Literature)" },
    304: { jp: "推理〔文芸〕", en: "Mystery/Detective (Literature)" },
    305: { jp: "ホラー〔文芸〕", en: "Horror (Literature)" },
    306: { jp: "アクション〔文芸〕", en: "Action (Literature)" },
    307: { jp: "コメディー〔文芸〕", en: "Comedy (Literature)" },
    401: { jp: "VRゲーム〔SF〕", en: "VR game (Science fiction)" },
    402: { jp: "宇宙〔SF〕", en: "Space (Science fiction)" },
    403: { jp: "空想科学〔SF〕", en: "Imaginary science (Science fiction)" },
    404: { jp: "パニック〔SF〕", en: "Disaster (Science fiction)" },
    9901: { jp: "童話〔その他〕", en: "Fairytale (Other)" },
    9902: { jp: "詩〔その他〕", en: "Poetry (Other)" },
    9903: { jp: "エッセイ〔その他〕", en: "Essay (Other)" },
    9904: { jp: "リプレイ〔その他〕", en: "Replay (Other)" },
    9999: { jp: "その他〔その他〕", en: "Other (Other)" },
    9801: { jp: "ノンジャンル〔ノンジャンル〕", en: "Non genre (Non genre)" }
};

var NOVEL_TYPE = {
    1: { jp: "連載", en: "Serializing" },
    2: { jp: "短編", en: "Short story" }
};

var NOVEL_TAGS = {
    isr15: { jp: "R15", en: "R15" },
    isbl: { jp: "ボーイズラブ", en: "Yaoi" },
    isgl: { jp: "ガールズラブ", en: "Yuri" },
    iszankoku: { jp: "残酷な描写あり", en: "Cruel" },
    istensei: { jp: "異世界転生", en: "Tensei" },
    istenni: { jp: "異世界転移", en: "Tenni" }
};

var NOVEL_STATUS = {
    end: {
        0: { jp: "完結済み", en: "Completed" },
        1: { jp: "連載中", en: "Ongoing" }
    },
    isstop: {
        0: { jp: "長期連載中", en: "Long-term serializing" },
        1: { jp: "長期連載停止中", en: "Long-term serialization suspension" }
    }
};

var NOVEL_POINTS = {
    global_point: { jp: "総合評価ポイント", en: "Overall evaluation points" },
    daily_point: { jp: "日間ポイント", en: "Daily points" },
    weekly_point: { jp: "週間ポイント", en: "Weekly points" },
    monthly_point: { jp: "月間ポイント", en: "Monthly points" },
    quarter_point: { jp: "四半期ポイント", en: "Quarterly points" },
    yearly_point: { jp: "年間ポイント", en: "Annual points" },
    fav_novel_cnt: { jp: "ブックマーク数", en: "Number of bookmarks" },
    impression_cnt: { jp: "感想数", en: "Number of impressions" },
    review_cnt: { jp: "レビュー数", en: "Number of reviews" },
    all_point: { jp: "評価ポイント", en: "Evaluation points" },
    all_hyoka_cnt: { jp: "評価者数", en: "Number of evaluators" }
};

// Ghep cac tham so thanh URL API day du (luon kem out=json).
function queryBuilder(params) {
    var parts = [];
    var keys = Object.keys(params);
    for (var i = 0; i < keys.length; i++) {
        parts.push(keys[i] + "=" + params[keys[i]]);
    }
    return API_URL + "?" + parts.join("&") + "&out=json";
}

// Giai ma cac HTML entity co ban trong tieu de API tra ve.
function htmlDecode(input) {
    var s = String(input === undefined || input === null ? "" : input);
    s = s.replace(/&apos;/g, "'");
    s = s.replace(/&quot;/g, '"');
    s = s.replace(/&amp;/g, "&");
    s = s.replace(/&lt;/g, "<");
    s = s.replace(/&gt;/g, ">");
    return s;
}

// Mo ta ngan loai truyen: "339部分" (lien tai) hoac "短編" (truyen ngan).
function novelTypeText(type, chaptersCount) {
    if (type === 1) return String(chaptersCount) + "部分";
    if (type === 2) return "短編";
    return "";
}

// Doi 1 ban ghi API thanh item danh sach cua app.
// Link luon dung chu thuong (API tra ncode chu HOA, URL site chu thuong).
function parseApiNovel(novel) {
    if (!novel || !novel.ncode) return null;
    var ncode = String(novel.ncode).toLowerCase();
    var title = htmlDecode(novel.title || "");
    if (!title) return null;
    var desc = "";
    if (novel.global_point !== undefined && novel.global_point !== null) {
        desc = String(novel.global_point) + "pt";
    }
    var tt = novelTypeText(novel.noveltype, novel.general_all_no);
    if (tt) desc = desc ? desc + "・" + tt : tt;
    return {
        name: title,
        link: BASE_URL + "/" + ncode + "/",
        description: desc
    };
}

// The loai cua truyen (detail): the loai lon + the loai nho + keyword.
// Moi muc la doi tuong {title, input, script} theo hop dong.
function convertGenres(novel) {
    var genres = [];
    if (novel.biggenre !== undefined && BIG_GENRES[novel.biggenre]) {
        genres.push({
            title: BIG_GENRES[novel.biggenre].jp,
            input: queryBuilder({ biggenre: novel.biggenre, order: "hyoka", of: API_FIELDS_LIST, lim: 100 }),
            script: "gen.js"
        });
    }
    if (novel.genre !== undefined && GENRES[novel.genre]) {
        genres.push({
            title: GENRES[novel.genre].jp,
            input: queryBuilder({ genre: novel.genre, order: "hyoka", of: API_FIELDS_LIST, lim: 100 }),
            script: "gen.js"
        });
    }
    if (novel.keyword) {
        var kws = String(novel.keyword).split(" ");
        for (var i = 0; i < kws.length; i++) {
            var kw = kws[i];
            if (!kw) continue;
            genres.push({
                title: kw,
                input: queryBuilder({ keyword: 1, word: encodeURIComponent(kw), order: "hyoka", of: API_FIELDS_LIST, lim: 100 }),
                script: "gen.js"
            });
        }
    }
    return genres;
}

// Co R15 / 残酷な描写…: tra chuoi co bao tieng Nhat (hien trong detail),
// de nguoi doc thay truoc khi mo truyen. Khong phai khoa tra phi.
function flagText(novel) {
    var flags = [];
    var keys = Object.keys(NOVEL_TAGS);
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (novel[k]) flags.push(NOVEL_TAGS[k].jp);
    }
    return flags.join("・");
}
