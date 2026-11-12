function execute() {
  return Response.success([
    { title: "Truyện Hot", input: "list:truyen-hot", script: "gen.js" },
    { title: "Truyện Mới", input: "list:truyen-moi", script: "gen.js" },
    { title: "Truyện Full", input: "list:truyen-full", script: "gen.js" },
    { title: "Truyện Convert", input: "list:truyen-convert", script: "gen.js" },
    { title: "Truyện Dịch", input: "list:truyen-dich", script: "gen.js" },
    { title: "Truyện Dịch AI", input: "list:truyen-dich-ai", script: "gen.js" },
  ]);
}
