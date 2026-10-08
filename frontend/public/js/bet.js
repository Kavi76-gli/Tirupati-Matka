
const bet = JSON.parse(localStorage.getItem("betInfo"));

if (!bet) {
  alert("No bet selected");
  window.location.href = "play.html";
}

// ====== SET HEADER DATA ======
document.querySelector(".market-info h3").innerText =
  `${bet.gameName} (${bet.betType.toUpperCase()})`;

const openTime = new Date(bet.openTime);
const closeTime = new Date(bet.closeTime);

document.querySelector(".market-info span").innerText =
  openTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
  " – " +
  closeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

document.querySelector(".game-type strong").innerText =
  bet.betType.toUpperCase();

document.querySelector(".market-icon").innerText =
  bet.gameName.charAt(0);

// ====== OPEN / CLOSE BUTTON LOGIC ======
const openBtn = document.getElementById("openBtn");
const closeBtn = document.getElementById("closeBtn");

// initial active
if (bet.betFor === "open") {
  openBtn.classList.add("active");
} else {
  closeBtn.classList.add("active");
}

function selectType(type) {
  bet.betFor = type;
  localStorage.setItem("betInfo", JSON.stringify(bet));

  openBtn.classList.remove("active");
  closeBtn.classList.remove("active");

  if (type === "open") openBtn.classList.add("active");
  else closeBtn.classList.add("active");

  // 🔥 UNIVERSAL REDIRECT LOGIC
  setTimeout(() => {
    const pageMap = {
      single: "single.html",
      jodi: "jodi.html",
      singlepanna: "singlepanna.html",
      doublepanna: "doublepanna.html",
      triplepanna: "triplepanna.html",
      halfsangam: "halfsangam.html",
      fullsangam: "fullsangam.html"
    };

    const nextPage = pageMap[bet.betType];

    if (!nextPage) {
      alert("Invalid bet type");
      return;
    }

    window.location.href = nextPage;
  }, 300);
}

