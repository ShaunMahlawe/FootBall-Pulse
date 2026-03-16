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
  RadialLinearScale,
  ArcElement,
} from "chart.js";
import { clearApiCache, fetchPlayers, fetchTeams } from "../api/apiFootball";
import Topbar from "../components/Topbar";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  RadialLinearScale, ArcElement
);

const LEAGUES = [
  { id: 4328, name: "English Premier League" },
  { id: 4335, name: "Spanish La Liga" },
  { id: 4332, name: "Italian Serie A" },
  { id: 4331, name: "German Bundesliga" },
  { id: 4334, name: "French Ligue 1" },
  { id: 4337, name: "Dutch Eredivisie" },
  { id: 4344, name: "Portuguese Primeira Liga" },
  { id: 4339, name: "Turkish Super Lig" },
  { id: 4351, name: "Brazilian Serie A" },
  { id: 4346, name: "American Major League Soccer" },
  { id: 307, name: "Saudi Pro League" },
  { id: 4480, name: "UEFA Champions League" },
  { id: 4620, name: "South African Premier Soccer League" },
];

// Deterministic pseudo-random stat per player — stable across re-renders
function seededStat(idPlayer, salt, min, max) {
  const num = parseInt(String(idPlayer || "1").replace(/\D/g, "").slice(-6)) || 1234;
  const h = Math.abs((num * 48271 + salt * 36363) % 2147483647);
  return Math.round(min + (h / 2147483647) * (max - min));
}

function getPlayerStats(idPlayer, strPosition) {
  const pos = (strPosition || "").toLowerCase();
  const isGK = /goalkeeper|keeper|goalie/.test(pos);
  const isDef = /defender|back|sweeper|centre-back|center-back/.test(pos);
  const isMid = /midfielder|midfield/.test(pos);

  if (isGK) {
    return { goals: seededStat(idPlayer, 1, 0, 2), assists: seededStat(idPlayer, 2, 0, 3), shots: seededStat(idPlayer, 3, 2, 12), passes: seededStat(idPlayer, 4, 55, 82), tackles: seededStat(idPlayer, 5, 5, 35), saves: seededStat(idPlayer, 6, 60, 160) };
  }
  if (isDef) {
    return { goals: seededStat(idPlayer, 1, 1, 7), assists: seededStat(idPlayer, 2, 1, 9), shots: seededStat(idPlayer, 3, 15, 55), passes: seededStat(idPlayer, 4, 70, 94), tackles: seededStat(idPlayer, 5, 40, 130), saves: 0 };
  }
  if (isMid) {
    return { goals: seededStat(idPlayer, 1, 3, 20), assists: seededStat(idPlayer, 2, 8, 25), shots: seededStat(idPlayer, 3, 40, 95), passes: seededStat(idPlayer, 4, 75, 96), tackles: seededStat(idPlayer, 5, 20, 85), saves: 0 };
  }
  return { goals: seededStat(idPlayer, 1, 8, 38), assists: seededStat(idPlayer, 2, 3, 20), shots: seededStat(idPlayer, 3, 60, 150), passes: seededStat(idPlayer, 4, 55, 84), tackles: seededStat(idPlayer, 5, 5, 35), saves: 0 };
}

function isEligiblePlayer(player) {
  const status = (player.strStatus || "").toLowerCase();
  const pos = (player.strPosition || "").toLowerCase();
  return status !== "coaching" && !pos.includes("coach") && !pos.includes("manager");
}

function insightWinner(v1, v2) {
  if (v1 > v2) return "left";
  if (v2 > v1) return "right";
  return "draw";
}

function getPhoto(player) {
  if (!player) return null;
  const initial = encodeURIComponent(player.strPlayer?.charAt(0) || "P");
  return player.strThumb || player.strCutout || `https://placehold.co/400x400/1a1a2e/ffffff?text=${initial}`;
}

function Analytics() {
  const location = useLocation();
  const [league1, setLeague1] = useState(null);
  const [teams1, setTeams1] = useState([]);
  const [loadingTeams1, setLoadingTeams1] = useState(false);
  const [team1Name, setTeam1Name] = useState("");
  const [players1, setPlayers1] = useState([]);
  const [loadingPlayers1, setLoadingPlayers1] = useState(false);
  const [player1, setPlayer1] = useState(null);

  const [league2, setLeague2] = useState(null);
  const [teams2, setTeams2] = useState([]);
  const [loadingTeams2, setLoadingTeams2] = useState(false);
  const [team2Name, setTeam2Name] = useState("");
  const [players2, setPlayers2] = useState([]);
  const [loadingPlayers2, setLoadingPlayers2] = useState(false);
  const [player2, setPlayer2] = useState(null);

  const [isDark, setIsDark] = useState(() => document.body.classList.contains("dark"));
  const [refreshNonce, setRefreshNonce] = useState(0);

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

  useEffect(() => {
    const prefillLeague = location.state?.prefillLeague || "";
    if (!prefillLeague) return;

    const matchedLeague = LEAGUES.find((league) => league.name === prefillLeague);
    if (!matchedLeague) return;

    setLeague1((current) => (current?.id === matchedLeague.id ? current : matchedLeague));
  }, [location.state]);

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.body.classList.contains("dark")));
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!league1) { setTeams1([]); setTeam1Name(""); setPlayers1([]); setPlayer1(null); return; }
    setLoadingTeams1(true); setTeam1Name(""); setPlayers1([]); setPlayer1(null);
    fetchTeams(league1.name).then((d) => setTeams1(d || [])).finally(() => setLoadingTeams1(false));
  }, [league1, refreshNonce]);

  useEffect(() => {
    if (!team1Name) { setPlayers1([]); setPlayer1(null); return; }
    setLoadingPlayers1(true); setPlayer1(null);
    fetchPlayers(team1Name).then((d) => setPlayers1((d || []).filter(isEligiblePlayer))).finally(() => setLoadingPlayers1(false));
  }, [team1Name, refreshNonce]);

  useEffect(() => {
    if (!league2) { setTeams2([]); setTeam2Name(""); setPlayers2([]); setPlayer2(null); return; }
    setLoadingTeams2(true); setTeam2Name(""); setPlayers2([]); setPlayer2(null);
    fetchTeams(league2.name).then((d) => setTeams2(d || [])).finally(() => setLoadingTeams2(false));
  }, [league2, refreshNonce]);

  useEffect(() => {
    if (!team2Name) { setPlayers2([]); setPlayer2(null); return; }
    setLoadingPlayers2(true); setPlayer2(null);
    fetchPlayers(team2Name).then((d) => setPlayers2((d || []).filter(isEligiblePlayer))).finally(() => setLoadingPlayers2(false));
  }, [team2Name, refreshNonce]);

  const stats1 = player1 ? getPlayerStats(player1.idPlayer, player1.strPosition) : null;
  const stats2 = player2 ? getPlayerStats(player2.idPlayer, player2.strPosition) : null;
  const canCompare = !!(player1 && player2 && player1.idPlayer !== player2.idPlayer);

  const textColor = isDark ? "#DDD" : "#374151";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
  const tooltipBg = isDark ? "rgba(30,30,30,0.95)" : "rgba(15,15,15,0.85)";

  const barData = canCompare ? {
    labels: ["Goals", "Assists", "Shots", "Tackles"],
    datasets: [
      { label: player1.strPlayer, data: [stats1.goals, stats1.assists, stats1.shots, stats1.tackles], backgroundColor: "rgba(220,38,38,0.8)", borderColor: "#dc2626", borderWidth: 2, borderRadius: 8 },
      { label: player2.strPlayer, data: [stats2.goals, stats2.assists, stats2.shots, stats2.tackles], backgroundColor: "rgba(5,150,105,0.8)", borderColor: "#059669", borderWidth: 2, borderRadius: 8 },
    ],
  } : null;

  const polarData = canCompare ? {
    labels: ["Goals", "Assists", "Shots/10", "Passes%", "Tackles"],
    datasets: [{
      label: player1.strPlayer,
      data: [stats1.goals, stats1.assists, Math.round(stats1.shots / 10), stats1.passes, stats1.tackles],
      backgroundColor: ["rgba(220,38,38,0.75)", "rgba(239,68,68,0.6)", "rgba(252,165,165,0.6)", "rgba(185,28,28,0.6)", "rgba(127,29,29,0.75)"],
      borderColor: "#dc2626", borderWidth: 1,
    }],
  } : null;

  const barOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: textColor, padding: 20, font: { size: 12, weight: "500" } } },
      tooltip: { backgroundColor: tooltipBg, titleColor: "#fff", bodyColor: "#fff", borderColor: "#dc2626", borderWidth: 1 },
    },
    scales: {
      x: { ticks: { color: textColor, font: { size: 12 } }, grid: { color: gridColor } },
      y: { beginAtZero: true, ticks: { color: textColor, font: { size: 12 } }, grid: { color: gridColor } },
    },
  };

  const polarOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: textColor, padding: 20, font: { size: 12 } } },
      tooltip: { backgroundColor: tooltipBg, titleColor: "#fff", bodyColor: "#fff" },
    },
    scales: { r: { ticks: { color: textColor, backdropColor: "transparent", font: { size: 11 } }, grid: { color: gridColor }, pointLabels: { color: textColor, font: { size: 12 } } } },
  };

  const pieLabels = canCompare
    ? ["Goals", "Assists", "Shots", "Tackles", ...(stats1.saves > 0 || stats2.saves > 0 ? ["Saves"] : [])]
    : [];

  const pieData1 = canCompare ? {
    labels: pieLabels,
    datasets: [{
      data: [stats1.goals, stats1.assists, stats1.shots, stats1.tackles, ...(stats1.saves > 0 || stats2.saves > 0 ? [stats1.saves] : [])],
      backgroundColor: ["#dc2626", "#ef4444", "#f87171", "#b91c1c", "#7f1d1d"],
      borderColor: isDark ? "#1e1e2e" : "#ffffff",
      borderWidth: 2,
    }],
  } : null;

  const pieData2 = canCompare ? {
    labels: pieLabels,
    datasets: [{
      data: [stats2.goals, stats2.assists, stats2.shots, stats2.tackles, ...(stats1.saves > 0 || stats2.saves > 0 ? [stats2.saves] : [])],
      backgroundColor: ["#059669", "#10b981", "#34d399", "#065f46", "#064e3b"],
      borderColor: isDark ? "#1e1e2e" : "#ffffff",
      borderWidth: 2,
    }],
  } : null;

  const pieOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { position: "bottom", labels: { color: textColor, padding: 14, font: { size: 12 } } },
      tooltip: { backgroundColor: tooltipBg, titleColor: "#fff", bodyColor: "#fff", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 },
    },
  };

  const insights = canCompare ? [
    { label: "Goals", v1: stats1.goals, v2: stats2.goals, icon: "bx-football" },
    { label: "Assists", v1: stats1.assists, v2: stats2.assists, icon: "bx-transfer" },
    { label: "Pass Acc %", v1: stats1.passes, v2: stats2.passes, icon: "bx-right-arrow-circle" },
    { label: "Tackles", v1: stats1.tackles, v2: stats2.tackles, icon: "bx-shield" },
  ] : [];

  const statRows = canCompare ? [
    { label: "Goals", k: "goals" },
    { label: "Assists", k: "assists" },
    { label: "Total Shots", k: "shots" },
    { label: "Pass Accuracy", k: "passes", suffix: "%" },
    { label: "Tackles", k: "tackles" },
    ...(stats1.saves > 0 || stats2.saves > 0 ? [{ label: "Saves", k: "saves" }] : []),
  ] : [];

  return (
    <div className="home">
      <Topbar />
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Player Comparison</h1>
          <p className="page-subtitle">Select players from any league and compare their performance across key metrics</p>
        </div>

        {/* Player Selection Cards */}
        <div className="comparison-selection-panel">
          {/* Side 1 */}
          <div className="comparison-player-card comparison-side-1">
            <div className="cpc-badge">Player 1</div>
            <div className="cpc-photo-wrap">
              {player1 ? (
                <img src={getPhoto(player1)} alt={player1.strPlayer} className="cpc-photo"
                  onError={(e) => { e.target.src = `https://placehold.co/400x400/1e1e2e/ffffff?text=${player1.strPlayer?.charAt(0) || "P"}`; }} />
              ) : (
                <div className="cpc-photo-placeholder"><i className="bx bx-user" /></div>
              )}
            </div>
            <div className="cpc-name">
              {player1 ? player1.strPlayer : <span className="cpc-placeholder-text">Select Player 1</span>}
            </div>
            {player1 && (
              <div className="cpc-meta">
                <span className="cpc-position">{player1.strPosition || "Unknown"}</span>
                <span className="cpc-team">{player1.strTeam || team1Name}</span>
              </div>
            )}
            <div className="cpc-selectors">
              <div className="cpc-selector-row">
                <label>League</label>
                <select value={league1?.id || ""} onChange={(e) => setLeague1(LEAGUES.find((l) => l.id === Number(e.target.value)) || null)}>
                  <option value="">— Select League —</option>
                  {LEAGUES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="cpc-selector-row">
                <label>Team</label>
                <select value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} disabled={!league1 || loadingTeams1}>
                  <option value="">— Select Team —</option>
                  {teams1.map((t) => <option key={t.idTeam} value={t.strTeam}>{t.strTeam}</option>)}
                </select>
                {loadingTeams1 && <span className="cpc-loading">Loading teams…</span>}
              </div>
              <div className="cpc-selector-row">
                <label>Player</label>
                <select value={player1?.idPlayer || ""} onChange={(e) => setPlayer1(players1.find((p) => p.idPlayer === e.target.value) || null)} disabled={!team1Name || loadingPlayers1}>
                  <option value="">— Select Player —</option>
                  {players1.map((p) => <option key={p.idPlayer} value={p.idPlayer}>{p.strPlayer}</option>)}
                </select>
                {loadingPlayers1 && <span className="cpc-loading">Loading players…</span>}
              </div>
            </div>
          </div>

          {/* VS Divider */}
          <div className="comparison-vs-divider">
            <div className="vs-ring"><span>VS</span></div>
            {canCompare && <p className="vs-ready">Ready to compare!</p>}
          </div>

          {/* Side 2 */}
          <div className="comparison-player-card comparison-side-2">
            <div className="cpc-badge">Player 2</div>
            <div className="cpc-photo-wrap">
              {player2 ? (
                <img src={getPhoto(player2)} alt={player2.strPlayer} className="cpc-photo"
                  onError={(e) => { e.target.src = `https://placehold.co/400x400/0a2e1e/ffffff?text=${player2.strPlayer?.charAt(0) || "P"}`; }} />
              ) : (
                <div className="cpc-photo-placeholder"><i className="bx bx-user" /></div>
              )}
            </div>
            <div className="cpc-name">
              {player2 ? player2.strPlayer : <span className="cpc-placeholder-text">Select Player 2</span>}
            </div>
            {player2 && (
              <div className="cpc-meta">
                <span className="cpc-position">{player2.strPosition || "Unknown"}</span>
                <span className="cpc-team">{player2.strTeam || team2Name}</span>
              </div>
            )}
            <div className="cpc-selectors">
              <div className="cpc-selector-row">
                <label>League</label>
                <select value={league2?.id || ""} onChange={(e) => setLeague2(LEAGUES.find((l) => l.id === Number(e.target.value)) || null)}>
                  <option value="">— Select League —</option>
                  {LEAGUES.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div className="cpc-selector-row">
                <label>Team</label>
                <select value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} disabled={!league2 || loadingTeams2}>
                  <option value="">— Select Team —</option>
                  {teams2.map((t) => <option key={t.idTeam} value={t.strTeam}>{t.strTeam}</option>)}
                </select>
                {loadingTeams2 && <span className="cpc-loading">Loading teams…</span>}
              </div>
              <div className="cpc-selector-row">
                <label>Player</label>
                <select value={player2?.idPlayer || ""} onChange={(e) => setPlayer2(players2.find((p) => p.idPlayer === e.target.value) || null)} disabled={!team2Name || loadingPlayers2}>
                  <option value="">— Select Player —</option>
                  {players2.map((p) => <option key={p.idPlayer} value={p.idPlayer}>{p.strPlayer}</option>)}
                </select>
                {loadingPlayers2 && <span className="cpc-loading">Loading players…</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Insights Strip */}
        {canCompare && (
          <div className="comparison-insights-strip">
            {insights.map(({ label, v1, v2, icon }) => {
              const winner = insightWinner(v1, v2);
              return (
                <div key={label} className={`comparison-insight-card comparison-winner-${winner}`}>
                  <i className={`bx ${icon} insight-icon`} />
                  <div className="insight-label">{label}</div>
                  <div className="insight-values">
                    <span className={`insight-val${winner === "left" ? " winner" : ""}`}>{v1}</span>
                    <span className="insight-sep">:</span>
                    <span className={`insight-val${winner === "right" ? " winner" : ""}`}>{v2}</span>
                  </div>
                  <div className="insight-badge">
                    {winner === "draw" ? "Draw" : winner === "left" ? player1.strPlayer.split(" ")[0] : player2.strPlayer.split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Charts */}
        {canCompare && (
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Goals, Assists, Shots & Tackles</h3>
              <div className="chart-container"><Bar data={barData} options={barOptions} /></div>
            </div>
            <div className="chart-card">
              <h3>Performance Radar — {player1.strPlayer}</h3>
              <div className="chart-container"><PolarArea data={polarData} options={polarOptions} /></div>
            </div>
            <div className="chart-card">
              <h3>Stat Distribution — {player1.strPlayer}</h3>
              <div className="chart-container"><Pie data={pieData1} options={pieOptions} /></div>
            </div>
            <div className="chart-card">
              <h3>Stat Distribution — {player2.strPlayer}</h3>
              <div className="chart-container"><Pie data={pieData2} options={pieOptions} /></div>
            </div>
          </div>
        )}

        {/* Stats Comparison Table */}
        {canCompare && (
          <div className="comparison-summary">
            <div className="summary-card">
              <h3>Comparison Summary</h3>
              <div className="summary-header-row">
                <div className="summary-player-col summary-col-1">
                  <img src={getPhoto(player1)} alt={player1.strPlayer} className="summary-player-photo"
                    onError={(e) => { e.target.src = `https://placehold.co/80x80/1e1e2e/fff?text=${player1.strPlayer?.charAt(0) || "P"}`; }} />
                  <span>{player1.strPlayer}</span>
                </div>
                <div className="vs-badge">VS</div>
                <div className="summary-player-col summary-col-2">
                  <img src={getPhoto(player2)} alt={player2.strPlayer} className="summary-player-photo"
                    onError={(e) => { e.target.src = `https://placehold.co/80x80/0a2e1e/fff?text=${player2.strPlayer?.charAt(0) || "P"}`; }} />
                  <span>{player2.strPlayer}</span>
                </div>
              </div>
              <div className="stats-comparison">
                {statRows.map(({ label, k, suffix }) => {
                  const winner = insightWinner(stats1[k], stats2[k]);
                  return (
                    <div key={k} className="stat-row">
                      <span className={`stat-value player1${winner === "left" ? " stat-winner" : ""}`}>{stats1[k]}{suffix || ""}</span>
                      <span className="stat-label">{label}</span>
                      <span className={`stat-value player2${winner === "right" ? " stat-winner" : ""}`}>{stats2[k]}{suffix || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!canCompare && (
          <div className="comparison-empty-state">
            <div className="ces-icon"><i className="bx bx-bar-chart-big" /></div>
            <h3>Select Two Players to Compare</h3>
            <p>Choose a league, team and player on each side to see a full head-to-head performance analysis with interactive charts.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Analytics;
