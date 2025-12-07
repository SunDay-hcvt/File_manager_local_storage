const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener('click', () =>{
    container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener('click', () =>{
    container.classList.remove("sign-up-mode");
});

document.addEventListener("DOMContentLoaded", () => {
  // Kiểm tra nếu người dùng đã đăng nhập
  if (window.auth.checkAuth()) {
    window.location.href = "dashboard.html";
    return;
  }

  // Thiết lập các sự kiện
  const signInForm = document.querySelector(".sign-in-form");
  const signUpForm = document.querySelector(".sign-up-form");

  if (signInForm) {
    signInForm.addEventListener("submit", window.auth.handleLogin);
  }

  if (signUpForm) {
    signUpForm.addEventListener("submit", window.auth.handleRegister);
  }
});
