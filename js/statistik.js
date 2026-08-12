const PALETTE = ["#5a4658", "#8a6a86", "#b79a8f", "#7c2f2f", "#b4bdaf", "#453449", "#c9a35a", "#4a6b5a"];

const MENTAL_AGE_SHORT = {
  "Jag lever som om det inte fanns någon morgondag": "YOLO",
  "Föddes som pensionär": "Pensionär",
  "Har ett spann på 19-84": "19-84",
  "Omyndig": "Omyndig",
  "Lederna börjar kärva men det går an": "Kärva leder",
  "Jag gillar lugn och ro": "Lugn & ro",
  "Tidlös & evig": "Tidlös & evig"
};

function shortAge(age) {
  if (!age) return "Okänd";
  return MENTAL_AGE_SHORT[age] || age;
}

// Bygger en procentandel-per-kategori-datastruktur för ett grupperat stapeldiagram.
// xCategories = kolumnerna (t.ex. Loppet/Festen/Båda), seriesFn extraherar seriens värde per person.
function buildPercentDataset(people, xField, xCategories, seriesFn) {
  const total = people.length || 1;
  const seriesValues = Array.from(new Set(people.map(seriesFn))).sort();

  const datasets = seriesValues.map((seriesVal, i) => {
    const counts = xCategories.map((xCat) =>
      people.filter((p) => p[xField] === xCat && seriesFn(p) === seriesVal).length);
    const data = counts.map((c) => +(100 * c / total).toFixed(1));
    return {
      label: seriesVal,
      data,
      counts,
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
        tooltip: { callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.dataset.counts[ctx.dataIndex]} (${ctx.parsed.y}%)` } },
        datalabels: {
          color: "#f2efe6",
          font: { weight: "600", size: 11 },
          formatter: (value, ctx) => {
            const count = ctx.dataset.counts[ctx.dataIndex];
            if (!count) return "";
            return `${value}%`;
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

let charts = {};

function renderAll(people) {
  const attendingCats = ["Loppet", "Festen", "Båda", "Kommer inte"];
  const classCats = ["Fun Run", "Backyard", "Stafett"];

  charts.c1 = renderStackedBar("chart1",
    buildPercentDataset(people, "attending", attendingCats, (p) => p.gender || "Okänd"), charts.c1);

  charts.c2 = renderStackedBar("chart2",
    buildPercentDataset(people, "attending", attendingCats, (p) => shortAge(p.age)), charts.c2);

  charts.c3 = renderStackedBar("chart3",
    buildPercentDataset(people, "participantClass", classCats, (p) => p.gender || "Okänd"), charts.c3);

  charts.c4 = renderStackedBar("chart4",
    buildPercentDataset(people, "participantClass", classCats, (p) => shortAge(p.age)), charts.c4);

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
