// home.js — Tab trang chu tinh, khong fetch (AGENTS.md muc 6.9).
// Tab tro ve updates.js / updates1.js voi input "/" de list script
// tai du lieu; khong parse muc trang chu "/" trong tab dau tien.
function execute() {
    return Response.success([
        { title: "最近更新", input: "/", script: "updates.js" },
        { title: "最新小说", input: "/", script: "updates1.js" }
    ]);
}
