function addAmount(value) {
  const input = document.getElementById("amount");
  input.value = Number(input.value || 0) + value;
  validateAmount();
}

function validateAmount() {
  const amount = Number(document.getElementById("amount").value);
  const btn = document.getElementById("addCashBtn");

  if (amount >= 100) {
    btn.disabled = false;
    btn.classList.add("enabled");
  } else {
    btn.disabled = true;
    btn.classList.remove("enabled");
  }
}

function go(page) {
  window.location.href = page;
}

function goBack() {
  window.history.back();
}