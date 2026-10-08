function inviteFriend() {
  const code = document.getElementById("referCode").innerText;
  const message = `Join Kalyan Satka Matka 🎯\nUse my referral code: ${code}\nEarn bonus now!`;

  if (navigator.share) {
    navigator.share({
      title: "Refer & Earn",
      text: message,
    });
  } else {
    alert("Your referral code: " + code);
  }
}