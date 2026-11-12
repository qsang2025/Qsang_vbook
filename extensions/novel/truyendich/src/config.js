// TruyenDich.AI — config dung chung cho moi script.
// Domain mac dinh: truyendich.space (2026-11-12: .store redirect sang .space,
// .ai redirect sang .fit — ca 3 deu cung mot backend). Nguoi dung doi domain
// trong cai dat nguon; cac mirror duoc liet ke trong plugin.json.
let BASE_URL = "https://truyendich.space";
try {
  if (DOMAIN) BASE_URL = DOMAIN;
} catch (error) {
}

// Fetch HTML co pacing: nghi jitter truoc moi request (ham rateLimitDelay o
// file rate-limit.js — script nao goi fetchPage phai tai ca 2 file). Khong
// xoay User-Agent de cookie cf_clearance (neu co) con hieu luc.
function fetchPage(url, options) {
  if (!options) options = {};
  try {
    if (typeof rateLimitDelay === "function") {
      rateLimitDelay(BASE_URL, 500, 1500);
    }
  } catch (e) {
  }
  var headers = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8",
    "Referer": BASE_URL + "/"
  };
  if (options.headers) {
    for (var key in options.headers) {
      headers[key] = options.headers[key];
    }
  }
  options.headers = headers;
  return fetch(url, options);
}

function safeString(value) {
  return value == null ? "" : String(value).trim();
}

function cleanText(value) {
  return safeString(value).replace(/\s+/g, " ");
}

function trimSlashes(value) {
  return safeString(value).replace(/^\/+|\/+$/g, "");
}

function normalizeUrl(url) {
  url = safeString(url);
  if (!url) return "";
  url = url.replace(/^[a-z]+:\/\/[^/]+/i, "");
  url = url.replace(/[?#].*$/, "");
  if (!url) return "";
  if (url.charAt(0) !== "/") url = "/" + url;
  if (url.length > 1) url = url.replace(/\/+$/, "");
  return url;
}

function normalizeEdition(edition) {
  edition = cleanText(edition).toLowerCase();
  if (edition === "ai") return "ai";
  if (edition === "convert" || edition === "cv") return "convert";
  return "base";
}

function getEditionTitle(edition) {
  edition = normalizeEdition(edition);
  if (edition === "ai") return "Dịch AI";
  if (edition === "convert") return "Convert";
  return "Bản Dịch";
}

function parseRoute(url) {
  var path = normalizeUrl(url);
  if (!path || path.indexOf("/doc-truyen/") !== 0) return null;

  var parts = path.substring("/doc-truyen/".length).split("/").filter(Boolean);
  var edition = "base";
  if (parts[0] === "ai") {
    edition = "ai";
    parts.shift();
  } else if (parts[0] === "cv") {
    edition = "convert";
    parts.shift();
  }

  var slug = trimSlashes(parts.shift());
  if (!slug) return null;

  var route = {
    edition: edition,
    slug: slug,
    kind: "detail",
    pageNo: 1,
    chapterSegment: "",
  };

  if (parts.length === 0) return route;

  if (/^trang-\d+$/.test(parts[0])) {
    route.kind = "page";
    route.pageNo = parseInt(parts[0].replace("trang-", ""), 10) || 1;
    return route;
  }

  route.kind = "chapter";
  route.chapterSegment = trimSlashes(parts.join("/"));
  return route;
}

function buildRoute(route) {
  if (!route || !route.slug) return "";

  var path = "/doc-truyen";
  var edition = normalizeEdition(route.edition);
  if (edition === "ai") path += "/ai";
  if (edition === "convert") path += "/cv";
  path += "/" + trimSlashes(route.slug);

  if (route.kind === "page") {
    var pageNo = parseInt(route.pageNo, 10) || 1;
    if (pageNo > 1) path += "/trang-" + pageNo;
    return path;
  }

  if (route.kind === "chapter" && route.chapterSegment) {
    path += "/" + trimSlashes(route.chapterSegment);
  }

  return path;
}

function buildDetailRoute(route) {
  if (!route) return "";
  return buildRoute({
    edition: route.edition,
    slug: route.slug,
    kind: "detail",
  });
}

function buildAbsoluteUrl(path) {
  path = safeString(path);
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return BASE_URL + normalizeUrl(path);
}

function collectEditionEntries(doc, currentRoute) {
  var data = [];
  var indexByKey = {};
  var slug = currentRoute && currentRoute.slug ? trimSlashes(currentRoute.slug) : "";

  doc
    .select("div:has(> div > span:contains(Phiên bản)) a[href^=/doc-truyen/]")
    .forEach(function (element) {
      var route = parseRoute(element.attr("href"));
      if (!route || route.kind !== "detail") return;
      if (slug && route.slug !== slug) return;

      var key = buildDetailRoute(route);
      var title = cleanText(element.text()) || getEditionTitle(route.edition);
      var index = indexByKey[key];
      if (index != null) {
        if (title.length > data[index].title.length) data[index].title = title;
        return;
      }

      indexByKey[key] = data.length;
      data.push({
        title: title,
        route: route,
        key: key,
      });
    });

  return data;
}

function collectSiblingEditionEntries(doc, currentRoute) {
  var data = [];
  var currentKey = buildDetailRoute(currentRoute);

  collectEditionEntries(doc, currentRoute).forEach(function (item) {
    if (!item || item.key === currentKey) return;
    data.push(item);
  });

  return data;
}
