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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Timeline() {
  const [selectedMetric, setSelectedMetric] = useState('goals');

  // Historical data spanning multiple seasons
  const timelineData = {
    seasons: ['2018/19', '2019/20', '2020/21', '2021/22', '2022/23', '2023/24'],
    metrics: {
      goals: [45, 38, 42, 48, 52, 55],
      assists: [28, 32, 35, 40, 38, 42],
      shots: [320, 345, 310, 380, 395, 410],
      passes: [85.2, 87.1, 86.8, 88.5, 89.2, 90.1],
      tackles: [180, 195, 175, 200, 210, 205],
      possession: [58.5, 60.2, 59.8, 61.5, 62.1, 63.2]
    }
  };

  const metricLabels = {
    goals: 'Goals Scored',
    assists: 'Assists',
    shots: 'Total Shots',
    passes: 'Pass Accuracy (%)',
    tackles: 'Tackles Won',
    possession: 'Possession (%)'
  };

  const lineData = {
    labels: timelineData.seasons,
    datasets: [
      {
        label: metricLabels[selectedMetric],
        data: timelineData.metrics[selectedMetric],
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#dc2626',
        pointBorderColor: '#ffffff',
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
        position: 'top',
        labels: {
          font: { size: 14, weight: '600' },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#dc2626',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            label += context.parsed.y;
            if (['passes', 'possession'].includes(selectedMetric)) {
              label += '%';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value) {
            if (['passes', 'possession'].includes(selectedMetric)) {
              return value + '%';
            }
            return value;
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const getTrendDirection = (data) => {
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    if (secondAvg > firstAvg * 1.05) return { direction: 'up', icon: '📈', text: 'Trending Up' };
    if (secondAvg < firstAvg * 0.95) return { direction: 'down', icon: '📉', text: 'Trending Down' };
    return { direction: 'stable', icon: '📊', text: 'Stable Trend' };
  };

  const trend = getTrendDirection(timelineData.metrics[selectedMetric]);
  const currentValue = timelineData.metrics[selectedMetric][timelineData.metrics[selectedMetric].length - 1];
  const previousValue = timelineData.metrics[selectedMetric][timelineData.metrics[selectedMetric].length - 2];
  const change = ((currentValue - previousValue) / previousValue * 100).toFixed(1);

  return (
    <div className="home">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Performance Timeline</h1>
          <p className="page-subtitle">Track performance trends across multiple seasons with interactive metrics</p>
        </div>

        {/* Metric Selection */}
        <div className="timeline-controls">
          <div className="metric-selector">
            <label>Select Metric:</label>
            <select
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

          {/* Trend Summary */}
          <div className="trend-summary">
            <div className="trend-card">
              <div className="trend-icon">{trend.icon}</div>
              <div className="trend-info">
                <h4>{trend.text}</h4>
                <p>Latest: {currentValue}{['passes', 'possession'].includes(selectedMetric) ? '%' : ''}</p>
                <span className={`change ${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>
                  {change > 0 ? '+' : ''}{change}% from last season
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="timeline-chart-container">
          <div className="chart-card">
            <h3>{metricLabels[selectedMetric]} Over Time</h3>
            <div className="timeline-chart">
              <Line data={lineData} options={lineOptions} />
            </div>
          </div>
        </div>

        {/* Season Breakdown */}
        <div className="season-breakdown">
          <h3>Season-by-Season Breakdown</h3>
          <div className="season-grid">
            {timelineData.seasons.map((season, index) => (
              <div key={season} className="season-card">
                <h4>{season}</h4>
                <div className="metric-value">
                  {timelineData.metrics[selectedMetric][index]}
                  {['passes', 'possession'].includes(selectedMetric) ? '%' : ''}
                </div>
                <div className="season-rank">
                  {index === timelineData.seasons.length - 1 ? 'Current' :
                   index === timelineData.seasons.length - 2 ? 'Previous' :
                   `Season ${index + 1}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Timeline;