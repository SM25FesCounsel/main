// Dashboard specific JavaScript helpers.

window.renderRoiChart = (chartData) => {
  if (!chartData || !Array.isArray(chartData.labels)) {
    return;
  }
  const canvas = document.getElementById("roiChart");
  if (!canvas) {
    return;
  }
  const context = canvas.getContext("2d");
  const existing = window._roiChartInstance;
  if (existing) {
    existing.destroy();
  }
  window._roiChartInstance = new Chart(context, {
    type: "bar",
    data: {
      labels: chartData.labels,
      datasets: [
        {
          label: "ROI %",
          data: chartData.roi,
          backgroundColor: "rgba(13, 110, 253, 0.6)",
          borderColor: "rgba(13, 110, 253, 1)",
          borderWidth: 1,
          yAxisID: "y",
        },
        {
          label: "Profit",
          data: chartData.profit,
          type: "line",
          borderColor: "rgba(25, 135, 84, 1)",
          backgroundColor: "rgba(25, 135, 84, 0.3)",
          borderWidth: 2,
          yAxisID: "y1",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "ROI (%)",
          },
        },
        y1: {
          beginAtZero: true,
          position: "right",
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: "Profit",
          },
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y;
              if (context.dataset.yAxisID === "y") {
                return `${context.dataset.label}: ${value.toFixed(2)}%`;
              }
              return `${context.dataset.label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
    },
  });
};
