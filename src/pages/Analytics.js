import { useState, useEffect } from "react";
import { Bar, Pie, PolarArea } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from "chart.js";
import { fetchPlayers } from "../api/apiFootball";
import Topbar from "../components/Topbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

function Analytics() {
  const [selectedPlayers, setSelectedPlayers] = useState([0, 1]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load players from API
  useEffect(() => {
    async function loadPlayers() {
      try {
        // Fetch players from Barcelona (popular team with good data)
        const barcelonaPlayers = await fetchPlayers("Barcelona");

        if (barcelonaPlayers && barcelonaPlayers.length > 0) {
          // Transform API data to our format
          const formattedPlayers = barcelonaPlayers.slice(0, 4).map((player, index) => ({
            id: index,
            name: player.strPlayer || `Player ${index + 1}`,
            photo: player.strThumb || player.strCutout || `https://via.placeholder.com/150x150?text=${player.strPlayer?.charAt(0) || 'P'}`,
            position: player.strPosition || "Unknown",
            stats: {
              goals: Math.floor(Math.random() * 30) + 1, // Mock stats for demo
              assists: Math.floor(Math.random() * 20) + 1,
              shots: Math.floor(Math.random() * 100) + 20,
              passes: Math.floor(Math.random() * 50) + 70,
              tackles: Math.floor(Math.random() * 40) + 5,
              saves: player.strPosition === "Goalkeeper" ? Math.floor(Math.random() * 150) + 50 : 0
            }
          }));

          setPlayers(formattedPlayers);
        } else {
          // Fallback to static data if API fails
          setPlayers([
            {
              id: 0,
              name: "Lionel Messi",
              photo: "https://www.thesportsdb.com/images/media/player/thumb/qp1n8u1585843235.jpg",
              stats: { goals: 25, assists: 15, shots: 85, passes: 92, tackles: 12, saves: 0 },
              position: "Forward"
            },
            {
              id: 1,
              name: "Cristiano Ronaldo",
              photo: "https://www.thesportsdb.com/images/media/player/thumb/uy7t8w1585843240.jpg",
              stats: { goals: 28, assists: 8, shots: 95, passes: 78, tackles: 8, saves: 0 },
              position: "Forward"
            },
            {
              id: 2,
              name: "Kevin De Bruyne",
              photo: "https://www.thesportsdb.com/images/media/player/thumb/xu7t8w1585843245.jpg",
              stats: { goals: 8, assists: 22, shots: 65, passes: 88, tackles: 15, saves: 0 },
              position: "Midfielder"
            },
            {
              id: 3,
              name: "Virgil van Dijk",
              photo: "https://www.thesportsdb.com/images/media/player/thumb/vu7t8w1585843250.jpg",
              stats: { goals: 3, assists: 2, shots: 25, passes: 85, tackles: 35, saves: 0 },
              position: "Defender"
            }
          ]);
        }
      } catch (error) {
        console.error("Error loading players:", error);
        // Fallback to static data
        setPlayers([
          {
            id: 0,
            name: "Lionel Messi",
            photo: "https://www.thesportsdb.com/images/media/player/thumb/qp1n8u1585843235.jpg",
            stats: { goals: 25, assists: 15, shots: 85, passes: 92, tackles: 12, saves: 0 },
            position: "Forward"
          },
          {
            id: 1,
            name: "Cristiano Ronaldo",
            photo: "https://www.thesportsdb.com/images/media/player/thumb/uy7t8w1585843240.jpg",
            stats: { goals: 28, assists: 8, shots: 95, passes: 78, tackles: 8, saves: 0 },
            position: "Forward"
          },
          {
            id: 2,
            name: "Kevin De Bruyne",
            photo: "https://www.thesportsdb.com/images/media/player/thumb/xu7t8w1585843245.jpg",
            stats: { goals: 8, assists: 22, shots: 65, passes: 88, tackles: 15, saves: 0 },
            position: "Midfielder"
          },
          {
            id: 3,
            name: "Virgil van Dijk",
            photo: "https://www.thesportsdb.com/images/media/player/thumb/vu7t8w1585843250.jpg",
            stats: { goals: 3, assists: 2, shots: 25, passes: 85, tackles: 35, saves: 0 },
            position: "Defender"
          }
        ]);
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="home">
        <Topbar />
        <div className="dashboard-shell page-flow-shell">
        <div className="page-container page-flow-container">
          <div className="page-header">
            <div className="page-title-row">
              <span className="page-title-icon">
                <i className="bx bx-git-compare"></i>
              </span>
              <h1 className="page-title">Player Comparison</h1>
            </div>
            <p className="page-subtitle">Loading player data...</p>
          </div>
          <div className="dashboard-panel loading-container">
            <div>Loading players from TheSportsDB...</div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // Ensure we have players before rendering
  if (!players || players.length === 0) {
    return (
      <div className="home">
        <Topbar />
        <div className="dashboard-shell page-flow-shell">
        <div className="page-container page-flow-container">
          <div className="page-header">
            <div className="page-title-row">
              <span className="page-title-icon">
                <i className="bx bx-git-compare"></i>
              </span>
              <h1 className="page-title">Player Comparison</h1>
            </div>
            <p className="page-subtitle">Unable to load player data</p>
          </div>
          <div className="dashboard-panel dashboard-empty-state">
            <p>No comparison data is available at the moment.</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

  const selectedPlayer1 = players[selectedPlayers[0]] || players[0];
  const selectedPlayer2 = players[selectedPlayers[1]] || players[1];

  // Bar Chart Data - Goals and Assists Comparison
  const barData = {
    labels: ['Goals', 'Assists'],
    datasets: [
      {
        label: selectedPlayer1.name,
        data: [selectedPlayer1.stats.goals, selectedPlayer1.stats.assists],
        backgroundColor: 'rgba(220, 38, 38, 0.8)',
        borderColor: '#dc2626',
        borderWidth: 1,
      },
      {
        label: selectedPlayer2.name,
        data: [selectedPlayer2.stats.goals, selectedPlayer2.stats.assists],
        backgroundColor: 'rgba(5, 150, 105, 0.8)',
        borderColor: '#059669',
        borderWidth: 1,
      },
    ],
  };

  // Pie Chart Data - Shot Accuracy Distribution
  const pieData = {
    labels: ['On Target', 'Off Target'],
    datasets: [{
      data: [
        Math.round(selectedPlayer1.stats.shots * 0.65), // Assuming 65% accuracy
        Math.round(selectedPlayer1.stats.shots * 0.35)
      ],
      backgroundColor: ['#dc2626', '#e5e7eb'],
      borderColor: ['#b91c1c', '#d1d5db'],
      borderWidth: 2,
    }],
  };

  // Polar Area Chart Data - Overall Performance Metrics
  const polarData = {
    labels: ['Goals', 'Assists', 'Shots', 'Passes', 'Tackles'],
    datasets: [{
      label: selectedPlayer1.name,
      data: [
        selectedPlayer1.stats.goals,
        selectedPlayer1.stats.assists,
        selectedPlayer1.stats.shots,
        selectedPlayer1.stats.passes,
        selectedPlayer1.stats.tackles
      ],
      backgroundColor: 'rgba(220, 38, 38, 0.2)',
      borderColor: '#dc2626',
      borderWidth: 2,
      pointBackgroundColor: '#dc2626',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12, weight: '500' }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      }
    }
  };

  return (
    <div className="home">
      <Topbar />
      <div className="dashboard-shell page-flow-shell">
      <div className="page-container page-flow-container">
        <div className="page-header">
          <div className="page-title-row">
            <span className="page-title-icon">
              <i className="bx bx-git-compare"></i>
            </span>
            <h1 className="page-title">Player Comparison</h1>
          </div>
          <p className="page-subtitle">Compare player performance metrics using multiple visualization types</p>
        </div>

        {/* Player Selection */}
        <div className="dashboard-panel comparison-controls-panel">
        <div className="comparison-controls">
          <div className="player-selectors">
            <div className="selector-group">
              <label>Player 1:</label>
              <div className="player-card-selection">
                <img src={selectedPlayer1.photo} alt={selectedPlayer1.name} className="player-photo" />
                <select
                  value={selectedPlayers[0]}
                  onChange={(e) => setSelectedPlayers([parseInt(e.target.value), selectedPlayers[1]])}
                  className="player-select"
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="selector-group">
              <label>Player 2:</label>
              <div className="player-card-selection">
                <img src={selectedPlayer2.photo} alt={selectedPlayer2.name} className="player-photo" />
                <select
                  value={selectedPlayers[1]}
                  onChange={(e) => setSelectedPlayers([selectedPlayers[0], parseInt(e.target.value)])}
                  className="player-select"
                >
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        </div>

        {/* Charts Grid */}
        <div className="dashboard-panel comparison-charts-panel">
        <div className="charts-grid">
          {/* Bar Chart */}
          <div className="chart-card">
            <h3>Goals & Assists Comparison</h3>
            <div className="chart-container">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          {/* Pie Chart */}
          <div className="chart-card">
            <h3>Shot Accuracy Distribution</h3>
            <div className="chart-container">
              <Pie data={pieData} options={chartOptions} />
            </div>
          </div>

          {/* Polar Area Chart */}
          <div className="chart-card">
            <h3>Performance Metrics Overview</h3>
            <div className="chart-container">
              <PolarArea data={polarData} options={chartOptions} />
            </div>
          </div>
        </div>
        </div>

        {/* Summary Stats */}
        <div className="dashboard-panel comparison-summary-panel">
        <div className="comparison-summary">
          <div className="summary-card">
            <h3>Comparison Summary</h3>
            <div className="players-header">
              <div className="player-header-item">
                <img src={selectedPlayer1.photo} alt={selectedPlayer1.name} className="summary-player-photo" />
                <span className="player-name">{selectedPlayer1.name}</span>
              </div>
              <div className="vs-badge">VS</div>
              <div className="player-header-item">
                <img src={selectedPlayer2.photo} alt={selectedPlayer2.name} className="summary-player-photo" />
                <span className="player-name">{selectedPlayer2.name}</span>
              </div>
            </div>
            <div className="stats-comparison">
              <div className="stat-row">
                <span className="stat-label">Total Goals:</span>
                <span className="stat-value player1">{selectedPlayer1.stats.goals}</span>
                <span className="stat-value player2">{selectedPlayer2.stats.goals}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Assists:</span>
                <span className="stat-value player1">{selectedPlayer1.stats.assists}</span>
                <span className="stat-value player2">{selectedPlayer2.stats.assists}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Shot Accuracy:</span>
                <span className="stat-value player1">65%</span>
                <span className="stat-value player2">70%</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Analytics;