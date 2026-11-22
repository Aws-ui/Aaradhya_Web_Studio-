import { mountNetwork } from "./network.js";

const dialog = document.querySelector("#brief-dialog");
const form = document.querySelector("#brief-form");
const service = document.querySelector("#brief-service");
const goal = document.querySelector("#brief-goal");
const output = document.querySelector("#brief-output");
const summary = document.querySelector("#brief-summary");
const copyStatus = document.querySelector("#brief-status");

function clearOutput() {
  output.hidden = true;
  copyStatus.textContent = "";
}

for (const button of document.querySelectorAll("[data-brief]")) {
  button.addEventListener("click", () => {
    if (button.dataset.brief && service.value !== button.dataset.brief) {
      service.value = button.dataset.brief;
      clearOutput();
    }
    dialog.showModal();
  });
}

document.querySelector("#close-brief").addEventListener("click", () => dialog.close());
form.addEventListener("input", clearOutput);
goal.addEventListener("input", () => goal.setCustomValidity(""));

form.addEventListener("submit", event => {
  event.preventDefault();
  if (!goal.value.trim()) {
    goal.setCustomValidity("Enter a goal for your project.");
    goal.reportValidity();
    return;
  }
  summary.value = `AW Studio — Project brief\n\nService: ${service.value}\n\nGoal: ${goal.value.trim()}`;
  output.hidden = false;
  summary.focus();
});

document.querySelector("#copy-brief").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(summary.value);
    copyStatus.textContent = "Brief copied.";
  } catch {
    summary.select();
    copyStatus.textContent = "Brief selected. Use your device’s copy command.";
  }
});

mountNetwork();
