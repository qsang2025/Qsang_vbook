// home.js — Các tab danh sách
// Contract: execute() → [{ title, input, script }]
load("config.js");
function execute() {
    return Response.success([
        { title: "Chương mới",    input: BASE_URL + "/chuong-moi?start={{page}}",     script: "book.js" },
        { title: "Truyện nam",    input: BASE_URL + "/truyen-nam",                    script: "book.js" },
        { title: "Nữ tần",        input: BASE_URL + "/nu-tan",                        script: "book.js" },
        { title: "Đam mỹ",        input: BASE_URL + "/dam-my",                        script: "book.js" },
        { title: "Review",        input: BASE_URL + "/review?start={{page}}",        script: "book.js" },
        { title: "Bảng xếp hạng", input: BASE_URL + "/bang-xep-hang?start={{page}}",  script: "book.js" }
    ]);
}