function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

function qaCardHtml(item) {
  return `
  <div class="card prose">
    <h3>${escapeHtml(item.question)}</h3>
    <p>${escapeHtml(item.answer)}</p>
  </div>`;
}

document.addEventListener("DOMContentLoaded", async () => {
  const items = await AbborrenDB.getConfig("qa", DEFAULT_QA);
  document.getElementById("qa-container").innerHTML = items.map(qaCardHtml).join("");
});
