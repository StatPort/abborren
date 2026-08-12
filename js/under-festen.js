const WHEEL_PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a", "#4a6b5a"];

let availableTasks = [];
let claimedTasks = [];
let currentRotation = 0;
let spinning = false;
let pendingTask = null;

const wheelEl = document.getElementById("wheel");
const legendEl = document.getElementById("wheel-legend");
const spinBtn = document.getElementById("spin-btn");
const resultEl = document.getElementById("task-result");
const resultTextEl = document.getElementById("task-result-text");
const nameInput = document.getElementById("claim-name");
const acceptBtn = document.getElementById("accept-btn");
const declineBtn = document.getElementById("decline-btn");
const acceptedMsgEl = document.getElementById("task-accepted-msg");
const emptyMsgEl = document.getElementById("tasks-empty-msg");
const wheelWrapEl = document.getElementById("wheel-wrap");
const claimedCardEl = document.getElementById("claimed-card");
const claimedListEl = document.getElementById("claimed-list");

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function renderWheel() {
  wheelEl.querySelectorAll(".wheel-number").forEach((el) => el.remove());
  legendEl.innerHTML = "";

  const n = availableTasks.length;
  const hasTasks = n > 0;

  wheelWrapEl.style.display = hasTasks ? "block" : "none";
  legendEl.style.display = hasTasks ? "block" : "none";
  spinBtn.style.display = hasTasks ? "block" : "none";
  emptyMsgEl.style.display = hasTasks ? "none" : "block";

  if (!hasTasks) return;

  const sliceSize = 360 / n;
  const stops = availableTasks.map((t, i) => {
    const color = WHEEL_PALETTE[i % WHEEL_PALETTE.length];
    return `${color} ${i * sliceSize}deg ${(i + 1) * sliceSize}deg`;
  });
  wheelEl.style.background = `conic-gradient(${stops.join(", ")})`;

  availableTasks.forEach((t, i) => {
    const angle = i * sliceSize + sliceSize / 2;
    const rad = (angle - 90) * (Math.PI / 180);
    const radius = 42;
    const x = 50 + radius * Math.cos(rad);
    const y = 50 + radius * Math.sin(rad);

    const numEl = document.createElement("div");
    numEl.className = "wheel-number";
    numEl.style.left = x + "%";
    numEl.style.top = y + "%";
    numEl.textContent = String(i + 1);
    wheelEl.appendChild(numEl);

    const li = document.createElement("li");
    li.textContent = t.label;
    legendEl.appendChild(li);
  });
}

function renderClaimedList() {
  claimedCardEl.style.display = claimedTasks.length ? "block" : "none";
  claimedListEl.innerHTML = claimedTasks.map((t) =>
    `<li>${escapeHtml(t.label)} — <strong>${escapeHtml(t.claimedBy)}</strong></li>`
  ).join("");
}

function spin() {
  if (spinning || availableTasks.length === 0) return;
  spinning = true;
  spinBtn.disabled = true;

  const n = availableTasks.length;
  const targetIndex = Math.floor(Math.random() * n);
  pendingTask = availableTasks[targetIndex];

  const sliceSize = 360 / n;
  const sliceCenter = targetIndex * sliceSize + sliceSize / 2;
  const desiredMod = (360 - sliceCenter) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  let delta = (desiredMod - currentMod + 360) % 360;
  delta += 360 * 4;
  currentRotation += delta;

  wheelEl.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    spinning = false;
    resultTextEl.textContent = pendingTask.label;
    nameInput.value = "";
    resultEl.style.display = "block";
    spinBtn.style.display = "none";
  }, 4100);
}

spinBtn.addEventListener("click", spin);

declineBtn.addEventListener("click", () => {
  resultEl.style.display = "none";
  spinBtn.style.display = "block";
  spinBtn.disabled = false;
  pendingTask = null;
});

acceptBtn.addEventListener("click", async () => {
  if (!pendingTask) return;
  const name = nameInput.value.trim();
  if (!name) {
    alert("Skriv in ditt namn innan du accepterar.");
    return;
  }
  acceptBtn.disabled = true;
  await AbborrenDB.acceptTask(pendingTask.id, name);
  resultEl.style.display = "none";
  acceptedMsgEl.style.display = "block";
  spinBtn.disabled = false;
  acceptBtn.disabled = false;
  pendingTask = null;
  setTimeout(() => { acceptedMsgEl.style.display = "none"; }, 4000);
});

AbborrenDB.subscribeTasks((rows) => {
  availableTasks = rows.filter((t) => !t.claimedBy);
  claimedTasks = rows.filter((t) => t.claimedBy);
  if (!spinning) renderWheel();
  renderClaimedList();
}, () => {
  wheelWrapEl.style.display = "none";
  legendEl.style.display = "none";
  spinBtn.style.display = "none";
  emptyMsgEl.style.display = "none";
  document.getElementById("tasks-error-msg").style.display = "block";
});
