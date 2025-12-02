// File Manager module
let currentPath = [];
let fileSystem = {};
let isCreatingFolder = false;
let currentContextItem = null;
let searchTerm = "";
let typeFilter = "";

// File system functions
function loadFileSystem() {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  // Sửa key lưu file system sang username
  const key = `fileSystem_${currentUser.username}`;
  fileSystem = JSON.parse(localStorage.getItem(key) || "{}");
}

function saveFileSystem() {
  const currentUser = window.auth.currentUser();
  if (!currentUser) return;

  // Sửa key lưu file system sang username
  const key = `fileSystem_${currentUser.username}`;
  localStorage.setItem(key, JSON.stringify(fileSystem));
}

function getCurrentFolder() {
  let current = fileSystem;
  for (const folder of currentPath) {
    if (!current[folder]) {
      // Tạo thư mục nếu chưa tồn tại
      current[folder] = {
        type: "folder",
        children: {},
        name: folder,
        createdAt: new Date().toISOString()
      };
    }
    // Đảm bảo luôn có children
    if (!current[folder].children) {
      current[folder].children = {};
    }
    current = current[folder].children;
  }
  return current;
}

function renderFileList() {
  const current = getCurrentFolder();
  const pathText = currentPath.length === 0 ? "/ Root" : "/ " + currentPath.join(" / ");
  const currentPathElement = document.getElementById("currentPath");
  if (currentPathElement) {
    currentPathElement.textContent = pathText;
  }

  const fileList = document.getElementById("fileList");
  if (!fileList) return;

  fileList.innerHTML = "";

  // Add back button if not in root
  if (currentPath.length > 0) {
    const backItem = createFileElement("..", "folder", true);
    fileList.appendChild(backItem);
  }

  // Get and filter items
  let items = Object.entries(current);

  // Apply search filter
  if (searchTerm) {
    items = items.filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  // Apply type filter
  if (typeFilter) {
    items = items.filter(([, item]) => {
      if (typeFilter === "image") {
        return item.type === "file" && isImageFile(item.name || "");
      }
      if (typeFilter === "video") {
        return item.type === "file" && isVideoFile(item.name || "");
      }
      if (typeFilter === "audio") {
        return item.type === "file" && isAudioFile(item.name || "");
      }
      return item.type === typeFilter;
    });
  }

  // Sort: folders first, then files
  items.sort(([, a], [, b]) => {
    if (a.type === "folder" && b.type !== "folder") return -1;
    if (a.type !== "folder" && b.type === "folder") return 1;
    return 0;
  });

  items.forEach(([name, item]) => {
    const element = createFileElement(name, item.type, false, item);
    fileList.appendChild(element);
  });

  if (items.length === 0 && (searchTerm || typeFilter)) {
    const noResults = document.createElement("div");
    noResults.className = "file-item";
    noResults.innerHTML = `
      <div class="icon">🔍</div>
      <div class="name">Không tìm thấy kết quả nào</div>
    `;
    fileList.appendChild(noResults);
  }
}

function createFileElement(name, type, isBack = false, item = null) {
  const div = document.createElement("div");
  div.className = "file-item";

  const level = Math.min(currentPath.length, 4);
  div.classList.add(`level-${level}`);

  // Check if item is shared
  const currentUser = window.auth.currentUser();
  if (currentUser) {
    const sharedFiles = JSON.parse(localStorage.getItem(`sharedFiles_${currentUser.email}`) || "[]");
    const isShared = sharedFiles.some((sf) => sf.name === name);
    if (isShared) {
      div.classList.add("shared");
    }
  }

  const icon = document.createElement("div");
  icon.className = "icon";

  if (isBack) {
    icon.textContent = "⬅️";
  } else if (type === "folder") {
    icon.textContent = "📁";
  } else {
    // Determine file icon based on extension
    const fileName = item?.name || name;
    if (isImageFile(fileName)) icon.textContent = "🖼️";
    else if (isVideoFile(fileName)) icon.textContent = "🎥";
    else if (isAudioFile(fileName)) icon.textContent = "🎵";
    else icon.textContent = "📄";
  }

  const nameDiv = document.createElement("div");
  nameDiv.className = "name";
  nameDiv.textContent = name;

  div.appendChild(icon);
  div.appendChild(nameDiv);

  // Add file details
  if (!isBack && item) {
    if (item.size) {
      const sizeDiv = document.createElement("div");
      sizeDiv.className = "size";
      sizeDiv.textContent = formatFileSize(item.size);
      div.appendChild(sizeDiv);
    }

    if (item.createdAt) {
      const dateDiv = document.createElement("div");
      dateDiv.className = "date";
      dateDiv.textContent = formatDate(item.createdAt);
      div.appendChild(dateDiv);
    }
  }

  // Click handler
  div.addEventListener("click", () => {
    if (isBack) {
      currentPath.pop();
      renderFileList();
    } else if (type === "folder") {
      currentPath.push(name);
      renderFileList();
      window.auth.addActivity(`Mở thư mục: ${name}`);
    }
  });

  // Double click: mở file khi là file, mở thư mục khi là thư mục
  if (!isBack) {
    div.addEventListener("dblclick", (e => {
      e.stopPropagation();
      if (type === "file") {
        currentContextItem = { name, type, item };
        handleView();
      } else if (type === "folder") {
        currentPath.push(name);
        renderFileList();
        window.auth.addActivity(`Mở thư mục: ${name}`);
      }
    }));
  }

  // Context menu for non-back items
  if (!isBack) {
    div.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      showContextMenu(e.clientX, e.clientY, name, type, item);
    });

    div.draggable = true;
    div.addEventListener("dragstart", (e) => {
      div.classList.add("dragging");
      e.dataTransfer.setData("text/plain", name);
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({
          name,
          type,
          item,
          sourcePath: [...currentPath],
        }),
      );
      e.dataTransfer.effectAllowed = "move";

      // Store the dragged item globally for easier access
      window.currentDraggedItem = {
        name,
        type,
        item,
        sourcePath: [...currentPath],
      };
    });

    div.addEventListener("dragend", () => {
      div.classList.remove("dragging");
      // Clear global variable
      window.currentDraggedItem = null;
      // Clear all drag-over classes
      clearAllDragOverClasses();
    });

    // Allow drop on folders
    if (type === "folder") {
      div.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        div.classList.add("drag-over");
        e.dataTransfer.dropEffect = "move";
      });

      div.addEventListener("dragleave", (e) => {
        e.stopPropagation();
        div.classList.remove("drag-over");
      });

      div.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        div.classList.remove("drag-over");
        handleDropOnFolder(e, name);
      });
    }
  }

  return div;
}

// Create/Delete functions
function showCreateDialog(isFolder) {
  isCreatingFolder = isFolder;
  const dialogTitle = document.getElementById("dialogTitle");
  const itemName = document.getElementById("itemName");
  const createDialog = document.getElementById("createDialog");

  if (dialogTitle) dialogTitle.textContent = isFolder ? "Tạo thư mục mới" : "Tạo file mới";
  if (itemName) itemName.value = "";
  if (createDialog) {
    createDialog.classList.remove("hidden");
    itemName.focus();
  }
}

function hideCreateDialog() {
  const createDialog = document.getElementById("createDialog");
  if (createDialog) {
    createDialog.classList.add("hidden");
  }
}

function handleCreate() {
  const itemName = document.getElementById("itemName");
  if (!itemName) return;

  const name = itemName.value.trim();
  if (!name) {
    alert("Vui lòng nhập tên!");
    return;
  }

  const current = getCurrentFolder();
  if (current[name]) {
    alert("Tên đã tồn tại!");
    return;
  }

  current[name] = {
    type: isCreatingFolder ? "folder" : "file",
    createdAt: new Date().toISOString(),
    children: isCreatingFolder ? {} : undefined,
    name: name,
  };

  saveFileSystem();
  renderFileList();
  hideCreateDialog();
  window.auth.addActivity(`Tạo ${isCreatingFolder ? "thư mục" : "file"}: ${name}`);
}

function handleFileUpload(e) {
  const files = Array.from(e.target.files);
  handleFileUploadFromFiles(files);
  e.target.value = ""; // Reset input
}

function handleFileUploadFromFiles(files) {
  // Lấy reference đến thư mục hiện tại trong fileSystem
  let targetFolder = fileSystem;
  for (const folder of currentPath) {
    if (!targetFolder[folder]) {
      // Tạo thư mục nếu chưa tồn tại
      targetFolder[folder] = {
        type: "folder",
        children: {},
        name: folder,
        createdAt: new Date().toISOString()
      };
    }
    // Đảm bảo luôn có children
    if (!targetFolder[folder].children) {
      targetFolder[folder].children = {};
    }
    targetFolder = targetFolder[folder].children;
  }

  let uploadedCount = 0;
  const totalFiles = files.length;

  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Thêm file vào đúng vị trí trong fileSystem
      targetFolder[file.name] = {
        type: "file",
        createdAt: new Date().toISOString(),
        size: file.size,
        content: e.target.result,
        name: file.name,
      };

      uploadedCount++;
      window.auth.addActivity(`Upload file: ${file.name}`);

      // Lưu và render sau khi tất cả file đã upload xong
      if (uploadedCount === totalFiles) {
        saveFileSystem();
        renderFileList();
      }
    };
    reader.onerror = () => {
      uploadedCount++;
      alert(`Lỗi khi upload file: ${file.name}`);
      if (uploadedCount === totalFiles) {
        saveFileSystem();
        renderFileList();
      }
    };
    reader.readAsDataURL(file);
  });
}

// Drag and drop functions
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
}

function handleDrop(e) {
  e.preventDefault();

  // Clear all drag-over classes
  clearAllDragOverClasses();

  // Handle file uploads from desktop
  if (e.dataTransfer.files.length > 0) {
    const files = Array.from(e.dataTransfer.files);
    handleFileUploadFromFiles(files);
    return;
  }

  // Handle internal file moves to current folder
  const data = e.dataTransfer.getData("application/json");
  if (data) {
    const draggedItem = JSON.parse(data);
    moveItemToCurrentFolder(draggedItem);
  }
}

// File area drag and drop handlers (for moving files out of folders)
function handleFileAreaDragOver(e) {
  e.preventDefault();
  e.stopPropagation();

  // Only show drop zone if we're not in root and dragging an internal file
  if (currentPath.length > 0) {
    const fileArea = document.querySelector(".file-area");
    if (fileArea) {
      fileArea.classList.add("drag-over");
    }
    e.dataTransfer.dropEffect = "move";
  }
}

function handleFileAreaDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();

  // Only remove if we're leaving the file area completely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    const fileArea = document.querySelector(".file-area");
    if (fileArea) {
      fileArea.classList.remove("drag-over");
    }
  }
}

function handleFileAreaDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  // Clear all drag-over classes
  clearAllDragOverClasses();

  // Try to get data from different possible sources
  let data = e.dataTransfer.getData("application/json");
  if (!data) {
    data = e.dataTransfer.getData("text/plain");
  }

  let draggedItem = null;

  if (data) {
    try {
      draggedItem = JSON.parse(data);
    } catch (error) {
      console.log("Could not parse dragged item data:", error);
    }
  }

  // Fallback to global variable
  if (!draggedItem && window.currentDraggedItem) {
    draggedItem = window.currentDraggedItem;
  }

  if (draggedItem) {
    // Move to parent folder (one level up)
    if (currentPath.length > 0) {
      const parentPath = currentPath.slice(0, -1);
      moveItem(draggedItem, parentPath);
    }
  }
}

// Breadcrumb drag and drop handlers (for moving files to parent folder)
function handleBreadcrumbDragOver(e) {
  e.preventDefault();
  e.stopPropagation();

  // Only show drop zone if we're not in root
  if (currentPath.length > 0) {
    const currentPathElement = document.getElementById("currentPath");
    if (currentPathElement) {
      currentPathElement.classList.add("drag-over");
    }
    e.dataTransfer.dropEffect = "move";
  }
}

function handleBreadcrumbDragLeave(e) {
  e.preventDefault();
  e.stopPropagation();

  // Only remove if we're leaving the breadcrumb completely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    const currentPathElement = document.getElementById("currentPath");
    if (currentPathElement) {
      currentPathElement.classList.remove("drag-over");
    }
  }
}

function handleBreadcrumbDrop(e) {
  e.preventDefault();
  e.stopPropagation();

  // Clear all drag-over classes
  clearAllDragOverClasses();

  // Try to get data from different possible sources
  let data = e.dataTransfer.getData("application/json");
  if (!data) {
    data = e.dataTransfer.getData("text/plain");
  }

  let draggedItem = null;

  if (data) {
    try {
      draggedItem = JSON.parse(data);
    } catch (error) {
      console.log("Could not parse dragged item data:", error);
    }
  }

  // Fallback to global variable
  if (!draggedItem && window.currentDraggedItem) {
    draggedItem = window.currentDraggedItem;
  }

  if (draggedItem) {
    // Move to parent folder (one level up)
    if (currentPath.length > 0) {
      const parentPath = currentPath.slice(0, -1);
      moveItem(draggedItem, parentPath);
    }
  }
}

function handleDropOnFolder(e, targetFolderName) {
  // Clear all drag-over classes
  clearAllDragOverClasses();

  const data = e.dataTransfer.getData("application/json");
  if (data) {
    const draggedItem = JSON.parse(data);

    // Don't allow dropping on itself
    if (draggedItem.name === targetFolderName) {
      return;
    }

    moveItemToFolder(draggedItem, targetFolderName);
  }
}

function moveItemToCurrentFolder(draggedItem) {
  // Don't move if already in current folder
  if (arraysEqual(draggedItem.sourcePath, currentPath)) {
    return;
  }

  moveItem(draggedItem, currentPath);
}

function moveItemToFolder(draggedItem, targetFolderName) {
  const targetPath = [...currentPath, targetFolderName];
  moveItem(draggedItem, targetPath);
}

function moveItem(draggedItem, targetPath) {
  // Get source location
  let sourceFolder = fileSystem;
  for (const folder of draggedItem.sourcePath) {
    sourceFolder = sourceFolder[folder]?.children || sourceFolder[folder] || {};
  }

  // Get target location
  let targetFolder = fileSystem;
  for (const folder of targetPath) {
    if (!targetFolder[folder]) {
      alert("Thư mục đích không tồn tại!");
      return;
    }
    targetFolder = targetFolder[folder].children || {};
  }

  // Check if item exists in source
  if (!sourceFolder[draggedItem.name]) {
    alert("File/thư mục nguồn không tồn tại!");
    return;
  }

  // Check if item already exists in target
  if (targetFolder[draggedItem.name]) {
    alert("File/thư mục đã tồn tại trong thư mục đích!");
    return;
  }

  // Move the item
  targetFolder[draggedItem.name] = sourceFolder[draggedItem.name];
  delete sourceFolder[draggedItem.name];

  saveFileSystem();
  renderFileList();

  const targetPathStr = targetPath.length === 0 ? "Root" : targetPath.join("/");
  const sourcePathStr = draggedItem.sourcePath.length === 0 ? "Root" : draggedItem.sourcePath.join("/");
  window.auth.addActivity(`Di chuyển: ${draggedItem.name} từ ${sourcePathStr} → ${targetPathStr}`);
}

function arraysEqual(a, b) {
  return a.length === b.length && a.every((val, i) => val === b[i]);
}

// Function to clear all drag-over classes
function clearAllDragOverClasses() {
  // Clear file area drag-over
  const fileArea = document.querySelector(".file-area");
  if (fileArea) {
    fileArea.classList.remove("drag-over");
  }

  // Clear breadcrumb drag-over
  const currentPathElement = document.getElementById("currentPath");
  if (currentPathElement) {
    currentPathElement.classList.remove("drag-over");
  }

  // Clear all folder drag-over classes
  const dragOverFolders = document.querySelectorAll(".file-item.drag-over");
  dragOverFolders.forEach(folder => {
    folder.classList.remove("drag-over");
  });
}

// Search and filter functions
function handleSearch(e) {
  searchTerm = e.target.value.trim();
  renderFileList();
}

function handleTypeFilter(e) {
  typeFilter = e.target.value;
  renderFileList();
}

function clearFilters() {
  searchTerm = "";
  typeFilter = "";
  const searchInput = document.getElementById("searchInput");
  const typeFilterSelect = document.getElementById("typeFilter");

  if (searchInput) searchInput.value = "";
  if (typeFilterSelect) typeFilterSelect.value = "";
  renderFileList();
}

// Context menu functions
function showContextMenu(x, y, name, type, item) {
  currentContextItem = { name, type, item };
  const contextMenu = document.getElementById("contextMenu");
  if (contextMenu) {
    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.classList.remove("hidden");
  }
}

function hideContextMenu() {
  const contextMenu = document.getElementById("contextMenu");
  if (contextMenu) {
    contextMenu.classList.add("hidden");
  }
}

function handleRename() {
  if (!currentContextItem) return;
  const oldName = currentContextItem.name;
  const newName = prompt("Nhập tên mới:", oldName);
  if (newName && newName.trim() !== "") {
    const current = getCurrentFolder();
    if (current[newName]) {
      alert("Tên đã tồn tại!");
      return;
    }

    // Move item and keep reference
    current[newName] = current[oldName];

    // Nếu đối tượng tồn tại, cập nhật thuộc tính name bên trong object
    if (current[newName] && typeof current[newName] === "object") {
      current[newName].name = newName;
    }

    delete current[oldName];

    // Cập nhật currentContextItem để các hành động tiếp theo (xem, tải...) dùng tên mới
    currentContextItem.name = newName;
    currentContextItem.item = current[newName];

    // --- CẬP NHẬT THÔNG TIN CHIA SẺ ĐỂ NGƯỜI ĐƯỢC CHIA SẺ VẪN THẤY FILE ---
    const currentUser = window.auth.currentUser();
    if (currentUser) {
      // Cập nhật danh sách chia sẻ của chủ sở hữu
      const ownerKey = `sharedFiles_${currentUser.username}`;
      const ownerShared = JSON.parse(localStorage.getItem(ownerKey) || "[]");
      let ownerChanged = false;
      ownerShared.forEach((s) => {
        if ((s.sharedBy === currentUser.username || !s.sharedBy) && arraysEqual(s.path || [], currentPath) && s.name === oldName) {
          s.name = newName;
          ownerChanged = true;
        }
      });
      if (ownerChanged) localStorage.setItem(ownerKey, JSON.stringify(ownerShared));

      // Cập nhật global shared list (dùng để hiển thị cho người khác)
      const globalShared = JSON.parse(localStorage.getItem("globalSharedFiles") || "[]");
      let globalChanged = false;
      globalShared.forEach((s) => {
        if (s.sharedBy === currentUser.username && arraysEqual(s.path || [], currentPath) && s.name === oldName) {
          s.name = newName;
          globalChanged = true;
        }
      });
      if (globalChanged) localStorage.setItem("globalSharedFiles", JSON.stringify(globalShared));
    }
    // ---------------------------------------------------------------------

    saveFileSystem();
    renderFileList();
    window.auth.addActivity(`Đổi tên: ${oldName} → ${newName}`);
  }
}

function handleShareItem() {
  if (!currentContextItem) return;
  showShareDialog(currentContextItem.name);
}

function handleDownload() {
  if (!currentContextItem) return;
  const current = getCurrentFolder();
  const file = current[currentContextItem.name];
  if (file.type === "file") {
    const link = document.createElement("a");
    link.href = file.content;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.auth.addActivity(`Tải xuống file: ${file.name}`);
  }
}

function handleDelete() {
  if (!currentContextItem) return;
  if (confirm(`Xóa ${currentContextItem.type === "folder" ? "thư mục" : "file"} ${currentContextItem.name}?`)) {
    const current = getCurrentFolder();
    delete current[currentContextItem.name];
    saveFileSystem();
    renderFileList();
    window.auth.addActivity(`Xóa ${currentContextItem.type === "folder" ? "thư mục" : "file"}: ${currentContextItem.name}`);
  }
}

function handleView() {
  if (!currentContextItem) return;
  const current = getCurrentFolder();
  const file = current[currentContextItem.name];
  if (file.type !== "file") return;

  const viewDialog = document.getElementById("viewDialog");
  const viewDialogContent = document.getElementById("viewDialogContent");
  if (!viewDialog || !viewDialogContent) return;

  const fileName = file.name || "";
  let html = `<h3>Xem file: ${fileName}</h3>`;

  if (isImageFile(fileName)) {
    html += `<img src="${file.content}" alt="${fileName}" style="max-width:100%;max-height:400px;">`;
  } else if (fileName.endsWith(".pdf")) {
    html += `<iframe src="${file.content}" style="width:100%;height:500px;" frameborder="0"></iframe>`;
  } else if (fileName.endsWith(".docx")) {
    html += `<div id="docxContent" style="max-width:100%;max-height:400px;overflow:auto;border:1px solid #ccc;padding:10px;"></div>`;
    setTimeout(() => {
      const arrayBuffer = dataURLtoBlob(file.content).arrayBuffer();
      arrayBuffer.then((buffer) => {
        mammoth.convertToHtml({ arrayBuffer: buffer })
          .then((result) => {
            document.getElementById("docxContent").innerHTML = result.value;
          })
          .catch((err) => {
            document.getElementById("docxContent").innerHTML = `<p>Lỗi khi hiển thị file DOCX.</p>`;
            console.error(err);
          });
      });
    }, 200);
  } else if (isVideoFile(fileName)) {
    html += `<video controls style="max-width:100%;max-height:400px;"><source src="${file.content}">Trình duyệt của bạn không hỗ trợ thẻ video.</video>`;
  } else if (isAudioFile(fileName)) {
    html += `<audio controls style="width:100%;"><source src="${file.content}">Trình duyệt của bạn không hỗ trợ thẻ audio.</audio>`;
  } else {
    html += `<p>Không hỗ trợ xem trực tiếp loại file này.</p>`;
  }

  html += `<button id="closeViewDialog" class="btn-secondary">Đóng</button>`;
  viewDialogContent.innerHTML = html;
  viewDialog.classList.remove("hidden");

  document.getElementById("closeViewDialog").onclick = hideViewDialog;
}

function hideViewDialog() {
  const viewDialog = document.getElementById("viewDialog");
  if (viewDialog) viewDialog.classList.add("hidden");
}

// Hàm chuyển dataURL sang Blob
function dataURLtoBlob(dataurl) {
  const arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
    bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  for (let i = 0; i < n; i++) u8arr[i] = bstr.charCodeAt(i);
  return new Blob([u8arr], { type: mime });
}

// Utility functions
function isImageFile(filename) {
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp", ".jfif", ".svg"];
  return imageExts.some((ext) => filename.toLowerCase().endsWith(ext));
}

function isVideoFile(filename) {
  const videoExts = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"];
  return videoExts.some((ext) => filename.toLowerCase().endsWith(ext));
}

function isAudioFile(filename) {
  const audioExts = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];
  return audioExts.some((ext) => filename.toLowerCase().endsWith(ext));
}

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

// Export for use in other modules
window.fileManager = {
  loadFileSystem,
  saveFileSystem,
  renderFileList,
  showCreateDialog,
  hideCreateDialog,
  handleCreate,
  handleFileUpload,
  handleFileUploadFromFiles,
  handleSearch,
  handleTypeFilter,
  clearFilters,
  showContextMenu,
  hideContextMenu,
  handleRename,
  handleShareItem,
  handleDownload,
  handleDelete,
  handleDragOver,
  handleDrop,
  handleFileAreaDragOver,
  handleFileAreaDragLeave,
  handleFileAreaDrop,
  handleBreadcrumbDragOver,
  handleBreadcrumbDragLeave,
  handleBreadcrumbDrop,
  clearAllDragOverClasses,
  handleView,
  hideViewDialog,
  get fileSystem() { return fileSystem; },
  get currentPath() { return currentPath; }
};
