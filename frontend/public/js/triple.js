
/* ==============================
   LOAD BET INFO
============================== */
const bet = JSON.parse(localStorage.getItem("betInfo"));
if (!bet) {
  alert("No game selected");
  location.href = "gamezone.html";
}

const gameId = bet.gameId || bet.matchId;

/* SHOW GAME DETAILS */
document.getElementById("gameName").innerText = bet.gameName;
document.getElementById("betInfoText").innerText =
  `Triple Panna • ${bet.betFor.toUpperCase()}`;

/* ==============================
   TRIPLE PANNA DATA (DIGIT WISE)
============================== */
const tpPannaMap = {
  "1": ["777"],
  "2": ["444"],
  "3": ["111"],
  "4": ["888"],
  "5": ["555"],
  "6": ["222"],
  "7": ["999"],
  "8": ["666"],
  "9": ["333"],
  "0": ["000"]
};

let currentList = [];
const grid = document.getElementById("pannaGrid");

/* ==============================
   RENDER PANNA
============================== */
function render(list) {
  grid.innerHTML = "";
  list.forEach(p => {
    grid.innerHTML += `
      <div class="card">
        <h2>${p}</h2>
        <input type="number" id="bid_${p}" placeholder="₹ Amount">
        <div class="hint">💡 Enter bid amount for ${p}</div>
      </div>
    `;
  });
}

/* ==============================
   FILTER BY DIGIT
============================== */
function filterDigit(d) {
  document.querySelectorAll(".digits button")
    .forEach(b => b.classList.remove("active"));

  event.target.classList.add("active");
  currentList = tpPannaMap[d] || [];
  render(currentList);
}

/* ==============================
   SEARCH PANNA
============================== */
function searchPanna() {
  const v = document.getElementById("searchInput").value;
  render(currentList.filter(p => p.includes(v)));
}

/* ==============================
   SUBMIT BIDS
============================== */
function submitBids() {
  let bids = [];
  let total = 0;

  currentList.forEach(p => {
    const input = document.getElementById("bid_" + p);
    if (input && input.value > 0) {
      bids.push({ number: p, amount: +input.value });
      total += +input.value;
    }
  });

  if (!bids.length) {
    alert("Enter bid amount");
    return;
  }

  localStorage.setItem("pendingBet", JSON.stringify({
    matchId: gameId,
    gameName: bet.gameName,
    betType: "triple-panna",
    betFor: bet.betFor,
    bids,
    totalAmount: total
  }));

  location.href = "bid-details.html";
}

/* ==============================
   MENU + BALANCE
============================== */
function toggleMenu() {
  document.getElementById("sideMenu").classList.toggle("active");
}

function goPage(page) {
  window.location.href = page;
}

const API = "https://tirupati-matka.onrender.com/api/auth";
const token = localStorage.getItem("token");

async function loadBalance() {
  const r = await fetch(API + "/balance", {
    headers: { Authorization: "Bearer " + token }
  });
  const d = await r.json();
  if (d.success) balance.innerText = "₹ " + d.balance;
}
loadBalance();

