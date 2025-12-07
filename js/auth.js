let currentUser = null;

// Hàm xử lý đăng nhập
function handleLogin(e) {
  e.preventDefault();
  const username = document.querySelector('.sign-in-form input[placeholder="Tên đăng nhập"]').value.trim(),
    password = document.querySelector('.sign-in-form input[placeholder="Mật khẩu"]').value,
    users = JSON.parse(localStorage.getItem("users") || "{}");
  users[username] && users[username].password === password ? (currentUser = {
    username: username,
    ...users[username]
  }, localStorage.setItem("currentUser", JSON.stringify(currentUser)), addActivity("Đăng nhập hệ thống"), window.location.href = "dashboard.html") : alert("Tên đăng nhập hoặc mật khẩu không đúng!")
}

// Hàm xử lý đăng ký
function handleRegister(e) {
  e.preventDefault();
  const username = document.querySelector('.sign-up-form input[placeholder="Tên đăng nhập"]').value.trim(),
    password = document.querySelector('.sign-up-form input[placeholder="Mật khẩu"]').value,
    confirmPassword = document.querySelector('.sign-up-form input[placeholder="Nhập lại mật khẩu"]').value;
  if (!username || !password || !confirmPassword) return void alert("Vui lòng nhập đầy đủ thông tin!");
  if (password !== confirmPassword) return void alert("Mật khẩu xác nhận không khớp!");
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[username]) return void alert("Tên đăng nhập đã tồn tại!");
  const isFirstUser = 0 === Object.keys(users).length;
  users[username] = {
    password: password,
    role: isFirstUser ? "admin" : "user",
    createdAt: (new Date).toISOString()
  }, localStorage.setItem("users", JSON.stringify(users)), alert("Đăng ký thành công! Vui lòng đăng nhập.")
}

// Hàm xử lý đăng xuất
function handleLogout() {
  addActivity("Đăng xuất hệ thống"), currentUser = null, localStorage.removeItem("currentUser"), window.location.href = "index.html"
}

// Hàm kiểm tra xác thực người dùng
function checkAuth() {
  const e = localStorage.getItem("currentUser");
  return !!e && (currentUser = JSON.parse(e), !0)
}

// Hàm thêm hoạt động người dùng
function addActivity(e) {
  if (!currentUser) return;
  const activities = JSON.parse(localStorage.getItem(`activities_${currentUser.username}`) || "[]");
  activities.push({
    action: e,
    timestamp: (new Date).toISOString()
  });

  // Giới hạn số lượng hoạt động lưu trữ
  const MAX_ACTIVITIES = 36;
  if (activities.length > MAX_ACTIVITIES) {
    activities.splice(0, activities.length - MAX_ACTIVITIES);
  }
  localStorage.setItem(`activities_${currentUser.username}`, JSON.stringify(activities))
}

// Xuất các hàm ra bên ngoài để sử dụng trong các file khác
window.auth = {
  currentUser: () => currentUser,
  handleLogin: handleLogin,
  handleRegister: handleRegister,
  handleLogout: handleLogout,
  checkAuth: checkAuth,
  addActivity: addActivity
};