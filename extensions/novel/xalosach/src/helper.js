// helper.js — Helper dung chung (khong co execute, chi duoc load).
// slugify: bo dau tieng Viet + chuyen thanh slug dung cho URL tim kiem
// cua site (vd. "toan cau bang phong" -> "toan-cau-bang-phong").
// Goc tu base Ivan1hai xalosach_ok v3 (util.js), viet lai var-style,
// bo phan RegExp ghep chu cai Chau Au khong can cho tieng Viet.
// File nay khong load them file nao khac.

function slugify(str) {
    var s = String(str || "").toLowerCase();
    s = s.replace(/à|á|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, "a");
    s = s.replace(/è|é|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, "e");
    s = s.replace(/ì|í|ỉ|ĩ|ị/g, "i");
    s = s.replace(/ò|ó|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, "o");
    s = s.replace(/ù|ú|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, "u");
    s = s.replace(/ỳ|ý|ỷ|ỹ|ỵ/g, "y");
    s = s.replace(/đ/g, "d");
    s = s.replace(/[^a-z0-9]+/g, "-");
    s = s.replace(/-+/g, "-");
    s = s.replace(/^-+/, "").replace(/-+$/, "");
    return s;
}
