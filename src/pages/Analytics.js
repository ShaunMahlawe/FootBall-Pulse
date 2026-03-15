import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { clearApiCache, fetchLeagues, fetchPlayers, fetchTeams } from "../api/apiFootball";
import Topbar from "../components/Topbar";
import { getPlayerVisual } from "../utils/playerVisuals";

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

function getNumericStat(player, keys) {
  for (const key of keys) {
    const value = player?.[key];
    if (value !== null && value !== undefined && value !== "") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
}

function getShotAccuracy(player) {
  const totalShots = Number(player?.stats?.shots || 0);
  const onTargetShots = Number(player?.stats?.shotsOnTarget || 0);

  if (totalShots <= 0) {
    return "N/A";
  }

  return `${((onTargetShots / totalShots) * 100).toFixed(1)}%`;
}

function isEligibleComparisonPlayer(player) {
  const position = String(player?.position || player?.strPosition || "").trim().toLowerCase();
  const status = String(player?.status || player?.strStatus || "").trim().toLowerCase();

  if (!position) return false;
  if (position === "coaching" || status === "coaching") return false;
  if (position.includes("coach")) return false;

  return true;
}

function isSamePlayer(left, right) {
  if (!left || !right) return false;

  const leftId = String(left.id || "").trim();
  const rightId = String(right.id || "").trim();
  if (leftId && rightId) {
    return leftId === rightId;
  }

  const leftName = String(left.name || "").trim().toLowerCase();
  const rightName = String(right.name || "").trim().toLowerCase();
  const leftClub = String(left.club || "").trim().toLowerCase();
  const rightClub = String(right.club || "").trim().toLowerCase();

  return Boolean(leftName) && leftName === rightName && leftClub === rightClub;
}

function Analytics() {
  const location = useLocation();
  const [selectedPlayers, setSelectedPlayers] = useState(["", ""]);
  const [playersBySide, setPlayersBySide] = useState([[], []]);
  const [leagues, setLeagues] = useState([]);
  const [teamsBySide, setTeamsBySide] = useState([[], []]);
  const [selectedLeagues, setSelectedLeagues] = useState([
    "English Premier League",
    "English Premier League"
  ]);
  const [selectedClubs, setSelectedClubs] = useState(["", ""]);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingSides, setLoadingSides] = useState([false, false]);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(() => document.body.classList.contains("dark"));

  useEffect(() => {
    const prefillLeague = location.state?.prefillLeague || "";
    if (!prefillLeague) return;

    setSelectedLeagues((prev) => [
      prefillLeague || prev[0],
      prefillLeague || prev[1],
    ]);
  }, [location.state]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.classList.contains("dark"));
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      clearApiCache();
      setRefreshNonce((value) => value + 1);
    };

    window.addEventListener("footballpulse:refreshData", handleGlobalRefresh);

    return () => {
      window.removeEventListener("footballpulse:refreshData", handleGlobalRefresh);
    };
  }, []);

  // Load available soccer leagues once
  useEffect(() => {
    let isMounted = true;

    async function loadLeagues() {
      setLoadingLeagues(true);
      try {
        const leagueData = await fetchLeagues();
        const soccerLeagues = (leagueData || []).filter((league) => league?.strLeague);

        if (!isMounted) return;

        setLeagues(soccerLeagues);

        if (soccerLeagues.length > 0) {
          setSelectedLeagues((prev) => {
            const fallbackLeague = soccerLeagues[0].strLeague;
            return prev.map((leagueName) => {
              const exists = soccerLeagues.some((league) => league.strLeague === leagueName);
              return exists ? leagueName : fallbackLeague;
            });
          });
        }
      } catch (error) {
        console.error("Error loading leagues:", error);
      } finally {
        if (isMounted) {
          setLoadingLeagues(false);
        }
      }
    }

    loadLeagues();

    return () => {
      isMounted = false;
    };
  }, [refreshNonce]);

  // Load clubs for side 1
  useEffect(() => {
    let isMounted = true;

    async function loadTeamsForSide0() {
      const selectedLeague = selectedLeagues[0];
      if (!selectedLeague) return;

      try {
        const teamData = await fetchTeams(selectedLeague);

        if (!isMounted) return;

        setTeamsBySide((prev) => [teamData || [], prev[1]]);

        if (!teamData || teamData.length === 0) {
          setSelectedClubs((prev) => ["", prev[1]]);
          return;
        }

        setSelectedClubs((prev) => {
          const next = [...prev];
          const exists = teamData.some((team) => team.strTeam === next[0]);
          next[0] = exists ? next[0] : teamData[0].strTeam;
          return next;
        });
      } catch (error) {
        console.error("Error loading clubs for side 1:", error);
        if (isMounted) {
          setTeamsBySide((prev) => [[], prev[1]]);
          setSelectedClubs((prev) => ["", prev[1]]);
        }
      }
    }

    loadTeamsForSide0();

    return () => {
      isMounted = false;
    };
  }, [selectedLeagues, refreshNonce]);

  // Load clubs for side 2
  useEffect(() => {
    let isMounted = true;

    async function loadTeamsForSide1() {
      const selectedLeague = selectedLeagues[1];
      if (!selectedLeague) return;

      try {
        const teamData = await fetchTeams(selectedLeague);

        if (!isMounted) return;

        setTeamsBySide((prev) => [prev[0], teamData || []]);

        if (!teamData || teamData.length === 0) {
          setSelectedClubs((prev) => [prev[0], ""]);
          return;
        }

        setSelectedClubs((prev) => {
          const next = [...prev];
          const exists = teamData.some((team) => team.strTeam === next[1]);
          next[1] = exists ? next[1] : teamData[0].strTeam;
          return next;
        });
      } catch (error) {
        console.error("Error loading clubs for side 2:", error);
        if (isMounted) {
          setTeamsBySide((prev) => [prev[0], []]);
          setSelectedClubs((prev) => [prev[0], ""]);
        }
      }
    }

    loadTeamsForSide1();

    return () => {
      isMounted = false;
    };
  }, [selectedLeagues, refreshNonce]);

  // Load full player list for side 1
  useEffect(() => {
    let isMounted = true;

    async function loadPlayersForSide0() {
      const selectedClub = selectedClubs[0];
      if (!selectedClub) {
        setPlayersBySide((prev) => [[], prev[1]]);
        setSelectedPlayers((prev) => ["", prev[1]]);
        return;
      }

      setLoadingSides((prev) => [true, prev[1]]);

      try {
        const apiPlayers = await fetchPlayers(selectedClub);

        if (!isMounted) return;

        const formattedPlayers = (apiPlayers || []).map((player, index) => ({
          id: player.idPlayer || `${selectedClub}-${index}`,
          name: player.strPlayer || `Player ${index + 1}`,
          photo: getPlayerVisual(player, { name: player.strPlayer, team: player.strTeam || selectedClub }),
          position: player.strPosition || "Unknown",
          club: player.strTeam || selectedClub,
          stats: {
            goals: getNumericStat(player, ["intGoals", "strGoals"]),
            assists: getNumericStat(player, ["intAssists", "strAssists"]),
            shots: getNumericStat(player, ["intShots", "strShots"]),
            shotsOnTarget: getNumericStat(player, ["intShotsOnTarget", "strShotsOnTarget"]),
            passes: getNumericStat(player, ["intPasses", "strPasses", "intPassesCompleted"]),
            tackles: getNumericStat(player, ["intTackles", "strTackles"]),
            saves: getNumericStat(player, ["intSaves", "strSaves"])
          }
        }));

        const eligiblePlayers = formattedPlayers.filter(isEligibleComparisonPlayer);

        setPlayersBySide((prev) => [eligiblePlayers, prev[1]]);

        setSelectedPlayers((prev) => {
          const playerIds = eligiblePlayers.map((player) => player.id);
          const firstId = playerIds.includes(prev[0]) ? prev[0] : playerIds[0] || "";
          return [firstId, prev[1]];
        });
      } catch (error) {
        console.error("Error loading players for side 1:", error);
        if (isMounted) {
          setPlayersBySide((prev) => [[], prev[1]]);
          setSelectedPlayers((prev) => ["", prev[1]]);
        }
      } finally {
        if (isMounted) {
          setLoadingSides((prev) => [false, prev[1]]);
        }
      }
    }

    loadPlayersForSide0();

    return () => {
      isMounted = false;
    };
  }, [selectedClubs, refreshNonce]);

  // Load full player list for side 2
  useEffect(() => {
    let isMounted = true;

    async function loadPlayersForSide1() {
      const selectedClub = selectedClubs[1];
      if (!selectedClub) {
        setPlayersBySide((prev) => [prev[0], []]);
        setSelectedPlayers((prev) => [prev[0], ""]);
        return;
      }

      setLoadingSides((prev) => [prev[0], true]);

      try {
        const apiPlayers = await fetchPlayers(selectedClub);

        if (!isMounted) return;

        const formattedPlayers = (apiPlayers || []).map((player, index) => ({
          id: player.idPlayer || `${selectedClub}-${index}`,
          name: player.strPlayer || `Player ${index + 1}`,
          photo: getPlayerVisual(player, { name: player.strPlayer, team: player.strTeam || selectedClub }),
          position: player.strPosition || "Unknown",
          club: player.strTeam || selectedClub,
          stats: {
            goals: getNumericStat(player, ["intGoals", "strGoals"]),
            assists: getNumericStat(player, ["intAssists", "strAssists"]),
            shots: getNumericStat(player, ["intShots", "strShots"]),
            shotsOnTarget: getNumericStat(player, ["intShotsOnTarget", "strShotsOnTarget"]),
            passes: getNumericStat(player, ["intPasses", "strPasses", "intPassesCompleted"]),
            tackles: getNumericStat(player, ["intTackles", "strTackles"]),
            saves: getNumericStat(player, ["intSaves", "strSaves"])
          }
        }));

        const eligiblePlayers = formattedPlayers.filter(isEligibleComparisonPlayer);

        setPlayersBySide((prev) => [prev[0], eligiblePlayers]);

        setSelectedPlayers((prev) => {
          const playerIds = eligiblePlayers.map((player) => player.id);
          const secondId = playerIds.includes(prev[1]) ? prev[1] : playerIds[0] || "";
          return [prev[0], secondId];
        });
      } catch (error) {
        console.error("Error loading players for side 2:", error);
        if (isMounted) {
          setPlayersBySide((prev) => [prev[0], []]);
          setSelectedPlayers((prev) => [prev[0], ""]);
        }
      } finally {
        if (isMounted) {
          setLoadingSides((prev) => [prev[0], false]);
        }
      }
    }

    loadPlayersForSide1();

    return () => {
      isMounted = false;
    };
  }, [selectedClubs, refreshNonce]);

  const selectedPlayer1 = playersBySide[0].find((player) => player.id === selectedPlayers[0]) || playersBySide[0][0];
  const selectedPlayer2 = playersBySide[1].find((player) => player.id === selectedPlayers[1]) || playersBySide[1][0];
  const loading = loadingLeagues || loadingSides[0] || loadingSides[1];
  const player1OnTargetShots = Math.min(selectedPlayer1?.stats?.shotsOnTarget || 0, selectedPlayer1?.stats?.shots || 0);
  const player1OffTargetShots = Math.max((selectedPlayer1?.stats?.shots || 0) - player1OnTargetShots, 0);
  const player1ShotAccuracy = getShotAccuracy(selectedPlayer1);
  const player2ShotAccuracy = getShotAccuracy(selectedPlayer2);

  useEffect(() => {
    if (!selectedPlayer1 || !selectedPlayer2 || !isSamePlayer(selectedPlayer1, selectedPlayer2)) {
      return;
    }

    const alternative = playersBySide[1].find((candidate) => !isSamePlayer(candidate, selectedPlayer1));
    if (alternative?.id) {
      setSelectedPlayers((prev) => [prev[0], alternative.id]);
    }
  }, [playersBySide, selectedPlayer1, selectedPlayer2]);

  const handlePlayerSelection = (sideIndex, playerId) => {
    if (sideIndex === 0) {
      const nextLeft = playersBySide[0].find((player) => player.id === playerId);
      const currentRight = playersBySide[1].find((player) => player.id === selectedPlayers[1]);
      if (nextLeft && currentRight && isSamePlayer(nextLeft, currentRight)) {
        const alternativeRight = playersBySide[1].find((candidate) => !isSamePlayer(candidate, nextLeft));
        setSelectedPlayers([playerId, alternativeRight?.id || selectedPlayers[1]]);
        return;
      }

      setSelectedPlayers([playerId, selectedPlayers[1]]);
      return;
    }

    const nextRight = playersBySide[1].find((player) => player.id === playerId);
    const currentLeft = playersBySide[0].find((player) => player.id === selectedPlayers[0]);
    if (nextRight && currentLeft && isSamePlayer(currentLeft, nextRight)) {
      const alternativeRight = playersBySide[1].find((candidate) => !isSamePlayer(candidate, currentLeft));
      setSelectedPlayers([selectedPlayers[0], alternativeRight?.id || playerId]);
      return;
    }

    setSelectedPlayers([selectedPlayers[0], playerId]);
  };

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
  if (!selectedPlayer1 || !selectedPlayer2) {
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
            <p>No player data found for one or both sides. Try another league or club selection.</p>
          </div>
        </div>
        </div>
      </div>
    );
  }

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
        player1OnTargetShots,
        player1OffTargetShots
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
    animation: {
      duration: 220,
      easing: "easeOutQuart",
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          color: isDarkMode ? "rgba(248, 250, 252, 0.9)" : "rgba(15, 23, 42, 0.88)",
          font: { size: 12, weight: '600' }
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.94)' : 'rgba(17, 24, 39, 0.94)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? "rgba(226, 232, 240, 0.86)" : "rgba(15, 23, 42, 0.84)",
          font: { size: 11, weight: "600" },
        },
        grid: {
          color: isDarkMode ? "rgba(148, 163, 184, 0.16)" : "rgba(15, 23, 42, 0.08)",
        },
      },
      y: {
        ticks: {
          color: isDarkMode ? "rgba(226, 232, 240, 0.84)" : "rgba(15, 23, 42, 0.82)",
          font: { size: 11, weight: "600" },
        },
        grid: {
          color: isDarkMode ? "rgba(148, 163, 184, 0.14)" : "rgba(15, 23, 42, 0.08)",
        },
      },
    }
  };

  const leftStats = selectedPlayer1?.stats || {};
  const rightStats = selectedPlayer2?.stats || {};
  const comparisonInsights = [
    { label: "Goals", left: leftStats.goals || 0, right: rightStats.goals || 0 },
    { label: "Assists", left: leftStats.assists || 0, right: rightStats.assists || 0 },
    { label: "Passes", left: leftStats.passes || 0, right: rightStats.passes || 0 },
    { label: "Tackles", left: leftStats.tackles || 0, right: rightStats.tackles || 0 },
  ].map((metric) => ({
    ...metric,
    winner: metric.left === metric.right ? "draw" : metric.left > metric.right ? "left" : "right",
  }));

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
          <p className="page-subtitle">Elite comparison analytics with cross-league player matchups, visual insights, and decision-grade performance signals.</p>
        </div>

        <div className="dashboard-panel comparison-insights-panel">
          <div className="comparison-insights-strip">
            {comparisonInsights.map((insight) => (
              <article key={insight.label} className={`comparison-insight-card comparison-winner-${insight.winner}`}>
                <span className="comparison-insight-label">{insight.label}</span>
                <div className="comparison-insight-values">
                  <strong>{insight.left}</strong>
                  <span>vs</span>
                  <strong>{insight.right}</strong>
                </div>
                <small>
                  {insight.winner === "draw"
                    ? "Level"
                    : insight.winner === "left"
                      ? `${selectedPlayer1.name} leads`
                      : `${selectedPlayer2.name} leads`}
                </small>
              </article>
            ))}
          </div>
        </div>

        {/* Player Selection */}
        <div className="dashboard-panel comparison-controls-panel">
        <div className="comparison-controls">
          <div className="player-selectors">
            <div className="selector-group">
              <label>League 1:</label>
              <select
                value={selectedLeagues[0]}
                onChange={(e) =>
                  setSelectedLeagues((prev) => [e.target.value, prev[1]])
                }
                className="player-select"
              >
                {leagues.map((league) => (
                  <option key={league.idLeague || league.strLeague} value={league.strLeague}>
                    {league.strLeague}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label>Club 1:</label>
              <select
                value={selectedClubs[0]}
                onChange={(e) =>
                  setSelectedClubs((prev) => [e.target.value, prev[1]])
                }
                className="player-select"
              >
                {teamsBySide[0].map((team) => (
                  <option key={team.idTeam || team.strTeam} value={team.strTeam}>
                    {team.strTeam}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label>League 2:</label>
              <select
                value={selectedLeagues[1]}
                onChange={(e) =>
                  setSelectedLeagues((prev) => [prev[0], e.target.value])
                }
                className="player-select"
              >
                {leagues.map((league) => (
                  <option key={`side2-${league.idLeague || league.strLeague}`} value={league.strLeague}>
                    {league.strLeague}
                  </option>
                ))}
              </select>
            </div>

            <div className="selector-group">
              <label>Club 2:</label>
              <select
                value={selectedClubs[1]}
                onChange={(e) =>
                  setSelectedClubs((prev) => [prev[0], e.target.value])
                }
                className="player-select"
              >
                {teamsBySide[1].map((team) => (
                  <option key={`side2-${team.idTeam || team.strTeam}`} value={team.strTeam}>
                    {team.strTeam}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="player-selectors">
            <div className="selector-group">
              <label>Player 1:</label>
              <div className="player-card-selection player-card-selection-side1">
                <div className="player-card-profile">
                  <img src={selectedPlayer1.photo || "/assets/img/User.jpg"} alt={selectedPlayer1.name} className="player-photo" />
                  <div className="player-card-copy">
                    <strong>{selectedPlayer1.name}</strong>
                    <span>{selectedPlayer1.position || "Player"}</span>
                    <small>{selectedPlayer1.club}</small>
                  </div>
                </div>
                <select
                  value={selectedPlayers[0]}
                  onChange={(e) => handlePlayerSelection(0, e.target.value)}
                  className="player-select"
                >
                  {playersBySide[0].map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position}) - {player.club}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="selector-group">
              <label>Player 2:</label>
              <div className="player-card-selection player-card-selection-side2">
                <div className="player-card-profile">
                  <img src={selectedPlayer2.photo || "/assets/img/User.jpg"} alt={selectedPlayer2.name} className="player-photo" />
                  <div className="player-card-copy">
                    <strong>{selectedPlayer2.name}</strong>
                    <span>{selectedPlayer2.position || "Player"}</span>
                    <small>{selectedPlayer2.club}</small>
                  </div>
                </div>
                <select
                  value={selectedPlayers[1]}
                  onChange={(e) => handlePlayerSelection(1, e.target.value)}
                  className="player-select"
                >
                  {playersBySide[1].map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({player.position}) - {player.club}
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
                <span className="stat-value player1">{player1ShotAccuracy}</span>
                <span className="stat-value player2">{player2ShotAccuracy}</span>
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