#!/usr/bin/env node
// health-check.js — Probe sức khỏe các nguồn vBook (HTTP + latency + fixture nhẹ).
//
//   node scripts/health-check.js [đường-dẫn-repo]
//   node scripts/health-check.js --help
//
// Probe từng nguồn (không cần điện thoại, không cần developer server):
//   - HTTP GET tới metadata.source trong plugin.json, đo latency;
//   - theo redirect (tối đa 5); redirect sang origin khác (đổi domain) hoặc
//     kẹt ở 3xx thì phân loại MOVED, không tính là HEALTHY;
//   - kiểm tra các case trong health.json của nguồn (nếu có): mỗi case là
//     {name, url, pattern} — GET url rồi tìm pattern (regex, không phân biệt
//     hoa/thường) trong body. Case lỗi -> DEGRADED.
//
// Trạng thái: HEALTHY / MOVED / DEGRADED / BROKEN / NO_SOURCE / UNKNOWN.
// Ghi health-check-failures.json (để workflow CI mở issue khi có nguồn gãy).
// Exit 0 khi mọi nguồn HEALTHY, exit 1 khi có bất kỳ nguồn nào không HEALTHY.
// Không ghi STATUS.md — file đó do job `status` trong workflow sinh.
//
// Định dạng health.json (fixture nhẹ cho CI — khác test.json: test.json là
// fixture sâu theo từng script, chỉ chạy được trên máy thật qua developer
// server; health.json chỉ cần URL + pattern, chạy được ở CI):
//   { "cases": [
//       { "name": "Danh sách truyện", "url": "https://site/truyen",
//         "pattern": "Tên site" },
//       { "name": "Trang chi tiết mẫu", "url": "https://site/truyen/abc",
//         "pattern": "Tên tác giả" }
//   ] }
// "name" tùy chọn; "pattern" tùy chọn (không có pattern thì chỉ kiểm tra
// HTTP 200). Chấp nhận cả dạng mảng trần [ {...}, {...} ] thay cho {"cases": [...]}.

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const TIMEOUT_MS = 10000;
const MAX_REDIRECTS = 5;
// Mẫu body tối đa 512KB (bản pro chỉ lấy 50KB — trang chi tiết hhkungfu
// đã ~330KB nên 50KB có thể cắt mất pattern nằm cuối trang).
const BODY_SAMPLE_MAX = 512 * 1024;
const RETRY_DELAY_MS = 2000;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function repoRoot() {
  return path.resolve(__dirname, "..");
}

function printHelp() {
  console.log(
    "Cách dùng:\n" +
      "  node scripts/health-check.js [đường-dẫn-repo]\n" +
      "\n" +
      "Probe từng nguồn trong extensions/: HTTP GET tới metadata.source,\n" +
      "đo latency, theo redirect, kiểm tra các case trong health.json\n" +
      "(nếu có). Ghi health-check-failures.json. Exit 0 khi mọi nguồn\n" +
      "HEALTHY, 1 khi có nguồn MOVED / DEGRADED / BROKEN / NO_SOURCE /\n" +
      "UNKNOWN."
  );
}

// Quét extensions/ giống tools/cli/validate.js: extensions/<loại>/<tên>/
// và extensions/<tên>/ (dạng phẳng, loại lấy từ metadata.type).
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

function sameOrigin(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.protocol === ub.protocol && ua.host === ub.host;
  } catch (e) {
    return false;
  }
}

// GET 1 URL, theo redirect tối đa MAX_REDIRECTS lần.
// Trả về { ok, status, finalUrl, movedOrigin, bodySample, error }.
// ok = true chỉ khi status cuối là 2xx.
// Có hard timeout theo deadline (mốc tuyệt đối) bao toàn bộ lần thử —
// kể cả kẹt ở DNS/connect/TLS/body mà timeout của socket không bắt được
// (đã gặp 1 lần hhkungfu.ee kẹt ~446s dù đã đặt timeout 10s).
function fetchOnce(targetUrl, redirectsLeft, deadlineMs) {
  return new Promise(function (resolve) {
    const startTime = Date.now();
    const deadline = deadlineMs || (startTime + TIMEOUT_MS);
    let settled = false;
    let req = null;
    function done(result) {
      if (settled) return;
      settled = true;
      clearTimeout(hardTimer);
      result.latency = Date.now() - startTime;
      resolve(result);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      done({ ok: false, status: 504, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: "Timeout sau " + TIMEOUT_MS + "ms" });
      return;
    }
    const hardTimer = setTimeout(function () {
      if (req) req.destroy();
      done({ ok: false, status: 504, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: "Timeout sau " + TIMEOUT_MS + "ms" });
    }, remaining);
    let u;
    try {
      u = new URL(targetUrl);
    } catch (e) {
      done({ ok: false, status: 0, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: "URL sai: " + e.message });
      return;
    }
    const lib = u.protocol === "https:" ? https : http;
    req = lib.get(u, {
      headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
      timeout: TIMEOUT_MS
    }, function (res) {
      const status = res.statusCode || 0;
      if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
        // Theo redirect; ghi nhận nếu sang origin khác (đổi domain).
        let next;
        try {
          next = new URL(res.headers.location, targetUrl).toString();
        } catch (e) {
          done({ ok: false, status: status, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: "Location redirect sai: " + e.message });
          return;
        }
        res.resume(); // bỏ body của response redirect
        clearTimeout(hardTimer);
        settled = true; // để done() của lần đệ quy quyết định (tránh timer ngoài bắn)
        fetchOnce(next, redirectsLeft - 1, deadline).then(function (r) {
          if (!sameOrigin(targetUrl, next)) r.movedOrigin = true;
          r.latency = Date.now() - startTime;
          resolve(r);
        });
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", function (chunk) {
        if (body.length < BODY_SAMPLE_MAX) body += chunk;
      });
      res.on("end", function () {
        done({
          ok: status >= 200 && status < 300,
          status: status,
          finalUrl: targetUrl,
          movedOrigin: false,
          bodySample: body,
          error: null
        });
      });
    });
    req.on("error", function (err) {
      done({ ok: false, status: 0, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: err.message });
    });
    req.on("timeout", function () {
      req.destroy();
      done({ ok: false, status: 504, finalUrl: targetUrl, movedOrigin: false, bodySample: "", error: "Timeout sau " + TIMEOUT_MS + "ms" });
    });
  });
}

// Probe 1 URL; lỗi mạng hoặc 5xx thì thử lại 1 lần (site thỉnh thoảng trả
// 502 nhất thời — đã gặp ở apptruyenchu.pro ngày 2026-11-06).
async function probeUrl(targetUrl) {
  const first = await fetchOnce(targetUrl, MAX_REDIRECTS);
  if (!first.ok && (first.status === 0 || first.status >= 500)) {
    await new Promise(function (r) { setTimeout(r, RETRY_DELAY_MS); });
    const second = await fetchOnce(targetUrl, MAX_REDIRECTS);
    if (second.ok || second.status !== first.status) return second;
    return first;
  }
  return first;
}

// Đọc health.json của nguồn; trả về { ok, cases, error }.
function readHealthJson(extDir) {
  const file = path.join(extDir, "health.json");
  if (!fs.existsSync(file)) return { ok: true, cases: null, error: null };
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    return { ok: false, cases: null, error: "health.json không parse được: " + e.message };
  }
  let cases = parsed;
  if (cases && typeof cases === "object" && !Array.isArray(cases) && Array.isArray(cases.cases)) {
    cases = cases.cases;
  }
  if (!Array.isArray(cases)) {
    return { ok: false, cases: null, error: "health.json phải là mảng case hoặc {\"cases\": [...]}." };
  }
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    if (!c || typeof c !== "object" || Array.isArray(c) || typeof c.url !== "string" || !c.url) {
      return { ok: false, cases: null, error: "health.json case " + (i + 1) + " thiếu trường \"url\"." };
    }
    if (c.pattern !== undefined && c.pattern !== null) {
      try {
        new RegExp(String(c.pattern), "i");
      } catch (e) {
        return { ok: false, cases: null, error: "health.json case " + (i + 1) + " pattern sai regex: " + e.message };
      }
    }
  }
  return { ok: true, cases: cases, error: null };
}

async function checkOne(source, root) {
  const relDir = source.rel;
  const manifestPath = path.join(source.dir, "plugin.json");
  let manifest = {};
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch (e) {
    return {
      name: source.name, type: source.type, dir: relDir,
      source: "", status: "UNKNOWN", latency: "0ms",
      detail: "Không đọc được plugin.json: " + e.message,
      lastChecked: new Date().toISOString()
    };
  }
  const meta = manifest.metadata || {};
  const sourceUrl = meta.source || "";
  const base = {
    name: meta.name || source.name,
    type: meta.type || source.type,
    dir: relDir,
    source: sourceUrl,
    status: "UNKNOWN",
    latency: "0ms",
    detail: "",
    lastChecked: new Date().toISOString()
  };

  if (!sourceUrl) {
    base.status = "NO_SOURCE";
    base.detail = "Manifest không có metadata.source.";
    return base;
  }

  const probe = await probeUrl(sourceUrl);
  base.latency = probe.latency + "ms";

  if (!probe.ok) {
    if (probe.status >= 300 && probe.status < 400) {
      base.status = "MOVED";
      base.detail = "Kẹt ở redirect HTTP " + probe.status + " (tới " + probe.finalUrl + ").";
    } else {
      base.status = "BROKEN";
      base.detail = probe.error || ("HTTP " + probe.status);
    }
    return base;
  }
  if (probe.movedOrigin) {
    base.status = "MOVED";
    base.detail = "Site đã chuyển domain: " + sourceUrl + " -> " + probe.finalUrl + ".";
    return base;
  }

  base.status = "HEALTHY";
  base.detail = "HTTP " + probe.status + " (" + probe.latency + "ms)" +
    (probe.finalUrl !== sourceUrl ? ", redirect nội bộ tới " + probe.finalUrl : "");

  // Kiểm tra fixture nhẹ trong health.json (nếu có).
  const hf = readHealthJson(source.dir);
  if (!hf.ok) {
    base.status = "DEGRADED";
    base.detail += " | " + hf.error;
    return base;
  }
  if (hf.cases) {
    for (let i = 0; i < hf.cases.length; i++) {
      const c = hf.cases[i];
      const label = c.name || ("case " + (i + 1));
      const cp = await probeUrl(c.url);
      if (!cp.ok) {
        base.status = "DEGRADED";
        base.detail += " | Fixture \"" + label + "\" lỗi: " + (cp.error || ("HTTP " + cp.status)) + " (" + c.url + ").";
        return base;
      }
      if (c.pattern !== undefined && c.pattern !== null && c.pattern !== "") {
        let re;
        try {
          re = new RegExp(String(c.pattern), "i");
        } catch (e) {
          base.status = "DEGRADED";
          base.detail += " | Fixture \"" + label + "\": pattern sai regex.";
          return base;
        }
        if (!re.test(cp.bodySample)) {
          base.status = "DEGRADED";
          base.detail += " | Fixture \"" + label + "\": không thấy pattern '" + c.pattern + "' (" + c.url + ") — site có thể đã đổi giao diện.";
          return base;
        }
      }
    }
  }
  return base;
}

async function runHealthCheck(root) {
  const extDirs = scanExtensions(root);
  const results = [];
  const failures = [];

  console.log("Probe " + extDirs.length + " nguồn...");
  for (const extDir of extDirs) {
    const r = await checkOne(extDir, root);
    results.push(r);
    if (r.status !== "HEALTHY") failures.push(r);
    console.log("[" + r.status + "] " + r.name + " -> " + r.detail);
  }

  const counts = { HEALTHY: 0, MOVED: 0, DEGRADED: 0, BROKEN: 0, NO_SOURCE: 0, UNKNOWN: 0 };
  results.forEach(function (r) {
    if (counts[r.status] === undefined) counts[r.status] = 0;
    counts[r.status]++;
  });

  const summaryPath = path.join(root, "health-check-failures.json");
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total: results.length,
    failedCount: failures.length,
    counts: counts,
    failures: failures
  }, null, 2), "utf8");

  console.log(
    "\nKết quả: " + counts.HEALTHY + "/" + results.length + " HEALTHY" +
    " (MOVED " + counts.MOVED + ", DEGRADED " + counts.DEGRADED +
    ", BROKEN " + counts.BROKEN + ", NO_SOURCE " + counts.NO_SOURCE +
    ", UNKNOWN " + counts.UNKNOWN + ")."
  );
  return { results: results, failures: failures, counts: counts };
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return 0;
  }
  const positional = argv.filter(function (a) { return a.charAt(0) !== "-"; });
  if (positional.length > 1) {
    console.error("LỖI: chỉ nhận tối đa 1 đường dẫn repo. Xem --help.");
    return 1;
  }
  const root = positional.length ? path.resolve(positional[0]) : repoRoot();
  const out = await runHealthCheck(root);
  return out.failures.length === 0 ? 0 : 1;
}

if (require.main === module) {
  main().then(function (code) { process.exit(code); });
}

module.exports = { runHealthCheck: runHealthCheck, probeUrl: probeUrl };
