// Dashboard page specific JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Check authentication
  if (!window.auth.checkAuth()) {
    window.location.href = "index.html";
    return;
  }

  // Initialize dashboard
  initializeDashboard();
  setupEventListeners();
});

function initializeDashboard() {
  const currentUser = window.auth.currentUser();
  
  // Update user info in header
  const userName = document.getElementById("userName");
  const userRole = document.getElementById("userRole");
  const usersTab = document.getElementById("usersTab");
  
  // Sửa lại để hiển thị username thay vì email
  if (userName) userName.textContent += currentUser.username + "!";
  if (userRole) userRole.textContent = currentUser.role === "admin" ? "Admin" : "User";
  
  // Show/hide admin features
  if (usersTab) {
    if (currentUser.role === "admin") {
      usersTab.classList.remove("hidden");
    } else {
      usersTab.classList.add("hidden");
    }
  }

  // Load file system and render
  window.fileManager.loadFileSystem();
  switchTab("files");
}

function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  // Logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", window.auth.handleLogout);
  }

  // Navigation tabs
  const filesTab = document.getElementById("filesTab");
  const statsTab = document.getElementById("statsTab");
  const sharedTab = document.getElementById("sharedTab");
  const usersTab = document.getElementById("usersTab");

  if (filesTab) filesTab.addEventListener("click", () => switchTab("files"));
  if (statsTab) statsTab.addEventListener("click", () => switchTab("stats"));
  if (sharedTab) sharedTab.addEventListener("click", () => switchTab("shared"));
  if (usersTab) usersTab.addEventListener("click", () => switchTab("users"));

  // File management
  const createFolderBtn = document.getElementById("createFolderBtn");
  const createFileBtn = document.getElementById("createFileBtn");
  const uploadFileBtn = document.getElementById("uploadFileBtn");
  const fileInput = document.getElementById("fileInput");

  if (createFolderBtn) createFolderBtn.addEventListener("click", () => window.fileManager.showCreateDialog(true));
  if (createFileBtn) createFileBtn.addEventListener("click", () => window.fileManager.showCreateDialog(false));
  if (uploadFileBtn) uploadFileBtn.addEventListener("click", () => fileInput.click());
  if (fileInput) fileInput.addEventListener("change", window.fileManager.handleFileUpload);

  // Search and filter
  const searchInput = document.getElementById("searchInput");
  const typeFilterSelect = document.getElementById("typeFilter");
  const clearFiltersBtn = document.getElementById("clearFilters");

  if (searchInput) searchInput.addEventListener("input", window.fileManager.handleSearch);
  if (typeFilterSelect) typeFilterSelect.addEventListener("change", window.fileManager.handleTypeFilter);
  if (clearFiltersBtn) clearFiltersBtn.addEventListener("click", window.fileManager.clearFilters);

  // Dialogs
  const confirmCreate = document.getElementById("confirmCreate");
  const cancelCreate = document.getElementById("cancelCreate");
  const confirmShare = document.getElementById("confirmShare");
  const cancelShare = document.getElementById("cancelShare");
  const copyLink = document.getElementById("copyLink");

  if (confirmCreate) confirmCreate.addEventListener("click", window.fileManager.handleCreate);
  if (cancelCreate) cancelCreate.addEventListener("click", window.fileManager.hideCreateDialog);
  if (confirmShare) confirmShare.addEventListener("click", handleShare);
  if (cancelShare) cancelShare.addEventListener("click", hideShareDialog);
  if (copyLink) copyLink.addEventListener("click", handleCopyLink);

  // Context menu
  const renameItem = document.getElementById("renameItem");
  const shareItem = document.getElementById("shareItem");
  const downloadItem = document.getElementById("downloadItem");
  const deleteItem = document.getElementById("deleteItem");
  const viewItem = document.getElementById("viewItem");

  if (renameItem) renameItem.addEventListener("click", window.fileManager.handleRename);
  if (shareItem) shareItem.addEventListener("click", window.fileManager.handleShareItem);
  if (downloadItem) downloadItem.addEventListener("click", window.fileManager.handleDownload);
  if (deleteItem) deleteItem.addEventListener("click", window.fileManager.handleDelete);
  if (viewItem) viewItem.addEventListener("click", window.fileManager.handleView);

  // User management
  const createUserBtn = document.getElementById("createUserBtn");
  if (createUserBtn) createUserBtn.addEventListener("click", handleCreateUser);

  // Global click to hide context menu
  document.addEventListener("click", window.fileManager.hideContextMenu);

  // Global drag end to clear all drag-over classes
  document.addEventListener("dragend", window.fileManager.clearAllDragOverClasses);

  // Drag and drop
  const fileList = document.getElementById("fileList");
  const fileArea = document.querySelector(".file-area");
  const currentPathElement = document.getElementById("currentPath");

  if (fileList) {
    fileList.addEventListener("dragover", window.fileManager.handleDragOver);
    fileList.addEventListener("drop", window.fileManager.handleDrop);
  }

  if (fileArea) {
    fileArea.addEventListener("dragover", window.fileManager.handleFileAreaDragOver);
    fileArea.addEventListener("dragleave", window.fileManager.handleFileAreaDragLeave);
    fileArea.addEventListener("drop", window.fileManager.handleFileAreaDrop);
  }

  if (currentPathElement) {
    currentPathElement.addEventListener("dragover", window.fileManager.handleBreadcrumbDragOver);
    currentPathElement.addEventListener("dragleave", window.fileManager.handleBreadcrumbDragLeave);
    currentPathElement.addEventListener("drop", window.fileManager.handleBreadcrumbDrop);
  }

  // Load theme
  loadTheme();
}

// Tab switching functionality
function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach((c) => c.classList.add("hidden"));

  switch (tab) {
    case "files":
      const filesTab = document.getElementById("filesTab");
      const filesContent = document.getElementById("filesContent");
      if (filesTab) filesTab.classList.add("active");
      if (filesContent) filesContent.classList.remove("hidden");
      window.fileManager.renderFileList();
      break;
    case "stats":
      const statsTab = document.getElementById("statsTab");
      const statsContent = document.getElementById("statsContent");
      if (statsTab) statsTab.classList.add("active");
      if (statsContent) statsContent.classList.remove("hidden");
      updateStatistics();
      break;
    case "shared":
      const sharedTab = document.getElementById("sharedTab");
      const sharedContent = document.getElementById("sharedContent");
      if (sharedTab) sharedTab.classList.add("active");
      if (sharedContent) sharedContent.classList.remove("hidden");
      renderSharedFiles();
      break;
    case "users":
      const currentUser = window.auth.currentUser();
      if (currentUser.role === "admin") {
        const usersTab = document.getElementById("usersTab");
        const usersContent = document.getElementById("usersContent");
        if (usersTab) usersTab.classList.add("active");
        if (usersContent) usersContent.classList.remove("hidden");
        renderUsersList();
      }
      break;
  }
}

// Theme functions
function loadTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.body.className = theme;
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = theme === "dark" ? "🌙" : "☀️";
  }
}

function toggleTheme() {
  const currentTheme = document.body.className || "light";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  document.body.className = newTheme;
  localStorage.setItem("theme", newTheme);
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.textContent = newTheme === "dark" ? "🌙" : "☀️";
  }
  window.auth.addActivity(`Chuyển sang chế độ ${newTheme === "dark" ? "tối" : "sáng"}`);
}

// Statistics functions
function updateStatistics() {
  // Access fileSystem from the fileManager module
  const stats = calculateStatistics(window.fileManager.fileSystem || {});

  const totalFolders = document.getElementById("totalFolders");
  const totalFiles = document.getElementById("totalFiles");
  const totalSize = document.getElementById("totalSize");
  const totalShared = document.getElementById("totalShared");

  if (totalFolders) totalFolders.textContent = stats.folders;
  if (totalFiles) totalFiles.textContent = stats.files;
  if (totalSize) totalSize.textContent = formatFileSize(stats.totalSize);

  const currentUser = window.auth.currentUser();
  if (currentUser && totalShared) {
    const sharedFiles = JSON.parse(localStorage.getItem(`sharedFiles_${currentUser.username}`) || "[]");
    totalShared.textContent = sharedFiles.length;
  }

  renderActivityList();
}

function calculateStatistics(obj) {
  let folders = 0;
  let files = 0;
  let totalSize = 0;

  for (const [key, value] of Object.entries(obj)) {
    if (value.type === "folder") {
      folders++;
      if (value.children) {
        const childStats = calculateStatistics(value.children);
        folders += childStats.folders;
        files += childStats.files;
        totalSize += childStats.totalSize;
      }
    } else if (value.type === "file") {
      files++;
      totalSize += value.size || 0;
    }
  }

  return { folders, files, totalSize };
}

function renderActivityList() {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  const activities = JSON.parse(localStorage.getItem(`activities_${currentUser.username}`) || "[]");
  const activityList = document.getElementById("activityList");
  if (!activityList) return;

  activityList.innerHTML = "";

  activities
    .slice(-20)
    .reverse()
    .forEach((activity) => {
      const div = document.createElement("div");
      div.className = "activity-item";
      div.innerHTML = `
      <div class="activity-text">${activity.action}</div>
      <div class="activity-time">${formatDate(activity.timestamp)}</div>
    `;
      activityList.appendChild(div);
    });

  if (activities.length === 0) {
    activityList.innerHTML = '<div class="activity-item"><div class="activity-text">Chưa có hoạt động nào</div></div>';
  }
}

// Share functions
function showShareDialog(fileName) {
  const shareFileName = document.getElementById("shareFileName");
  const shareLink = document.getElementById("shareLink");
  const shareDialog = document.getElementById("shareDialog");
  
  if (shareFileName) shareFileName.textContent = fileName;
  if (shareLink) shareLink.value = `${window.location.origin}?share=${generateShareId()}`;
  if (shareDialog) shareDialog.classList.remove("hidden");
}

function hideShareDialog() {
  const shareDialog = document.getElementById("shareDialog");
  if (shareDialog) shareDialog.classList.add("hidden");
}

function handleShare() {
  const shareFileName = document.getElementById("shareFileName");
  const shareLink = document.getElementById("shareLink");
  
  if (!shareFileName || !shareLink) return;
  
  const fileName = shareFileName.textContent;
  const permission = document.querySelector('input[name="permission"]:checked')?.value || "view";
  const shareId = generateShareId();

  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  // Save shared file info
  const sharedFiles = JSON.parse(localStorage.getItem(`sharedFiles_${currentUser.username}`) || "[]");
  sharedFiles.push({
    name: fileName,
    shareId: shareId,
    permission: permission,
    sharedAt: new Date().toISOString(),
    sharedBy: currentUser.username,
  });
  localStorage.setItem(`sharedFiles_${currentUser.username}`, JSON.stringify(sharedFiles));

  // Save to global shared files
  const globalShared = JSON.parse(localStorage.getItem("globalSharedFiles") || "[]");
  globalShared.push({
    name: fileName,
    shareId: shareId,
    permission: permission,
    sharedAt: new Date().toISOString(),
    sharedBy: currentUser.username,
    path: window.fileManager.currentPath || [],
  });
  localStorage.setItem("globalSharedFiles", JSON.stringify(globalShared));

  window.auth.addActivity(`Chia sẻ file: ${fileName} (${permission})`);
  hideShareDialog();
  alert("Chia sẻ thành công! Link đã được copy.");
}

function handleCopyLink() {
  const shareLink = document.getElementById("shareLink");
  if (shareLink) {
    shareLink.select();
    document.execCommand("copy");
    alert("Đã copy link!");
  }
}

function generateShareId() {
  return Math.random().toString(36).substr(2, 9);
}

// Shared files functions
function renderSharedFiles() {
  renderMySharedFiles();
  renderSharedWithMe();
}

function renderMySharedFiles() {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  const sharedFiles = JSON.parse(localStorage.getItem(`sharedFiles_${currentUser.username}`) || "[]");
  const mySharedFiles = document.getElementById("mySharedFiles");
  if (!mySharedFiles) return;

  mySharedFiles.innerHTML = "";

  sharedFiles.forEach((file) => {
    const div = document.createElement("div");
    div.className = "shared-file-item";
    div.innerHTML = `
      <div class="shared-file-info">
        <div class="shared-file-name">📄 ${file.name}</div>
        <div class="shared-file-details">
          Quyền: ${file.permission === "view" ? "Xem" : "Chỉnh sửa"} • 
          Chia sẻ: ${formatDate(file.sharedAt)}
        </div>
      </div>
      <div class="shared-file-actions">
        <button onclick="copyShareLink('${file.shareId}')" class="btn-primary">Copy</button>
        <button onclick="removeShare('${file.shareId}')" class="btn-secondary">Xóa</button>
      </div>
    `;
    mySharedFiles.appendChild(div);
  });

  if (sharedFiles.length === 0) {
    mySharedFiles.innerHTML =
      '<div class="shared-file-item"><div class="shared-file-info">Chưa có file nào được chia sẻ</div></div>';
  }
}

function renderSharedWithMe() {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  const globalShared = JSON.parse(localStorage.getItem("globalSharedFiles") || "[]");
  const sharedWithMeFiles = globalShared.filter((file) => file.sharedBy !== currentUser.username);
  const sharedWithMe = document.getElementById("sharedWithMe");
  if (!sharedWithMe) return;

  sharedWithMe.innerHTML = "";

  sharedWithMeFiles.forEach((file) => {
    const div = document.createElement("div");
    div.className = "shared-file-item";
    div.innerHTML = `
      <div class="shared-file-info">
        <div class="shared-file-name">📄 ${file.name}</div>
        <div class="shared-file-details">
          Từ: ${file.sharedBy} • 
          Quyền: ${file.permission === "view" ? "Xem" : "Chỉnh sửa"} • 
          ${formatDate(file.sharedAt)}
        </div>
      </div>
    `;
    // Thêm sự kiện click để mở file được share
    div.addEventListener("click", () => {
      openSharedFile(file);
    });
    sharedWithMe.appendChild(div);
  });

  if (sharedWithMeFiles.length === 0) {
    sharedWithMe.innerHTML =
      '<div class="shared-file-item"><div class="shared-file-info">Chưa có file nào được chia sẻ với bạn</div></div>';
  }
}

// User management functions
function renderUsersList() {
  const currentUser = window.auth.currentUser();
  if (currentUser.role !== "admin") return;

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const usersList = document.getElementById("usersList");
  if (!usersList) return;

  usersList.innerHTML = "";

  Object.entries(users).forEach(([username, user]) => {
    const div = document.createElement("div");
    div.className = "user-item";
    div.innerHTML = `
      <div class="user-info">
        ${username !== currentUser.username ? `<div class="user-email-text">${username}</div>` : `<div class="user-email-text"> Đây là bạn: ${username}</div>`}
        <div class="user-details">
          Vai trò: ${user.role === "admin" ? "Admin" : "User"} • 
          Tạo: ${formatDate(user.createdAt)}
        </div>
      </div>
      <div class="user-actions">
        ${username !== currentUser.username ? `<button onclick="toggleUserRole('${username}')" class="btn-primary">${user.role === "admin" ? "Hạ quyền" : "Nâng quyền"}</button>` : ""}
        ${username !== currentUser.username ? `<button onclick="deleteUser('${username}')" class="btn-secondary">Xóa</button>` : ""}
      </div>
    `;
    usersList.appendChild(div);
  });
}

function handleCreateUser() {
  const username = prompt("Nhập tên đăng nhập người dùng mới:");
  const password = prompt("Nhập mật khẩu:");

  if (!username || !password) return;

  const users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username]) {
    alert("Tên đăng nhập đã tồn tại!");
    return;
  }

  users[username] = {
    password: password,
    role: "user",
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem("users", JSON.stringify(users));
  renderUsersList();
  window.auth.addActivity(`Tạo người dùng: ${username}`);
}

// Global functions for user management
window.toggleUserRole = (username) => {
  const currentUser = window.auth.currentUser();
  if (currentUser.role !== "admin") return;

  const users = JSON.parse(localStorage.getItem("users") || "{}");
  if (users[username]) {
    users[username].role = users[username].role === "admin" ? "user" : "admin";
    localStorage.setItem("users", JSON.stringify(users));
    renderUsersList();
    window.auth.addActivity(`Thay đổi quyền: ${username} → ${users[username].role}`);
  }
};

window.deleteUser = (username) => {
  const currentUser = window.auth.currentUser();
  if (currentUser.role !== "admin" || username === currentUser.username) return;

  if (confirm(`Xóa người dùng ${username}?`)) {
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    delete users[username];
    localStorage.setItem("users", JSON.stringify(users));
    renderUsersList();
    window.auth.addActivity(`Xóa người dùng: ${username}`);
  }
};

// Global functions for shared files
window.copyShareLink = (shareId) => {
  const link = `${window.location.origin}?share=${shareId}`;
  navigator.clipboard.writeText(link).then(() => {
    alert("Đã copy link!");
  });
};

window.removeShare = (shareId) => {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  const sharedFiles = JSON.parse(localStorage.getItem(`sharedFiles_${currentUser.username}`) || "[]");
  const filtered = sharedFiles.filter((f) => f.shareId !== shareId);
  localStorage.setItem(`sharedFiles_${currentUser.username}`, JSON.stringify(filtered));

  const globalShared = JSON.parse(localStorage.getItem("globalSharedFiles") || "[]");
  const filteredGlobal = globalShared.filter((f) => f.shareId !== shareId);
  localStorage.setItem("globalSharedFiles", JSON.stringify(filteredGlobal));

  renderSharedFiles();
  window.auth.addActivity("Xóa chia sẻ file");
};


function openSharedFile(sharedFile) {
  // Lấy fileSystem của người chia sẻ
  const ownerFileSystem = JSON.parse(localStorage.getItem(`fileSystem_${sharedFile.sharedBy}`) || "{}");
  let file = ownerFileSystem;
  // Duyệt theo path nếu có (nếu bạn lưu path khi share)
  if (sharedFile.path && sharedFile.path.length) {
    for (const folder of sharedFile.path) {
      file = file[folder]?.children || {};
    }
  }
  file = file[sharedFile.name];

  if (!file) {
    alert("File không tồn tại hoặc đã bị xóa!");
    return;
  }

  // Hiển thị dialog xem file (tùy loại file)
  const viewDialog = document.getElementById("viewDialog");
  const viewDialogContent = document.getElementById("viewDialogContent");
  if (!viewDialog || !viewDialogContent) return;

  let html = `<h3>Xem file: ${file.name}</h3>`;
  if (file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|jfif)$/i)) {
    html += `<img src="${file.content}" alt="${file.name}" style="max-width:100%;max-height:400px;">`;
  } else if (file.name.endsWith(".pdf")) {
    html += `<iframe src="${file.content}" style="width:100%;height:500px;" frameborder="0"></iframe>`;
  } else {
    html += `<p>Không hỗ trợ xem trực tiếp loại file này.</p>`;
  }

  // Nếu có quyền tải về
  html += `<button id="downloadSharedFile" class="btn-primary">Tải về</button>`;
  html += `<button id="closeViewDialog" class="btn-secondary">Đóng</button>`;

  // Nếu quyền là "edit", thêm nút Xóa
  if (sharedFile.permission === "edit") {
    html += `<button id="deleteSharedFile" class="btn-secondary">Xóa</button>`;
  }

  viewDialogContent.innerHTML = html; // Gán 1 lần duy nhất
  viewDialog.classList.remove("hidden");

  document.getElementById("closeViewDialog").onclick = () => viewDialog.classList.add("hidden");
  document.getElementById("downloadSharedFile").onclick = () => {
    const link = document.createElement("a");
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Nếu quyền là "edit", gán sự kiện cho nút Xóa
  if (sharedFile.permission === "edit") {
    document.getElementById("deleteSharedFile").onclick = () => {
      removeShare(sharedFile.shareId);
      viewDialog.classList.add("hidden");
    };
  }
}

// Utility functions
function formatFileSize(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return (
    date.toLocaleDateString("vi-VN") + " " + date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}
