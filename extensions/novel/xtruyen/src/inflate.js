// inflate.js — Giai nen DEFLATE tho (RFC 1951) bang JS thuan cho runtime vBook.
//
// Dung cho cac site nen noi dung chuong thanh Base64(+Deflate) trong bien JS
// (vd. xtruyen.vn: bien data_x). Khong co san zlib/pako trong runtime Rhino
// ES6 nen tu cai dat inflate o day.
//
// Thuat toan: giai ma Huffman chuan (canonical) theo kieu puff.c — bang dem
// theo do dai ma, khong quet tuyen tinh tung ma nhu ban nguyen thuy, nen mo
// chuong dai (~10-30KB chu) chi mat vai tram ms. Co chan an toan: du lieu
// cat (het bit), khoi sai kieu, khoang cach vuot qua du lieu da giai, dau ra
// qua lon — tat ca deu throw Error thay vi treo may.
//
// Dinh dang dau vao: mang byte DEFLATE THO (khong header zlib 2 byte, khong
// Adler-32 cuoi). Neu site dung dang zlib-wrapped thi phai bo 2 byte dau va
// 4 byte cuoi truoc khi dua vao day.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.

var INFLATE_MAX_OUTPUT = 10 * 1024 * 1024;

var XT_LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
var XT_LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
var XT_DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
var XT_DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

// Bang base64url tuy chinh cua xtruyen.vn: chu so truoc, roi chu thuong,
// chu hoa, -_ (khac base64 chuan). Doi sang base64 chuan truoc khi giai ma.
var XT_URL64 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_";
var XT_B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function xtUrl64ToBase64(str) {
    var out = "";
    var i = 0;
    for (i = 0; i < str.length; i++) {
        var ch = str.charAt(i);
        var idx = XT_URL64.indexOf(ch);
        out += idx > -1 ? XT_B64.charAt(idx) : ch;
    }
    return out;
}

function xtB64ToBytes(b64) {
    b64 = String(b64).replace(/[^A-Za-z0-9+\/=]/g, "");
    var bytes = [];
    var i = 0;
    var b10 = 0;
    var imax = b64.length;
    var pads = 0;
    if (imax > 0 && b64.charAt(imax - 1) === "=") {
        pads = 1;
        if (imax > 1 && b64.charAt(imax - 2) === "=") pads = 2;
        imax -= 4;
    }
    for (i = 0; i < imax; i += 4) {
        b10 = (XT_B64.indexOf(b64.charAt(i)) << 18) |
              (XT_B64.indexOf(b64.charAt(i + 1)) << 12) |
              (XT_B64.indexOf(b64.charAt(i + 2)) << 6) |
              XT_B64.indexOf(b64.charAt(i + 3));
        bytes.push((b10 >> 16) & 255, (b10 >> 8) & 255, b10 & 255);
    }
    if (pads === 1) {
        b10 = (XT_B64.indexOf(b64.charAt(i)) << 18) |
              (XT_B64.indexOf(b64.charAt(i + 1)) << 12) |
              (XT_B64.indexOf(b64.charAt(i + 2)) << 6);
        bytes.push((b10 >> 16) & 255, (b10 >> 8) & 255);
    } else if (pads === 2) {
        b10 = (XT_B64.indexOf(b64.charAt(i)) << 18) |
              (XT_B64.indexOf(b64.charAt(i + 1)) << 12);
        bytes.push((b10 >> 16) & 255);
    }
    return bytes;
}

function xtBytesToUtf8(bytes) {
    var str = "";
    var i = 0;
    while (i < bytes.length) {
        var c = bytes[i++];
        if (c < 128) {
            str += String.fromCharCode(c);
        } else if (c < 224) {
            if (i >= bytes.length) break;
            str += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
        } else if (c < 240) {
            if (i + 1 >= bytes.length) break;
            str += String.fromCharCode(((c & 15) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63));
        } else {
            if (i + 2 >= bytes.length) break;
            var cp = ((c & 7) << 18) | ((bytes[i++] & 63) << 12) | ((bytes[i++] & 63) << 6) | (bytes[i++] & 63);
            cp -= 65536;
            str += String.fromCharCode(55296 + (cp >> 10), 56320 + (cp & 1023));
        }
    }
    return str;
}

// Giai nen mot mang byte DEFLATE tho, tra ve mang byte goc.
// Throw Error khi du lieu loi/cat thay vi treo.
function xtInflate(data) {
    var out = [];
    var pos = 0;
    var bitBuf = 0;
    var bitCnt = 0;

    function needBits(n) {
        while (bitCnt < n) {
            if (pos >= data.length) throw new Error("inflate: het du lieu");
            bitBuf |= data[pos++] << bitCnt;
            bitCnt += 8;
        }
    }

    function readBits(n) {
        if (n === 0) return 0;
        needBits(n);
        var v = bitBuf & ((1 << n) - 1);
        bitBuf >>>= n;
        bitCnt -= n;
        return v;
    }

    // Xay bang Huffman chuan tu mang do dai ma (canonical, kieu puff.c).
    function buildHuffman(lengths) {
        var maxLen = 0;
        var i = 0;
        for (i = 0; i < lengths.length; i++) {
            if (lengths[i] > maxLen) maxLen = lengths[i];
        }
        var counts = [];
        var k = 0;
        for (k = 0; k <= maxLen; k++) counts.push(0);
        for (i = 0; i < lengths.length; i++) counts[lengths[i]]++;
        counts[0] = 0;
        var offsets = [];
        var sum = 0;
        for (k = 1; k <= maxLen; k++) {
            offsets[k] = sum;
            sum += counts[k];
        }
        var symbols = [];
        for (i = 0; i < lengths.length; i++) {
            if (lengths[i] > 0) symbols[offsets[lengths[i]]++] = i;
        }
        return { counts: counts, symbols: symbols, maxLen: maxLen };
    }

    // Giai mot symbol tu bang Huffman (doc tung bit, MSB cua ma doc truoc).
    function decodeSymbol(tree) {
        var code = 0;
        var first = 0;
        var index = 0;
        var len = 0;
        for (len = 1; len <= tree.maxLen; len++) {
            code = (code << 1) | readBits(1);
            var count = tree.counts[len];
            if (code - first < count) return tree.symbols[index + (code - first)];
            index += count;
            first = (first + count) << 1;
        }
        return -1;
    }

    function decodeBlock(litTree, distTree) {
        while (true) {
            var sym = decodeSymbol(litTree);
            if (sym < 0) throw new Error("inflate: ma Huffman loi");
            if (sym === 256) return;
            if (sym < 256) {
                out.push(sym);
                if (out.length > INFLATE_MAX_OUTPUT) throw new Error("inflate: du lieu qua lon");
            } else {
                var li = sym - 257;
                if (li < 0 || li > 28) throw new Error("inflate: ma do dai loi");
                var length = XT_LEN_BASE[li] + readBits(XT_LEN_EXTRA[li]);
                var ds = decodeSymbol(distTree);
                if (ds < 0 || ds > 29) throw new Error("inflate: ma khoang cach loi");
                var dist = XT_DIST_BASE[ds] + readBits(XT_DIST_EXTRA[ds]);
                if (dist > out.length) throw new Error("inflate: khoang cach vuot qua du lieu");
                for (var k = 0; k < length; k++) {
                    out.push(out[out.length - dist]);
                }
                if (out.length > INFLATE_MAX_OUTPUT) throw new Error("inflate: du lieu qua lon");
            }
        }
    }

    var bfinal = 0;
    while (!bfinal) {
        bfinal = readBits(1);
        var btype = readBits(2);
        if (btype === 0) {
            // Khoi stored: bo bit thua den bien byte, roi LEN/NLEN + du lieu tho.
            bitBuf = 0;
            bitCnt = 0;
            if (pos + 4 > data.length) throw new Error("inflate: het du lieu");
            var len = data[pos] | (data[pos + 1] << 8);
            var nlen = data[pos + 2] | (data[pos + 3] << 8);
            pos += 4;
            if (len !== ((~nlen) & 0xffff)) throw new Error("inflate: khoi stored loi");
            if (pos + len > data.length) throw new Error("inflate: het du lieu");
            for (var k = 0; k < len; k++) out.push(data[pos++]);
            if (out.length > INFLATE_MAX_OUTPUT) throw new Error("inflate: du lieu qua lon");
        } else if (btype === 1) {
            // Khoi fixed Huffman.
            var litLens = [];
            var k2 = 0;
            for (k2 = 0; k2 < 288; k2++) litLens.push(k2 < 144 ? 8 : (k2 < 256 ? 9 : (k2 < 280 ? 7 : 8)));
            var distLens = [];
            for (k2 = 0; k2 < 32; k2++) distLens.push(5);
            decodeBlock(buildHuffman(litLens), buildHuffman(distLens));
        } else if (btype === 2) {
            // Khoi dynamic Huffman.
            var hlit = readBits(5) + 257;
            var hdist = readBits(5) + 1;
            var hclen = readBits(4) + 4;
            var CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
            var clLens = [];
            var k3 = 0;
            for (k3 = 0; k3 < 19; k3++) clLens.push(0);
            for (k3 = 0; k3 < hclen; k3++) clLens[CL_ORDER[k3]] = readBits(3);
            var clTree = buildHuffman(clLens);
            var allLens = [];
            while (allLens.length < hlit + hdist) {
                var s = decodeSymbol(clTree);
                if (s < 0) throw new Error("inflate: ma do dai ma loi");
                if (s < 16) {
                    allLens.push(s);
                } else if (s === 16) {
                    var rep = readBits(2) + 3;
                    var last = allLens[allLens.length - 1];
                    for (var r = 0; r < rep; r++) allLens.push(last);
                } else if (s === 17) {
                    var rep17 = readBits(3) + 3;
                    for (var r17 = 0; r17 < rep17; r17++) allLens.push(0);
                } else if (s === 18) {
                    var rep18 = readBits(7) + 11;
                    for (var r18 = 0; r18 < rep18; r18++) allLens.push(0);
                } else {
                    throw new Error("inflate: ma lap do dai ma loi");
                }
            }
            var litTree = buildHuffman(allLens.slice(0, hlit));
            var distTree = buildHuffman(allLens.slice(hlit, hlit + hdist));
            decodeBlock(litTree, distTree);
        } else {
            throw new Error("inflate: loai khoi khong hop le");
        }
    }
    return out;
}

// Giai ma tron goi data_x cua xtruyen.vn: chuoi base64url tuy chinh ->
// byte -> inflate (DEFLATE tho) -> chuoi UTF-8.
// Thu bang url64 truoc; neu loi thi thu lai bang base64 chuan. Throw khi
// ca 2 cach deu loi. (Khong kiem tra do dai o day — chuong that ngan van
// hop le; chuong goi len se tu kiem tra do dai noi dung.)
function xtDecodeDataX(dataX) {
    var s = String(dataX).replace(/\s+/g, "");
    var firstError = null;
    try {
        return xtBytesToUtf8(xtInflate(xtB64ToBytes(xtUrl64ToBase64(s))));
    } catch (e1) {
        firstError = e1;
    }
    try {
        return xtBytesToUtf8(xtInflate(xtB64ToBytes(s)));
    } catch (e2) {
    }
    throw new Error("Giai nen data_x that bai: " + String(firstError));
}
