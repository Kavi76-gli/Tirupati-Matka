function go(page) {
  window.location.href = page;
}

function closeMenu() {
  window.history.back();
}

function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    window.location.href = "login.html";
  }
}