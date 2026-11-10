// probe.js — TAM THOI, chi de xem body cua HTTP 403 tu may that.
// XOA sau khi test xong, khong commit.
load('config.js');
load('config-helpers.js');
load('fetch-helpers.js');
load('rate-limit.js');

function execute(url) {
    url = url || BASE_URL + "/";
    var res = null;
    try {
        res = pacedFetch(url, {});
    } catch (e) {
        return Response.success("pacedFetch exception: " + e);
    }
    if (!res) return Response.success("pacedFetch tra null");
    var out = "ok=" + res.ok + " status=" + res.status;
    if (res.res) {
        var t = "";
        try { t = res.res.text(); } catch (e2) { t = "text() loi: " + e2; }
        out = out + " len=" + t.length + " body=" + t.substring(0, 600);
    }
    if (res.error) out = out + " error=" + res.error;
    return Response.success(out);
}
