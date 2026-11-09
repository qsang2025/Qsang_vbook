// hanviet.js — Chuyển tên truyện tiếng Việt sang tên gốc tiếng Trung
// để tự tìm trên ixdzs8.com, không cần ghi sẵn từng truyện trong bảng map.
//
// Tên truyện dịch đa số là phiên âm Hán-Việt từng âm tiết: mỗi âm tiết
// tiếng Việt ứng với một chữ Hán (Quỷ Bí Chi Chủ = 诡秘之主, Kiếm Lai =
// 剑来). Bảng HANVIET tra âm (giữ nguyên dấu thanh) sang chữ thường gặp
// nhất trong tên truyện; âm nào không có trong bảng (chữ thuần Việt như
// "bắt", "đầu", "cái", "trò"...) thì bỏ qua — trang tìm kiếm khớp theo
// chuỗi con nên phần còn lại vẫn tìm ra (vd. bỏ "Bắt Đầu" vẫn ra đúng
// 开局长生万古，苟到天荒地老). Âm đa nghĩa nằm ở HANVIET_ALT: thử lần lượt
// từng biến thể rồi đối chiếu tên thật trả về để khỏi lấy nhầm truyện.
// KHÔNG dùng Google Dịch cho tên truyện: đã kiểm chứng 2026-11-08, dịch
// theo nghĩa nên sai hết (Quỷ Bí Chi Chủ -> 鬼魂大师, Kiếm Lai -> 赖剑).

var HANVIET = {
    "a": "阿", "ác": "恶", "ái": "爱", "an": "安", "anh": "英", "ảnh": "影", "âm": "阴", "ấn": "印", "ải": "隘",
    "bách": "百", "bạch": "白", "bá": "霸", "bạc": "银", "bảo": "宝", "bàn": "盘", "bán": "半", "băng": "冰", "bằng": "鹏", "bất": "不", "bi": "悲", "bí": "秘", "biến": "变", "biệt": "别", "bình": "平", "bồng": "蓬", "bổn": "本", "bút": "笔",
    "ca": "歌", "các": "阁", "cam": "甘", "cảm": "感", "cảnh": "景", "cao": "高", "cát": "吉", "cấm": "禁", "cầm": "琴", "cấp": "级", "cận": "近", "châm": "针", "chân": "真", "châu": "洲", "chiến": "战", "chiếu": "照", "chinh": "征", "chính": "正", "chi": "之", "chủ": "主", "chuẩn": "准", "chúc": "祝", "chung": "终", "chương": "章", "chuyển": "转", "chư": "诸",
    "cổ": "古", "công": "功", "cốt": "骨", "cơ": "机", "càn": "乾", "cẩm": "锦", "cần": "勤", "cực": "极", "cửu": "九", "cung": "宫", "cuồng": "狂", "cường": "强", "cố": "固", "cẩu": "苟",
    "danh": "名", "dã": "野", "diệt": "灭", "diệu": "妙", "dịch": "译", "diễm": "艳", "diện": "面", "du": "游", "duy": "唯", "duyên": "缘", "dương": "阳",
    "đế": "帝", "đệ": "弟", "địch": "敌", "địa": "地", "đình": "庭", "định": "定", "độ": "度", "độc": "独", "đồ": "图", "đoàn": "团", "đoản": "短", "đông": "东", "đồng": "同", "đức": "德", "đại": "大", "đắc": "得", "đạo": "道", "đào": "桃", "đến": "到", "điện": "电", "điền": "田", "đỉnh": "鼎", "đô": "都", "đoạt": "夺", "đường": "唐",
    "giả": "假", "giai": "佳", "gia": "家", "giang": "江", "giác": "觉", "giám": "监", "giản": "简", "giáo": "教", "giao": "交", "giới": "界",
    "hải": "海", "hàm": "含", "hắc": "黑", "hành": "行", "hào": "豪", "hạo": "浩", "hiền": "贤", "hiệp": "侠", "hiếu": "孝", "hiện": "现", "hiểu": "晓", "hoa": "花", "hoàng": "皇", "hỏa": "火", "hoàn": "完", "hoang": "荒", "hồn": "魂", "hồng": "红", "hồ": "湖", "hội": "会", "hợp": "合", "hưng": "兴", "huyền": "玄", "huyết": "血", "huynh": "兄", "hữu": "友", "hạ": "下", "hàn": "寒", "hậu": "后", "hùng": "雄", "huyễn": "幻", "hồi": "回", "hận": "恨", "hạnh": "幸", "hỷ": "喜", "hoan": "欢", "hệ": "系",
    "kha": "柯", "khai": "开", "khải": "凯", "khảo": "考", "kiếm": "剑", "kiệt": "杰", "kim": "金", "kinh": "经", "kỳ": "奇", "kỷ": "纪", "kiến": "见", "kiếp": "劫", "kiều": "娇", "khí": "气", "khôn": "坤", "không": "空", "khổ": "苦", "khuynh": "倾", "khương": "姜", "khang": "康", "kỹ": "技", "khố": "库",
    "lâm": "林", "lạn": "烂", "lai": "来", "lang": "郎", "lãng": "浪", "lệ": "丽", "liễu": "柳", "linh": "灵", "long": "龙", "lão": "老", "lộc": "禄", "lôi": "雷", "luân": "轮", "lưu": "流", "lục": "陆", "luyến": "恋", "lực": "力", "luyện": "炼", "lễ": "礼", "lạc": "乐", "lịch": "历",
    "ma": "魔", "mai": "梅", "mạn": "漫", "mạnh": "猛", "minh": "明", "mộc": "木", "môn": "门", "mộng": "梦", "mưu": "谋", "mỹ": "美", "mã": "马", "mạch": "脉", "mật": "密",
    "ngọc": "玉", "ngôn": "言", "ngô": "吴", "nguyệt": "月", "ngự": "御", "nguyên": "元", "nhân": "人", "nhất": "一", "nhật": "日", "nhị": "二", "nhiếp": "摄", "nho": "儒", "nhu": "柔", "nhạc": "乐", "niên": "年", "ninh": "宁", "nữ": "女", "ngộ": "悟", "ngục": "狱", "nghĩa": "义", "năng": "能", "ngân": "银",
    "phong": "风", "phụng": "凤", "phượng": "凤", "phúc": "福", "phương": "方", "phàm": "凡", "pháp": "法", "phách": "魄", "phật": "佛", "phi": "妃", "pháo": "炮", "phái": "派",
    "quân": "君", "quỷ": "诡", "quang": "光", "quáng": "矿", "quyển": "卷", "quyết": "诀", "quốc": "国", "quái": "怪",
    "sơn": "山", "sinh": "生", "sư": "师", "sĩ": "士",
    "tam": "三", "tâm": "心", "trận": "阵", "trần": "尘", "vấn": "问", "thiên": "天", "thần": "神", "thế": "世", "tiên": "仙", "tiếu": "笑", "tiểu": "小", "tinh": "星", "tình": "情", "tôn": "尊", "trường": "长", "tử": "子", "tứ": "四", "tuyệt": "绝", "tài": "才", "thái": "太", "thị": "市", "thư": "书", "thừa": "承", "thuyết": "说", "thân": "身", "thể": "体", "thuật": "术", "thủy": "水", "thổ": "土", "thạch": "石", "thanh": "青", "thọ": "寿", "thánh": "圣", "thú": "兽", "sủng": "宠", "thống": "统", "tướng": "将", "tông": "宗", "tộc": "族", "tiền": "钱", "tín": "信", "trí": "智", "trọng": "重", "trung": "忠", "tiết": "节", "tu": "修", "tăng": "僧", "tượng": "象", "tần": "秦", "thiếp": "妾",
    "vân": "云", "vô": "无", "vương": "王", "võ": "武", "văn": "文", "vạn": "万", "việt": "越", "võng": "网",
    "xuân": "春", "xuyên": "穿", "xích": "赤",
    "yên": "烟", "yêu": "妖", "y": "医", "ý": "意",
    "nam": "南", "bắc": "北", "tây": "西", "ân": "恩", "oán": "怨", "thù": "仇", "hòa": "和", "ai": "哀", "sầu": "愁", "ảo": "幻", "ám": "暗", "lam": "蓝", "thiết": "铁", "cương": "钢", "nhược": "弱", "khoát": "阔", "thâm": "深", "thiển": "浅", "quảng": "广", "bao": "包", "biên": "边", "tận": "尽", "cùng": "穷", "chí": "至", "tối": "最", "song": "双", "hầu": "侯", "khanh": "卿", "soái": "帅", "đốc": "督", "phủ": "府", "doãn": "尹", "lệnh": "令", "sử": "史", "viên": "员", "ngoại": "外", "gian": "间", "hà": "河", "tàng": "藏", "truyền": "传", "ký": "记", "vật": "物", "niệm": "念", "đan": "丹", "dược": "药", "lô": "炉", "cục": "局", "cờ": "棋", "binh": "兵", "xe": "车", "tốt": "卒", "nương": "娘", "dân": "民", "xã": "社", "tắc": "则", "triều": "朝", "quan": "官", "lại": "吏", "kế": "计", "sự": "事", "liêm": "廉", "sỉ": "耻", "bảng": "榜", "dị": "异", "khoa": "科",
    "đấu": "斗", "phá": "破", "thương": "苍", "khung": "穹", "la": "罗", "nghịch": "逆", "mộ": "墓", "già": "遮", "thôn": "吞", "phệ": "噬", "vĩnh": "永", "hằng": "恒", "ngạo": "傲", "vực": "域", "chúa": "主", "tể": "宰", "thượng": "上", "sát": "杀", "hỗn": "混", "độn": "沌", "phù": "符", "tà": "邪", "siêu": "超", "kiêu": "骄", "vũ": "武", "chu": "朱", "tước": "雀", "hổ": "虎", "diêm": "阎", "vi": "微", "thất": "七", "bát": "八", "ngũ": "五", "tiêu": "逍", "dao": "遥", "nhiên": "然", "tự": "自", "tại": "在", "mệnh": "命", "lân": "麟", "vĩ": "尾", "tuyết": "雪", "bích": "碧", "uyên": "鸳", "ương": "鸯", "liên": "连", "khâu": "丘", "côn": "昆", "thục": "蜀", "nga": "峨", "mi": "眉", "đang": "当", "thiếu": "少", "tung": "嵩", "nhạn": "雁", "lăng": "陵", "biện": "汴", "khánh": "庆", "hán": "汉", "tân": "津", "tô": "苏", "hàng": "杭", "trùng": "重", "toàn": "全", "chức": "职", "thủ": "手", "xạ": "射", "điêu": "雕", "khách": "客", "cô": "孤", "bộ": "步", "phát": "发", "mạc": "莫", "hủ": "朽", "mạt": "末", "loạn": "乱", "thịnh": "盛", "hạn": "限", "viễn": "远", "động": "动"
};

// Âm đa nghĩa: thử lần lượt từng chữ thay thế khi bản chính không ra.
var HANVIET_ALT = {
    "quỷ": ["鬼"], "kỳ": ["棋", "其", "期", "麒"], "trường": ["场"], "chi": ["支", "知"],
    "cố": ["顾", "苟"], "bí": ["必"], "cổ": ["故"], "hồng": ["洪"], "trần": ["陈"],
    "châu": ["珠", "周", "州"], "chân": ["足"], "đào": ["陶", "逃"], "bằng": ["凭", "朋"],
    "an": ["鞍", "岸"], "hoa": ["华"], "hoàn": ["完", "还"], "hồ": ["胡", "狐"],
    "đồng": ["铜", "童"], "cơ": ["基", "姬"], "tử": ["紫", "死"], "lục": ["六", "绿"],
    "dương": ["杨", "扬"], "hữu": ["有"], "lang": ["狼"], "lưu": ["留"], "tinh": ["精"],
    "nhạc": ["岳"], "nhân": ["仁"], "nguyên": ["原"], "lệ": ["泪", "例"], "các": ["各"],
    "cảnh": ["境", "警"], "cung": ["弓", "供"], "độc": ["毒", "读"], "đồ": ["徒", "途"],
    "đông": ["冬"], "hạ": ["夏", "贺"], "hàn": ["韩"], "hậu": ["厚"], "kinh": ["京", "惊"],
    "kiến": ["建"], "kiều": ["桥"], "ma": ["麻"], "mạnh": ["孟"], "quân": ["军"],
    "thế": ["势"], "yên": ["燕", "嫣"], "yêu": ["要"], "nam": ["男"], "bi": ["碑", "卑"],
    "bình": ["瓶"], "bàn": ["般", "班"], "bán": ["伴"], "băng": ["崩"], "cầm": ["擒", "禽"],
    "cấp": ["急", "给"], "chiếu": ["诏"], "chính": ["政"], "chung": ["钟", "忠"],
    "công": ["公", "工"], "du": ["逾", "愉", "悠"], "duy": ["维"], "đệ": ["第"], "đình": ["亭", "停"],
    "độ": ["渡"], "giả": ["者"], "giác": ["角"], "hàm": ["函"], "hiệp": ["协"],
    "phong": ["峰", "封"], "đỉnh": ["顶"], "thừa": ["丞"], "đường": ["堂"], "lạc": ["洛"],
    "luân": ["仑"], "thương": ["伤"], "thành": ["城"], "hoàn": ["环", "还"], "vũ": ["雨"], "phi": ["飞"]
};

// Chuyển tên tiếng Việt sang tên tiếng Trung. Trả {primary, variants}:
// primary là bản đổi theo chữ chính; variants là các bản thay 1 âm đa nghĩa
// (tối đa 8 bản, bản chính luôn đứng đầu). Âm không có trong bảng thì bỏ;
// chữ Hán, số có sẵn trong tên thì giữ nguyên.
function convertTitleToZh(viTitle) {
    var out = { primary: "", variants: [] };
    if (!viTitle) return out;
    var s = String(viTitle);
    // Tách tên thành các mảnh: chữ Hán giữ nguyên từng cụm, còn lại tách theo âm tiết.
    var parts = [];
    var cur = "";
    var i = 0;
    while (i < s.length) {
        var ch = s.charAt(i);
        var code = s.charCodeAt(i);
        if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
            if (cur) { parts.push(cur); cur = ""; }
            var j = i;
            var zh = "";
            while (j < s.length) {
                var c2 = s.charCodeAt(j);
                if ((c2 >= 0x4E00 && c2 <= 0x9FFF) || (c2 >= 0x3400 && c2 <= 0x4DBF)) { zh += s.charAt(j); j++; }
                else break;
            }
            parts.push({ zh: zh });
            i = j;
        } else {
            cur += ch;
            i++;
        }
    }
    if (cur) parts.push(cur);

    var chars = [];      // chuỗi chữ Hán chính, mỗi phần tử là 1 chữ hoặc null (âm bỏ qua)
    var ambPos = [];     // vị trí các âm đa nghĩa trong chars
    for (var p = 0; p < parts.length; p++) {
        var part = parts[p];
        if (typeof part === "object") {
            for (var k = 0; k < part.zh.length; k++) chars.push(part.zh.charAt(k));
            continue;
        }
        var tokens = String(part).toLowerCase().split(/[^a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ0-9]+/);
        for (var t = 0; t < tokens.length; t++) {
            var tok = tokens[t];
            if (!tok) continue;
            if (/^[0-9]+$/.test(tok)) {
                for (var d = 0; d < tok.length; d++) chars.push(tok.charAt(d));
                continue;
            }
            if (HANVIET[tok]) {
                chars.push(HANVIET[tok]);
                if (HANVIET_ALT[tok]) ambPos.push({ pos: chars.length - 1, alts: HANVIET_ALT[tok] });
            }
            // Âm không có trong bảng (chữ thuần Việt) thì bỏ qua.
        }
    }
    var primary = chars.join("");
    out.primary = primary;
    if (primary.length < 2) return out;
    // Sinh biến thể: mỗi biến thể thay đúng 1 âm đa nghĩa bằng 1 chữ thay thế.
    var count = 0;
    for (var a = 0; a < ambPos.length && count < 10; a++) {
        var ap = ambPos[a];
        for (var b = 0; b < ap.alts.length && count < 10; b++) {
            var copy = chars.slice();
            copy[ap.pos] = ap.alts[b];
            var v = copy.join("");
            if (v !== primary) { out.variants.push(v); count++; }
        }
    }
    // Thêm 1 bản đổi hết các âm đa nghĩa sang chữ thay thế đầu tiên (cho tên
    // có 2 âm đa nghĩa trở lên, vd. Dương Châu -> 扬州 cần đổi cả 2 âm).
    if (ambPos.length > 1 && count < 10) {
        var combo = chars.slice();
        for (var c = 0; c < ambPos.length; c++) combo[ambPos[c].pos] = ambPos[c].alts[0];
        var cv = combo.join("");
        if (cv !== primary && out.variants.indexOf(cv) === -1) out.variants.push(cv);
    }
    return out;
}

// Tìm truyện trên ixdzs8 theo tên tiếng Trung, đối chiếu tên thật trả về.
// Trả {bookId, name} hoặc null. Chấp nhận khi tên thật bằng đúng truy vấn,
// hoặc tên thật chứa truy vấn và truy vấn phủ >= 60% độ dài tên thật.
// Vì sao 60%: tìm kiếm của ixdzs8 là substring nên tên thật thường dài hơn
// truy vấn một đoạn tiền tố/hậu tố (vd. "重生之..." hay ",苟到天荒地老") —
// ngưỡng 60% cho phép đoạn thêm vào tới ~40% độ dài tên. Ngược lại, ngưỡng
// này chặn trường hợp lấy nhầm truyện dài hơn hẳn, vd. "Cố Đạo Trường Sinh"
// chuyển thành 苟道长生 khớp tên dài "我靠避凶天赋苟道长生" nhưng truy vấn chỉ
// phủ ~36% nên bị loại. Ngưỡng + cap 10 biến thể chỉ kiểm chứng trên ~12 tên
// mẫu + 3 truyện test trên máy thật (v4) — gặp truyện mới bị lấy nhầm hoặc
// tìm không ra thì log lại cặp (tên Việt -> tên tìm được -> tên thật) vào
// README để hiệu chỉnh ngưỡng có căn cứ, đừng chỉnh mù.
function searchUpstreamByTitle(zhQuery) {
    if (!zhQuery || zhQuery.length < 2) return null;
    var url = "https://ixdzs8.com/bsearch?q=" + encodeURIComponent(zhQuery);
    var res = null;
    try {
        res = fetch(url, {
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
        });
    } catch (e) {
        return null;
    }
    if (!res || !res.ok) return null;
    var html = res.text();
    var re = /<li class="burl" data-url="\/read\/(\d+)\/"[\s\S]*?<h3 class="bname"><a[^>]*title="([^"]*)"/gi;
    var results = [];
    var m = null;
    while ((m = re.exec(html)) !== null && results.length < 3) {
        results.push({ bookId: m[1], name: m[2] });
    }
    var q = String(zhQuery).replace(/[，,。、！!？?·\s]/g, "");
    for (var i = 0; i < results.length; i++) {
        var name = String(results[i].name || "").replace(/[，,。、！!？?·\s]/g, "");
        if (!name || !q) continue;
        if (name === q) return results[i];
        if (name.indexOf(q) !== -1 && q.length * 10 >= name.length * 6) return results[i];
        if (q.indexOf(name) !== -1 && name.length * 10 >= q.length * 6) return results[i];
    }
    return null;
}

function getCachedUpstreamBookId(storyId) {
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var raw = localStorage.getItem("ttc_upstream_map");
            if (raw) {
                var map = JSON.parse(raw);
                if (map && map[String(storyId)]) return String(map[String(storyId)]);
            }
        }
    } catch (e) {}
    return "";
}

function cacheUpstreamBookId(storyId, bookId) {
    if (!storyId || !bookId) return;
    try {
        if (typeof localStorage !== "undefined" && localStorage) {
            var map = {};
            try {
                var raw = localStorage.getItem("ttc_upstream_map");
                if (raw) map = JSON.parse(raw) || {};
            } catch (eParse) {}
            map[String(storyId)] = String(bookId);
            localStorage.setItem("ttc_upstream_map", JSON.stringify(map));
        }
    } catch (e) {}
}

// Phân giải storyId TTC sang bookId ixdzs8: bảng map cứng trước, rồi cache,
// rồi chuyển tên Hán-Việt + tìm kiếm (bản chính rồi các biến thể).
function resolveUpstreamBookId(storyId, viTitle) {
    if (KNOWN_UPSTREAM_STORIES[String(storyId)]) {
        return KNOWN_UPSTREAM_STORIES[String(storyId)].bookId;
    }
    var cached = getCachedUpstreamBookId(storyId);
    if (cached) return cached;
    var conv = convertTitleToZh(viTitle);
    var queries = [];
    if (conv.primary) queries.push(conv.primary);
    for (var i = 0; i < conv.variants.length; i++) queries.push(conv.variants[i]);
    for (var j = 0; j < queries.length; j++) {
        var hit = searchUpstreamByTitle(queries[j]);
        if (hit && hit.bookId) {
            cacheUpstreamBookId(storyId, hit.bookId);
            return hit.bookId;
        }
    }
    return "";
}
