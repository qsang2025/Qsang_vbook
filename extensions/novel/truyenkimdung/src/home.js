// home.js — Cac tab trang chu Truyen Kim Dung (truyenkimdung.net).
//
// Chi tra tab tinh, khong fetch (quy tac 9 AGENTS.md: app chay tab dau
// tien ngay khi mo extension — fetch loi o do se chan ca trang chu).
// Thu vien chi co 20 bo nen moi tab lay pageSize=20 (du 1 trang, khong
// can phan trang). Tab loc theo phien ban dung GET /?version=<...> (gia
// tri tieng Viet co dau, da encode san — kiem chung live 2026-11-19).
function execute() {
    return Response.success([
        { title: "Tất cả truyện", input: "/?pageSize=20", script: "gen.js" },
        { title: "Bản tân tu", input: "/?version=T%C3%A2n%20tu&pageSize=20", script: "gen.js" },
        { title: "Bản cũ", input: "/?version=B%E1%BA%A3n%20c%C5%A9&pageSize=20", script: "gen.js" },
        { title: "Truyện ngắn", input: "/?version=Truy%E1%BB%87n%20ng%E1%BA%AFn&pageSize=20", script: "gen.js" }
    ]);
}
