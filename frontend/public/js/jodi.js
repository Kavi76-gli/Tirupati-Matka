/* ==============================
   LOAD BET INFO
============================== */
let bet = null;
try {
  bet = JSON.parse(localStorage.getItem("betInfo"));
  console.log("betInfo:", bet);
} catch (e) {}

if (!bet?.gameId && !bet?.matchId) {
  alert("No bet selected");
  window.location.href = "gamezone.html";
}

const gameId = bet.gameId || bet.matchId;
const token = localStorage.getItem("token");

/* ==============================
   REAL JODI DATA (TOTAL WISE)
============================== */
const JODI_BY_TOTAL = {
  0: ["00","19","28","37","46","55","64","73","82","91"],
  1: ["01","10","29","38","47","56","65","74","83","92"],
  2: ["02","11","20","39","48","57","66","75","84","93"],
  3: ["03","12","21","30","49","58","67","76","85","94"],
  4: ["04","13","22","31","40","59","68","77","86","95"],
  5: ["05","14","23","32","41","50","69","78","87","96"],
  6: ["06","15","24","33","42","51","60","79","88","97"],
  7: ["07","16","25","34","43","52","61","70","89","98"],
  8: ["08","17","26","35","44","53","62","71","80","99"],
  9: ["09","18","27","36","45","54","63","72","81","90"]
};

/* ==============================
   CREATE JODI GRID
============================== */
const jodiGrid = document.getElementById("jodiGrid");

Object.keys(JODI_BY_TOTAL).forEach(total => {

  const header = document.createElement("div");
  header.className = "total-header";
  header.innerText = `Total ${total}`;
  jodiGrid.appendChild(header);

  JODI_BY_TOTAL[total].forEach(jodi => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${jodi}</h2>
      <input 
        type="number" 
        min="1" 
        placeholder="₹ Amount" 
        id="bid_${jodi}"
      />
      <div class="hint">💡 Jodi ${jodi} (Total ${total})</div>
    `;

    jodiGrid.appendChild(card);
  });
});


/* ==============================
   FILTER BY DIGIT
============================== */
function filterDigit(digit) {
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const jodi = card.querySelector("h2")?.innerText;
    if (!jodi) return;

    card.style.display = jodi.includes(digit) ? "block" : "none";
  });

  updateTotalHeaders();
}

/* ==============================
   SEARCH JODI
============================== */
function searchJodi() {
  const val = document.getElementById("searchInput").value.trim();
  const cards = document.querySelectorAll(".card");

  cards.forEach(card => {
    const jodi = card.querySelector("h2")?.innerText;
    if (!jodi) return;

    card.style.display = jodi.includes(val) ? "block" : "none";
  });

  updateTotalHeaders();
}

/* ==============================
   RESET FILTER
============================== */
function resetFilter() {
  document.getElementById("searchInput").value = "";
  document.querySelectorAll(".card").forEach(card => {
    card.style.display = "block";
  });

  updateTotalHeaders();
}

/* ==============================
   HIDE EMPTY TOTAL HEADERS
============================== */
function updateTotalHeaders() {
  document.querySelectorAll(".total-header").forEach(header => {
    let next = header.nextElementSibling;
    let visible = false;

    while (next && !next.classList.contains("total-header")) {
      if (next.style.display !== "none") {
        visible = true;
      }
      next = next.nextElementSibling;
    }

    header.style.display = visible ? "block" : "none";
  });
}

/* ==============================
   TIME FORMATTER
============================== */
function formatTime12(time) {
  if (!time) return "--:--";

  let d;
  if (time.includes("T")) {
    d = new Date(time);
  } else {
    const [h, m] = time.split(":").map(Number);
    d = new Date();
    d.setHours(h, m, 0, 0);
  }

  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;

  return `${h.toString().padStart(2,"0")}:${m
    .toString()
    .padStart(2,"0")} ${ampm}`;
}

/* ==============================
   LOAD LIVE GAME DATA
============================== */
(async () => {
  let game = {
    gameName: bet.gameName,
    openTime: bet.openTime,
    closeTime: bet.closeTime,
    openResult: null,
    closeResult: null
  };

  try {
    const res = await fetch(
      `https://tirupati-matka.onrender.com/api/match/gamezone/${gameId}`,
      { headers: { Authorization: "Bearer " + token } }
    );
    const data = await res.json();

    if (data.success && data.game) {
      game = { ...game, ...data.game };
    }
  } catch (err) {
    console.warn("Using local data only");
  }

  document.querySelector(".card h2").innerText = game.gameName;
  document.querySelector(".card .subtitle").innerText =
    `${bet.betType.toUpperCase()} (${bet.betFor.toUpperCase()})`;

  console.log("Open:", formatTime12(game.openTime));
  console.log("Close:", formatTime12(game.closeTime));

  // save updated results
  bet.openResult = game.openResult;
  bet.closeResult = game.closeResult;
  localStorage.setItem("betInfo", JSON.stringify(bet));
})();

/* ==============================
   SUBMIT JODI BIDS
============================== */
function submitBids() {
  let bids = [];
  let totalAmount = 0;

  Object.values(JODI_BY_TOTAL).flat().forEach(jodi => {
    const amt = Number(
      document.getElementById("bid_" + jodi).value
    );

    if (amt > 0) {
      bids.push({
        number: jodi,
        amount: amt
      });
      totalAmount += amt;
    }
  });

  if (!bids.length) {
    alert("Please enter at least one bid amount");
    return;
  }

  localStorage.setItem("pendingBet", JSON.stringify({
    matchId: gameId,
    gameName: bet.gameName,
    betType: bet.betType,
    betFor: bet.betFor,
    bids,
    totalAmount
  }));

  window.location.href = "bid-details.html";
}

/* ==============================
   MENU & NAVIGATION
============================== */
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("active");
}

function goPage(page) {
  window.location.href = page;
}

/* ==============================
   LOAD BALANCE
============================== */
const API = "https://tirupati-matka.onrender.com/api/auth";
const balance = document.getElementById("balance");

async function loadBalance() {
  try {
    const r = await fetch(API + "/balance", {
      headers: { Authorization: "Bearer " + token }
    });
    const d = await r.json();
    if (d.success) balance.innerText = "₹ " + d.balance;
  } catch (e) {}
}
loadBalance();
