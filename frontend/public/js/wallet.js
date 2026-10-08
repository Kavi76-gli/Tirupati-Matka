let balance = 0;

function addCash() {
  let amount = prompt("Enter amount to add:");
  if (amount && !isNaN(amount)) {
    balance += Number(amount);
    document.getElementById("totalBalance").innerText = balance.toFixed(2);
    document.getElementById("amountAdded").innerText = balance.toFixed(2);
    document.querySelector(".top-balance").innerText = "₹" + balance.toFixed(2);
  }
}