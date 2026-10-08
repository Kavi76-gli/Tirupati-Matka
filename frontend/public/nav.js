document.addEventListener("DOMContentLoaded", () => {

  // ==========================
  // AUTO APK UPDATE CHECK
  // ==========================



(async function checkUpdate() {
  try {
    const CURRENT_VERSION = "1.0.1";

    const controller = new AbortController();
    setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      "https://kalyanmaster.online/app-version.json",
      {
        cache: "no-store",
        signal: controller.signal
      }
    );

    if (!res.ok) return;

    const data = await res.json();

    if (data.version !== CURRENT_VERSION) {
      const msg = data.force
        ? "New update required to continue"
        : "New update available. Download now?";
      if (confirm(msg)) window.location.href = data.apkUrl;
    }
  } catch {
    // 🔕 intentionally silent (offline / blocked / localhost)
  }
})();


  // ==========================
  // BOTTOM NAV CLICK SYSTEM
  // ==========================
  const navItems = document.querySelectorAll(".nav-item");
  const indicator = document.querySelector(".active-indicator");
  const currentPage = location.pathname.split("/").pop() || "gamezone.html";

  function moveIndicator(item) {
    if (!indicator) return;
    indicator.style.transform = `translateX(${item.offsetLeft}px)`;
    indicator.style.width = `${item.offsetWidth}px`;
  }

  navItems.forEach(item => {
    const page = item.dataset.page;
    if (page === currentPage) {
      item.classList.add("active");
      moveIndicator(item);
    }
    item.addEventListener("click", () => window.location.href = page);
  });

  // ==========================
  // PAGE HISTORY (RECENTS)
  // ==========================
  let visitedPages = JSON.parse(localStorage.getItem("visitedPages") || "[]");
  if (!visitedPages.includes(currentPage)) {
    visitedPages.push(currentPage);
    if (visitedPages.length > 10) visitedPages.shift();
    localStorage.setItem("visitedPages", JSON.stringify(visitedPages));
  }

  function openRecents() {
    if (document.getElementById("recentsModal")) return;

    const modal = document.createElement("div");
    modal.id = "recentsModal";
    modal.style.cssText = `
      position:fixed; inset:0;
      background:rgba(0,0,0,.95);
      z-index:9999;
      color:#00eaff;
      padding:20px;
      overflow:auto;
      display:flex;
      flex-direction:column;
      align-items:center;
    `;
    const title = document.createElement("h2");
    title.textContent = "Recent Pages";
    title.style.marginBottom = "20px";
    modal.appendChild(title);

    visitedPages.slice().reverse().forEach(p => {
      const btn = document.createElement("div");
      btn.textContent = p;
      btn.style.cssText = `
        padding:14px;
        margin:8px 0;
        width:90%;
        background:#020b1a;
        border:1px solid #00eaff;
        border-radius:12px;
        text-align:center;
        cursor:pointer;
      `;
      btn.onclick = () => window.location.href = p;
      modal.appendChild(btn);
    });

    const close = document.createElement("div");
    close.textContent = "✕ Close";
    close.style.cssText = `
      position:fixed;
      top:15px;
      right:15px;
      padding:8px 14px;
      background:#ff0044;
      border-radius:8px;
      color:#fff;
      cursor:pointer;
    `;
    close.onclick = () => modal.remove();
    modal.appendChild(close);

    document.body.appendChild(modal);
  }

  // ==========================
  // GESTURE NAVIGATION ENGINE
  // ==========================
  let startX = 0, startY = 0, currentY = 0;
  let startTime = 0, pulling = false;
  const EDGE = 40, SWIPE = 80, PULL = 120;

  document.addEventListener("touchstart", e => {
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startTime = Date.now();
    pulling = false;
  });

  document.addEventListener("touchmove", e => {
    currentY = e.touches[0].clientY;
    // block native pull refresh
    if (startY < 80 && currentY - startY > 60) pulling = true;
  }, { passive:false });

  document.addEventListener("touchend", e => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const diffX = endX - startX;
    const diffY = endY - startY;
    const time = Date.now() - startTime;

    // ⬇ Pull down → Reload
    if (pulling && diffY > PULL) { location.reload(); return; }

    // ⬅ Swipe from left → Back
    if (startX < EDGE && diffX > SWIPE && time < 500) { history.back(); return; }

    // ➡ Swipe from right → Forward
    if (startX > window.innerWidth - EDGE && diffX < -SWIPE && time < 500) { history.forward(); return; }

    // ⬆ Swipe up → Home
    if (startY > window.innerHeight - EDGE && diffY < -SWIPE && time < 500) { window.location.href="gamezone.html"; return; }

    // ⬆ Hold → Recents
    if (startY > window.innerHeight - EDGE && diffY < -30 && diffY > -SWIPE && time > 250) { openRecents(); return; }
  });

  // ==========================
  // AUTO HIDE NAV ON SCROLL
  // ==========================
  let lastScroll = window.scrollY;
  const sysNav = document.querySelector(".bottom-nav");
  window.addEventListener("scroll", () => {
    if (!sysNav) return;
    if (window.scrollY > lastScroll + 10) sysNav.classList.add("hide");
    else if (window.scrollY < lastScroll - 10) sysNav.classList.remove("hide");
    lastScroll = window.scrollY;
  });

  // ==========================
  // DISABLE NATIVE OVERSCROLL
  // ==========================
  document.body.style.overscrollBehavior = "none";
  document.documentElement.style.overscrollBehavior = "none";

});
