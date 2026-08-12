const ADMIN_USER = "admin";
const ADMIN_PASS = "ultra";
const ADMIN_AUTH_KEY = "abborren_admin_authed";

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function escapeAttr(str) { return escapeHtml(str); }

/* ---------- Login ---------- */

function isAdminLoggedIn() {
  return sessionStorage.getItem(ADMIN_AUTH_KEY) === "yes";
}

function showAdminPanel() {
  document.getElementById("admin-login-wrap").style.display = "none";
  document.getElementById("admin-panel").style.display = "block";
  initAdminPanel();
}

document.getElementById("admin-login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const u = document.getElementById("admin-username").value.trim().toLowerCase();
  const p = document.getElementById("admin-password").value;
  if (u === ADMIN_USER && p === ADMIN_PASS) {
    sessionStorage.setItem(ADMIN_AUTH_KEY, "yes");
    showAdminPanel();
  } else {
    document.getElementById("admin-error-msg").textContent = "Fel användarnamn eller lösenord.";
  }
});

if (isAdminLoggedIn()) {
  showAdminPanel();
}

/* ---------- Generisk stränglista-redigerare (kön, mental ålder, klass) ---------- */

function setupStringListEditor(configKey, defaultValue) {
  const listEl = document.getElementById("list-" + configKey);
  const addInput = document.getElementById("add-" + configKey);
  const addBtn = document.querySelector(`.admin-add-btn[data-key="${configKey}"]`);
  let items = [];
  let loaded = false;
  addBtn.disabled = true;

  function render() {
    listEl.innerHTML = items.map((val, i) => `
      <li class="admin-list-row">
        <input type="text" class="admin-list-input" data-index="${i}" value="${escapeAttr(val)}">
        <button type="button" class="admin-remove-btn" data-index="${i}">&times;</button>
      </li>
    `).join("");
  }

  function save() {
    AbborrenDB.setConfig(configKey, items);
  }

  listEl.addEventListener("change", (e) => {
    if (e.target.classList.contains("admin-list-input")) {
      const i = Number(e.target.dataset.index);
      items[i] = e.target.value;
      save();
    }
  });

  listEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("admin-remove-btn")) {
      const i = Number(e.target.dataset.index);
      items.splice(i, 1);
      render();
      save();
    }
  });

  addBtn.addEventListener("click", () => {
    if (!loaded) return;
    const val = addInput.value.trim();
    if (!val) return;
    items.push(val);
    addInput.value = "";
    render();
    save();
  });

  AbborrenDB.getConfig(configKey, defaultValue).then((val) => {
    items = val.slice();
    loaded = true;
    addBtn.disabled = false;
    render();
  });
}

/* ---------- Deltagare ---------- */

function signupRowHtml(s, genderOpts, ageOpts, classOpts) {
  const attendingOpts = [
    ["Loppet", "Jag kommer på loppet"],
    ["Festen", "Jag kommer på festen"],
    ["Båda", "Jag kommer på båda"],
    ["Kommer inte", "Jag kommer inte alls tyvärr, hemsk ledsen"]
  ];
  const opt = (list, current) => list.map((v) => {
    const val = Array.isArray(v) ? v[0] : v;
    const label = Array.isArray(v) ? v[1] : v;
    return `<option value="${escapeAttr(val)}" ${val === current ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");

  return `
  <div class="admin-signup-row" data-id="${s.id}">
    <label>Nickname</label>
    <input type="text" class="f-nickname" value="${escapeAttr(s.nickname)}">

    <label>Mental ålder</label>
    <select class="f-age">${opt(ageOpts, s.age)}</select>

    <label>Kön</label>
    <select class="f-gender">${opt(genderOpts, s.gender)}</select>

    <label>Ort</label>
    <input type="text" class="f-hometown" value="${escapeAttr(s.hometown)}">

    <label>Jag kommer på</label>
    <select class="f-attending">${opt(attendingOpts, s.attending)}</select>

    <label>Klass</label>
    <select class="f-class">${opt(classOpts, s.participantClass)}</select>

    <label>Parkering</label>
    <select class="f-parking">${opt([["Ja", "Ja"], ["Nej", "Nej"]], s.parking)}</select>

    <label>Kost/allergier</label>
    <input type="text" class="f-diet" value="${escapeAttr(s.diet)}">

    <div class="admin-row-actions">
      <button type="button" class="secondary-btn admin-save-signup">Spara</button>
      <button type="button" class="admin-remove-btn admin-remove-btn-wide admin-delete-signup">Ta bort</button>
    </div>
  </div>`;
}

function setupSignupsEditor() {
  const container = document.getElementById("admin-signups");
  let genderOpts = DEFAULT_GENDER_OPTIONS;
  let ageOpts = DEFAULT_MENTAL_AGE_OPTIONS;
  let classOpts = DEFAULT_CLASS_OPTIONS;
  let signups = [];

  function render() {
    container.innerHTML = signups.length
      ? signups.map((s) => signupRowHtml(s, genderOpts, ageOpts, classOpts)).join("")
      : "<p>Inga anmälningar än.</p>";

    const parkingCount = signups.filter((s) => s.parking === "Ja").length;
    document.getElementById("admin-parking-summary").textContent =
      signups.length ? `${parkingCount} av ${signups.length} behöver parkering` : "";
  }

  container.addEventListener("click", async (e) => {
    const row = e.target.closest(".admin-signup-row");
    if (!row) return;
    const id = row.dataset.id;

    if (e.target.classList.contains("admin-save-signup")) {
      const fields = {
        nickname: row.querySelector(".f-nickname").value,
        age: row.querySelector(".f-age").value,
        gender: row.querySelector(".f-gender").value,
        hometown: row.querySelector(".f-hometown").value,
        attending: row.querySelector(".f-attending").value,
        participantClass: row.querySelector(".f-class").value,
        parking: row.querySelector(".f-parking").value,
        diet: row.querySelector(".f-diet").value
      };
      e.target.textContent = "Sparar...";
      await AbborrenDB.updateSignup(id, fields);
      e.target.textContent = "Sparat!";
      setTimeout(() => { e.target.textContent = "Spara"; }, 1500);
    }

    if (e.target.classList.contains("admin-delete-signup")) {
      if (!confirm("Ta bort den här deltagaren permanent?")) return;
      await AbborrenDB.deleteSignup(id);
    }
  });

  Promise.all([
    AbborrenDB.getConfig("genderOptions", DEFAULT_GENDER_OPTIONS),
    AbborrenDB.getConfig("mentalAgeOptions", DEFAULT_MENTAL_AGE_OPTIONS),
    AbborrenDB.getConfig("classOptions", DEFAULT_CLASS_OPTIONS)
  ]).then(([g, a, c]) => {
    genderOpts = g;
    ageOpts = a;
    classOpts = c;
    render();
  });

  AbborrenDB.subscribeSignups((rows) => {
    signups = rows;
    render();
  });
}

/* ---------- Polls ---------- */

function pollEditorHtml(poll, index) {
  const optionsHtml = poll.options.map((opt, i) => `
    <li class="admin-list-row">
      <input type="text" class="admin-poll-option" data-poll-index="${index}" data-option-index="${i}" value="${escapeAttr(opt)}">
      <button type="button" class="admin-remove-btn admin-remove-poll-option" data-poll-index="${index}" data-option-index="${i}">&times;</button>
    </li>`).join("");

  return `
  <div class="admin-poll-block" data-poll-index="${index}">
    <label>Fråga</label>
    <input type="text" class="admin-poll-question" data-poll-index="${index}" value="${escapeAttr(poll.question)}">
    <ul class="admin-list">${optionsHtml}</ul>
    <div class="admin-add-row">
      <input type="text" class="admin-add-poll-option" data-poll-index="${index}" placeholder="Nytt alternativ">
      <button type="button" class="secondary-btn admin-add-poll-option-btn" data-poll-index="${index}">Lägg till alternativ</button>
    </div>
    <button type="button" class="admin-remove-btn admin-remove-btn-wide admin-remove-poll" data-poll-index="${index}">Ta bort hela pollen</button>
    <hr>
  </div>`;
}

function setupPollsEditor() {
  const container = document.getElementById("admin-polls");
  const addPollBtn = document.getElementById("add-poll-btn");
  let polls = [];
  let loaded = false;
  addPollBtn.disabled = true;

  function render() {
    container.innerHTML = polls.map(pollEditorHtml).join("");
  }

  function save() {
    AbborrenDB.setConfig("polls", polls);
  }

  container.addEventListener("change", (e) => {
    if (e.target.classList.contains("admin-poll-question")) {
      polls[Number(e.target.dataset.pollIndex)].question = e.target.value;
      save();
    }
    if (e.target.classList.contains("admin-poll-option")) {
      const pi = Number(e.target.dataset.pollIndex);
      const oi = Number(e.target.dataset.optionIndex);
      polls[pi].options[oi] = e.target.value;
      save();
    }
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("admin-remove-poll-option")) {
      const pi = Number(e.target.dataset.pollIndex);
      const oi = Number(e.target.dataset.optionIndex);
      polls[pi].options.splice(oi, 1);
      render();
      save();
    }
    if (e.target.classList.contains("admin-add-poll-option-btn")) {
      const pi = Number(e.target.dataset.pollIndex);
      const input = container.querySelector(`.admin-add-poll-option[data-poll-index="${pi}"]`);
      const val = input.value.trim();
      if (!val) return;
      polls[pi].options.push(val);
      render();
      save();
    }
    if (e.target.classList.contains("admin-remove-poll")) {
      if (!confirm("Ta bort hela pollen?")) return;
      const pi = Number(e.target.dataset.pollIndex);
      polls.splice(pi, 1);
      render();
      save();
    }
  });

  addPollBtn.addEventListener("click", () => {
    if (!loaded) return;
    polls.push({ id: "poll" + Date.now(), question: "Ny fråga", options: [] });
    render();
    save();
  });

  AbborrenDB.getConfig("polls", DEFAULT_POLLS).then((val) => {
    polls = JSON.parse(JSON.stringify(val));
    loaded = true;
    addPollBtn.disabled = false;
    render();
  });
}

/* ---------- Snurra hjulet ---------- */

function taskRowHtml(t) {
  const claimedTag = t.claimedBy ? ` <span class="admin-tag">paxad av ${escapeHtml(t.claimedBy)}</span>` : "";
  return `
  <li class="admin-list-row" data-id="${t.id}">
    <input type="text" class="admin-task-input" value="${escapeAttr(t.label)}">
    ${claimedTag}
    <button type="button" class="admin-remove-btn admin-remove-task">&times;</button>
  </li>`;
}

function setupTasksEditor() {
  const listEl = document.getElementById("admin-tasks");
  const addInput = document.getElementById("add-task");

  listEl.addEventListener("change", (e) => {
    if (e.target.classList.contains("admin-task-input")) {
      const id = e.target.closest(".admin-list-row").dataset.id;
      AbborrenDB.updateTask(id, { label: e.target.value });
    }
  });

  listEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("admin-remove-task")) {
      const id = e.target.closest(".admin-list-row").dataset.id;
      AbborrenDB.deleteTask(id);
    }
  });

  document.getElementById("add-task-btn").addEventListener("click", () => {
    const val = addInput.value.trim();
    if (!val) return;
    AbborrenDB.addTask(val);
    addInput.value = "";
  });

  AbborrenDB.subscribeTasks((rows) => {
    listEl.innerHTML = rows.map(taskRowHtml).join("");
  });
}

/* ---------- Q&A ---------- */

function qaEditorHtml(item, index) {
  return `
  <div class="admin-qa-block" data-index="${index}">
    <label>Fråga</label>
    <input type="text" class="admin-qa-question" data-index="${index}" value="${escapeAttr(item.question)}">
    <label>Svar</label>
    <textarea class="admin-qa-answer" data-index="${index}" rows="3">${escapeHtml(item.answer)}</textarea>
    <button type="button" class="admin-remove-btn admin-remove-btn-wide admin-remove-qa" data-index="${index}">Ta bort</button>
    <hr>
  </div>`;
}

function setupQaEditor() {
  const container = document.getElementById("admin-qa");
  const addQaBtn = document.getElementById("add-qa-btn");
  let items = [];
  let loaded = false;
  addQaBtn.disabled = true;

  function render() {
    container.innerHTML = items.map(qaEditorHtml).join("");
  }
  function save() {
    AbborrenDB.setConfig("qa", items);
  }

  container.addEventListener("change", (e) => {
    const i = Number(e.target.dataset.index);
    if (e.target.classList.contains("admin-qa-question")) {
      items[i].question = e.target.value;
      save();
    }
    if (e.target.classList.contains("admin-qa-answer")) {
      items[i].answer = e.target.value;
      save();
    }
  });

  container.addEventListener("click", (e) => {
    if (e.target.classList.contains("admin-remove-qa")) {
      const i = Number(e.target.dataset.index);
      items.splice(i, 1);
      render();
      save();
    }
  });

  addQaBtn.addEventListener("click", () => {
    if (!loaded) return;
    items.push({ question: "Ny fråga", answer: "" });
    render();
    save();
  });

  AbborrenDB.getConfig("qa", DEFAULT_QA).then((val) => {
    items = JSON.parse(JSON.stringify(val));
    loaded = true;
    addQaBtn.disabled = false;
    render();
  });
}

/* ---------- Galleri ---------- */

function galleryAdminItemHtml(item) {
  const who = item.uploaderName ? escapeHtml(item.uploaderName) : "Okänd";
  return `
  <div class="gallery-item" data-id="${item.id}" data-storage-path="${escapeAttr(item.storagePath || "")}">
    <img src="${item.url}" alt="Bild från ${who}" class="gallery-thumb">
    <div class="gallery-caption">
      ${who}
      <button type="button" class="admin-remove-btn admin-remove-btn-wide admin-remove-gallery" style="margin-top:6px;">Ta bort</button>
    </div>
  </div>`;
}

function setupGalleryEditor() {
  const grid = document.getElementById("admin-gallery");
  const emptyMsg = document.getElementById("admin-gallery-empty");

  grid.addEventListener("click", async (e) => {
    if (e.target.classList.contains("admin-remove-gallery")) {
      const item = e.target.closest(".gallery-item");
      if (!confirm("Ta bort den här bilden permanent?")) return;
      await AbborrenDB.deleteGalleryImage(item.dataset.id, item.dataset.storagePath || null);
    }
  });

  AbborrenDB.subscribeGalleryImages((items) => {
    emptyMsg.style.display = items.length ? "none" : "block";
    grid.innerHTML = items.map(galleryAdminItemHtml).join("");
  });
}

/* ---------- Init ---------- */

let adminInitialized = false;
function initAdminPanel() {
  if (adminInitialized) return;
  adminInitialized = true;
  setupSignupsEditor();
  setupStringListEditor("genderOptions", DEFAULT_GENDER_OPTIONS);
  setupStringListEditor("mentalAgeOptions", DEFAULT_MENTAL_AGE_OPTIONS);
  setupStringListEditor("classOptions", DEFAULT_CLASS_OPTIONS);
  setupPollsEditor();
  setupTasksEditor();
  setupQaEditor();
  setupGalleryEditor();
}
