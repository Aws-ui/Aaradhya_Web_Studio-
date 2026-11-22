const form = document.querySelector("#review");
const result = document.querySelector("#reviewout");
form.addEventListener("input", () => {
  result.hidden = true;
  const stars = Number(form.elements.stars.value);
  document.querySelector("#score").value = stars ? stars + " out of 5" : "Choose 1 to 5 stars";
  form.querySelectorAll(".rating label").forEach((label, index) => label.classList.toggle("lit", index < stars));
});
form.onsubmit = event => {
  event.preventDefault();
  const data = new FormData(form);
  const text = ["AW Studio client review", "Name: " + data.get("name"), "Project: " + data.get("project"), "Rating: " + data.get("stars") + "/5", data.get("comment"), "Permission to publish: " + (data.has("publish") ? "Yes" : "No")].join("\n");
  document.querySelector("#reviewlink").href = "https://wa.me/919561851358?text=" + encodeURIComponent(text);
  result.hidden = false;
  document.querySelector("#reviewlink").focus();
};
