const POLL_PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a"];

const POLLS = [
  {
    id: "poll1",
    question: "Vad fick dig att komma på festen?",
    options: [
      "Jag älskar fest!",
      "Jag hatar fest men blev tvingad.",
      "Jag tyckte att det lät kul bara",
      "Jag älskar korv med bröd",
      "Jag är här för att Matilda & Michael är världens härligaste människor och jag vill hänga med dem.",
      "Jag vill springa världens roligaste lopp.",
      "Jag vet inte, jag tycker det är lite läskigt."
    ]
  },
  {
    id: "poll2",
    question: "På fest gillar jag...",
    options: [
      "Att dansa när jag får feeling",
      "Springa runt och snacka med alla jag känner och inte känner",
      "Alternativ 3 (kommer snart)",
      "Alternativ 4 (kommer snart)",
      "Alternativ 5 (kommer snart)",
      "Alternativ 6 (kommer snart)",
      "Alternativ 7 (kommer snart)"
    ]
  }
];

function pollCardHtml(poll) {
  const optionsHtml = poll.options.map((opt, i) => `
    <label class="radio-row">
      <input type="radio" name="${poll.id}" value="${escapeAttr(opt)}">
      ${escapeHtml(opt)}
    </label>`).join("");

  return `
  <div class="card">
    <h2>${escapeHtml(poll.question)}</h2>
    <div class="poll-form" id="form-${poll.id}">
      ${optionsHtml}
      <button type="button" class="submit-btn poll-vote-btn" data-poll="${poll.id}">Rösta</button>
    </div>
    <canvas id="chart-${poll.id}" height="280" style="margin-top:16px;"></canvas>
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
  const counts = poll.options.map((opt) => votes.filter((v) => v.choice === opt).length);
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
        x: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } }
      }
    }
  });
}

function setupPoll(poll) {
  const formEl = document.getElementById("form-" + poll.id);

  if (AbborrenDB.hasVoted(poll.id)) {
    formEl.style.display = "none";
  }

  AbborrenDB.subscribePollVotes(poll.id, (votes) => renderPollChart(poll, votes));

  formEl.querySelector(".poll-vote-btn").addEventListener("click", async () => {
    const checked = formEl.querySelector(`input[name="${poll.id}"]:checked`);
    if (!checked) {
      alert("Välj ett alternativ innan du röstar.");
      return;
    }
    await AbborrenDB.addPollVote(poll.id, checked.value);
    AbborrenDB.markVoted(poll.id);
    formEl.style.display = "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("polls-container");
  container.innerHTML = POLLS.map(pollCardHtml).join("");
  POLLS.forEach(setupPoll);
});
