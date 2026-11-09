#!/usr/bin/env node
// build-catalog.js — Sinh registry gốc plugin.json từ các nguồn trên đĩa.
//
// Registry KHÔNG sửa tay: file này quét extensions/<loại>/<tên>/plugin.json
// và sinh lại toàn bộ plugin.json ở root repo (branch main).
// Chỉ dùng Node stdlib (fs, path). Chạy từ bất cứ đâu:
//   node tools/cli/build-catalog.js [--check] [đường-dẫn-repo]
//   node tools/cli/build-catalog.js --help
//
//   --check : chỉ kiểm tra plugin.json hiện tại có khớp với nội dung sẽ
//             sinh ra không; không ghi file. Exit 1 nếu lệch.
//   Mặc định (không cờ): ghi đè plugin.json ở root repo.

const fs = require("fs");
const path = require("path");

const REPO = "qsang2025/Qsang_vbook";
const BRANCH = "main";
const RAW_BASE = "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH;
const REGISTRY_AUTHOR = "MuseAi";
const DEFAULT_DESCRIPTION =
  "Tuyển tập extension vBook của Qsang — đọc truyện, truyện tranh, video, " +
  "audio, dịch, TTS và AI. Registry sinh tự động từ extensions/, không sửa tay.";

function repoRoot() {
  // Script nằm ở tools/cli/ -> root repo là 2 cấp lên trên.
  return path.resolve(__dirname, "..", "..");
}

function die(msg) {
  console.error("LỖI: " + msg);
  process.exit(1);
}

function printHelp() {
  console.log(
    "Cách dùng:\n" +
      "  node tools/cli/build-catalog.js [--check] [đường-dẫn-repo]\n" +
      "\n" +
      "Quét mọi nguồn trong extensions/<loại>/<tên>/ (mỗi nguồn có plugin.json)\n" +
      "và sinh registry gốc plugin.json ở root repo với metadata author \"MuseAi\".\n" +
      "Đường dẫn zip trong registry dùng branch main:\n" +
      "  " + RAW_BASE + "/extensions/<loại>/<tên>/plugin.zip\n" +
      "\n" +
      "Tùy chọn:\n" +
      "  --check   Chỉ kiểm tra plugin.json hiện tại có khớp với nội dung sẽ\n" +
      "            sinh ra không; không ghi file. Exit 1 nếu lệch.\n" +
      "  --help    Hiện hướng dẫn này.\n" +
      "\n" +
      "Exit code: 0 khi thành công (hoặc khớp, với --check), 1 khi lỗi/lệch."
  );
}

// Đọc JSON, báo lỗi rõ ràng bằng tiếng Việt thay vì stack trace.
function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (e) {
    die("không đọc được file " + file + ": " + e.message);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    die("file " + file + " không phải JSON hợp lệ: " + e.message);
  }
}

// Quét extensions/: trả về danh sách { type, dir, manifest }.
// Chấp nhận cả 2 dạng: extensions/<loại>/<tên>/ và extensions/<tên>/
// (loại khi đó lấy từ metadata.type của nguồn).
function scanExtensions(root) {
  const extRoot = path.join(root, "extensions");
  if (!fs.existsSync(extRoot)) return [];
  const found = [];

  function readSource(typeDir, name, type) {
    const dir = path.join(extRoot, typeDir, name);
    const manifestPath = path.join(dir, "plugin.json");
    if (!fs.existsSync(manifestPath)) return;
    const manifest = readJson(manifestPath);
    const meta = manifest.metadata || {};
    found.push({ type: type, dir: dir, name: name, manifest: manifest, meta: meta });
  }

  for (const type of fs.readdirSync(extRoot).sort()) {
    const typePath = path.join(extRoot, type);
    if (!fs.statSync(typePath).isDirectory()) continue;
    // extensions/<tên>/plugin.json (dạng phẳng, loại lấy từ metadata.type)
    if (fs.existsSync(path.join(typePath, "plugin.json"))) {
      const manifest = readJson(path.join(typePath, "plugin.json"));
      const meta = manifest.metadata || {};
      found.push({ type: meta.type || type, dir: typePath, name: type, manifest: manifest, meta: meta });
      continue;
    }
    // extensions/<loại>/<tên>/plugin.json (dạng chuẩn)
    for (const name of fs.readdirSync(typePath).sort()) {
      const dir = path.join(typePath, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      readSource(type, name, type);
    }
  }
  return found;
}

function buildRegistry(root) {
  const sources = scanExtensions(root);
  const entries = sources.map(function (s) {
    const m = s.meta;
    const rel = s.type + "/" + s.name;
    const iconPath = path.join(s.dir, "icon.png");
    if (!fs.existsSync(iconPath)) {
      console.error(
        "Cảnh báo: nguồn " + rel + " thiếu icon.png — registry vẫn trỏ tới " +
        "icon.png trên GitHub, app sẽ không hiện icon cho nguồn này."
      );
    }
    return {
      name: m.name || s.name,
      author: m.author || REGISTRY_AUTHOR,
      path: RAW_BASE + "/extensions/" + rel + "/plugin.zip",
      version: m.version,
      source: m.source || "",
      icon: RAW_BASE + "/extensions/" + rel + "/icon.png",
      description: m.description || "",
      type: m.type || s.type,
      locale: m.locale || "vi_VN",
      // Co NSFW (metadata.nsfw === true) thi ghi ro vao registry de app
      // biet ma loc/an theo cai dat nguoi dung (AGENTS.md §6.7). Chi ghi
      // khi true de khong lam phinh registry cua cac nguon binh thuong.
      ...(m.nsfw === true ? { nsfw: true } : {}),
    };
  });

  entries.sort(function (a, b) {
    if (a.type !== b.type) return a.type < b.type ? -1 : 1;
    return String(a.name).localeCompare(String(b.name), "vi");
  });

  // Giữ lại description cũ của registry nếu đã có, để không mất câu mô tả
  // do người khác viết tay ở metadata.
  let description = DEFAULT_DESCRIPTION;
  const registryPath = path.join(root, "plugin.json");
  if (fs.existsSync(registryPath)) {
    try {
      const old = JSON.parse(fs.readFileSync(registryPath, "utf8"));
      if (old && old.metadata && typeof old.metadata.description === "string" && old.metadata.description) {
        description = old.metadata.description;
      }
    } catch (e) {
      // Registry cũ lỗi thì bỏ qua, sẽ ghi đè bằng nội dung mới.
    }
  }

  return {
    metadata: { author: REGISTRY_AUTHOR, description: description },
    data: entries,
  };
}

// So sánh sâu 2 registry, KHÔNG phụ thuộc thứ tự key hay khoảng trắng
// (file hiện tại có thể viết {"data":...,"metadata":...}, file sinh ra
// viết {"metadata":...,"data":...} — vẫn là cùng một registry).
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every(function (v, i) { return deepEqual(v, b[i]); });
  }
  if (typeof a === "object") {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (ka.length !== kb.length) return false;
    return ka.every(function (k, i) { return k === kb[i] && deepEqual(a[k], b[k]); });
  }
  return false;
}

function registriesEqual(a, b) {
  return deepEqual(a, b);
}

// Mô tả ngắn gọn chỗ lệch để người dùng sửa cho khớp.
function describeDiff(current, generated) {
  const lines = [];
  const byPath = function (list) {
    const map = new Map();
    list.forEach(function (e) { map.set(e.path, e); });
    return map;
  };
  const cur = byPath(current.data || []);
  const gen = byPath(generated.data || []);
  gen.forEach(function (entry, p) {
    if (!cur.has(p)) {
      lines.push("  - thiếu trong plugin.json hiện tại: " + entry.name + " (" + p + ")");
    }
  });
  cur.forEach(function (entry, p) {
    if (!gen.has(p)) {
      lines.push("  - thừa trong plugin.json hiện tại (không còn trên đĩa): " + (entry.name || "?") + " (" + p + ")");
    }
  });
  gen.forEach(function (entry, p) {
    const old = cur.get(p);
    if (!old) return;
    ["name", "author", "version", "source", "icon", "description", "type", "locale"].forEach(function (k) {
      if (String(old[k]) !== String(entry[k])) {
        lines.push(
          "  - lệch trường \"" + k + "\" ở " + entry.name + ": hiện tại=" +
          JSON.stringify(old[k]) + ", đúng ra=" + JSON.stringify(entry[k])
        );
      }
    });
  });
  if ((current.metadata && current.metadata.author) !== REGISTRY_AUTHOR) {
    lines.push('  - metadata.author hiện tại là ' + JSON.stringify(current.metadata && current.metadata.author) +
      ', đúng ra phải là "Qsang"');
  }
  if ((current.metadata && current.metadata.description) !== generated.metadata.description) {
    lines.push("  - metadata.description hiện tại khác với mô tả sẽ sinh ra.");
  }
  if (lines.length === 0) {
    lines.push("  - (không rõ chi tiết — thử chạy build-catalog không có --check để xem file sinh ra).");
  }
  return lines;
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  const check = argv.includes("--check");
  const positional = argv.filter(function (a) { return !a.startsWith("-"); });
  if (positional.length > 1) die("chỉ nhận tối đa 1 đường dẫn repo. Xem --help.");
  const root = positional.length ? path.resolve(positional[0]) : repoRoot();
  if (!fs.existsSync(path.join(root, "extensions"))) {
    die("không tìm thấy thư mục extensions/ trong " + root + " — sai đường dẫn repo?");
  }

  const registry = buildRegistry(root);
  const registryPath = path.join(root, "plugin.json");

  if (check) {
    if (!fs.existsSync(registryPath)) {
      die("chưa có plugin.json ở root repo — chạy build-catalog không có --check để sinh file.");
    }
    const current = readJson(registryPath);
    if (!current || !Array.isArray(current.data)) {
      die("plugin.json hiện tại sai định dạng: thiếu mảng \"data\".");
    }
    if (registriesEqual(current, registry)) {
      console.log("OK: plugin.json khớp với " + registry.data.length + " nguồn trên đĩa.");
      return;
    }
    console.error("LỖI: plugin.json LỆCH so với các nguồn trên đĩa (" + registry.data.length + " nguồn):");
    describeDiff(current, registry).forEach(function (l) { console.error(l); });
    console.error("Chạy \"node tools/cli/build-catalog.js\" (không có --check) để sinh lại registry.");
    process.exit(1);
  }

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + "\n", "utf8");
  console.log("Đã sinh " + registryPath + " với " + registry.data.length + " nguồn.");
}

main();
