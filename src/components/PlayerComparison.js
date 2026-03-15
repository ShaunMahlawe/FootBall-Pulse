import { useMemo } from "react";
import { Radar } from "react-chartjs-2";
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const METRIC_LABELS = ["Speed", "Shooting", "Passing", "Defense", "Dribbling"];

function normalizePlayer(player, fallbackName) {
  return {
    id: String(player?.idPlayer || player?.id || ""),
    name: player?.name || player?.strPlayer || fallbackName,
    team: player?.team || player?.strTeam || "Unknown Club",
    position: player?.position || player?.strPosition || "Unknown Position",
    image: player?.image || player?.strThumb || player?.strCutout || "/assets/img/User.jpg",
    stats: Array.isArray(player?.stats) && player.stats.length === METRIC_LABELS.length
      ? player.stats
      : [68, 70, 72, 66, 71],
  };
}

function isSamePlayer(left, right) {
  if (!left || !right) return false;
  if (left.id && right.id) return left.id === right.id;
  return left.name.trim().toLowerCase() === right.name.trim().toLowerCase() &&
    left.team.trim().toLowerCase() === right.team.trim().toLowerCase();
}

function PlayerComparison({ player1, player2 }) {
  const leftPlayer = useMemo(() => normalizePlayer(player1, "Player 1"), [player1]);
  const rightCandidate = useMemo(() => normalizePlayer(player2, "Player 2"), [player2]);

  const rightPlayer = useMemo(() => {
    if (!isSamePlayer(leftPlayer, rightCandidate)) return rightCandidate;
    return {
      ...rightCandidate,
      id: rightCandidate.id || "comparison-fallback",
      name: "Comparison Player",
      team: `Opponent of ${leftPlayer.team}`,
      position: "Midfielder",
      stats: [64, 69, 74, 67, 70],
    };
  }, [leftPlayer, rightCandidate]);

  const data = {
    labels: METRIC_LABELS,
    datasets: [
      {
        label: leftPlayer.name,
        data: leftPlayer.stats,
        backgroundColor: "rgba(220, 38, 38, 0.2)",
        borderColor: "#dc2626",
        borderWidth: 2,
        pointBackgroundColor: "#dc2626",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
      {
        label: rightPlayer.name,
        data: rightPlayer.stats,
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
      background: "var(--dashboard-panel-bg)",
      border: "1px solid var(--dashboard-border)",
      borderRadius: "18px",
      padding: "20px",
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    }}>
      <h2 style={{
        fontSize: "20px",
        fontWeight: "700",
        color: "var(--dashboard-text)",
        textAlign: "center",
        margin: 0
      }}>
        Player Comparison
      </h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        alignItems: "center",
        gap: "12px"
      }}>
        <article style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          borderRadius: "14px",
          background: "var(--dashboard-soft-bg)",
          border: "1px solid rgba(220, 38, 38, 0.45)"
        }}>
          <img
            src={leftPlayer.image}
            alt={leftPlayer.name}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(255, 255, 255, 0.75)"
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--dashboard-text)", fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leftPlayer.name}</div>
            <div style={{ color: "var(--dashboard-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leftPlayer.position}</div>
            <div style={{ color: "var(--dashboard-muted)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{leftPlayer.team}</div>
          </div>
        </article>

        <span style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "42px",
          height: "42px",
          borderRadius: "999px",
          background: "var(--primary-gradient)",
          color: "var(--text-inverse)",
          fontSize: "13px",
          fontWeight: 800,
          letterSpacing: "0.06em"
        }}>VS</span>

        <article style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px",
          borderRadius: "14px",
          background: "var(--dashboard-soft-bg)",
          border: "1px solid rgba(5, 150, 105, 0.45)"
        }}>
          <img
            src={rightPlayer.image}
            alt={rightPlayer.name}
            style={{
              width: "68px",
              height: "68px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(255, 255, 255, 0.75)"
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--dashboard-text)", fontSize: "15px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rightPlayer.name}</div>
            <div style={{ color: "var(--dashboard-muted)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rightPlayer.position}</div>
            <div style={{ color: "var(--dashboard-muted)", fontSize: "12px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{rightPlayer.team}</div>
          </div>
        </article>
      </div>

      <div style={{ height: "300px", width: "100%" }}>
        <Radar data={data} options={options} />
      </div>
    </div>
  );
}

export default PlayerComparison;

