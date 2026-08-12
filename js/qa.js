function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function qaCardHtml(item) {
  const answer = item.answer && item.answer.trim()
    ? escapeHtml(item.answer)
    : "<em>Svar kommer snart!</em>";
  return `
  <div class="card prose">
    <h3>${escapeHtml(item.question)}</h3>
    <p>${answer}</p>
  </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("qa-container");
  const askBtn = document.getElementById("ask-question-btn");
  const questionInput = document.getElementById("new-question");
  const msgEl = document.getElementById("ask-question-msg");

  let items = [];
  let loaded = false;
  askBtn.disabled = true;

  function render() {
    container.innerHTML = items.map(qaCardHtml).join("");
  }

  items = await AbborrenDB.getConfig("qa", DEFAULT_QA);
  loaded = true;
  askBtn.disabled = false;
  render();

  askBtn.addEventListener("click", async () => {
    if (!loaded) return;
    const question = questionInput.value.trim();
    if (!question) {
      alert("Skriv en fråga innan du skickar.");
      return;
    }
    askBtn.disabled = true;

    // Läs senaste listan igen precis innan vi sparar, så vi inte råkar
    // skriva över någon annans fråga som lagts till under tiden.
    const latest = await AbborrenDB.getConfig("qa", DEFAULT_QA);
    latest.push({ question, answer: "" });
    await AbborrenDB.setConfig("qa", latest);

    items = latest;
    render();
    questionInput.value = "";
    msgEl.style.display = "block";
    setTimeout(() => { msgEl.style.display = "none"; }, 4000);
    askBtn.disabled = false;
  });
});
