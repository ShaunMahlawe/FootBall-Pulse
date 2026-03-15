import { useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import Topbar from "../components/Topbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const TIMELINE_DATA = {
  seasons: ["2018/19", "2019/20", "2020/21", "2021/22", "2022/23", "2023/24"],
  metrics: {
    goals: [45, 38, 42, 48, 52, 55],
    assists: [28, 32, 35, 40, 38, 42],
    shots: [320, 345, 310, 380, 395, 410],
    passes: [85.2, 87.1, 86.8, 88.5, 89.2, 90.1],
    tackles: [180, 195, 175, 200, 210, 205],
    possession: [58.5, 60.2, 59.8, 61.5, 62.1, 63.2],
  },
};

const METRIC_LABELS = {
  goals: "Goals Scored",
  assists: "Assists",
  shots: "Total Shots",
  passes: "Pass Accuracy (%)",
  tackles: "Tackles Won",
  possession: "Possession (%)",
};

const PERCENTAGE_METRICS = ["passes", "possession"];

function formatMetricValue(metric, value) {
  return `${value}${PERCENTAGE_METRICS.includes(metric) ? "%" : ""}`;
}

function Timeline() {
  const [selectedMetric, setSelectedMetric] = useState("goals");

  const lineData = {
    labels: TIMELINE_DATA.seasons,
    datasets: [
      {
        label: METRIC_LABELS[selectedMetric],
        data: TIMELINE_DATA.metrics[selectedMetric],
        borderColor: "#dc2626",
        backgroundColor: "rgba(220, 38, 38, 0.1)",
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: "#dc2626",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { size: 14, weight: "600" },
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#dc2626",
        borderWidth: 1,
        callbacks: {
          label(context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            label += context.parsed.y;
            if (PERCENTAGE_METRICS.includes(selectedMetric)) {
              label += "%";
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          font: {
            size: 12,
          },
          callback(value) {
            if (PERCENTAGE_METRICS.includes(selectedMetric)) {
              return `${value}%`;
            }
            return value;
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 12,
            weight: "500",
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
  };

  const getTrendDirection = (data) => {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.05) return { direction: "up", icon: "bx-trending-up", text: "Trending Up" };
    if (secondAvg < firstAvg * 0.95) return { direction: "down", icon: "bx-trending-down", text: "Trending Down" };
    return { direction: "stable", icon: "bx-minus", text: "Stable Trend" };
  };

  const trend = getTrendDirection(TIMELINE_DATA.metrics[selectedMetric]);
  const currentValue = TIMELINE_DATA.metrics[selectedMetric][TIMELINE_DATA.metrics[selectedMetric].length - 1];
  const previousValue = TIMELINE_DATA.metrics[selectedMetric][TIMELINE_DATA.metrics[selectedMetric].length - 2];
  const change = (((currentValue - previousValue) / previousValue) * 100).toFixed(1);

  return (
    <div className="home">
      <Topbar />
      <div className="dashboard-shell page-flow-shell">
      <div className="page-container page-flow-container">
        <div className="page-header">
          <div className="page-title-row">
            <span className="page-title-icon">
              <i className="bx bx-time-five"></i>
            </span>
            <h1 className="page-title">Performance Timeline</h1>
          </div>
          <p className="page-subtitle">Track performance trends across multiple seasons with interactive metrics</p>
        </div>

        <div className="dashboard-panel timeline-controls-panel">
        <div className="timeline-controls">
          <div className="metric-selector">
            <label htmlFor="metric-select">Select Metric:</label>
            <select
              id="metric-select"
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="metric-select"
            >
              <option value="goals">Goals Scored</option>
              <option value="assists">Assists</option>
              <option value="shots">Total Shots</option>
              <option value="passes">Pass Accuracy</option>
              <option value="tackles">Tackles Won</option>
              <option value="possession">Possession</option>
            </select>
          </div>

          <div className="trend-summary">
            <div className="trend-card">
              <div className="trend-icon">
                <i className={`bx ${trend.icon}`}></i>
              </div>
              <div className="trend-info">
                <h4>{trend.text}</h4>
                <p>Latest: {formatMetricValue(selectedMetric, currentValue)}</p>
                <span className={`change ${change > 0 ? "positive" : change < 0 ? "negative" : "neutral"}`}>
                  {change > 0 ? "+" : ""}
                  {change}% from last season
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="dashboard-panel timeline-chart-panel">
        <div className="timeline-chart-container">
          <div className="chart-card">
            <h3>{METRIC_LABELS[selectedMetric]} Over Time</h3>
            <div className="timeline-chart">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>
        </div>

        <div className="dashboard-panel season-breakdown-panel">
        <div className="season-breakdown">
          <h3>Season-by-Season Breakdown</h3>
          <div className="season-grid">
            {TIMELINE_DATA.seasons.map((season, index) => (
              <div key={season} className="season-card">
                <h4>{season}</h4>
                <div className="metric-value">
                  {formatMetricValue(selectedMetric, TIMELINE_DATA.metrics[selectedMetric][index])}
                </div>
                <div className="season-rank">
                  {index === TIMELINE_DATA.seasons.length - 1 ? 'Current' :
                   index === TIMELINE_DATA.seasons.length - 2 ? 'Previous' :
                   `Season ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Timeline;