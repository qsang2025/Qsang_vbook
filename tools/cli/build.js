#!/usr/bin/env node
// build.js — Build 1 extension thành plugin.zip (cơ chế lib-inline, zip pure-Node).
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
//      thiết vào src/ tạm. File lib được inline vào thư mục TẠM khi build,
//      KHÔNG copy vĩnh viễn vào src/ trên đĩa (tránh lib cũ lệch với lib/
//      ở root repo — xem AGENTS.md mục 9).
//   4. Đóng plugin.zip bằng code Node thuần (fs + zlib, không cần lệnh
//      `zip` của hệ thống, không cần dependency ngoài). Zip chứa
//      plugin.json + icon.png + src/ + src/*.js ở đúng cấu trúc
//      (không kèm thư mục cha thừa).
//
// Quy tắc nhà giữ nguyên khi đóng zip:
//   - Thiếu file load() thì LỖI CỨNG (die ngay, không warn-rồi-build-tiếp).
//   - Timestamp DOS trong zip phải là ngày HỢP LỆ: lấy từ mtime của file
//     gốc (đã kẹp về 1980-01-01..2107-12-31). Không ghi 0/0 (1980-00-00)
//     như bản tham khảo — ngày 00 tháng 00 không hợp lệ theo spec ZIP.
//   - Build lại nguồn không đổi thì zip không đổi (mtime được khôi phục
//     từ file gốc trước khi đóng, nên zip không sinh diff giả trên git).
//
// Chỉ dùng Node stdlib (fs, path, os, zlib).

const fs = require("fs");
const path = require("path");
const os = require("os");
const zlib = require("zlib");

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
      "Zip được đóng bằng code Node thuần (không cần lệnh `zip` hệ thống).\n" +
      "Thiếu file load() thì lỗi cứng, không build tiếp.\n" +
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

// ---- ZIP pure-Node (định dạng PKZIP, DEFLATE) ----
// Port từ bản tham khảo, đã sửa: timestamp DOS hợp lệ (xem dosDateTime).

// CRC32 (bảng tra cứu, chuẩn ZIP).
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ -1) >>> 0;
}

// Chuyển Date thành cặp (dosTime, dosDate) hợp lệ theo spec ZIP:
//   date = ((năm - 1980) << 9) | (tháng << 5) | ngày   (tháng 1-12, ngày 1-31)
//   time = (giờ << 11) | (phút << 5) | (giây / 2)     (giây lưu theo đơn vị 2s)
// Ngày ngoài khoảng 1980-01-01..2107-12-31 được kẹp về biên gần nhất.
// KHÔNG trả về 0/0: ngày 00 tháng 00 không tồn tại (một số tool unzip báo lỗi).
function dosDateTime(d) {
  let year = d.getFullYear();
  let month = d.getMonth() + 1;
  let day = d.getDate();
  let hour = d.getHours();
  let minute = d.getMinutes();
  let second = d.getSeconds();
  if (year < 1980) { year = 1980; month = 1; day = 1; hour = 0; minute = 0; second = 0; }
  if (year > 2107) { year = 2107; month = 12; day = 31; hour = 23; minute = 59; second = 58; }
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  const dosTime = (hour << 11) | (minute << 5) | (second >> 1);
  return { time: dosTime, date: dosDate };
}

// Ghi zip từ danh sách file { name, data, mtime } (name dùng "/" làm
// phân cách; tên kết thúc bằng "/" là entry thư mục, data rỗng).
// Thứ tự entry trong zip giữ nguyên thứ tự mảng truyền vào.
function createZipArchive(files, outputPath) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const file of files) {
    const isDir = file.name.endsWith("/");
    const filenameBuf = Buffer.from(file.name.replace(/\\/g, "/"), "utf8");
    const data = isDir ? Buffer.alloc(0) : file.data;
    const isDeflated = data.length > 0;
    const compressed = isDeflated ? zlib.deflateRawSync(data) : Buffer.alloc(0);
    const crc = crc32(data);
    const stamp = dosDateTime(file.mtime || new Date());

    // Local file header (30 bytes + tên).
    const local = Buffer.alloc(30 + filenameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // signature
    local.writeUInt16LE(20, 4);         // version needed (2.0)
    local.writeUInt16LE(0, 6);          // flags
    local.writeUInt16LE(isDeflated ? 8 : 0, 8); // compression: 8=deflate, 0=store
    local.writeUInt16LE(stamp.time, 10); // mod time (DOS, hợp lệ)
    local.writeUInt16LE(stamp.date, 12); // mod date (DOS, hợp lệ)
    local.writeUInt32LE(crc, 14);       // crc-32
    local.writeUInt32LE(compressed.length, 18); // compressed size
    local.writeUInt32LE(data.length, 22);   // uncompressed size
    local.writeUInt16LE(filenameBuf.length, 26); // file name length
    local.writeUInt16LE(0, 28);                  // extra field length
    filenameBuf.copy(local, 30);

    localParts.push(local, compressed);

    // Central directory header (46 bytes + tên).
    const central = Buffer.alloc(46 + filenameBuf.length);
    central.writeUInt32LE(0x02014b50, 0); // signature
    central.writeUInt16LE(20, 4);         // version made by
    central.writeUInt16LE(20, 6);         // version needed
    central.writeUInt16LE(0, 8);          // flags
    central.writeUInt16LE(isDeflated ? 8 : 0, 10);
    central.writeUInt16LE(stamp.time, 12);
    central.writeUInt16LE(stamp.date, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(data.length, 24);
    central.writeUInt16LE(filenameBuf.length, 28);
    central.writeUInt16LE(0, 30);         // extra length
    central.writeUInt16LE(0, 32);         // comment length
    central.writeUInt16LE(0, 34);         // disk number start
    central.writeUInt16LE(0, 36);         // internal file attributes
    central.writeUInt32LE(isDir ? 0x10 : 0, 38); // external attrs (bit thư mục)
    central.writeUInt32LE(offset, 42);    // relative offset of local header
    filenameBuf.copy(central, 46);

    centralParts.push(central);
    offset += local.length + compressed.length;
  }

  const centralDirOffset = offset;
  let centralDirSize = 0;
  for (const c of centralParts) centralDirSize += c.length;

  // End of central directory record (22 bytes).
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // signature
  eocd.writeUInt16LE(0, 4);          // disk number
  eocd.writeUInt16LE(0, 6);          // disk with central dir
  eocd.writeUInt16LE(files.length, 8); // entries on disk
  eocd.writeUInt16LE(files.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12);
  eocd.writeUInt32LE(centralDirOffset, 16);
  eocd.writeUInt16LE(0, 20); // comment length

  fs.writeFileSync(outputPath, Buffer.concat(localParts.concat(centralParts, [eocd])));
}

// Khôi phục mtime cho file trong thư mục tạm từ file gốc tương ứng, để
// zip build lại từ nguồn không đổi thì không đổi byte (không sinh diff giả).
//   tmpExt: thư mục tạm đã copy xong (gồm src/ đã inline lib).
//   srcDirArg: thư mục nguồn gốc; flatLayout: template để .js phẳng ở top;
//   neededLib: file lib đã inline (mtime lấy từ lib/ ở root repo).
function restoreMtimes(tmpExt, srcDirArg, flatLayout, neededLib, libDir) {
  const libSet = new Set(neededLib);
  function restoreOne(tmpPath, origPath) {
    if (!fs.existsSync(origPath)) return;
    const m = fs.statSync(origPath).mtime;
    fs.utimesSync(tmpPath, m, m);
  }
  fs.readdirSync(tmpExt).forEach(function (f) {
    const tmpPath = path.join(tmpExt, f);
    if (!fs.statSync(tmpPath).isFile()) return;
    restoreOne(tmpPath, path.join(srcDirArg, f));
  });
  const tmpSrc = path.join(tmpExt, "src");
  if (fs.existsSync(tmpSrc)) {
    fs.readdirSync(tmpSrc).forEach(function (f) {
      const tmpPath = path.join(tmpSrc, f);
      if (!fs.statSync(tmpPath).isFile()) return;
      if (libSet.has(f)) {
        restoreOne(tmpPath, path.join(libDir, f));
      } else if (flatLayout) {
        restoreOne(tmpPath, path.join(srcDirArg, f));
      } else {
        restoreOne(tmpPath, path.join(srcDirArg, "src", f));
      }
    });
  }
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
  // LỖI CỨNG khi thiếu: load() trỏ tới file không có trong src/ lẫn lib/
  // thì dừng build ngay, không warn-rồi-build-tiếp.
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
    // Khôi phục mtime từ file gốc để zip ổn định theo nội dung.
    restoreMtimes(tmpExt, srcDirArg, flatLayout, neededLib, libDir);

    // ---- Thu thập file đưa vào zip (thứ tự cố định, xác định) ----
    const files = [];
    if (fs.existsSync(path.join(tmpExt, "plugin.json"))) {
      files.push({
        name: "plugin.json",
        data: fs.readFileSync(path.join(tmpExt, "plugin.json")),
        mtime: fs.statSync(path.join(tmpExt, "plugin.json")).mtime,
      });
    }
    if (fs.existsSync(path.join(tmpExt, "icon.png"))) {
      files.push({
        name: "icon.png",
        data: fs.readFileSync(path.join(tmpExt, "icon.png")),
        mtime: fs.statSync(path.join(tmpExt, "icon.png")).mtime,
      });
    }
    const tmpSrc = path.join(tmpExt, "src");
    if (fs.existsSync(tmpSrc)) {
      // Mtime của entry thư mục "src/" lấy từ thư mục script gốc (xác định
      // theo nội dung, không lấy giờ build — nếu không 2 lần build liên
      // tiếp sẽ khác byte chỉ vì timestamp của entry này).
      files.push({ name: "src/", data: Buffer.alloc(0), mtime: fs.statSync(scriptDir).mtime });
      fs.readdirSync(tmpSrc).sort().forEach(function (f) {
        const full = path.join(tmpSrc, f);
        if (!fs.statSync(full).isFile()) return;
        files.push({ name: "src/" + f, data: fs.readFileSync(full), mtime: fs.statSync(full).mtime });
      });
    }
    if (files.length === 0) die("không có file nào để đóng zip: " + srcDirArg);

    // Ghi đè zip cũ nếu có.
    if (fs.existsSync(outZip)) fs.unlinkSync(outZip);
    createZipArchive(files, outZip);
    if (!fs.existsSync(outZip) || fs.statSync(outZip).size === 0) {
      die("zip không được tạo ra hoặc rỗng: " + outZip);
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  console.log("Đã build \"" + extName + "\" -> " + outZip +
    " (" + fs.statSync(outZip).size + " bytes, zip pure-Node).");
  if (neededLib.length > 0) {
    console.log("File lib đã inline vào src/: " + neededLib.join(", "));
  } else {
    console.log("Không có file lib nào cần inline (src/ không load file nào từ lib/).");
  }
}

main();
