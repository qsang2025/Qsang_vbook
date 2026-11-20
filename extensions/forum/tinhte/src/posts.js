// posts.js — noi dung cac bai trong mot thread (Tinhte Forum).
//
// Trang thread cua Tinhte la ung dung Next.js (React), KHONG phai
// XenForo co dien nhu trang board: bai viet khong nam trong
// .message.message--post ma duoc server-render trong JSON __NEXT_DATA__
// (job "posts") + DOM .thread-comment__box. Lay theo JSON vi no sach
// va day du nhat: moi bai co post_id, poster_username, post_body_html,
// post_is_first_post, post_create_date, post_like_count.
//
// `url` la `link` cua thread; `page` la token lan goi truoc tra ve o
// data2 (rong o lan dau). Tra ve 1 trang bai o data dang { posts, page,
// total_pages } de app hien so trang + nhay trang, token trang tiep o
// data2.
//
// Phan trang: /page-N trong duong dan (giong XenForo). App cat dau "/"
// cuoi cua URL truoc khi truyen vao, nen tu noi lai "/" truoc khi ghep
// "page-N". Moi trang 30 bai (da kiem chung: trang 1 co 30 bai, trang 2
// co 3 bai tren thread 33 bai) — floor tinh theo vi tri: (page-1)*30
// + thu tu trong trang.
//
// is_op = bai co post_is_first_post (bai mo dau cua chu thread).
// time = post_create_date (Unix giây) doi sang "dd/mm/yyyy hh:mm".
// content = post_body_html (HTML goc cua site, co ca anh va link).
// Nguon chi doc.
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
load('config.js');

var POSTS_PER_PAGE = 30;

function pad2(n) {
    n = parseInt(n);
    return (n < 10 ? "0" : "") + n;
}

function formatTime(ts) {
    var d = new Date(ts * 1000);
    return pad2(d.getDate()) + "/" + pad2(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

function execute(url, page) {
    url = normalizeUrl(url);
    page = page || "1";
    var pageNum = parseInt(page);

    var base = url;
    if (base.charAt(base.length - 1) !== "/") base += "/";
    var pageUrl = (pageNum <= 1) ? url : base + "page-" + pageNum;

    var response = fetch(pageUrl);
    if (!response.ok) return Response.error("Không tải được bài viết (HTTP " + response.status + ")");
    var html = response.text();

    // JSON nhung trong <script id="__NEXT_DATA__"> (Next.js escape <
    // thanh \u003c nen khong co </script> that ben trong).
    var m = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (!m) return Response.error("Không đọc được dữ liệu bài viết (thiếu __NEXT_DATA__).");
    var data;
    try {
        data = JSON.parse(m[1]);
    } catch (e) {
        return Response.error("Không đọc được dữ liệu bài viết (JSON lỗi).");
    }

    var jobs = data && data.props && data.props.pageProps && data.props.pageProps.apiData && data.props.pageProps.apiData.jobs;
    if (!jobs) return Response.error("Không đọc được dữ liệu bài viết (thiếu apiData).");
    var job = null;
    for (var k in jobs) {
        var j = jobs[k];
        if (j && j._req && j._req.uri === "posts" && j.posts) { job = j; break; }
    }
    if (!job) return Response.error("Không đọc được danh sách bài viết.");

    var permalink = "";
    if (job.thread && job.thread.links && job.thread.links.permalink) {
        permalink = job.thread.links.permalink;
    } else {
        permalink = base;
    }
    var totalPages = 1;
    if (job.links && job.links.pages) totalPages = job.links.pages;

    var posts = [];
    var list = job.posts;
    for (var i = 0; i < list.length; i++) {
        var p = list[i];
        var pid = String(p.post_id);
        posts.push({
            id: pid,
            floor: "#" + ((pageNum - 1) * POSTS_PER_PAGE + i + 1),
            url: permalink + "#post-" + pid,
            is_op: p.post_is_first_post === true,
            time: formatTime(p.post_create_date),
            user: {
                name: p.poster_username,
                title: p.poster_rank ? p.poster_rank : ""
            },
            content: p.post_body_html,
            content_format: "html"
        });
    }

    var next = (pageNum < totalPages) ? String(pageNum + 1) : "";
    return Response.success({ posts: posts, page: pageNum, total_pages: totalPages }, next);
}
