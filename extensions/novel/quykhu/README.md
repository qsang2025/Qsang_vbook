# QuyKhu (Vozer) Extension cho vBook

- **Tên extension**: QuyKhu
- **Tác giả**: MuseAi
- **Phiên bản**: 1
- **Nguồn**: https://quykhu.com (dự phòng https://vozer.io)
- **Tham khảo**: extension `vozer` v6 của mizhm

## Giới thiệu
QuyKhu (trước đây là Vozer.io) là nền tảng đọc truyện online tổng hợp các bộ truyện Voz huyền thoại: truyện ma, tâm linh, hồi ký, tình cảm Voz.

Nội dung chương được mã hóa XOR Base64 và giải mã qua thư viện `crypto.js` (CryptoJS).
Hệ thống yêu cầu header `Accept-Language: vi-VN,vi;q=0.9` và tự động điều tiết tần suất request (rate limiting).
