document.querySelectorAll("input").forEach(input => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");
  });
});
