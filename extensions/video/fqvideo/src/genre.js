// genre.js — danh sach the loai video FQ Video (tab tinh, KHONG fetch).
// Bao gom 24 the loai Phim ngan (real-drama), 8 the loai Man kich / Hoat hinh
// (comic-drama) va 8 the loai Hoat hinh AI (ai-drama) da xac minh live.
// Loai tru /category/comic (truyen tranh tinh, khong phai video).
// Tuong thich Rhino ES6: chi dung var/function, noi chuoi bang +.
function execute() {
    return Response.success([
        { title: "Phim ngắn — Tình cảm", input: "/category/real-drama/romance", script: "search.js" },
        { title: "Phim ngắn — Niên đại", input: "/category/real-drama/period", script: "search.js" },
        { title: "Phim ngắn — Nghịch tập", input: "/category/real-drama/comeback", script: "search.js" },
        { title: "Phim ngắn — Truyền kỳ", input: "/category/real-drama/legend", script: "search.js" },
        { title: "Phim ngắn — Trưởng thành", input: "/category/real-drama/growth", script: "search.js" },
        { title: "Phim ngắn — Gia đình", input: "/category/real-drama/family", script: "search.js" },
        { title: "Phim ngắn — Gia tộc", input: "/category/real-drama/clan", script: "search.js" },
        { title: "Phim ngắn — Manh bảo", input: "/category/real-drama/cute-kids", script: "search.js" },
        { title: "Phim ngắn — Huyền nghi", input: "/category/real-drama/suspense", script: "search.js" },
        { title: "Phim ngắn — Kinh dị", input: "/category/real-drama/thriller", script: "search.js" },
        { title: "Phim ngắn — Khủng bố", input: "/category/real-drama/horror", script: "search.js" },
        { title: "Phim ngắn — Chí quái", input: "/category/real-drama/supernatural", script: "search.js" },
        { title: "Phim ngắn — Cổ trang", input: "/category/real-drama/costume", script: "search.js" },
        { title: "Phim ngắn — Huyền huyễn", input: "/category/real-drama/fantasy", script: "search.js" },
        { title: "Phim ngắn — Kỳ huyễn", input: "/category/real-drama/wonder", script: "search.js" },
        { title: "Phim ngắn — Đô thị", input: "/category/real-drama/urban", script: "search.js" },
        { title: "Phim ngắn — Thanh xuân", input: "/category/real-drama/youth", script: "search.js" },
        { title: "Phim ngắn — Hài hước", input: "/category/real-drama/comedy", script: "search.js" },
        { title: "Phim ngắn — Khoa huyễn", input: "/category/real-drama/sci-fi", script: "search.js" },
        { title: "Phim ngắn — Thảm họa", input: "/category/real-drama/disaster", script: "search.js" },
        { title: "Phim ngắn — Hành động phiêu lưu", input: "/category/real-drama/action-adventure", script: "search.js" },
        { title: "Phim ngắn — Chiến tranh", input: "/category/real-drama/war", script: "search.js" },
        { title: "Phim ngắn — Tạp kỹ", input: "/category/real-drama/variety", script: "search.js" },
        { title: "Phim ngắn — Chính kịch", input: "/category/real-drama/drama", script: "search.js" },
        { title: "Mạn kịch — Não động", input: "/category/comic-drama/creative", script: "search.js" },
        { title: "Mạn kịch — Huyền huyễn", input: "/category/comic-drama/fantasy", script: "search.js" },
        { title: "Mạn kịch — Chính kịch", input: "/category/comic-drama/drama", script: "search.js" },
        { title: "Mạn kịch — Mạt thế", input: "/category/comic-drama/apocalypse", script: "search.js" },
        { title: "Mạn kịch — Hào môn", input: "/category/comic-drama/wealthy-family", script: "search.js" },
        { title: "Mạn kịch — Kỳ huyễn", input: "/category/comic-drama/wonder", script: "search.js" },
        { title: "Mạn kịch — Khoa huyễn", input: "/category/comic-drama/sci-fi", script: "search.js" },
        { title: "Mạn kịch — Phiêu lưu", input: "/category/comic-drama/adventure", script: "search.js" },
        { title: "Hoạt hình AI — Não động", input: "/category/ai-drama/creative", script: "search.js" },
        { title: "Hoạt hình AI — Huyền huyễn", input: "/category/ai-drama/fantasy", script: "search.js" },
        { title: "Hoạt hình AI — Chính kịch", input: "/category/ai-drama/drama", script: "search.js" },
        { title: "Hoạt hình AI — Mạt thế", input: "/category/ai-drama/apocalypse", script: "search.js" },
        { title: "Hoạt hình AI — Hào môn", input: "/category/ai-drama/wealthy-family", script: "search.js" },
        { title: "Hoạt hình AI — Kỳ huyễn", input: "/category/ai-drama/wonder", script: "search.js" },
        { title: "Hoạt hình AI — Khoa huyễn", input: "/category/ai-drama/sci-fi", script: "search.js" },
        { title: "Hoạt hình AI — Phiêu lưu", input: "/category/ai-drama/adventure", script: "search.js" }
    ]);
}
