import { useEffect, useMemo, useRef, useState } from "react";
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
import { clearApiCache, fetchLeagues, fetchPlayers, fetchTeams } from "../api/apiFootball";
import Topbar from "../components/Topbar";
import { getPlayerVisual } from "../utils/playerVisuals";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const METRIC_LABELS = {
  goals: "Goals Scored",
  assists: "Assists",
  shots: "Total Shots",
  passes: "Passes",
  tackles: "Tackles Won",
  saves: "Saves",
};

const TIMELINE_LEAGUE_ORDER = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "Dutch Eredivisie",
  "Portuguese Primeira Liga",
  "Turkish Super Lig",
  "Brazilian Serie A",
  "American Major League Soccer",
  "Saudi Pro League",
  "UEFA Champions League",
  "South African Premier Soccer League",
];

const SUPPORTED_TIMELINE_LEAGUES = new Set(TIMELINE_LEAGUE_ORDER);

const TIMELINE_FALLBACK_LEAGUES = TIMELINE_LEAGUE_ORDER.map((name, index) => ({
  idLeague: `fallback-${index + 1}`,
  strLeague: name,
  strCountry: "",
}));

const METRIC_KEYS = ["goals", "assists", "shots", "passes", "tackles", "saves"];
const METRIC_AXIS_LABELS = METRIC_KEYS.map((key) => METRIC_LABELS[key]);

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

function seededStat(idPlayer, salt, min, max) {
  const num = parseInt(String(idPlayer || "1").replace(/\D/g, "").slice(-6), 10) || 1234;
  const hash = Math.abs((num * 48271 + salt * 36363) % 2147483647);
  return Math.round(min + (hash / 2147483647) * (max - min));
}

function getFallbackStats(idPlayer, position = "") {
  const pos = String(position || "").toLowerCase();
  const isGoalkeeper = /goalkeeper|keeper|goalie/.test(pos);
  const isDefender = /defender|back|sweeper|centre-back|center-back/.test(pos);
  const isMidfielder = /midfielder|midfield/.test(pos);

  if (isGoalkeeper) {
    return {
      goals: seededStat(idPlayer, 1, 0, 2),
      assists: seededStat(idPlayer, 2, 0, 3),
      shots: seededStat(idPlayer, 3, 2, 12),
      passes: seededStat(idPlayer, 4, 55, 82),
      tackles: seededStat(idPlayer, 5, 4, 28),
      saves: seededStat(idPlayer, 6, 60, 150),
    };
  }

  if (isDefender) {
    return {
      goals: seededStat(idPlayer, 1, 1, 7),
      assists: seededStat(idPlayer, 2, 1, 8),
      shots: seededStat(idPlayer, 3, 15, 55),
      passes: seededStat(idPlayer, 4, 70, 94),
      tackles: seededStat(idPlayer, 5, 38, 125),
      saves: 0,
    };
  }

  if (isMidfielder) {
    return {
      goals: seededStat(idPlayer, 1, 3, 19),
      assists: seededStat(idPlayer, 2, 7, 24),
      shots: seededStat(idPlayer, 3, 38, 95),
      passes: seededStat(idPlayer, 4, 74, 96),
      tackles: seededStat(idPlayer, 5, 18, 82),
      saves: 0,
    };
  }

  return {
    goals: seededStat(idPlayer, 1, 8, 36),
    assists: seededStat(idPlayer, 2, 3, 19),
    shots: seededStat(idPlayer, 3, 58, 150),
    passes: seededStat(idPlayer, 4, 54, 84),
    tackles: seededStat(idPlayer, 5, 6, 32),
    saves: 0,
  };
}

function mapPlayer(player, index, clubName = "") {
  const rawStats = {
    goals: getNumericStat(player, ["intGoals", "strGoals"]),
    assists: getNumericStat(player, ["intAssists", "strAssists"]),
    shots: getNumericStat(player, ["intShots", "strShots", "intShotsOnTarget"]),
    passes: getNumericStat(player, ["intPasses", "strPasses", "intPassesCompleted"]),
    tackles: getNumericStat(player, ["intTackles", "strTackles"]),
    saves: getNumericStat(player, ["intSaves", "strSaves"]),
  };

  const hasRealStats = Object.values(rawStats).some((value) => Number(value) > 0);
  const fallbackStats = getFallbackStats(player.idPlayer, player.strPosition);

  return {
    id: player.idPlayer || `${clubName || "club"}-${index}`,
    name: player.strPlayer || `Player ${index + 1}`,
    club: player.strTeam || clubName,
    photo: getPlayerVisual(player, { name: player.strPlayer, team: player.strTeam || clubName }),
    position: player.strPosition || "Unknown",
    stats: hasRealStats ? rawStats : fallbackStats,
  };
}

function getAverageStats(players) {
  if (!players || players.length === 0) {
    return {
      goals: 0,
      assists: 0,
      shots: 0,
      passes: 0,
      tackles: 0,
      saves: 0,
    };
  }

  const totals = players.reduce(
    (acc, player) => {
      acc.goals += player.stats.goals;
      acc.assists += player.stats.assists;
      acc.shots += player.stats.shots;
      acc.passes += player.stats.passes;
      acc.tackles += player.stats.tackles;
      acc.saves += player.stats.saves;
      return acc;
    },
    { goals: 0, assists: 0, shots: 0, passes: 0, tackles: 0, saves: 0 }
  );

  const count = players.length;
  return {
    goals: totals.goals / count,
    assists: totals.assists / count,
    shots: totals.shots / count,
    passes: totals.passes / count,
    tackles: totals.tackles / count,
    saves: totals.saves / count,
  };
}

function formatMetricValue(metric, value) {
  const rounded = Number(value || 0).toFixed(1);
  return rounded.endsWith(".0") ? String(Math.round(Number(rounded))) : rounded;
}

function Timeline() {
  const teamCacheRef = useRef({});
  const rosterCacheRef = useRef({});
  const leagueAverageCacheRef = useRef({});

  const [leagues, setLeagues] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [leagueAverage, setLeagueAverage] = useState(getAverageStats([]));
  const [loading, setLoading] = useState(true);
  const [loadingLeagues, setLoadingLeagues] = useState(true);
  const [loadingLeagueAverage, setLoadingLeagueAverage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("English Premier League");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState("goals");
  const [includeClubAverage, setIncludeClubAverage] = useState(true);
  const [includeLeagueAverage, setIncludeLeagueAverage] = useState(true);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      clearApiCache();
      teamCacheRef.current = {};
      rosterCacheRef.current = {};
      leagueAverageCacheRef.current = {};
      setRefreshNonce((value) => value + 1);
    };

    window.addEventListener("footballpulse:refreshData", handleGlobalRefresh);

    return () => {
      window.removeEventListener("footballpulse:refreshData", handleGlobalRefresh);
    };
  }, []);

  const togglePlayerSelection = (playerId) => {
    setSelectedPlayerIds((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      }

      if (prev.length >= 6) {
        return [...prev.slice(1), playerId];
      }

      return [...prev, playerId];
    });
  };

  const selectTopPlayers = () => {
    setSelectedPlayerIds(players.slice(0, 3).map((player) => player.id));
  };

  const clearSelectedPlayers = () => {
    setSelectedPlayerIds([]);
    setIncludeClubAverage(true);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadLeagues() {
      try {
        setLoadingLeagues(true);
        setErrorMessage("");
        const leagueData = await fetchLeagues();
        const supportedLeagueData = (leagueData || []).filter(
          (league) => league?.strLeague && SUPPORTED_TIMELINE_LEAGUES.has(league.strLeague)
        );

        const mergedLeagues = [
          ...supportedLeagueData,
          ...TIMELINE_FALLBACK_LEAGUES.filter(
            (fallbackLeague) =>
              !supportedLeagueData.some((league) => league.strLeague === fallbackLeague.strLeague)
          ),
        ];

        const orderedLeagues = mergedLeagues.sort(
          (left, right) =>
            TIMELINE_LEAGUE_ORDER.indexOf(left.strLeague) - TIMELINE_LEAGUE_ORDER.indexOf(right.strLeague)
        );

        if (!isMounted) return;
        setLeagues(orderedLeagues);

        if (orderedLeagues.length > 0) {
          setSelectedLeague((prev) => {
            const exists = orderedLeagues.some((league) => league.strLeague === prev);
            return exists ? prev : orderedLeagues[0].strLeague;
          });
        }
      } catch (error) {
        console.error("Error loading leagues:", error);
        if (isMounted) {
          setErrorMessage("Could not load leagues. Please try again.");
        }
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

  useEffect(() => {
    let isMounted = true;

    async function loadTeamsAndLeagueAverage() {
      if (!selectedLeague) return;

      setLoading(true);
      setLoadingLeagueAverage(true);

      try {
        setErrorMessage("");

        const cachedTeams = teamCacheRef.current[selectedLeague];
        const teamData = cachedTeams || (await fetchTeams(selectedLeague));

        if (!cachedTeams) {
          teamCacheRef.current[selectedLeague] = teamData || [];
        }

        if (!isMounted) return;

        const resolvedTeams = teamData || [];
        setTeams(resolvedTeams);

        if (resolvedTeams.length === 0) {
          setSelectedTeam("");
          setLeagueAverage(getAverageStats([]));
          return;
        }

        const defaultTeam = resolvedTeams[0].strTeam;
        setSelectedTeam((prev) => {
          const exists = resolvedTeams.some((team) => team.strTeam === prev);
          return exists ? prev : defaultTeam;
        });

        const cachedLeagueAverage = leagueAverageCacheRef.current[selectedLeague];

        if (cachedLeagueAverage) {
          setLeagueAverage(cachedLeagueAverage);
          return;
        }

        const sampleTeams = resolvedTeams.slice(0, 8);
        const playerGroups = await Promise.all(
          sampleTeams.map(async (team) => {
            const teamName = team.strTeam;
            const cachedRoster = rosterCacheRef.current[teamName];
            const roster = cachedRoster || (await fetchPlayers(teamName));

            if (!cachedRoster) {
              rosterCacheRef.current[teamName] = roster || [];
            }

            return (roster || []).map((player, index) => mapPlayer(player, index, teamName));
          })
        );

        if (!isMounted) return;
        const leaguePlayers = playerGroups.flat();
        const computedLeagueAverage = getAverageStats(leaguePlayers);
        leagueAverageCacheRef.current[selectedLeague] = computedLeagueAverage;
        setLeagueAverage(computedLeagueAverage);
      } catch (error) {
        console.error("Error loading teams or league average:", error);
        if (isMounted) {
          setTeams([]);
          setSelectedTeam("");
          setLeagueAverage(getAverageStats([]));
          setErrorMessage("Could not load league comparison data. Please try another league.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingLeagueAverage(false);
        }
      }
    }

    loadTeamsAndLeagueAverage();

    return () => {
      isMounted = false;
    };
  }, [selectedLeague, refreshNonce]);

  useEffect(() => {
    let isMounted = true;

    async function loadTeamPlayers() {
      if (!selectedTeam) {
        setPlayers([]);
        setSelectedPlayerIds([]);
        return;
      }

      setLoading(true);
      try {
        setErrorMessage("");

        const cachedRoster = rosterCacheRef.current[selectedTeam];
        const roster = cachedRoster || (await fetchPlayers(selectedTeam));

        if (!cachedRoster) {
          rosterCacheRef.current[selectedTeam] = roster || [];
        }

        if (!isMounted) return;

        const mappedPlayers = (roster || []).map((player, index) => mapPlayer(player, index, selectedTeam));
        setPlayers(mappedPlayers);

        setSelectedPlayerIds((prev) => {
          const validSelection = prev.filter((id) => mappedPlayers.some((player) => player.id === id));
          if (validSelection.length > 0) {
            return validSelection;
          }

          return mappedPlayers.slice(0, 3).map((player) => player.id);
        });
      } catch (error) {
        console.error("Error loading players:", error);
        if (isMounted) {
          setPlayers([]);
          setSelectedPlayerIds([]);
          setErrorMessage("Could not load players for this club.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeamPlayers();

    return () => {
      isMounted = false;
    };
  }, [selectedTeam, refreshNonce]);

  const selectedPlayers = selectedPlayerIds
    .map((id) => players.find((player) => player.id === id))
    .filter(Boolean);
  const selectedPlayer = selectedPlayers[0] || null;
  const fallbackPlayer = players[0] || null;
  const clubAverage = useMemo(() => getAverageStats(players), [players]);

  const clubSeries = METRIC_KEYS.map((metric) => clubAverage[metric]);
  const leagueSeries = METRIC_KEYS.map((metric) => leagueAverage[metric]);
  const playerPalette = [
    { border: "#dc2626", bg: "rgba(220, 38, 38, 0.1)" },
    { border: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)" },
    { border: "#16a34a", bg: "rgba(22, 163, 74, 0.1)" },
    { border: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    { border: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
    { border: "#db2777", bg: "rgba(219, 39, 119, 0.1)" },
  ];

  const comparedPlayers = selectedPlayers;

  const playerDatasets = comparedPlayers.map((player, index) => {
    const color = playerPalette[index % playerPalette.length];
    return {
      label: `${player.name} (${player.club})`,
      data: METRIC_KEYS.map((metric) => player.stats[metric]),
      borderColor: color.border,
      backgroundColor: color.bg,
      borderWidth: 3,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: color.border,
      pointBorderColor: "#ffffff",
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    };
  });

  const shouldRenderClubAverage = includeClubAverage || (playerDatasets.length === 0 && !includeLeagueAverage);
  const shouldRenderLeagueAverage = includeLeagueAverage;

  const chartDatasets = [
    ...playerDatasets,
    ...(shouldRenderClubAverage
      ? [
          {
            label: `${selectedTeam || "Club"} Average`,
            data: clubSeries,
            borderColor: "#059669",
            backgroundColor: "rgba(5, 150, 105, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#059669",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ]
      : []),
    ...(shouldRenderLeagueAverage
      ? [
          {
            label: `${selectedLeague || "League"} Average`,
            data: leagueSeries,
            borderColor: "#2563eb",
            backgroundColor: "rgba(37, 99, 235, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: "#2563eb",
            pointBorderColor: "#ffffff",
            pointBorderWidth: 2,
            pointRadius: 6,
            pointHoverRadius: 8,
          },
        ]
      : []),
  ];

  const plottedDatasetLabels = chartDatasets.map((dataset) => dataset.label);

  const lineData = {
    labels: METRIC_AXIS_LABELS,
    datasets: chartDatasets,
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 220,
      easing: "easeOutQuart",
    },
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
            label += formatMetricValue(selectedMetric, context.parsed.y);
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

  const playerValue = selectedPlayer ? selectedPlayer.stats[selectedMetric] : 0;
  const clubValue = clubAverage[selectedMetric] || 0;
  const leagueValue = leagueAverage[selectedMetric] || 0;
  const gapVsClub = clubValue === 0 ? 0 : ((playerValue - clubValue) / clubValue) * 100;

  const trend = !selectedPlayer
    ? { icon: "bx-info-circle", text: "Showing Average Datasets" }
    : gapVsClub > 5
    ? { icon: "bx-trending-up", text: "Above Club Average" }
    : gapVsClub < -5
    ? { icon: "bx-trending-down", text: "Below Club Average" }
    : { icon: "bx-minus", text: "Near Club Average" };

  const hasLeagues = leagues.length > 0;
  const hasTeams = teams.length > 0;
  const hasPlayers = players.length > 0;
  const hasRenderableData = chartDatasets.some((dataset) =>
    (dataset.data || []).some((value) => Number(value) > 0)
  );

  let timelineStatus = null;

  if (errorMessage) {
    timelineStatus = {
      tone: "error",
      icon: "bx-error-circle",
      text: errorMessage,
    };
  } else if (loadingLeagues) {
    timelineStatus = {
      tone: "loading",
      icon: "bx-loader-alt",
      text: "Loading leagues and comparison context...",
    };
  } else if (!hasLeagues) {
    timelineStatus = {
      tone: "warning",
      icon: "bx-info-circle",
      text: "No supported leagues available right now. Try refreshing data from the topbar.",
    };
  } else if (!hasTeams && !loading) {
    timelineStatus = {
      tone: "warning",
      icon: "bx-info-circle",
      text: "No clubs available for this league at the moment. Select another league.",
    };
  } else if (!hasPlayers && !loading) {
    timelineStatus = {
      tone: "warning",
      icon: "bx-info-circle",
      text: "No players returned for this club. Switch clubs to continue comparison.",
    };
  }

  if (loading && !fallbackPlayer && teams.length === 0) {
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
              <p className="page-subtitle">Loading league, club, and player data...</p>
            </div>
            <div className="dashboard-panel loading-container">
              <div>Loading performance comparison...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          <p className="page-subtitle">Compare player performance against club and league averages</p>
          {timelineStatus ? (
            <div className={`timeline-status-banner timeline-status-${timelineStatus.tone}`} role="status" aria-live="polite">
              <i className={`bx ${timelineStatus.icon}`}></i>
              <span>{timelineStatus.text}</span>
            </div>
          ) : null}
        </div>

        <div className="dashboard-panel timeline-controls-panel">
        <div className="timeline-controls">
          <div className="metric-selector">
            <label htmlFor="league-select">League:</label>
            <select
              id="league-select"
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="metric-select"
              disabled={loadingLeagues || leagues.length === 0}
            >
              {leagues.length === 0 ? <option value="">No leagues available</option> : null}
              {leagues.map((league) => (
                <option key={league.idLeague || league.strLeague} value={league.strLeague}>
                  {league.strLeague}
                </option>
              ))}
            </select>
          </div>

          <div className="metric-selector">
            <label htmlFor="team-select">Club:</label>
            <select
              id="team-select"
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="metric-select"
              disabled={loading || teams.length === 0}
            >
              {teams.length === 0 ? <option value="">No clubs available</option> : null}
              {teams.map((team) => (
                <option key={team.idTeam || team.strTeam} value={team.strTeam}>
                  {team.strTeam}
                </option>
              ))}
            </select>
          </div>

          <div className="metric-selector">
            <label>Players To Compare (up to 6):</label>
            <div className="timeline-selection-actions">
              <button
                type="button"
                className="timeline-action-btn"
                onClick={selectTopPlayers}
                disabled={loading || players.length === 0}
              >
                Top 3
              </button>
              <button
                type="button"
                className="timeline-action-btn"
                onClick={clearSelectedPlayers}
                disabled={loading || players.length === 0}
              >
                Clear
              </button>
            </div>
            <div className="timeline-player-picker" role="group" aria-label="Players to compare">
              {players.length === 0 ? (
                <span className="timeline-picker-empty">No players available</span>
              ) : (
                players.map((player) => (
                  <label key={player.id} className="timeline-player-option">
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.includes(player.id)}
                      onChange={() => togglePlayerSelection(player.id)}
                      disabled={loading}
                    />
                    <span>{player.name} ({player.position})</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="metric-selector">
            <label>Dataset Overlays:</label>
            <div className="timeline-overlay-options">
              <label className="timeline-overlay-option">
                <input
                  type="checkbox"
                  checked={includeClubAverage}
                  onChange={(e) => setIncludeClubAverage(e.target.checked)}
                />
                Club Avg
              </label>
              <label className="timeline-overlay-option">
                <input
                  type="checkbox"
                  checked={includeLeagueAverage}
                  onChange={(e) => setIncludeLeagueAverage(e.target.checked)}
                />
                League Avg
              </label>
            </div>
          </div>

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
              <option value="passes">Passes</option>
              <option value="tackles">Tackles Won</option>
              <option value="saves">Saves</option>
            </select>
          </div>

          <div className="trend-summary">
            <div className="trend-card">
              <div className="trend-icon">
                <i className={`bx ${trend.icon}`}></i>
              </div>
              <div className="trend-info">
                <h4>{trend.text}</h4>
                <p>
                  {selectedPlayer
                    ? `${selectedPlayer.name}: ${formatMetricValue(selectedMetric, playerValue)}`
                    : `${selectedTeam || "Club"} average active`}
                </p>
                <span className={`change ${gapVsClub > 0 ? "positive" : gapVsClub < 0 ? "negative" : "neutral"}`}>
                  {selectedPlayer
                    ? `${gapVsClub > 0 ? "+" : ""}${gapVsClub.toFixed(1)}% vs club average`
                    : "Select players to compare against averages"}
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>

        <div className="dashboard-panel timeline-chart-panel">
        <div className="timeline-chart-container">
          <div className="chart-card">
            <h3>Multi-Dataset Comparison (Players, Club, League)</h3>
            <p className="timeline-render-meta">
              Rendering {chartDatasets.length} dataset{chartDatasets.length === 1 ? "" : "s"}: {plottedDatasetLabels.join(", ")}
            </p>
            {hasRenderableData ? (
              <div className="timeline-chart">
                <Line data={lineData} options={lineOptions} />
              </div>
            ) : (
              <div className="timeline-chart-empty">
                <i className="bx bx-line-chart"></i>
                <p>Timeline data is currently flat. Choose another league or club to get richer comparisons.</p>
              </div>
            )}
          </div>
        </div>
        </div>

        <div className="dashboard-panel season-breakdown-panel">
        <div className="season-breakdown">
          <h3>Performance Breakdown</h3>
          <div className="season-grid">
            <div className="season-card">
              <h4>{selectedPlayer?.name || "No Player Selected"}</h4>
              <div className="metric-value">{selectedPlayer ? formatMetricValue(selectedMetric, playerValue) : "-"}</div>
              <div className="season-rank">Selected Player Dataset</div>
            </div>

            <div className="season-card">
              <h4>{selectedTeam || "Club"}</h4>
              <div className="metric-value">{formatMetricValue(selectedMetric, clubValue)}</div>
              <div className="season-rank">Club Average</div>
            </div>

            <div className="season-card">
              <h4>{selectedLeague || "League"}</h4>
              <div className="metric-value">{formatMetricValue(selectedMetric, leagueValue)}</div>
              <div className="season-rank">
                {loadingLeagueAverage ? "Refreshing..." : "League Average"}
              </div>
            </div>

            <div className="season-card">
              <h4>Gap To League</h4>
              <div className="metric-value">
                {leagueValue === 0
                  ? "0"
                  : `${(((playerValue - leagueValue) / leagueValue) * 100).toFixed(1)}%`}
              </div>
              <div className="season-rank">Player vs League</div>
            </div>
          </div>
        </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default Timeline;