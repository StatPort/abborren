const POLL_PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a"];

function pollCardHtml(poll) {
  const optionsHtml = poll.options.map((opt, i) => `
    <label class="checkbox-row">
      <input type="checkbox" name="${poll.id}" value="${escapeAttr(opt)}">
      ${escapeHtml(opt)}
    </label>`).join("");

  const chartHeight = Math.max(280, poll.options.length * 55);

  return `
  <div class="card">
    <h2>${escapeHtml(poll.question)}</h2>
    <p style="opacity:0.7; margin-top:-6px;">Flera svar möjliga</p>
    <div class="poll-form" id="form-${poll.id}">
      ${optionsHtml}
      <button type="button" class="submit-btn poll-vote-btn" data-poll="${poll.id}">Rösta</button>
    </div>
    <p id="voted-msg-${poll.id}" style="display:none;">
      Du har redan röstat i den här webbläsaren.
      <button type="button" class="secondary-btn" id="revote-${poll.id}">Ändra din röst</button>
    </p>
    <canvas id="chart-${poll.id}" height="${chartHeight}" style="margin-top:16px;"></canvas>
  </div>`;
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function escapeAttr(str) {
  return escapeHtml(str);
}

const pollCharts = {};

function wrapLabel(text, maxLen) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((w) => {
    if ((line + " " + w).trim().length > maxLen) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  });
  if (line) lines.push(line);
  return lines;
}

function renderPollChart(poll, votes) {
  const total = votes.length || 1;
  const counts = poll.options.map((opt) => votes.filter((v) => (v.choices || []).includes(opt)).length);
  const percentages = counts.map((c) => +(100 * c / total).toFixed(1));

  if (pollCharts[poll.id]) pollCharts[poll.id].destroy();
  const ctx = document.getElementById("chart-" + poll.id).getContext("2d");
  pollCharts[poll.id] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: poll.options.map((opt) => wrapLabel(opt, 28)),
      datasets: [{
        data: percentages,
        backgroundColor: poll.options.map((_, i) => POLL_PALETTE[i % POLL_PALETTE.length])
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => ctx.parsed.x + "%" } }
      },
      scales: {
        x: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } },
        y: { ticks: { autoSkip: false } }
      }
    }
  });
}

function setupPoll(poll) {
  const formEl = document.getElementById("form-" + poll.id);
  const votedMsgEl = document.getElementById("voted-msg-" + poll.id);

  function showVoted() {
    formEl.style.display = "none";
    votedMsgEl.style.display = "block";
  }
  function showForm() {
    formEl.style.display = "block";
    votedMsgEl.style.display = "none";
  }

  if (AbborrenDB.hasVoted(poll.id)) {
    showVoted();
  }

  AbborrenDB.subscribePollVotes(poll.id, (votes) => renderPollChart(poll, votes));

  formEl.querySelector(".poll-vote-btn").addEventListener("click", async () => {
    const checked = Array.from(formEl.querySelectorAll(`input[name="${poll.id}"]:checked`));
    if (checked.length === 0) {
      alert("Välj minst ett alternativ innan du röstar.");
      return;
    }
    const existingVoteId = AbborrenDB.getVoteId(poll.id);
    const voteId = await AbborrenDB.addPollVote(poll.id, checked.map((c) => c.value), existingVoteId);
    AbborrenDB.markVoted(poll.id, voteId);
    showVoted();
  });

  document.getElementById("revote-" + poll.id).addEventListener("click", () => {
    formEl.querySelectorAll(`input[name="${poll.id}"]`).forEach((cb) => { cb.checked = false; });
    showForm();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const polls = await AbborrenDB.getConfig("polls", DEFAULT_POLLS);
  const container = document.getElementById("polls-container");
  container.innerHTML = polls.map(pollCardHtml).join("");
  polls.forEach(setupPoll);
});
