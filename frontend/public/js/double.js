
/* ==============================
   LOAD BET INFO (SAME AS SINGLE)
============================== */
let bet = null;
try {
  bet = JSON.parse(localStorage.getItem("betInfo"));
} catch (e) {}

if (!bet?.gameId && !bet?.matchId) {
  alert("No bet selected");
  window.location.href = "gamezone.html";
}

const gameId = bet.gameId || bet.matchId;

/* ==============================
   PANNA GRID
============================== */
const pannaGrid = document.getElementById("pannaGrid");

/* Double Panna list */
let pannaList = [
  "118","226","244","299",
  "334","355","366","399",
  "445","466","477","488",
  "559","577","588","668",
  "677","688","778","799",
  "889","899"
];

function renderPanna(list) {
  pannaGrid.innerHTML = "";

  list.forEach(panna => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <h2>${panna}</h2>
      <input type="number" placeholder="₹ Amount" id="bid_${panna}">
      <div class="hint">💡 Enter bid amount for ${panna}</div>
    `;

    pannaGrid.appendChild(card);
  });
}

renderPanna(pannaList);

/* ==============================
   DIGIT FILTER
============================== */
function filterDigit(digit, btn) {
  document.querySelectorAll(".digits button").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");

  const filtered = pannaList.filter(p => p.startsWith(digit));
  renderPanna(filtered);
}

/* ==============================
   SEARCH
============================== */
function searchPanna() {
  const value = document.getElementById("searchInput").value;
  const result = pannaList.filter(p => p.includes(value));
  renderPanna(result);
}

/* ==============================
   COLLECT DOUBLE PANNA → DETAILS
============================== */
function submitBids() {
  let selectedBids = [];
  let totalAmount = 0;

  pannaList.forEach(panna => {
    const input = document.getElementById("bid_" + panna);
    if (input && Number(input.value) > 0) {
      selectedBids.push({
        number: panna,
        amount: Number(input.value)
      });
      totalAmount += Number(input.value);
    }
  });

  if (!selectedBids.length) {
    alert("Please enter at least one bid amount");
    return;
  }

  localStorage.setItem("pendingBet", JSON.stringify({
    matchId: gameId,
    gameName: bet.gameName,
    betType: "double-panna",   // ✅ ENUM SAFE
    betFor: bet.betFor,        // open / close
    bids: selectedBids,
    totalAmount
  }));

  window.location.href = "bid-details.html";
}

