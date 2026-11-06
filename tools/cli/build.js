#!/usr/bin/env node
// build.js — Build 1 extension thành plugin.zip (cơ chế lib-inline).
//
//   node tools/cli/build.js <đường-dẫn-thư-mục-nguồn> [output.zip]
//   node tools/cli/build.js --help
//
// Các bước:
//   1. Đọc plugin.json của nguồn.
//   2. Quét các lệnh load('lib-xxx.js') / load('cleanHtml.js')... trong src/
//      để xác định file lib nào được load — CHỈ copy những file lib đó
//      (từ lib/ ở root repo) vào src/ tạm, KHÔNG copy file lib không dùng.
//      (Vì load() của vBook chỉ load file ở top level src/, không đệ quy,
//      nên lib/ ở root repo không chạy được nếu không inline vào zip.)
//   3. Copy toàn bộ thư mục nguồn sang thư mục tạm, copy file lib cần
//      thiết vào src/ tạm.
//   4. Đóng plugin.zip bằng lệnh `zip` của hệ thống qua child_process.
//      Zip chứa plugin.json + icon.png + src/*.js ở đúng cấu trúc
//      (không kèm thư mục cha thừa).
//
// Chỉ dùng Node stdlib (fs, path, os, child_process).

const fs = require("fs");
const path = require("path");
const os = require("os");
const childProcess = require("child_process");

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function die(msg) {
  console.error("LỖI: " + msg);
  process.exit(1);
}

function printHelp() {
  console.log(
    "Cách dùng:\n" +
      "  node tools/cli/build.js <đường-dẫn-thư-mục-nguồn> [output.zip]\n" +
      "\n" +
      "Build 1 extension thành plugin.zip. Ví dụ:\n" +
      "  node tools/cli/build.js extensions/novel/truyenfull\n" +
      "  node tools/cli/build.js templates/novel /tmp/test.zip\n" +
      "\n" +
      "Nếu không cho output.zip, zip ghi vào <thư-mục-nguồn>/plugin.zip.\n" +
      "File lib nào được load() trong src/ sẽ được copy (inline) từ lib/\n" +
      "ở root repo vào src/ trong zip; file lib không dùng sẽ không copy.\n" +
      "Chấp nhận cả 2 layout: extensions/<loại>/<tên>/src/ (chuẩn) và\n" +
      "template để file .js phẳng ở top level (templates/novel/...) —\n" +
      "zip lúc nào cũng có đúng cấu trúc plugin.json + icon.png + src/*.js.\n" +
      "Cần lệnh `zip` của hệ thống (gói Info-ZIP).\n" +
      "\n" +
      "Exit code: 0 khi build xong, 1 khi lỗi."
  );
}

// Quét load('xxx.js') trong mọi file .js của src/, trả về danh sách tên file.
function findLoads(srcDir) {
  const loads = new Set();
  if (!fs.existsSync(srcDir)) return loads;
  const re = /load\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  for (const f of fs.readdirSync(srcDir)) {
    if (!f.endsWith(".js")) continue;
    const text = fs.readFileSync(path.join(srcDir, f), "utf8");
    let m;
    while ((m = re.exec(text)) !== null) loads.add(m[1]);
  }
  return loads;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  const positional = argv.filter(function (a) { return !a.startsWith("-"); });
  if (positional.length < 1 || positional.length > 2) {
    die("sai cú pháp. Cách dùng: node tools/cli/build.js <thư-mục-nguồn> [output.zip] (xem --help).");
  }

  const srcDirArg = path.resolve(positional[0]);
  const root = repoRoot();
  const libDir = path.join(root, "lib");

  if (!fs.existsSync(srcDirArg) || !fs.statSync(srcDirArg).isDirectory()) {
    die("không tìm thấy thư mục nguồn: " + srcDirArg);
  }
  const manifestPath = path.join(srcDirArg, "plugin.json");
  if (!fs.existsSync(manifestPath)) {
    die("thư mục nguồn thiếu plugin.json: " + srcDirArg);
  }
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    die("plugin.json của nguồn không parse được: " + e.message);
  }
  const meta = manifest.metadata || {};
  const extName = meta.name || path.basename(srcDirArg);
  // Thư mục chứa script: extensions/<loại>/<tên>/src/ (layout chuẩn),
  // hoặc chính thư mục nguồn khi template để file .js phẳng ở top level
  // (templates/novel/... — không có src/). Zip lúc nào cũng đóng gói
  // theo cấu trúc chuẩn: plugin.json + icon.png + src/*.js.
  const hasSrcDir = fs.existsSync(path.join(srcDirArg, "src")) &&
    fs.statSync(path.join(srcDirArg, "src")).isDirectory();
  const scriptDir = hasSrcDir ? path.join(srcDirArg, "src") : srcDirArg;
  const flatLayout = !hasSrcDir;
  if (flatLayout && !fs.readdirSync(srcDirArg).some(function (f) { return f.endsWith(".js"); })) {
    die("thư mục nguồn không có file .js nào (cũng không có thư mục src/): " + srcDirArg);
  }

  const outZip = positional[1]
    ? path.resolve(positional[1])
    : path.join(srcDirArg, "plugin.zip");

  // ---- Xác định file lib cần inline ----
  const loads = findLoads(scriptDir);
  const neededLib = [];
  loads.forEach(function (name) {
    const base = path.basename(name);
    if (fs.existsSync(path.join(scriptDir, base))) return; // đã có sẵn trong src/
    const libFile = path.join(libDir, base);
    if (fs.existsSync(libFile)) {
      neededLib.push(base);
    } else {
      die(
        "nguồn \"" + extName + "\" load('" + name + "') nhưng không tìm thấy file \"" + base +
        "\" trong src/ lẫn trong lib/ ở root repo — thêm file vào lib/ hoặc sửa lệnh load()."
      );
    }
  });

  // ---- Kiểm tra lệnh `zip` của hệ thống ----
  const which = childProcess.spawnSync("which", ["zip"], { encoding: "utf8" });
  if (which.status !== 0 || !which.stdout.trim()) {
    die(
      "không tìm thấy lệnh `zip` trên máy này, không đóng được plugin.zip.\n" +
      "Cài đặt rồi chạy lại:\n" +
      "  - Ubuntu/Debian: sudo apt install zip\n" +
      "  - macOS: brew install zip\n" +
      "  - Windows: cài Git for Windows (kèm zip) hoặc 7-Zip rồi thêm vào PATH."
    );
  }

  // ---- Copy sang thư mục tạm + inline lib ----
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qsang-vbook-build-"));
  const tmpExt = path.join(tmpDir, "ext");
  try {
    fs.cpSync(srcDirArg, tmpExt, { recursive: true });
    // Không mang plugin.zip cũ (nếu có) vào bản build mới.
    const staleZip = path.join(tmpExt, "plugin.zip");
    if (fs.existsSync(staleZip)) fs.unlinkSync(staleZip);
    // Layout phẳng (template): chuyển các file .js ở top level vào src/
    // để zip có đúng cấu trúc chuẩn plugin.json + icon.png + src/*.js.
    // (test.json và các file khác ở top level không đưa vào zip.)
    if (flatLayout) {
      const tmpSrc = path.join(tmpExt, "src");
      fs.mkdirSync(tmpSrc, { recursive: true });
      fs.readdirSync(tmpExt).forEach(function (f) {
        if (f.endsWith(".js")) fs.renameSync(path.join(tmpExt, f), path.join(tmpSrc, f));
      });
    }
    neededLib.forEach(function (f) {
      fs.copyFileSync(path.join(libDir, f), path.join(tmpExt, "src", f));
    });

    // ---- Đóng zip: chạy trong thư mục tạm để zip không kèm thư mục cha ----
    const zipArgs = ["-r", "-q", outZip];
    if (fs.existsSync(path.join(tmpExt, "plugin.json"))) zipArgs.push("plugin.json");
    if (fs.existsSync(path.join(tmpExt, "icon.png"))) zipArgs.push("icon.png");
    zipArgs.push("src");
    // Ghi đè zip cũ nếu có (zip -r mặc định cập nhật, -FS tránh lỗi timestamp).
    if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
    const res = childProcess.spawnSync("zip", zipArgs, { cwd: tmpExt, encoding: "utf8" });
    if (res.status !== 0) {
      die("lệnh zip thất bại (exit " + res.status + "): " + ((res.stderr || res.stdout || "")).trim());
    }
    if (!fs.existsSync(outZip) || fs.statSync(outZip).size === 0) {
      die("zip không được tạo ra hoặc rỗng: " + outZip);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("Đã build \"" + extName + "\" -> " + outZip +
    " (" + fs.statSync(outZip).size + " bytes).");
  if (neededLib.length > 0) {
    console.log("File lib đã inline vào src/: " + neededLib.join(", "));
  } else {
    console.log("Không có file lib nào cần inline (src/ không load file nào từ lib/).");
  }
}

main();
