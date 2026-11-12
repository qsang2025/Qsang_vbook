// home.js — cac tab xep hang cua alicesw (trang chu tinh, khong fetch).
// Moi tab tro ve gen1.js voi input la duong dan bang xep hang.
function execute() {
    return Response.success([
        { title: "本日排行", input: "/other/rank_hits/order/hits_day.html", script: "gen1.js" },
        { title: "本周排行", input: "/other/rank_hits/order/hits_week.html", script: "gen1.js" },
        { title: "本月排行", input: "/other/rank_hits/order/hits_month.html", script: "gen1.js" },
        { title: "总排行", input: "/other/rank_hits/order/hits.html", script: "gen1.js" }
    ]);
}
