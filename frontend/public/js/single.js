const pannaGrid = document.getElementById("pannaGrid");

// Sample Single Panna list
let pannaList = [
  "127", "136", "145", "190",
  "235", "244", "290", "334",
  "370", "389", "460", "479"
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

// Filter by digit
function filterDigit(digit) {
  document.querySelectorAll(".digits button").forEach(btn => {
    btn.classList.remove("active");
  });

  event.target.classList.add("active");

  const filtered = pannaList.filter(p => p.startsWith(digit));
  renderPanna(filtered);
}

// Search panna
function searchPanna() {
  const value = document.getElementById("searchInput").value;
  const result = pannaList.filter(p => p.includes(value));
  renderPanna(result);
}

// Submit bids
function submitBids() {
  let bids = [];

  pannaList.forEach(panna => {
    const input = document.getElementById(`bid_${panna}`);
    if (input && input.value > 0) {
      bids.push({ panna, amount: input.value });
    }
  });

  if (bids.length === 0) {
    alert("Please enter at least one bid amount");
    return;
  }

  console.log("Submitted bids:", bids);
  alert("Bid submitted successfully");
}