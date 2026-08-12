const POLL_PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a"];

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function escapeAttr(str) {
  return escapeHtml(str);
}

// Håller reda på vilka alternativ (fasta + fritext-upptäckta) som redan
// renderats som kryssrutor per poll, så vi kan lägga till nya utan att
// bygga om hela formuläret (vilket skulle nollställa ett pågående val).
const knownOptions = {}; // pollId -> Map(lowercaseKey -> canonicalDisplayString)

function pollCardHtml(poll) {
  knownOptions[poll.id] = new Map(poll.options.map((o) => [o.toLowerCase(), o]));

  const optionsHtml = poll.options.map((opt) => `
    <label class="checkbox-row">
      <input type="checkbox" name="${poll.id}" value="${escapeAttr(opt)}">
      ${escapeHtml(opt)}
    </label>`).join("");

  const chartHeight = Math.max(280, (poll.options.length + 1) * 55);

  return `
  <div class="card">
    <h2>${escapeHtml(poll.question)}</h2>
    <p style="opacity:0.7; margin-top:-6px;">Flera svar möjliga</p>
    <div class="poll-form" id="form-${poll.id}">
      ${optionsHtml}
      <div id="extra-${poll.id}"></div>
      <label class="checkbox-row poll-freetext-row">
        <input type="checkbox" class="poll-freetext-checkbox" data-poll="${poll.id}">
        Fritext:
        <input type="text" class="poll-freetext-input" data-poll="${poll.id}" placeholder="Skriv ditt svar">
      </label>
      <button type="button" class="submit-btn poll-vote-btn" data-poll="${poll.id}">Rösta</button>
    </div>
    <p id="voted-msg-${poll.id}" style="display:none;">
      Du har redan röstat i den här webbläsaren.
      <button type="button" class="secondary-btn" id="revote-${poll.id}">Ändra din röst</button>
    </p>
    <canvas id="chart-${poll.id}" height="${chartHeight}" style="margin-top:16px;"></canvas>
  </div>`;
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

// Lägger till kryssrutor för nya fritext-kategorier som dykt upp i rösterna,
// utan att röra befintliga (redan ikryssade) rutor.
function growOptionsFromVotes(poll, votes) {
  const known = knownOptions[poll.id];
  const extraContainer = document.getElementById("extra-" + poll.id);
  let added = false;

  votes.forEach((v) => {
    (v.choices || []).forEach((choice) => {
      const key = String(choice).toLowerCase();
      if (!known.has(key)) {
        known.set(key, choice);
        const label = document.createElement("label");
        label.className = "checkbox-row";
        label.innerHTML = `<input type="checkbox" name="${poll.id}" value="${escapeAttr(choice)}"> ${escapeHtml(choice)}`;
        extraContainer.appendChild(label);
        added = true;
      }
    });
  });

  return added;
}

function renderPollChart(poll, votes) {
  const allOptions = Array.from(knownOptions[poll.id].values());
  const total = votes.length || 1;
  const counts = allOptions.map((opt) => votes.filter((v) => (v.choices || []).includes(opt)).length);
  const percentages = counts.map((c) => +(100 * c / total).toFixed(1));

  if (pollCharts[poll.id]) pollCharts[poll.id].destroy();
  const ctx = document.getElementById("chart-" + poll.id).getContext("2d");
  pollCharts[poll.id] = new Chart(ctx, {
    type: "bar",
    data: {
      labels: allOptions.map((opt) => wrapLabel(opt, 28)),
      datasets: [{
        data: percentages,
        backgroundColor: allOptions.map((_, i) => POLL_PALETTE[i % POLL_PALETTE.length])
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
  const freetextCheckbox = formEl.querySelector(".poll-freetext-checkbox");
  const freetextInput = formEl.querySelector(".poll-freetext-input");

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

  AbborrenDB.subscribePollVotes(poll.id, (votes) => {
    growOptionsFromVotes(poll, votes);
    renderPollChart(poll, votes);
  });

  formEl.querySelector(".poll-vote-btn").addEventListener("click", async () => {
    const checked = Array.from(formEl.querySelectorAll(`input[name="${poll.id}"]:checked`))
      .map((c) => c.value);

    const freetextChecked = freetextCheckbox.checked;
    const freetextVal = freetextInput.value.trim();
    if (freetextChecked && !freetextVal) {
      alert("Skriv ditt svar i fritextfältet, eller bocka ur rutan.");
      return;
    }

    let choices = checked.slice();
    if (freetextChecked && freetextVal) {
      const known = knownOptions[poll.id];
      const key = freetextVal.toLowerCase();
      const canonical = known.has(key) ? known.get(key) : freetextVal;
      if (!choices.includes(canonical)) choices.push(canonical);
      if (!known.has(key)) known.set(key, canonical);
    }

    if (choices.length === 0) {
      alert("Välj minst ett alternativ innan du röstar.");
      return;
    }

    const existingVoteId = AbborrenDB.getVoteId(poll.id);
    const voteId = await AbborrenDB.addPollVote(poll.id, choices, existingVoteId);
    AbborrenDB.markVoted(poll.id, voteId);
    showVoted();
  });

  document.getElementById("revote-" + poll.id).addEventListener("click", () => {
    formEl.querySelectorAll(`input[name="${poll.id}"]`).forEach((cb) => { cb.checked = false; });
    freetextCheckbox.checked = false;
    freetextInput.value = "";
    showForm();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  const polls = await AbborrenDB.getConfig("polls", DEFAULT_POLLS);
  const container = document.getElementById("polls-container");
  container.innerHTML = polls.map(pollCardHtml).join("");
  polls.forEach(setupPoll);
});
