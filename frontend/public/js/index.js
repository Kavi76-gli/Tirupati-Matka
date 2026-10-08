const spans = document.querySelectorAll(".word span:not(.space)");
const letters = [...spans].map(s => s.dataset.letter);
let step = 0;

/* Step 1: Start with numbers */
spans.forEach(span => {
  span.textContent = Math.floor(Math.random() * 9);
});

/* Step 2: Smooth counting down */
const interval = setInterval(() => {
  spans.forEach(span => {
    span.textContent = Math.floor(Math.random() * 9);
  });

  step++;

  /* Step 3: Lock letters one by one */
  if (step >= 20) {
    clearInterval(interval);

    spans.forEach((span, i) => {
      setTimeout(() => {
        span.textContent = letters[i];
        span.style.transform = "scale(1.2)";
        setTimeout(() => {
          span.style.transform = "scale(1)";
        }, 300);
      }, i * 120);
    });
  }
}, 80);

/* Click → Auth */
document.querySelector(".splash").addEventListener("click", () => {
  document.body.style.opacity = "0";
  document.body.style.transition = "opacity 0.8s";
  setTimeout(() => {
    window.location.href = "auth.html";
  }, 800);
});

const API = "https://tirupati-matka.onrender.com/api/auth";

async function checkLogin() {
  const token = localStorage.getItem("token");

  // ❌ no token → go to auth
  if (!token) {
    window.location.replace("auth.html");
    return;
  }

  try {
    const res = await fetch(API + "/me", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    // ❌ token invalid / expired
    if (!res.ok) {
      localStorage.clear();
      window.location.replace("auth.html");
      return;
    }

    // ✅ token valid → user logged in
    const data = await res.json();

    if (data.success) {
      window.location.replace("gamezone.html");
    } else {
      localStorage.clear();
      window.location.replace("auth.html");
    }

  } catch (err) {
    console.error("checkLogin error:", err);
    window.location.replace("auth.html");
  }
}
