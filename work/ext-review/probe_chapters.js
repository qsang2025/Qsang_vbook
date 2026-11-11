const https = require("https");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function fetchPage(url) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        "User-Agent": UA,
        "Referer": "https://fanqienovel.com/",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
      }
    }, res => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        resolve({ status: res.statusCode, headers: res.headers, data });
      });
    }).on("error", e => resolve({ error: e.message }));
  });
}

function analyzeReaderHtml(html) {
  const startMarker = "window.__INITIAL_STATE__=";
  const endMarker = ";\n            }\n        )(";
  const idx1 = html.indexOf(startMarker);
  let state = null;
  if (idx1 !== -1) {
    const idx2 = html.indexOf(endMarker, idx1);
    if (idx2 !== -1) {
      const jsonStr = html.substring(idx1 + startMarker.length, idx2);
      try {
        state = JSON.parse(jsonStr);
      } catch (e) {
        console.error("JSON parse error", e.message);
      }
    }
  }

  // Regex for woff2
  const fontMatches = html.match(/https:\/\/[^"'\s\)]+\.woff2/g) || [];
  
  let chapterData = null;
  if (state && state.reader && state.reader.chapterData) {
    chapterData = state.reader.chapterData;
  }

  let content = chapterData ? chapterData.content : "";
  let puaCount = 0;
  let cjkCount = 0;
  for (let i = 0; i < content.length; i++) {
    const cp = content.codePointAt(i);
    if (cp >= 0xE000 && cp <= 0xF8FF) {
      puaCount++;
    } else if (cp >= 0x4E00 && cp <= 0x9FFF) {
      cjkCount++;
    }
  }

  return {
    hasState: !!state,
    title: chapterData ? chapterData.title : null,
    needPay: chapterData ? chapterData.needPay : null,
    contentLen: content.length,
    puaCount,
    cjkCount,
    puaPercentage: content.length ? ((puaCount / content.length) * 100).toFixed(1) + "%" : "0%",
    puaOverCjk: (cjkCount + puaCount) ? ((puaCount / (cjkCount + puaCount)) * 100).toFixed(1) + "%" : "0%",
    fontUrls: Array.from(new Set(fontMatches)),
    sampleContent: content.substring(0, 150)
  };
}

async function run() {
  const chaptersToTest = [
    { name: "Chap 1 (isChapterLock: false)", itemId: "7069952706521236001" },
    { name: "Chap 11 (isChapterLock: true)", itemId: "7070467423643632159" },
    { name: "Chap 176 (isChapterLock: true)", itemId: "7145491757675840035" },
    { name: "Chap 1 (Run 2 - compare font hash)", itemId: "7069952706521236001" }
  ];

  for (let i = 0; i < chaptersToTest.length; i++) {
    const ch = chaptersToTest[i];
    console.log(`\n=== Testing [${i+1}/${chaptersToTest.length}] ${ch.name}: /reader/${ch.itemId} ===`);
    const res = await fetchPage(`https://fanqienovel.com/reader/${ch.itemId}`);
    console.log("HTTP status:", res.status, "HTML length:", res.data ? res.data.length : 0);
    const analysis = analyzeReaderHtml(res.data || "");
    console.log(JSON.stringify(analysis, null, 2));
    await sleep(3500);
  }
}

run();
