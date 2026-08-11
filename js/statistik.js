const PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a", "#4a6b5a"];

function bucketAge(ageStr) {
  const n = parseInt(String(ageStr).replace(/\D/g, ""), 10);
  if (isNaN(n)) return "Okänd";
  if (n < 18) return "Under 18";
  if (n < 30) return "18–29";
  if (n < 45) return "30–44";
  if (n < 60) return "45–59";
  return "60+";
}

// Bygger en procentandel-per-kategori-datastruktur för ett grupperat stapeldiagram.
// xCategories = kolumnerna (t.ex. Loppet/Festen/Båda), seriesFn extraherar seriens värde per person.
function buildPercentDataset(people, xField, xCategories, seriesFn) {
  const total = people.length || 1;
  const seriesValues = Array.from(new Set(people.map(seriesFn))).sort();

  const datasets = seriesValues.map((seriesVal, i) => {
    const data = xCategories.map((xCat) => {
      const count = people.filter((p) => p[xField] === xCat && seriesFn(p) === seriesVal).length;
      return +(100 * count / total).toFixed(1);
    });
    return {
      label: seriesVal,
      data,
      backgroundColor: PALETTE[i % PALETTE.length]
    };
  });

  return { labels: xCategories, datasets };
}

function renderStackedBar(canvasId, chartData, existingChart) {
  if (existingChart) existingChart.destroy();
  const ctx = document.getElementById(canvasId).getContext("2d");
  return new Chart(ctx, {
    type: "bar",
    data: chartData,
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: { stacked: true, beginAtZero: true, max: 100, ticks: { callback: (v) => v + "%" } }
      },
      plugins: {
        legend: { position: "bottom" },
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%` } }
      }
    }
  });
}

let charts = {};

function renderAll(people) {
  const attendingCats = ["Loppet", "Festen", "Båda"];
  const classCats = ["Fun Run", "Backyard", "Stafett"];

  charts.c1 = renderStackedBar("chart1",
    buildPercentDataset(people, "attending", attendingCats, (p) => p.gender || "Okänd"), charts.c1);

  charts.c2 = renderStackedBar("chart2",
    buildPercentDataset(people, "attending", attendingCats, (p) => bucketAge(p.age)), charts.c2);

  charts.c3 = renderStackedBar("chart3",
    buildPercentDataset(people, "participantClass", classCats, (p) => p.gender || "Okänd"), charts.c3);

  charts.c4 = renderStackedBar("chart4",
    buildPercentDataset(people, "participantClass", classCats, (p) => bucketAge(p.age)), charts.c4);

  const rows = document.getElementById("participant-rows");
  rows.innerHTML = people.map((p) => `
    <tr><td>${escapeHtml(p.nickname)}</td><td>${escapeHtml(p.age)}</td><td>${escapeHtml(p.hometown)}</td></tr>
  `).join("");
  document.getElementById("empty-msg").style.display = people.length ? "none" : "block";
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

document.addEventListener("DOMContentLoaded", () => {
  AbborrenDB.subscribeSignups(renderAll);
});
