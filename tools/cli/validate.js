#!/usr/bin/env node
// validate.js — Kiểm tra toàn bộ repo Qsang_vbook.
//
//   node tools/cli/validate.js [đường-dẫn-repo]
//   node tools/cli/validate.js --help
//
// Kiểm tra:
//   (a) mọi plugin.json (root + từng nguồn) parse được;
//   (b) catalog root ≡ đĩa (mọi thư mục nguồn đều có trong plugin.json data
//       và ngược lại);
//   (c) version trong manifest nguồn khớp version trong registry;
//   (d) mọi script trong script map tồn tại dưới dạng file trong src/;
//   (e) mọi file .js trong src/ đều có trong script map HOẶC là helper
//       được load (config.js, helper.js, file trong lib/, hoặc file được
//       load('...') từ một script khác) — còn lại báo file mồ côi;
//   (f) locale thuộc tập chuẩn, type thuộc tập chuẩn;
//   (g) test.json (nếu có) đúng định dạng golden fixture
//       {"script", "input", "expect"} (một case hoặc mảng các case);
//   (h) mỗi nguồn phải có plugin.zip đã commit kèm (để app cài được từ
//       URL repo); nội dung zip phải khớp src/ hiện tại (plugin.json +
//       src/*.js + file lib đã inline); không có file .zip lạ nào khác
//       trong extensions/.
//   (i) linter Rhino ES6: cấm arrow function, async/await, template literal,
//       ?., ??, spread, .flat() trong src/*.js và lib/*.js (runtime vBook
//       chỉ chạy Rhino ES6); script chạy được phải có function execute(...);
//       file được load() không được load() tiếp; load() không chứa đường
//       dẫn (chỉ tên file ở top level của src/).
//   (j) health.json (nếu có) đúng định dạng fixture nhẹ
//       {"cases": [{"name", "url", "pattern"}]}.
//   (+) branch trong URL registry phải là "main" (theo AGENTS.md mục 5).
//
// In từng lỗi rõ ràng bằng tiếng Việt + tổng kết số nguồn đã kiểm tra.
// Exit 0 khi pass (kể cả khi 0 extension), exit 1 khi có lỗi.

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const REPO = "qsang2025/Qsang_vbook";
const BRANCH = "main";
const RAW_BASE = "https://raw.githubusercontent.com/" + REPO + "/" + BRANCH;
const LOCALES = ["vi_VN", "zh_CN", "ja_JP", "en_US", "zh_TW"];
const TYPES = ["novel", "comic", "chinese_novel", "video", "audio", "translate", "tts", "ai"];
// File helper được chấp nhận trong src/ mà không cần có trong script map.
const HELPER_NAMES = ["config.js", "helper.js"];

function repoRoot() {
  return path.resolve(__dirname, "..", "..");
}

function printHelp() {
  console.log(
    "Cách dùng:\n" +
      "  node tools/cli/validate.js [đường-dẫn-repo]\n" +
      "\n" +
      "Kiểm tra toàn bộ repo: JSON hợp lệ, catalog ≡ đĩa, version khớp,\n" +
      "script map khớp file trong src/, không có file .js mồ côi, locale/type\n" +
      "chuẩn, test.json đúng định dạng golden fixture, mỗi nguồn có plugin.zip\n" +
      "đã commit kèm và khớp nội dung src/ hiện tại, không có file .zip lạ\n" +
      "trong extensions/, branch trong URL registry là \"main\", linter Rhino\n" +
      "ES6 cho src/*.js và lib/*.js, health.json đúng định dạng fixture nhẹ.\n" +
      "\n" +
      "Exit code: 0 khi pass (kể cả khi chưa có extension nào),\n" +
      "1 khi có lỗi. Cảnh báo không làm fail."
  );
}

const errors = [];
const warnings = [];
function err(msg) { errors.push(msg); }
function warn(msg) { warnings.push(msg); }

function readJson(file) {
  try {
    return { ok: true, value: JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Quét extensions/ giống build-catalog: extensions/<loại>/<tên>/ và
// extensions/<tên>/ (dạng phẳng, loại lấy từ metadata.type).
function scanExtensions(root) {
  const extRoot = path.join(root, "extensions");
  const found = [];
  if (!fs.existsSync(extRoot)) return found;
  for (const type of fs.readdirSync(extRoot).sort()) {
    const typePath = path.join(extRoot, type);
    if (!fs.statSync(typePath).isDirectory()) continue;
    if (fs.existsSync(path.join(typePath, "plugin.json"))) {
      found.push({ type: type, name: type, dir: typePath, rel: type });
      continue;
    }
    for (const name of fs.readdirSync(typePath).sort()) {
      const dir = path.join(typePath, name);
      if (!fs.statSync(dir).isDirectory()) continue;
      if (fs.existsSync(path.join(dir, "plugin.json"))) {
        found.push({ type: type, name: name, dir: dir, rel: type + "/" + name });
      }
    }
  }
  return found;
}

// Liệt kê đệ quy mọi file dưới một thư mục, trả về đường dẫn tương đối.
function walkFiles(dir, base) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = path.join(base, entry);
    if (fs.statSync(full).isDirectory()) out.push.apply(out, walkFiles(full, rel));
    else out.push(rel);
  }
  return out;
}

// Tìm mọi lệnh load('file.js') THẬT trong code (bỏ qua comment và chuỗi
// ký tự — vd. comment hướng dẫn "load('config.js');" hay thông báo lỗi
// "can load('config.js')..." không phải lệnh load thật). Dùng cho cả
// findLoads() lẫn kiểm tra load() đệ quy ở dưới.
function findLoadCalls(code) {
  const found = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code.charAt(i);
    // Chuỗi "..." / '...' / `...` (có escape \).
    if (c === '"' || c === "'" || c === "`") {
      const q = c;
      i++;
      while (i < n && code.charAt(i) !== q) {
        if (code.charAt(i) === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    // Comment // tới cuối dòng.
    if (c === "/" && code.charAt(i + 1) === "/") {
      while (i < n && code.charAt(i) !== "\n") i++;
      continue;
    }
    // Comment /* ... */ (có thể nhiều dòng).
    if (c === "/" && code.charAt(i + 1) === "*") {
      i += 2;
      while (i + 1 < n && !(code.charAt(i) === "*" && code.charAt(i + 1) === "/")) i++;
      i += 2;
      continue;
    }
    // Từ khóa load( ở code thật (không phải hậu tố của tên khác).
    if (code.slice(i, i + 4) === "load" && !/[a-zA-Z0-9_$]/.test(code.charAt(i - 1) || "")) {
      const m = /^load\s*\(\s*(['"])([^'"]+)\1/.exec(code.slice(i));
      if (m) {
        found.push(m[2]);
        i += m[0].length;
        continue;
      }
    }
    i++;
  }
  return found;
}

// Tìm mọi lệnh load('xxx.js') trong nội dung các file src/.
function findLoads(srcDir) {
  const loaded = new Set();
  if (!fs.existsSync(srcDir)) return loaded;
  for (const f of fs.readdirSync(srcDir)) {
    if (!f.endsWith(".js")) continue;
    const text = fs.readFileSync(path.join(srcDir, f), "utf8");
    findLoadCalls(text).forEach(function (name) { loaded.add(path.basename(name)); });
  }
  return loaded;
}

// ---- Đọc file .zip bằng Node stdlib (fs + zlib, không cần dependency) ----
// Trả về { ok, entries, buf } — entries là mảng
// { name, method, compSize, size, localOff }.
function readZipEntries(zipPath) {
  const buf = fs.readFileSync(zipPath);
  // Tìm End Of Central Directory trong 64KB cuối file.
  let eocd = -1;
  const min = Math.max(0, buf.length - 65557);
  for (let i = buf.length - 22; i >= min; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) return { ok: false, error: "không tìm được End Of Central Directory" };
  const total = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const entries = [];
  for (let n = 0; n < total; n++) {
    if (off + 46 > buf.length || buf.readUInt32LE(off) !== 0x02014b50) {
      return { ok: false, error: "central directory hỏng ở entry " + n };
    }
    const method = buf.readUInt16LE(off + 10);
    const compSize = buf.readUInt32LE(off + 20);
    const size = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const localOff = buf.readUInt32LE(off + 42);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    entries.push({ name: name, method: method, compSize: compSize, size: size, localOff: localOff });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return { ok: true, entries: entries, buf: buf };
}

// Giải nén 1 entry (method 0 = stored, 8 = deflate) thành Buffer; null nếu
// không đọc được hoặc method không hỗ trợ.
function inflateEntry(zip, entry) {
  try {
    const buf = zip.buf;
    const off = entry.localOff;
    if (off + 30 > buf.length || buf.readUInt32LE(off) !== 0x04034b50) return null;
    const nameLen = buf.readUInt16LE(off + 26);
    const extraLen = buf.readUInt16LE(off + 28);
    const start = off + 30 + nameLen + extraLen;
    const data = buf.slice(start, start + entry.compSize);
    if (entry.method === 0) return data;
    if (entry.method === 8) return zlib.inflateRawSync(data);
    return null;
  } catch (e) {
    return null;
  }
}

// (h) plugin.zip đã commit kèm và khớp nội dung src/ hiện tại.
// Quy tắc (quyết định 2026-11-06): app cài từ URL repo nên mỗi nguồn phải
// có plugin.zip trên GitHub; zip lệch với src/ thì người dùng sẽ cài phải
// bản cũ. Kiểm tra bằng cách đọc thẳng nội dung zip:
//   - đủ entry: plugin.json, icon.png (nếu có trên đĩa), toàn bộ file
//     trong src/, cộng file lib đã inline (tên trong load() mà có trong lib/);
//   - không có entry lạ (trừ entry thư mục như "src/");
//   - nội dung từng entry khớp byte với file tương ứng trên đĩa
//     (src/*.js so với src/, file lib so với lib/).
function validateZipContents(s, label, libNames) {
  const zipPath = path.join(s.dir, "plugin.zip");
  if (!fs.existsSync(zipPath)) {
    err(label + " thiếu plugin.zip — app cài từ URL repo sẽ lỗi 404. " +
      "Chạy \"node tools/cli/build.js extensions/" + s.rel + "\" để đóng zip rồi commit kèm.");
    return;
  }
  let zip;
  try {
    zip = readZipEntries(zipPath);
  } catch (e) {
    err(label + " không đọc được plugin.zip: " + e.message);
    return;
  }
  if (!zip.ok) {
    err(label + " plugin.zip hỏng: " + zip.error);
    return;
  }

  // Bản đồ entry trong zip -> file trên đĩa để so nội dung.
  const expected = new Map(); // tên entry -> đường dẫn đĩa
  expected.set("plugin.json", path.join(s.dir, "plugin.json"));
  if (fs.existsSync(path.join(s.dir, "icon.png"))) {
    expected.set("icon.png", path.join(s.dir, "icon.png"));
  }
  const srcDir = path.join(s.dir, "src");
  if (fs.existsSync(srcDir)) {
    fs.readdirSync(srcDir).forEach(function (f) {
      const full = path.join(srcDir, f);
      if (fs.statSync(full).isFile()) expected.set("src/" + f, full);
    });
  }
  const loaded = findLoads(srcDir);
  loaded.forEach(function (name) {
    if (libNames.has(name) && !expected.has("src/" + name)) {
      expected.set("src/" + name, path.join(repoRoot(), "lib", name));
    }
  });

  const seen = new Set();
  zip.entries.forEach(function (entry) {
    if (entry.name.endsWith("/")) return; // entry thư mục (vd. "src/")
    seen.add(entry.name);
    const diskPath = expected.get(entry.name);
    if (!diskPath) {
      err(label + " plugin.zip chứa entry lạ \"" + entry.name +
        "\" không có trên đĩa — rebuild zip từ src/ hiện tại.");
      return;
    }
    if (!fs.existsSync(diskPath)) {
      err(label + " plugin.zip chứa \"" + entry.name +
        "\" nhưng không tìm được file gốc trên đĩa.");
      return;
    }
    const content = inflateEntry(zip, entry);
    if (content === null) {
      err(label + " không giải nén được \"" + entry.name + "\" trong plugin.zip.");
      return;
    }
    if (!content.equals(fs.readFileSync(diskPath))) {
      err(label + " plugin.zip lệch với src/: \"" + entry.name +
        "\" trong zip khác file trên đĩa — rebuild zip rồi commit lại.");
    }
  });
  expected.forEach(function (diskPath, name) {
    if (!seen.has(name)) {
      err(label + " plugin.zip thiếu \"" + name + "\" — rebuild zip từ src/ hiện tại.");
    }
  });
}

function validateTestJson(source, file) {
  const parsed = readJson(file);
  if (!parsed.ok) {
    err("[" + source.rel + "] test.json không parse được: " + parsed.error);
    return;
  }
  // Chấp nhận 3 dạng: 1 case {"script","input","expect"}, mảng các case,
  // hoặc {"cases": [...]} (dạng template dùng — bọc mảng case trong key cases).
  let cases = parsed.value;
  if (cases && typeof cases === "object" && !Array.isArray(cases) && Array.isArray(cases.cases)) {
    cases = cases.cases;
  }
  if (!Array.isArray(cases)) cases = [cases];
  if (cases.length === 0) {
    err("[" + source.rel + "] test.json là mảng rỗng, cần ít nhất 1 case.");
    return;
  }
  const srcDir = path.join(source.dir, "src");
  cases.forEach(function (c, i) {
    const label = "[" + source.rel + "] test.json case " + (i + 1);
    if (!c || typeof c !== "object" || Array.isArray(c)) {
      err(label + ": mỗi case phải là object {\"script\", \"input\", \"expect\"}.");
      return;
    }
    if (typeof c.script !== "string" || !c.script) {
      err(label + ": thiếu trường \"script\" (tên file .js trong src/).");
    } else if (!fs.existsSync(path.join(srcDir, c.script))) {
      err(label + ": script \"" + c.script + "\" không tồn tại trong src/.");
    }
    if (!("input" in c)) err(label + ": thiếu trường \"input\".");
    if (!("expect" in c)) err(label + ": thiếu trường \"expect\".");
  });
}

// (i) Linter Rhino ES6: runtime vBook chỉ chạy Rhino ES6 (xem
// extension-api.md) — cấm arrow function, async/await, template literal,
// ?., ??, spread, .flat(). Trả về mảng lỗi dạng "Dòng N: ...".
// Lưu ý: strip comment // có false-negative nhỏ khi "//" nằm trong chuỗi
// (vd. "https://...") — chấp nhận được, linter là lưới an toàn, không thay
// thế việc đọc code. Chuỗi "..." / '...' được strip trước khi check các
// pattern còn lại để tránh false positive từ nội dung text trong code.
function lintRhinoES6(code) {
  const errors = [];
  const lines = code.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const num = i + 1;
    const stripped = lines[i].replace(/\/\/.*$/, "").replace(/\/\*.*?\*\//g, "");
    if (stripped.indexOf("`") !== -1) {
      errors.push("Dòng " + num + ": template literal (`...`) bị cấm trong Rhino ES6 — dùng nối chuỗi (+).");
    }
    const noStr = stripped.replace(/"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, '""');
    if (/(?:\([^\)]*\)|[a-zA-Z0-9_$]+)\s*=>/.test(noStr)) {
      errors.push("Dòng " + num + ": arrow function (=>) bị cấm trong Rhino ES6.");
    }
    if (/\basync\s+function\b|\bawait\s+/.test(noStr)) {
      errors.push("Dòng " + num + ": async/await bị cấm trong Rhino ES6.");
    }
    if (/\?\./.test(noStr)) {
      errors.push("Dòng " + num + ": optional chaining (?.) bị cấm trong Rhino ES6.");
    }
    if (/\?\?/.test(noStr)) {
      errors.push("Dòng " + num + ": nullish coalescing (??) bị cấm trong Rhino ES6 — dùng || hoặc toán tử 3 ngôi.");
    }
    if (/\.\.\.[a-zA-Z0-9_$]+/.test(noStr)) {
      errors.push("Dòng " + num + ": spread (...) bị cấm trong Rhino ES6.");
    }
    if (/\.(flat|flatMap)\s*\(/.test(noStr)) {
      errors.push("Dòng " + num + ": .flat()/.flatMap() bị cấm trong Rhino ES6.");
    }
  }
  return errors;
}

// (j) health.json đúng định dạng fixture nhẹ: mảng case hoặc
// {"cases": [...]}, mỗi case là {"name"?, "url", "pattern"?}.
function validateHealthJson(source, file) {
  const parsed = readJson(file);
  if (!parsed.ok) {
    err("[" + source.rel + "] health.json không parse được: " + parsed.error);
    return;
  }
  let cases = parsed.value;
  if (cases && typeof cases === "object" && !Array.isArray(cases) && Array.isArray(cases.cases)) {
    cases = cases.cases;
  }
  if (!Array.isArray(cases)) {
    err("[" + source.rel + "] health.json phải là mảng case hoặc {\"cases\": [...]}.");
    return;
  }
  cases.forEach(function (c, i) {
    const label = "[" + source.rel + "] health.json case " + (i + 1);
    if (!c || typeof c !== "object" || Array.isArray(c)) {
      err(label + ": mỗi case phải là object {\"url\", \"pattern\"?} (\"name\" tùy chọn).");
      return;
    }
    if (typeof c.url !== "string" || !c.url) {
      err(label + ": thiếu trường \"url\" (string).");
    }
    if (c.pattern !== undefined && c.pattern !== null && c.pattern !== "") {
      try {
        new RegExp(String(c.pattern), "i");
      } catch (e) {
        err(label + ": pattern sai regex: " + e.message);
      }
    }
  });
}

function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }
  const positional = argv.filter(function (a) { return !a.startsWith("-"); });
  if (positional.length > 1) {
    console.error("LỖI: chỉ nhận tối đa 1 đường dẫn repo. Xem --help.");
    process.exit(1);
  }
  const root = positional.length ? path.resolve(positional[0]) : repoRoot();

  // ---- (a) plugin.json root phải parse được ----
  const registryPath = path.join(root, "plugin.json");
  if (!fs.existsSync(registryPath)) {
    console.error("LỖI: không tìm thấy plugin.json ở root repo (" + root + ").");
    console.error("Chạy \"node tools/cli/build-catalog.js\" để sinh registry.");
    process.exit(1);
  }
  const regParsed = readJson(registryPath);
  if (!regParsed.ok) {
    console.error("LỖI: plugin.json ở root không parse được: " + regParsed.error);
    process.exit(1);
  }
  const registry = regParsed.value;
  if (!registry || !Array.isArray(registry.data)) {
    console.error("LỖI: plugin.json ở root sai định dạng: thiếu mảng \"data\".");
    process.exit(1);
  }
  if (!registry.metadata || registry.metadata.author !== "Qsang") {
    warn("plugin.json root: metadata.author không phải \"Qsang\" (đúng ra registry do build-catalog sinh phải có author Qsang).");
  }

  // Tên các file lib dùng chung ở root (được chấp nhận làm helper trong src/).
  const libNames = new Set();
  const libDir = path.join(root, "lib");
  if (fs.existsSync(libDir)) {
    fs.readdirSync(libDir).forEach(function (f) {
      if (f.endsWith(".js")) libNames.add(f);
    });
  }

  const sources = scanExtensions(root);

  // ---- (b) catalog ≡ đĩa ----
  const diskPaths = new Set(
    sources.map(function (s) { return RAW_BASE + "/extensions/" + s.rel + "/plugin.zip"; })
  );
  const regPaths = new Map(); // path -> entry
  registry.data.forEach(function (e) {
    if (e && typeof e.path === "string") regPaths.set(e.path, e);
  });
  diskPaths.forEach(function (p) {
    if (!regPaths.has(p)) {
      err("catalog thiếu nguồn trên đĩa: " + p.replace(RAW_BASE + "/extensions/", "extensions/") +
        " — chạy \"node tools/cli/build-catalog.js\" để sinh lại registry.");
    }
  });
  regPaths.forEach(function (entry, p) {
    if (!diskPaths.has(p)) {
      err("catalog thừa mục không có trên đĩa: " + (entry.name || "?") + " (" + p + ").");
    }
    if (typeof p === "string" && p.indexOf("/" + BRANCH + "/") === -1) {
      err("URL registry của \"" + (entry.name || p) + "\" không dùng branch \"main\": " + p);
    }
  });

  // ---- Kiểm tra từng nguồn ----
  sources.forEach(function (s) {
    const label = "[" + s.rel + "]";
    const manifestPath = path.join(s.dir, "plugin.json");
    const parsed = readJson(manifestPath);
    if (!parsed.ok) {
      err(label + " plugin.json không parse được: " + parsed.error);
      return;
    }
    const manifest = parsed.value;
    const meta = (manifest && manifest.metadata) || {};
    const scriptMap = (manifest && manifest.script) || {};

    // (f) trường bắt buộc + locale/type chuẩn.
    if (!meta.name) err(label + " thiếu metadata.name.");
    if (meta.version === undefined || meta.version === null || meta.version === "") {
      err(label + " thiếu metadata.version.");
    }
    if (!meta.source) err(label + " thiếu metadata.source.");
    if (!meta.type) err(label + " thiếu metadata.type.");
    else if (TYPES.indexOf(meta.type) === -1) {
      err(label + " type \"" + meta.type + "\" không thuộc tập chuẩn {" + TYPES.join(", ") + "}.");
    }
    if (!meta.locale) err(label + " thiếu metadata.locale.");
    else if (LOCALES.indexOf(meta.locale) === -1) {
      err(label + " locale \"" + meta.locale + "\" không thuộc tập chuẩn {" + LOCALES.join(", ") + "}.");
    }
    // Loại thư mục phải khớp type trong manifest (layout extensions/<loại>/<tên>/).
    if (meta.type && s.rel.indexOf("/") !== -1 && meta.type !== s.type) {
      warn(label + " nằm trong thư mục loại \"" + s.type + "\" nhưng metadata.type là \"" + meta.type + "\".");
    }

    // (c) version trong manifest khớp version trong registry.
    const expectedPath = RAW_BASE + "/extensions/" + s.rel + "/plugin.zip";
    const regEntry = regPaths.get(expectedPath);
    if (regEntry && String(regEntry.version) !== String(meta.version)) {
      err(label + " version lệch: manifest v" + meta.version +
        " nhưng registry v" + regEntry.version + " — chạy build-catalog để sinh lại.");
    }

    // (d) mọi script trong script map phải tồn tại trong src/.
    const srcDir = path.join(s.dir, "src");
    if (!fs.existsSync(srcDir)) {
      err(label + " thiếu thư mục src/.");
      return;
    }
    const declared = new Set();
    Object.keys(scriptMap).forEach(function (key) {
      const file = scriptMap[key];
      if (typeof file !== "string" || !file) {
        err(label + " script map: khóa \"" + key + "\" trống hoặc không phải tên file.");
        return;
      }
      declared.add(path.basename(file));
      if (!fs.existsSync(path.join(srcDir, path.basename(file)))) {
        err(label + " script \"" + key + "\" trỏ tới file \"" + file +
          "\" nhưng không có file đó trong src/.");
      }
    });

    // (e) file .js mồ côi trong src/.
    const loaded = findLoads(srcDir);
    fs.readdirSync(srcDir).forEach(function (f) {
      if (!f.endsWith(".js")) return;
      if (declared.has(f)) return;
      if (HELPER_NAMES.indexOf(f) !== -1) return;
      if (libNames.has(f)) return;
      if (loaded.has(f)) return;
      err(label + " file mồ côi trong src/: \"" + f + "\" không có trong script map, " +
        "không phải helper (config.js/helper.js/file trong lib/) và không được load() " +
        "từ script nào — xóa file hoặc khai báo vào script map.");
    });

    // (g) test.json đúng định dạng golden fixture.
    const testPath = path.join(s.dir, "test.json");
    if (fs.existsSync(testPath)) validateTestJson(s, testPath);

    // (j) health.json (nếu có) đúng định dạng fixture nhẹ.
    const healthPath = path.join(s.dir, "health.json");
    if (fs.existsSync(healthPath)) validateHealthJson(s, healthPath);

    // (i) linter Rhino ES6 + execute() + load() cho từng file trong src/.
    fs.readdirSync(srcDir).forEach(function (f) {
      if (!f.endsWith(".js")) return;
      const code = fs.readFileSync(path.join(srcDir, f), "utf8");
      lintRhinoES6(code).forEach(function (e) {
        err(label + " src/" + f + ": " + e);
      });
      // Script chạy được phải có function execute(...); bỏ qua helper
      // (config.js/helper.js) và file lib đã inline vào src/.
      if (HELPER_NAMES.indexOf(f) === -1 && !libNames.has(f)) {
        if (!/\bfunction\s+execute\s*\(/.test(code)) {
          err(label + " src/" + f + ": thiếu function execute(...) bắt buộc.");
        }
      }
      // load() chỉ nhận tên file ở top level của src/, không chứa đường dẫn.
      findLoadCalls(code).forEach(function (target) {
        if (target.indexOf("/") !== -1 || target.indexOf("\\") !== -1) {
          err(label + " src/" + f + ": load('" + target + "') chứa đường dẫn — " +
            "load() của runtime vBook chỉ load file ở top level của src/.");
        }
      });
    });
    // File được load() không được load() tiếp (runtime không đệ quy).
    loaded.forEach(function (name) {
      const libPath = path.join(srcDir, name);
      if (!fs.existsSync(libPath)) return; // thiếu file đã báo ở (e) qua validateZipContents/load check
      const libCode = fs.readFileSync(libPath, "utf8");
      const subs = findLoadCalls(libCode);
      if (subs.length > 0) {
        err(label + " file được load() \"" + name + "\" lại gọi load('" + subs.join("', '") +
          "') — runtime vBook không cho file được load load thêm file khác.");
      }
    });

    // (h) plugin.zip đã commit kèm và khớp nội dung src/ hiện tại.
    validateZipContents(s, label, libNames);
  });

  // (i) linter Rhino ES6 cho file lib dùng chung ở root (đây là file mẫu
  // sẽ được inline vào src/ rồi load() lúc chạy, nên cũng không được chứa
  // cú pháp vượt Rhino ES6 hay gọi load()).
  if (fs.existsSync(libDir)) {
    fs.readdirSync(libDir).forEach(function (f) {
      if (!f.endsWith(".js")) return;
      const code = fs.readFileSync(path.join(libDir, f), "utf8");
      lintRhinoES6(code).forEach(function (e) {
        err("[lib] " + f + ": " + e);
      });
      if (findLoadCalls(code).length > 0) {
        err("[lib] " + f + ": chứa lệnh load() — file lib được load lúc chạy " +
          "nên không được load thêm file khác.");
      }
    });
  }

  // (h) quét toàn bộ extensions/ xem còn file .zip nào khác không
  // (plugin.zip trong từng nguồn đã kiểm tra ở trên nên bỏ qua ở đây để
  // không báo trùng cùng một file hai lần).
  walkFiles(path.join(root, "extensions"), "extensions").forEach(function (rel) {
    if (rel.toLowerCase().endsWith(".zip") && path.basename(rel).toLowerCase() !== "plugin.zip") {
      err("có file zip lạ trong extensions/: " + rel + " — chỉ plugin.zip của nguồn mới được commit, xóa file này đi.");
    }
  });

  // ---- In kết quả ----
  errors.forEach(function (e) { console.error("LỖI: " + e); });
  warnings.forEach(function (w) { console.error("Cảnh báo: " + w); });
  console.log(
    "Đã kiểm tra " + sources.length + " nguồn, " + registry.data.length + " mục trong registry: " +
    (errors.length === 0
      ? "PASS (" + warnings.length + " cảnh báo)."
      : "FAIL — " + errors.length + " lỗi, " + warnings.length + " cảnh báo.")
  );
  process.exit(errors.length === 0 ? 0 : 1);
}

main();
