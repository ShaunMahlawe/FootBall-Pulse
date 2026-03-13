import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

function PlayerComparison({ player1, player2 }) {
  const data = {
    labels: ["Speed", "Shooting", "Passing", "Defense", "Dribbling"],
    datasets: [
      {
        label: player1.name,
        data: player1.stats,
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: "#dc2626",
        borderWidth: 2,
        pointBackgroundColor: "#dc2626",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: player2.name,
        data: player2.stats,
        backgroundColor: "rgba(5, 150, 105, 0.2)",
        borderColor: "#059669",
        borderWidth: 2,
        pointBackgroundColor: "#059669",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#dc2626',
        borderWidth: 1,
      }
    },
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    }
  };

  return (
    <div className="player-card" style={{
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        Player Comparison
      </h2>
      <div style={{ height: '300px', width: '100%' }}>
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}

export default PlayerComparison;

