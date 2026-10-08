// ======================
// CONFIG
// ======================
const API = "https://tirupati-matka.onrender.com/api/auth";
const token = localStorage.getItem("token");

if (!token) {
  location.replace("auth.html");
}

// ======================
// LOAD PROFILE
// ======================
async function loadProfile() {
  try {
    const res = await fetch(`${API}/profile`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert(data.msg || "Session expired. Please login again.");
      localStorage.removeItem("token");
      location.replace("auth.html");
      return;
    }

    const u = data.user;

    // Basic info
    document.getElementById("username").innerText = u.name || "Player";
    document.getElementById("userRole").innerText = data.dashboard || "User Area";

    // Optional extra fields (if present in HTML)
    if (document.getElementById("mobile")) {
      document.getElementById("mobile").innerText = u.phone || "-";
    }
    if (document.getElementById("email")) {
      document.getElementById("email").innerText = u.email || "-";
    }

    // User ID
const userIdEl = document.getElementById("userid");
if (userIdEl) {
  userIdEl.innerText = u.id || "-";
}
    // Avatar
    if (u.avatarUrl) {
      document.getElementById("avatar").src = u.avatarUrl;
    }

    // Admin UI
    if (u.isAdmin) {
      const adminArea = document.getElementById("adminArea");
      if (adminArea) adminArea.style.display = "block";
      document.body.classList.add("admin");
    }

  } catch (err) {
    console.error("Profile load error:", err);
    alert("Unable to load profile. Try again later.");
  }
}

loadProfile();

// ======================
// AVATAR CLICK → FILE PICK
// ======================
const avatarImg = document.getElementById("avatar");
const avatarInput = document.getElementById("avatarInput");

if (avatarImg && avatarInput) {
  avatarImg.addEventListener("click", () => avatarInput.click());
}

// ======================
// AVATAR UPLOAD
// ======================
async function uploadAvatar() {
  const file = avatarInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Please select a valid image");
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    alert("Image must be under 2MB");
    return;
  }

  const form = new FormData();
  form.append("avatar", file);

  try {
    const res = await fetch(`${API}/upload-avatar`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: form
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      throw new Error(data.msg || "Avatar upload failed");
    }

    // ✅ Backend sends avatarUrl
    avatarImg.src = data.avatarUrl;

    alert("Avatar updated successfully");

  } catch (err) {
    console.error("Avatar upload error:", err);
    alert(err.message || "Server error while uploading avatar");
  }
}

