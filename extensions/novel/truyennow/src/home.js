// home.js — Tab trang chu (tinh, khong fetch — quy tac 9).
// Cac muc tren trang chu site: Mới Cập Nhật (/danh-sach?sort=updated_at),
// Truyện Hot (/danh-sach?filter=hot), Hoàn Thành (/danh-sach?filter=completed),
// Kho Truyện (/danh-sach). Tat ca qua gen.js.
load('config.js');

function execute() {
  return Response.success([
    {
      title: "Mới Cập Nhật",
      input: BASE_URL + "/danh-sach?sort=updated_at",
      script: "gen.js"
    },
    {
      title: "Truyện Hot",
      input: BASE_URL + "/danh-sach?filter=hot",
      script: "gen.js"
    },
    {
      title: "Truyện Full",
      input: BASE_URL + "/danh-sach?filter=completed",
      script: "gen.js"
    },
    {
      title: "Kho Truyện",
      input: BASE_URL + "/danh-sach",
      script: "gen.js"
    }
  ]);
}
