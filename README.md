# File Manager

Ứng dụng quản lý file phía client (không cần server), hỗ trợ nhiều người dùng, chia sẻ, kéo-thả, xem file (Ảnh, Video, DOCX, PDF) và quản lý quyền.

## Tính năng chính
- Đăng ký / đăng nhập (auth.js)
- Phân quyền Admin / User; quản lý người dùng (dashboard.js)
- File system riêng cho từng user, lưu vào localStorage (fileManager.js)
- Tạo/xóa/đổi tên file & thư mục
- Upload file (FileReader → dataURL) và xem trực tiếp ảnh, PDF, DOCX
- Drag & drop để di chuyển file giữa thư mục / ra ngoài thư mục
- Chia sẻ file: tạo share link, lưu shared meta (globalSharedFiles & sharedFiles_{username})
- Activity log theo user
- Light / Dark mode và responsive UI

## Cấu trúc quan trọng
- index.html — trang đăng nhập/đăng ký (index.js)
- dashboard.html — giao diện chính (dashboard.js)
- js/
  - auth.js — xử lý auth, currentUser, activity log
  - index.js — khởi tạo trang login, bind event
  - dashboard.js — khởi tạo dashboard, tabs, chia sẻ, users, thống kê
  - fileManager.js — quản lý file, render list, upload, drag/drop, viewer
- styles/
  - dashboard.css — giao diện (modal viewer responsive)
  - index.css - giao diện trang đăng ký/đăng nhập
- Lưu trữ: toàn bộ dữ liệu nằm trong localStorage

## Keys localStorage (đang sử dụng)
- users — object chứa users: { username: { password, role, createdAt } }
- currentUser — object user đang login
- fileSystem_{username} — file tree cho từng user
- sharedFiles_{username} — danh sách file user đã chia sẻ
- globalSharedFiles — danh sách file chia sẻ toàn cục (để hiển thị "được chia sẻ với tôi")
- activities_{username} — activity log per user
- theme — "light" hoặc "dark"

## Cách chạy
1. Mở `index.html` trong trình duyệt.
2. Đăng ký tài khoản đầu tiên → sẽ là Admin.
3. Đăng nhập để vào dashboard.

Không cần cài đặt, chỉ cần trình duyệt hiện đại (Chrome/Edge/Firefox).

## Những điểm lưu ý / vận hành
- File upload lưu content dưới dạng dataURL (sử dụng FileReader). Tệp lớn sẽ nhanh chóng làm đầy localStorage.
- Khi đổi tên file, module đã cập nhật cả shared metadata (sharedFiles_{owner} và globalSharedFiles) để người được chia sẻ vẫn thấy file với tên mới.
- Double-click mở file viewer (image/pdf/docx/mp3/mp4). Viewer responsive, chiều cao modal được tối ưu để hiển thị lớn hơn nhưng vẫn phù hợp trên mobile.
- Admin không thể tự hạ quyền hoặc xóa chính mình (cả UI và server-side client check).

## API nội bộ (window namespace)
- window.auth
  - currentUser(), handleLogin(), handleRegister(), handleLogout(), checkAuth(), addActivity()
- window.fileManager
  - loadFileSystem(), saveFileSystem(), renderFileList(), showCreateDialog(isFolder), handleCreate(), handleFileUpload(), handleFileUploadFromFiles(files), handleSearch(), handleTypeFilter(), clearFilters(), handleRename(), handleShareItem(), handleDownload(), handleDelete(), handleView(), hideViewDialog(), v.v.
- window.copyShareLink(shareId), window.removeShare(shareId), window.toggleUserRole(username), window.deleteUser(username)

## Các vấn đề cần chú ý / gợi ý cải tiến
- localStorage có hạn — cân nhắc lưu file lớn lên server hoặc IndexedDB.
- Thêm xác thực mạnh hơn (hash password) nếu dùng ngoài mục học tập.
- Khi share theo đường dẫn, có thể sinh token ngắn hạn và mapping vào metadata server để an toàn.

## Troubleshooting nhanh
- Không thấy file sau khi upload: kiểm tra console, kiểm tra key `fileSystem_{username}` có tồn tại.
- Viewer không hiển thị DOCX: cần thư viện mammoth.js (đã dự kiến trong code).
- Kéo-thả không hoạt động: đảm bảo phần tử có draggable=true và listener đã khởi tạo (dashboard.js khởi tạo khi DOMContentLoaded).

## Liên hệ / Ghi chú
Dự án là bản demo học tập — không dùng cho môi trường sản xuất mà không chỉnh sửa thêm. Xem chi tiết trong mã nguồn JS để mở rộng hoặc tích hợp backend.