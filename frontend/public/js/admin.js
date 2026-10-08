// ==============================
// Admin JS
// ==============================

const API = "https://tirupati-matka.onrender.com/api"; // Backend base URL
const token = localStorage.getItem("token"); // Make sure admin is logged in

// ------------------------------
// Show/Hide Sections
// ------------------------------
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.style.display = "none");
  document.getElementById(id).style.display = "block";

  if (id === "viewGames" || id === "openCloseResult") loadGames();
  if (id === "userBids") loadBids();
}

// ------------------------------
// Create Game

document
  .getElementById("createGameForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const msgEl = document.getElementById("createGameMsg");
    msgEl.innerText = "";

    const formData = Object.fromEntries(new FormData(e.target).entries());

    // ---------------- BASIC TIME CHECK ----------------
    if (formData.openTime === formData.closeTime) {
      msgEl.innerText = "❌ Open time and Close time cannot be same";
      return;
    }

    // ---------------- ALLOWED BET TYPES ----------------
    const allowedTypes = formData.allowedTypes
      ? formData.allowedTypes.split(",").map(t => t.trim())
      : [];

    // ---------------- DEFAULT MATKA PAYOUT ----------------
    const payout = {
      single: 9.5,
      jodi: 95,
      singlepanna: 150,
      doublepanna: 300,
      triplepanna: 1000,
      halfSangam: 1000,
      fullSangam: 10000
    };

    // ---------------- FINAL PAYLOAD ----------------
    const payload = {
      gameName: formData.gameName,
      gameCode: formData.gameCode.toUpperCase(),
      openTime: formData.openTime,
      closeTime: formData.closeTime,
      resultTime: formData.resultTime, // informational
      minBet: Number(formData.minBet) || 1,
      maxBet: Number(formData.maxBet) || 100000,
      payout,
      allowedTypes
    };

    try {
      const res = await fetch(`${API}/match/admin/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        msgEl.innerText = "❌ " + (data.msg || "Failed to create game");
        return;
      }

      msgEl.innerText =
        "✅ Game created successfully. This game will run daily automatically.";
      e.target.reset();

    } catch (err) {
      console.error(err);
      msgEl.innerText = "❌ Server error";
    }
  });





// ------------------------------
// Load Games
// ------------------------------
async function loadGames() {
  try {
    const res = await fetch(`${API}/match/admin/all`, {
      headers: { "Authorization": "Bearer " + token }
    });

    if (!res.ok) throw new Error("Failed to load games");
    const data = await res.json();

    const tbody = document.querySelector("#gamesTable tbody");
    const resultSelect = document.getElementById("matchSelect");
    const deleteSelect = document.getElementById("deleteMatchSelect");

    tbody.innerHTML = "";
    resultSelect.innerHTML = "";
    deleteSelect.innerHTML = `<option value="">Select Game</option>`;

    // ✅ FIXED TIME FORMATTER (STRING SAFE)
    const formatTime = (t) => {
      if (!t) return "-";

      // If backend sends "HH:mm"
      if (typeof t === "string" && t.includes(":")) {
        let [h, m] = t.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12;
        return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
      }

      // If backend sends Date
      return new Date(t).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    };

    if (data.matches?.length) {
      data.matches.forEach(m => {
        const openResult = m.openResult?.panel
          ? `${m.openResult.panel}-${m.openResult.single}`
          : "—";

        const closeResult = m.closeResult?.panel
          ? `${m.closeResult.panel}-${m.closeResult.single}`
          : "—";

        // ✅ TABLE WITH RESULTS
        tbody.innerHTML += `
          <tr>
            <td>${m.gameName}</td>
            <td>${m.gameCode}</td>
            <td>${formatTime(m.openTime)}</td>
            <td>${formatTime(m.closeTime)}</td>
            <td>${openResult}</td>
            <td>${closeResult}</td>
            <td>${m.status}</td>
            <td>
      <button onclick="resetMatchResult('${m._id}')">Reset</button>
    </td>
          </tr>
        `;

        // RESULT SELECT
        resultSelect.innerHTML += `
          <option value="${m._id}">
            ${m.gameName} (${m.gameCode})
          </option>
        `;

        // DELETE SELECT
        deleteSelect.innerHTML += `
          <option value="${m._id}">
            ${m.gameName} (${m.gameCode})
          </option>
        `;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="7">No games found</td></tr>`;
    }
  } catch (err) {
    console.error("Load Games Error:", err);
  }
}


// ------------------------------
// Declare Open/Close Result
// ------------------------------
// ------------------------------
// Declare Open / Close Result
// ------------------------------
document
  .getElementById("declareResultForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const matchId = document.getElementById("matchSelect").value;
    const panel = document.getElementById("panel").value.trim();
    const singleInput = document.getElementById("single").value.trim();
    const type = document.getElementById("resultType").value;

    const msgEl = document.getElementById("declareMsg");
    const submitBtn = e.target.querySelector("button[type='submit']");
    msgEl.innerText = "";

    if (!matchId || !panel || !singleInput) {
      msgEl.innerText = "⚠️ All fields are required";
      return;
    }
    if (!/^\d{3}$/.test(panel)) {
      msgEl.innerText = "⚠️ Panel must be 3 digits (e.g. 780)";
      return;
    }
    const single = Number(singleInput);
    if (isNaN(single) || single < 0 || single > 9) {
      msgEl.innerText = "⚠️ Single must be between 0–9";
      return;
    }

    const endpoint = type === "open"
      ? "/match/admin/result/open"
      : "/match/admin/result/close";

    submitBtn.disabled = true;
    submitBtn.innerText = "Processing...";

    try {
      const res = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ matchId, panel, single })
      });

      const data = await res.json();
      if (!res.ok) {
        msgEl.innerText = "❌ " + (data.message || data.msg || "Failed");
        submitBtn.disabled = false;
        submitBtn.innerText = "Declare Result";
        return;
      }

      // ---------------- RESULT DISPLAY ----------------
      let resultText = "";
      if (type === "open") {
        resultText = `Open: ${data.panel || "???"}-${data.single ?? "?"}*-***`;
      } else {
        resultText =
          `Open: ${data.openPanel || "???"}-${data.openSingle ?? "?"}*-*** | ` +
          `Close: ***-*${data.closeSingle ?? "?"}-${data.closePanel ?? "???"} | ` +
          `Final: ${data.openPanel || "???"}-${data.jodi || "??"}-${data.closePanel || "???"}`;
      }

      let winnerText = "";
      if (data.winnerDetails?.length) {
        winnerText = "\n🎯 Winners:\n" + data.winnerDetails.map((w, i) =>
          `${i + 1}. ${w.user} | ${w.betType.toUpperCase()} | ${w.betNumber} | ₹${w.amountWon}`
        ).join("\n");
      }

      msgEl.innerText =
        `✅ RESULT DECLARED\n${resultText}\n🏆 Winners: ${data.winners || 0} | 💰 Total Payout: ₹${data.totalWinAmount || 0}${winnerText}`;

      submitBtn.disabled = true;
      submitBtn.innerText = "Result Declared";

      if (typeof loadGames === "function") loadGames();

    } catch (err) {
      console.error("Declare Result Error:", err);
      msgEl.innerText = "❌ Server error";
      submitBtn.disabled = false;
      submitBtn.innerText = "Declare Result";
    }
  });



// ------------------------------
// Load User Bids
// ------------------------------
async function loadBids() {
  try {
    const res = await fetch(`${API}/admin/admin/bids`, {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    const tbody = document.querySelector("#bidsTable tbody");

    tbody.innerHTML = "";

    if (data.success && data.bids.length > 0) {
      data.bids.forEach(b => {
        tbody.innerHTML += `
          <tr>
            <td>
              <strong>${b.user?.name || "N/A"}</strong><br>
              <small>${b.user?.phone || ""}</small>
            </td>
            <td>${b.match?.gameName || "N/A"}</td>
            <td>${b.betType}</td>
            <td>${b.betFor}</td>
            <td><strong>${b.number}</strong></td>
            <td>₹${b.amount}</td>
            <td>${new Date(b.createdAt).toLocaleString()}</td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center;">
            No bids found
          </td>
        </tr>
      `;
    }

  } catch (err) {
    console.error("Load Bids Error:", err);
  }
}

async function deleteSelectedGame() {
  const matchId = document.getElementById("deleteMatchSelect").value;
  const msg = document.getElementById("deleteMsg");

  msg.innerText = "";

  if (!matchId) {
    msg.innerText = "⚠️ Please select a game";
    return;
  }

  if (!confirm("Are you sure you want to delete this game?")) return;

  try {
    const res = await fetch(
      `https://tirupati-matka.onrender.com/api/match/admin/match/${matchId}`, // ✅ FIXED URL
      {
        method: "DELETE",
        headers: {
          "Authorization": "Bearer " + token
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      msg.innerText = data.message || "❌ Delete failed";
      return;
    }

    msg.innerText = "✅ " + data.message;

    // 🔄 Refresh games list & dropdown
    loadGames();

  } catch (err) {
    console.error("Delete Game Error:", err);
    msg.innerText = "❌ Server error";
  }
}

async function resetMatchResult(matchId) {
  if (!matchId) return alert("Invalid match");

  if (!confirm("Reset this match result?")) return;

  try {
    const res = await fetch(`${API}/match/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ matchId })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Reset failed");
      return;
    }

    alert("✅ Match result reset successfully");
    loadGames();

  } catch {
    alert("Server not reachable");
  }
}
async function resetAllMatches() {
  const sure = confirm(
    "⚠️ WARNING!\n\nThis will RESET RESULTS of ALL MATCHES.\nThis action CANNOT be undone.\n\nContinue?"
  );

  if (!sure) return;

  const finalConfirm = confirm("❗ LAST CONFIRMATION\nAre you absolutely sure?");
  if (!finalConfirm) return;

  try {
    const res = await fetch(`${API}/match/reset-all`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Reset all failed");
      return;
    }

    alert("✅ All match results reset successfully");
    loadGames();

  } catch {
    alert("Server not reachable");
  }
}

// ------------------------------
// Show default section
// ------------------------------
showSection("createGame");
