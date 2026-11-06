// language.js — danh sach ngon ngu engine ho tro (template translate).
// Y tuong: template translate cua Darkrai9x.
// type: "from" (chi ngon ngu nguon) | "to" (chi ngon ngu dich) | bo trong
// (ca hai). id theo ma ISO 639-1 (vi, en, zh, ja).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { id: "auto", name: "Tự động nhận diện", type: "from" },
        { id: "vi", name: "Vietnamese" },
        { id: "en", name: "English" },
        { id: "zh", name: "Chinese" },
        { id: "ja", name: "Japanese" }
    ]);
}
