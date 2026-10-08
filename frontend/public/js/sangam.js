/* ======================================================
   CONFIG
====================================================== */
const API = "https://kalyanmaster.onrender.com/api/auth";
const token = localStorage.getItem("token");

/* ======================================================
   LOAD BALANCE
====================================================== */
async function loadBalance() {
  try {
    const res = await fetch(API + "/balance", {
      headers: { Authorization: "Bearer " + token }
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById("wallet").innerText = data.balance;
    }
  } catch (e) {
    console.error("Balance error:", e);
  }
}
loadBalance();

/* ======================================================
   LOAD BET INFO (FROM bet.js)
====================================================== */
let bet = null;
try {
  bet = JSON.parse(localStorage.getItem("betInfo"));
} catch {
  bet = null;
}

if (!bet || !bet.gameId) {
  alert("No game selected");
  location.href = "play.html";
}

/* ======================================================
   BASIC UI SETUP
====================================================== */
document.getElementById("gameTitle").innerText = bet.gameName;
document.getElementById("marketName").innerText = bet.gameName;

/* ======================================================
   INPUT BOX REFERENCES
====================================================== */
const openPannaBox  = document.getElementById("openPannaBox");
const openDigitBox  = document.getElementById("openDigitBox");
const closeDigitBox = document.getElementById("closeDigitBox");
const closePannaBox = document.getElementById("closePannaBox");

const openPanna  = document.getElementById("openPanna");
const openDigit  = document.getElementById("openDigit");
const closeDigit = document.getElementById("closeDigit");
const closePanna = document.getElementById("closePanna");

/* ======================================================
   AUTO SHOW FIELDS BASED ON bet.betFor
====================================================== */
function setupHalfSangamUI() {

  // hide all first
  openPannaBox.style.display  = "none";
  openDigitBox.style.display  = "none";
  closeDigitBox.style.display = "none";
  closePannaBox.style.display = "none";

  // OPEN → Open Digit + Close Panna
  if (bet.betFor === "open") {
    openDigitBox.style.display  = "block";
    closePannaBox.style.display = "block";
  }

  // CLOSE → Open Panna + Close Digit
  if (bet.betFor === "close") {
    openPannaBox.style.display  = "block";
    closeDigitBox.style.display = "block";
  }
}
setupHalfSangamUI();

/* ======================================================
   VALIDATION HELPERS
====================================================== */
function isValidDigit(v) {
  return v !== "" && v >= 0 && v <= 9;
}

function isValidPanna(v) {
  return v !== "" && v >= 0 && v <= 999;
}

/* ======================================================
   SUBMIT HALF SANGAM
====================================================== */
function submitHalfSangam() {

  const amount = Number(document.getElementById("amount").value);
  if (amount < 10) {
    alert("Minimum amount ₹10");
    return;
  }

  let number = "";

  /* ---------- OPEN ---------- */
  if (bet.betFor === "open") {

    if (!isValidDigit(openDigit.value) || !isValidPanna(closePanna.value)) {
      alert("Enter valid Open Digit (0-9) and Close Panna (000-999)");
      return;
    }

    number = `${openDigit.value}-${closePanna.value}`;
  }

  /* ---------- CLOSE ---------- */
  if (bet.betFor === "close") {

    if (!isValidPanna(openPanna.value) || !isValidDigit(closeDigit.value)) {
      alert("Enter valid Open Panna (000-999) and Close Digit (0-9)");
      return;
    }

    number = `${openPanna.value}-${closeDigit.value}`;
  }

  /* ======================================================
     SAVE BET FOR BET-DETAILS PAGE
  ====================================================== */
  const pendingBet = {
    matchId: bet.gameId,
    gameName: bet.gameName,
    betType: "halfsangam",
    betFor: bet.betFor,
    bids: [{ number, amount }],
    totalAmount: amount
  };

  localStorage.setItem("pendingBet", JSON.stringify(pendingBet));

  window.location.href = "bid-details.html";
}