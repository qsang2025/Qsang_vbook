#!/usr/bin/env node
// cli.js — CLI một cửa cho repo Qsang_vbook (chỉ điều phối, không chứa logic).
//
//   node scripts/cli.js validate [repo]        Kiểm tra tĩnh toàn repo
//   node scripts/cli.js build [ext-dir]        Đóng plugin.zip (OFFLINE, zip local)
//   node scripts/cli.js build-catalog [--check] [repo]
//   node scripts/cli.js health-check           Kiểm tra sức khỏe các nguồn
//   node scripts/cli.js connect                Kiểm tra developer server trên điện thoại
//   node scripts/cli.js test <ext> <script> [args...]
//   node scripts/cli.js testall [ext...] [--query ...] [--json ...]
//   node scripts/cli.js install <ext>
//
// Điều phối:
//   validate / build / build-catalog -> tools/cli/*.js (Node thuần, offline).
//   health-check                     -> scripts/health-check.js.
//   connect / test / testall / install -> .agents/skills/vbook-extensions/scripts/vbook.js
//     (đường dẫn theo AGENTS.md mục 3; cần điện thoại bật dev mode).
//
// `build` chạy OFFLINE bằng zip local (tools/cli/build.js) — không cần điện
// thoại. Chỉ `test` / `testall` / `install` / `connect` mới gọi developer
// server trên điện thoại (xem AGENTS.md mục 3).
//
// Chỉ dùng Node stdlib (fs, path, child_process). Exit code lấy từ script
// con; nếu script con bị kill (status null) thì exit 1 — không để null
// trôi thành 0 (lỗi nhỏ của bản tham khảo đã sửa ở đây).

const fs = require("fs");
const path = require("path");
const childProcess = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const TOOLS_DIR = path.join(ROOT, "tools", "cli");
const SKILL_VBOOK = path.join(
  ROOT, ".agents", "skills", "vbook-extensions", "scripts", "vbook.js"
);

function printHelp() {
  console.log(
    "Qsang_vbook CLI — một cửa cho mọi lệnh repo\n" +
      "\n" +
      "Cách dùng:\n" +
      "  node scripts/cli.js validate [repo]              Kiểm tra tĩnh toàn repo\n" +
      "  node scripts/cli.js build [ext-dir]              Đóng plugin.zip (OFFLINE)\n" +
      "  node scripts/cli.js build-catalog [--check] [repo]\n" +
      "  node scripts/cli.js health-check                 Kiểm tra sức khỏe các nguồn\n" +
      "  node scripts/cli.js connect                      Kiểm tra developer server\n" +
      "  node scripts/cli.js test <ext> <script> [args...]\n" +
      "  node scripts/cli.js testall [ext...] [--query ...] [--json ...]\n" +
      "  node scripts/cli.js install <ext>\n" +
      "\n" +
      "Ghi chú:\n" +
      "  - build: chạy offline bằng zip local (tools/cli/build.js), không cần\n" +
      "    điện thoại. Không cho ext-dir thì build hết các nguồn trong extensions/.\n" +
      "  - connect / test / testall / install: cần điện thoại mở app vBook, bật\n" +
      "    dev mode (xem scripts/vbook.js và servers.json).\n" +
      "  - health-check: cần scripts/health-check.js (giai đoạn 1).\n" +
      "\n" +
      "Hoặc dùng npm scripts: npm run validate | build | build-catalog |\n" +
      "health-check | connect | test | testall | install\n"
  );
}

// Chạy 1 script con bằng chính node đang chạy, kế thừa stdio, trả exit code
// của nó. Script con bị kill (status null) hoặc spawn lỗi thì exit 1.
function runScript(scriptPath, args) {
  const result = childProcess.spawnSync(process.execPath, [scriptPath].concat(args), {
    stdio: "inherit",
  });
  if (result.error) {
    console.error("LỖI: không chạy được " + scriptPath + ": " + result.error.message);
    process.exit(1);
  }
  process.exit(typeof result.status === "number" ? result.status : 1);
}

// Tìm mọi extension trên đĩa: extensions/<loại>/<tên>/ có plugin.json.
function listExtDirs() {
  const extRoot = path.join(ROOT, "extensions");
  const out = [];
  if (!fs.existsSync(extRoot)) return out;
  fs.readdirSync(extRoot).sort().forEach(function (type) {
    const typeDir = path.join(extRoot, type);
    if (!fs.statSync(typeDir).isDirectory()) return;
    fs.readdirSync(typeDir).sort().forEach(function (name) {
      const dir = path.join(typeDir, name);
      if (
        fs.statSync(dir).isDirectory() &&
        fs.existsSync(path.join(dir, "plugin.json"))
      ) {
        out.push(dir);
      }
    });
  });
  return out;
}

// build: không arg -> build hết; 1 arg -> build 1 nguồn;
// 2 arg (thư mục nguồn + đường dẫn .zip) -> build 1 nguồn ra file zip đó;
// nhiều arg hơn -> build từng thư mục được cho.
// Build từng nguồn riêng để một nguồn lỗi không chặn các nguồn khác;
// cuối cùng exit 1 nếu có nguồn nào lỗi.
function runBuild(args) {
  const buildJs = path.join(TOOLS_DIR, "build.js");
  if (args.length === 2 && args[1].toLowerCase().endsWith(".zip")) {
    runScript(buildJs, args);
    return;
  }
  const targets = args.length > 0 ? args : listExtDirs();
  if (targets.length === 0) {
    console.log("Không tìm thấy extension nào trong extensions/ để build.");
    process.exit(0);
  }
  let failed = 0;
  targets.forEach(function (t) {
    const result = childProcess.spawnSync(
      process.execPath, [buildJs, t], { stdio: "inherit" }
    );
    if (result.error || result.status !== 0) failed++;
  });
  if (failed > 0) {
    console.error("build: " + failed + "/" + targets.length + " nguồn lỗi.");
    process.exit(1);
  }
  console.log("build: xong " + targets.length + "/" + targets.length + " nguồn.");
}

function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];
  const rest = argv.slice(1);

  if (!cmd || cmd === "--help" || cmd === "-h") {
    printHelp();
    process.exit(0);
  }

  switch (cmd) {
    case "validate":
      runScript(path.join(TOOLS_DIR, "validate.js"), rest);
      break;
    case "build":
      runBuild(rest);
      break;
    case "build-catalog":
      runScript(path.join(TOOLS_DIR, "build-catalog.js"), rest);
      break;
    case "health-check": {
      const hc = path.join(ROOT, "scripts", "health-check.js");
      if (!fs.existsSync(hc)) {
        console.error(
          "LỖI: chưa có scripts/health-check.js — lệnh này thuộc giai đoạn 1,\n" +
            "đang được làm song song. Khi nào file đó có mặt thì chạy lại."
        );
        process.exit(1);
      }
      runScript(hc, rest);
      break;
    }
    case "connect":
    case "test":
    case "testall":
    case "install":
      runScript(SKILL_VBOOK, [cmd].concat(rest));
      break;
    default:
      console.error("LỖI: lệnh không biết: " + cmd + "\n");
      printHelp();
      process.exit(1);
  }
}

main();
