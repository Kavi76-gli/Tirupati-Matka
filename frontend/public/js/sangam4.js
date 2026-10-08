function submitFullSangam() {
  const openPanna = document.getElementById("openPanna").value;
  const closePanna = document.getElementById("closePanna").value;
  const amount = document.getElementById("amount").value;

  if (
    openPanna.length !== 3 ||
    closePanna.length !== 3 ||
    amount <= 0
  ) {
    alert("Please enter valid Open Panna, Close Panna and Amount");
    return;
  }

  const bidData = {
    market: "MAIN BAZAR",
    game: "FULL SANGAM",
    openPanna,
    closePanna,
    amount
  };

  console.log("Full Sangam Bid:", bidData);
  alert("Full Sangam bid submitted successfully!");
}