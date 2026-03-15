import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import Topbar from "../components/Topbar";
import {
  fetchLeagueDetails,
  fetchPlayers,
  fetchPlayerDetails,
  fetchTeams,
  fetchLiveMatches,
  fetchUpcomingMatches,
  fetchMatchDetails,
  fetchTeamDetails,
  fetchTeamByName,
} from "../api/apiFootball";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const LEAGUE_OPTIONS = [
  { id: 4328, name: "English Premier League", country: "England", spotlightTeam: "Arsenal", label: "Premier League" },
  { id: 4335, name: "Spanish La Liga", country: "Spain", spotlightTeam: "Barcelona", label: "La Liga" },
  { id: 4332, name: "Italian Serie A", country: "Italy", spotlightTeam: "Inter", label: "Serie A" },
  { id: 4331, name: "German Bundesliga", country: "Germany", spotlightTeam: "Bayern Munich", label: "Bundesliga" },
  { id: 4334, name: "French Ligue 1", country: "France", spotlightTeam: "Paris Saint-Germain", label: "Ligue 1" },
];

const FALLBACK_PLAYER = {
  name: "Henrikh Mkhitaryan",
  position: "Midfielder",
  team: "Inter",
  image: "/assets/img/User.jpg",
  nationality: "Armenia",
  preferredSide: "Unknown",
  height: "1.77 m",
  weight: "Unknown",
  birthLocation: "Yerevan, Armenia",
  dateBorn: "1989-01-21",
  status: "Active",
  description:
    "Experienced attacking midfielder known for smart positioning, combination play, and carrying the ball through midfield.",
};

function pickSpotlightCandidate(players) {
  const validPlayers = (players || []).filter(
    (player) =>
      player &&
      player.strStatus !== "Coaching" &&
      player.strPosition &&
      !/coach/i.test(player.strPosition)
  );

  return (
    validPlayers.find((player) => player.strPosition === "Midfielder" && (player.strCutout || player.strThumb)) ||
    validPlayers.find((player) => player.strPosition === "Forward" && (player.strCutout || player.strThumb)) ||
    validPlayers.find((player) => player.strCutout || player.strThumb) ||
    validPlayers[0] ||
    null
  );
}

function shortDescription(text) {
  if (!text) return FALLBACK_PLAYER.description;
  const clean = text.replace(/\s+/g, " ").trim();
  const firstSentence = clean.split(/(?<=[.!?])\s+/)[0];
  return firstSentence || clean;
}

function buildPerformanceProfile(player) {
  const position = player?.strPosition || player?.position || FALLBACK_PLAYER.position;
  const side = player?.strSide || player?.preferredSide || "";

  const presets = {
    Goalkeeper: [92, 72, 28, 8],
    Defender: [88, 74, 84, 24],
    Midfielder: [72, 88, 76, 58],
    Forward: [38, 79, 34, 91],
  };

  const values = [...(presets[position] || presets.Midfielder)];

  if (/left|right/i.test(side)) {
    values[1] = Math.min(95, values[1] + 3);
  }

  if (/forward|striker/i.test(position)) {
    values[3] = Math.min(96, values[3] + 2);
  }

  return [
    { label: "Defense", value: values[0] },
    { label: "Passing Completed", value: values[1] },
    { label: "Tackles Won", value: values[2] },
    { label: "Goals Scored", value: values[3] },
  ];
}

function buildSpotlightPlayer(player) {
  const source = player || FALLBACK_PLAYER;

  return {
    id: source.idPlayer || null,
    name: source.strPlayer || source.name || FALLBACK_PLAYER.name,
    position: source.strPosition || source.position || FALLBACK_PLAYER.position,
    team: source.strTeam || source.team || FALLBACK_PLAYER.team,
    image:
      source.strCutout || source.strThumb || source.strRender || source.image || FALLBACK_PLAYER.image,
    nationality: source.strNationality || source.nationality || "Unknown",
    preferredSide: source.strSide || source.preferredSide || "Unknown",
    height: source.strHeight || source.height || "Unknown",
    weight: source.strWeight || source.weight || "Unknown",
    birthLocation: source.strBirthLocation || source.birthLocation || "Unknown",
    dateBorn: source.dateBorn || source.dateBorn || "Unknown",
    status: source.strStatus || source.status || "Active",
    description: shortDescription(source.strDescriptionEN || source.description),
    performanceProfile: buildPerformanceProfile(source),
  };
}

function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [leagueTeamsCount, setLeagueTeamsCount] = useState(0);
  const [leagueBadges, setLeagueBadges] = useState({});
  const [spotlightPlayer, setSpotlightPlayer] = useState(() => buildSpotlightPlayer(null));
  const teamCacheRef = useRef({});
  const teamBadgeByNameRef = useRef({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(LEAGUE_OPTIONS[0]);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [feedType, setFeedType] = useState("upcoming");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dashboardNotice, setDashboardNotice] = useState("");

  const featuredMatch = useMemo(
    () => matches.find((match) => match.idEvent === activeMatchId) || matches[0] || null,
    [activeMatchId, matches]
  );
  const liveMatches = useMemo(() => matches.slice(0, 2), [matches]);
  const latestMatches = useMemo(() => matches.slice(0, 5), [matches]);
  const normalizeTeamName = useCallback((name) => (name || "").trim().toLowerCase(), []);

  const getTeamBadge = useCallback((teamId, teamName, eventBadge) => {
    if (eventBadge) return eventBadge;
    if (teamId && teamCacheRef.current[teamId]?.strTeamBadge) {
      return teamCacheRef.current[teamId].strTeamBadge;
    }

    const normalizedName = normalizeTeamName(teamName);
    if (normalizedName && teamBadgeByNameRef.current[normalizedName]) {
      return teamBadgeByNameRef.current[normalizedName];
    }

    return "/assets/img/logo.png";
  }, [normalizeTeamName]);

  const spotlightClubBadge = useMemo(() => {
    if (featuredMatch?.strHomeTeam === spotlightPlayer.team && featuredMatch?.idHomeTeam) {
      return getTeamBadge(featuredMatch.idHomeTeam, featuredMatch.strHomeTeam, featuredMatch.strHomeTeamBadge);
    }

    if (featuredMatch?.strAwayTeam === spotlightPlayer.team && featuredMatch?.idAwayTeam) {
      return getTeamBadge(featuredMatch.idAwayTeam, featuredMatch.strAwayTeam, featuredMatch.strAwayTeamBadge);
    }

    const cachedTeam = Object.values(teamCacheRef.current).find(
      (team) => team?.strTeam === spotlightPlayer.team
    );

    return cachedTeam?.strTeamBadge || "/assets/img/logo.png";
  }, [featuredMatch, getTeamBadge, spotlightPlayer.team]);
  const dashboardSummary = useMemo(() => {
    const liveCount = matches.filter((match) => match?.strStatus === "LIVE").length;
    const totalGoals = matches.reduce(
      (sum, match) => sum + (Number(match?.intHomeScore) || 0) + (Number(match?.intAwayScore) || 0),
      0
    );
    const uniqueTeams = new Set();
    matches.forEach((match) => {
      if (match?.strHomeTeam) uniqueTeams.add(match.strHomeTeam);
      if (match?.strAwayTeam) uniqueTeams.add(match.strAwayTeam);
    });

    return {
      liveCount,
      totalGoals,
      trackedTeams: uniqueTeams.size,
      fixturesCount: matches.length,
    };
  }, [matches]);
  const radarData = useMemo(
    () => ({
      labels: spotlightPlayer.performanceProfile.map((entry) => entry.label),
      datasets: [
        {
          label: `${spotlightPlayer.name} profile`,
          data: spotlightPlayer.performanceProfile.map((entry) => entry.value),
          backgroundColor: "rgba(220, 38, 38, 0.22)",
          borderColor: "rgba(255, 255, 255, 0.95)",
          borderWidth: 2,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#dc2626",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
        },
      ],
    }),
    [spotlightPlayer]
  );
  const radarOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(12, 12, 12, 0.92)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "rgba(220, 38, 38, 0.5)",
          borderWidth: 1,
          callbacks: {
            label(context) {
              return `${context.label}: ${context.parsed.r}%`;
            },
          },
        },
      },
      scales: {
        r: {
          beginAtZero: true,
          min: 0,
          max: 100,
          ticks: {
            display: false,
            stepSize: 20,
          },
          grid: {
            color: "rgba(255, 255, 255, 0.12)",
          },
          angleLines: {
            color: "rgba(255, 255, 255, 0.12)",
          },
          pointLabels: {
            color: "rgba(255, 255, 255, 0.78)",
            font: {
              size: 11,
              weight: "600",
            },
          },
        },
      },
    }),
    []
  );

  const getLeagueBadge = (leagueId) => {
    return leagueBadges[leagueId] || null;
  };

  const getCardStatus = (match) => {
    if (!match) return "Scheduled";
    if (match.strStatus === "LIVE") return "Live";
    if (match.strStatus) return match.strStatus;
    return "Scheduled";
  };

  const getMatchMinute = (match) => {
    if (!match) return "-";
    if (match.intTime) return `${match.intTime}'`;
    if (match.strProgress) return match.strProgress;
    if (match.strStatus === "LIVE") return "Live";
    return formatDateTime(match.dateEvent, match.strTime, { hour: "2-digit", minute: "2-digit" });
  };

  const getMatchRoundLabel = () => {
    if (featuredMatch?.intRound) {
      return `Round ${featuredMatch.intRound}`;
    }

    if (featuredMatch?.strRound) {
      return featuredMatch.strRound;
    }

    const totalRounds = Math.max(leagueTeamsCount * 2 - 2, 34);
    return `Tracking ${matches.length} fixtures · ${totalRounds} matchdays`;
  };

  const getFeedLabel = () => (feedType === "live" ? "Live match feed" : "Upcoming fixtures");

  const getLastUpdatedLabel = () => {
    if (!lastUpdated) return "No refresh yet";
    return `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  };

  const openMatchDetails = async (match) => {
    if (!match?.idEvent) return;

    setSelectedMatch(match);
    setMatchDetails(null);
    setIsMatchModalOpen(true);

    try {
      const details = await fetchMatchDetails(match.idEvent);
      setMatchDetails(details);
    } catch (error) {
      console.error("Error loading match details:", error);
      setMatchDetails(null);
    }
  };

  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setMatchDetails(null);
  };

  const formatDateTime = (dateStr, timeStr, overrides = {}) => {
    if (!dateStr) return "TBD";
    const dateTime = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
    return dateTime.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      ...overrides,
    });
  };

  useEffect(() => {
    async function loadLeagueBadges() {
      try {
        const details = await Promise.all(
          LEAGUE_OPTIONS.map((league) => fetchLeagueDetails(league.id))
        );

        const nextBadges = {};
        details.forEach((league) => {
          const visual = league?.strBadge || league?.strLogo || league?.strPoster || null;
          if (league?.idLeague && visual) {
            nextBadges[Number(league.idLeague)] = visual;
          }
        });

        setLeagueBadges(nextBadges);
      } catch (error) {
        console.error("Error loading league badges:", error);
      }
    }

    loadLeagueBadges();
  }, []);

  const cacheTeamsForMatches = useCallback(async (events) => {
      const uniqueTeamIds = new Set();
      const uniqueTeamNames = new Set();

      events.forEach((evt) => {
        if (evt.idHomeTeam) uniqueTeamIds.add(evt.idHomeTeam);
        if (evt.idAwayTeam) uniqueTeamIds.add(evt.idAwayTeam);
        if (evt.strHomeTeam) uniqueTeamNames.add(evt.strHomeTeam);
        if (evt.strAwayTeam) uniqueTeamNames.add(evt.strAwayTeam);
      });

      const missingIds = Array.from(uniqueTeamIds).filter(
        (id) => !teamCacheRef.current[id]
      );

      const updates = {};
      await Promise.all(
        missingIds.map(async (teamId) => {
          const details = await fetchTeamDetails(teamId);
          if (details) {
            updates[teamId] = details;
            if (details.strTeam && details.strTeamBadge) {
              teamBadgeByNameRef.current[normalizeTeamName(details.strTeam)] = details.strTeamBadge;
            }
          }
        })
      );

      const unresolvedNames = Array.from(uniqueTeamNames).filter((teamName) => {
        const normalized = normalizeTeamName(teamName);
        return normalized && !teamBadgeByNameRef.current[normalized];
      });

      await Promise.all(
        unresolvedNames.map(async (teamName) => {
          const details = await fetchTeamByName(teamName);
          if (details?.strTeam && details?.strTeamBadge) {
            teamBadgeByNameRef.current[normalizeTeamName(details.strTeam)] = details.strTeamBadge;
          }
        })
      );

      if (Object.keys(updates).length) {
        teamCacheRef.current = { ...teamCacheRef.current, ...updates };
      }
    }, [normalizeTeamName]);

  const loadMatches = useCallback(async ({ manualRefresh = false } = {}) => {
    if (manualRefresh) {
      setIsRefreshing(true);
    }

    try {
      let source = "live";
      let results = await fetchLiveMatches(selectedLeague.name);

      if (!results || results.length === 0) {
        results = await fetchUpcomingMatches(selectedLeague.id);
        source = "upcoming";
      }

      setFeedType(source);
      setMatches(results);
      setActiveMatchId(results[0]?.idEvent || null);
      await cacheTeamsForMatches(results);
      setLastUpdated(new Date());
      setDashboardNotice(results.length === 0 ? "No fixtures found for this league right now." : "");
    } catch (error) {
      console.error("Error loading matches:", error);
      setDashboardNotice("Unable to refresh matches right now. Please try again.");
    } finally {
      if (manualRefresh) {
        setIsRefreshing(false);
      }
    }
  }, [cacheTeamsForMatches, selectedLeague.id, selectedLeague.name]);

  const loadLeagueContext = useCallback(async () => {
    try {
      const [teamsData, playersData] = await Promise.all([
        fetchTeams(selectedLeague.name),
        fetchPlayers(selectedLeague.spotlightTeam),
      ]);

      setLeagueTeamsCount(teamsData?.length || 20);

      const preferredPlayer = pickSpotlightCandidate(playersData);
      const playerDetails = preferredPlayer?.idPlayer
        ? await fetchPlayerDetails(preferredPlayer.idPlayer)
        : null;

      setSpotlightPlayer(buildSpotlightPlayer(playerDetails || preferredPlayer));
    } catch (error) {
      console.error("Error loading dashboard context:", error);
      setLeagueTeamsCount(20);
      setSpotlightPlayer(buildSpotlightPlayer(null));
    }
  }, [selectedLeague.name, selectedLeague.spotlightTeam]);

  useEffect(() => {
    loadLeagueContext();
    loadMatches();
  }, [loadLeagueContext, loadMatches]);

  const cycleLeague = () => {
    const currentIndex = LEAGUE_OPTIONS.findIndex((league) => league.id === selectedLeague.id);
    const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % LEAGUE_OPTIONS.length : 0;
    setSelectedLeague(LEAGUE_OPTIONS[nextIndex]);
  };

  useEffect(() => {
    async function loadSpotlightFromMatch() {
      if (!featuredMatch?.strHomeTeam) {
        return;
      }

      try {
        const playersData = await fetchPlayers(featuredMatch.strHomeTeam);
        const preferredPlayer = pickSpotlightCandidate(playersData);
        const playerDetails = preferredPlayer?.idPlayer
          ? await fetchPlayerDetails(preferredPlayer.idPlayer)
          : null;

        if (preferredPlayer || playerDetails) {
          setSpotlightPlayer(buildSpotlightPlayer(playerDetails || preferredPlayer));
        }
      } catch (error) {
        console.error("Error loading spotlight player:", error);
      }
    }

    loadSpotlightFromMatch();
  }, [featuredMatch]);

  return (
    <div className="home">
      <Topbar />
      <div className="dashboard-shell">
        <div className="dashboard-layout">
          <div className="dashboard-sidebar-column">
            <section className="dashboard-panel live-score-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>{selectedLeague.label}</h2>
                  <p>{getFeedLabel()} · {getMatchRoundLabel()}</p>
                </div>
                <div className="dashboard-header-actions">
                  <button
                    type="button"
                    className="dashboard-refresh-btn"
                    onClick={() => loadMatches({ manualRefresh: true })}
                    disabled={isRefreshing}
                    aria-label="Refresh match feed"
                    title={isRefreshing ? "Refreshing" : "Refresh"}
                  >
                    <i className={`bx ${isRefreshing ? "bx-loader-alt bx-spin" : "bx-refresh"}`}></i>
                  </button>
                  <span className={`dashboard-live-pill ${featuredMatch?.strStatus === "LIVE" ? "is-live" : ""}`}>
                    <span className="live-dot"></span>
                    {getCardStatus(featuredMatch)}
                  </span>
                </div>
              </div>

              <div className="dashboard-insights-row">
                <span>Live: {dashboardSummary.liveCount}</span>
                <span>Fixtures: {dashboardSummary.fixturesCount}</span>
                <span>Goals: {dashboardSummary.totalGoals}</span>
                <span>Teams: {dashboardSummary.trackedTeams}</span>
              </div>

              <p className="dashboard-updated-at">{getLastUpdatedLabel()}</p>

              <div className="live-score-list">
                {liveMatches.length > 0 ? (
                  liveMatches.map((match) => (
                    <button
                      key={match.idEvent}
                      type="button"
                      className={`live-score-card ${match.idEvent === featuredMatch?.idEvent ? "is-active" : ""}`}
                      onClick={() => setActiveMatchId(match.idEvent)}
                    >
                      <div className="live-score-head">
                        <span>{getMatchMinute(match)}</span>
                      </div>
                      <div className="live-score-body">
                        <div className="live-team">
                          <img src={getTeamBadge(match.idHomeTeam, match.strHomeTeam, match.strHomeTeamBadge)} alt={match.strHomeTeam} />
                          <span>{match.strHomeTeam}</span>
                        </div>
                        <div className="live-score-value">
                          <strong>{match.intHomeScore || 0}</strong>
                          <span>:</span>
                          <strong>{match.intAwayScore || 0}</strong>
                        </div>
                        <div className="live-team">
                          <img src={getTeamBadge(match.idAwayTeam, match.strAwayTeam, match.strAwayTeamBadge)} alt={match.strAwayTeam} />
                          <span>{match.strAwayTeam}</span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="dashboard-empty-state">
                    <p>{dashboardNotice || "No live or upcoming matches available."}</p>
                    <button type="button" className="dashboard-empty-action" onClick={cycleLeague}>
                      Try Another League
                    </button>
                  </div>
                )}
              </div>
            </section>

            <section className="dashboard-panel favourites-panel">
              <div className="dashboard-panel-header">
                <div>
                  <h2>Favourite League</h2>
                  <p>Quick switcher</p>
                </div>
              </div>

              <div className="favourite-league-list">
                {LEAGUE_OPTIONS.map((league) => (
                  <button
                    key={league.id}
                    type="button"
                    className={`favourite-league-item ${selectedLeague.id === league.id ? "is-active" : ""}`}
                    onClick={() => setSelectedLeague(league)}
                  >
                    <span className="league-avatar">
                      {getLeagueBadge(league.id) ? (
                        <img src={getLeagueBadge(league.id)} alt={`${league.label} logo`} />
                      ) : (
                        <i className="bx bx-football league-avatar-fallback" aria-hidden="true"></i>
                      )}
                    </span>
                    <span className="league-copy">
                      <strong>{league.label}</strong>
                      <small>{league.country}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="dashboard-main-column">
            <div className="dashboard-top-row">
              <section className="dashboard-panel spotlight-panel">
                <div className="spotlight-head">
                  <div>
                    <h2>{spotlightPlayer.name}</h2>
                    <p>{spotlightPlayer.position} · {spotlightPlayer.team}</p>
                  </div>
                  <button
                    type="button"
                    className="spotlight-action"
                    onClick={() => featuredMatch && openMatchDetails(featuredMatch)}
                    disabled={!featuredMatch}
                    aria-label="Open highlighted match details"
                  >
                    <i className="bx bx-detail"></i>
                  </button>
                </div>

                <div className="spotlight-stage">
                  <div className="spotlight-silhouette">
                    <img src={spotlightPlayer.image} alt={spotlightPlayer.name} />
                  </div>
                  <div className="spotlight-orb">
                    <img src={spotlightClubBadge} alt={`${spotlightPlayer.team} badge`} />
                  </div>
                </div>

                <div className="spotlight-bottom">
                  <div className="spotlight-traits-card">
                    <h3>Characteristic</h3>
                    <div className="traits-grid">
                      <div className="trait-column">
                        <h4>Profile</h4>
                        <span className="trait-chip">Nationality: {spotlightPlayer.nationality}</span>
                        <span className="trait-chip">Born: {spotlightPlayer.dateBorn}</span>
                      </div>
                      <div className="trait-column">
                        <h4>Physical</h4>
                        <span className="trait-chip">Height: {spotlightPlayer.height}</span>
                        <span className="trait-chip">Weight: {spotlightPlayer.weight}</span>
                      </div>
                      <div className="trait-column">
                        <h4>Background</h4>
                        <span className="trait-chip subdued">Birth place: {spotlightPlayer.birthLocation}</span>
                        <span className="trait-chip subdued">Status: {spotlightPlayer.status}</span>
                      </div>
                    </div>
                    <p className="spotlight-description">{spotlightPlayer.description}</p>
                  </div>

                  <div className="passing-panel-card">
                    <h3>Passing profile</h3>
                    <div className="passing-radar-wrap">
                      <Radar data={radarData} options={radarOptions} />
                    </div>
                    <div className="passing-metric-list">
                      {spotlightPlayer.performanceProfile.map((entry) => (
                        <div key={entry.label} className="passing-metric-item">
                          <span>{entry.label}</span>
                          <strong>{entry.value}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>

            <section className="dashboard-panel latest-matches-panel">
              <div className="dashboard-panel-header latest-matches-header">
                <div>
                  <h2>Latest Matches</h2>
                  <p>{selectedLeague.name}</p>
                </div>
                <button
                  type="button"
                  className="latest-matches-detail"
                  onClick={() => featuredMatch && openMatchDetails(featuredMatch)}
                  disabled={!featuredMatch}
                  aria-label="Open latest selected match details"
                >
                  <i className="bx bx-right-arrow-alt"></i>
                </button>
              </div>

              <div className="latest-match-list">
                {latestMatches.length > 0 ? (
                  latestMatches.map((match) => (
                    <button
                      key={match.idEvent}
                      type="button"
                      className={`latest-match-row ${match.idEvent === featuredMatch?.idEvent ? "is-active" : ""}`}
                      onClick={() => setActiveMatchId(match.idEvent)}
                    >
                      <div className="latest-meta-block">
                        <span className="latest-time">{formatDateTime(match.dateEvent, match.strTime, { weekday: undefined })}</span>
                        <small>{match.dateEvent || "TBD"}</small>
                      </div>
                      <div className="latest-teams-block">
                        <span className="latest-team-name">{match.strHomeTeam}</span>
                        <img src={getTeamBadge(match.idHomeTeam, match.strHomeTeam, match.strHomeTeamBadge)} alt={match.strHomeTeam} />
                        <strong className="latest-score">
                          {match.intHomeScore || 0} : {match.intAwayScore || 0}
                        </strong>
                        <img src={getTeamBadge(match.idAwayTeam, match.strAwayTeam, match.strAwayTeamBadge)} alt={match.strAwayTeam} />
                        <span className="latest-team-name">{match.strAwayTeam}</span>
                      </div>
                      <div className="latest-status-block">
                        <span className="status-dot"></span>
                        <strong>{getMatchMinute(match)}</strong>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="dashboard-empty-state">No matches to display for this league.</div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {isMatchModalOpen && (
        <div className="modal-overlay" onClick={closeMatchModal}>
          <div className="match-modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>{selectedMatch?.strEvent || "Match Details"}</h2>
              <button className="modal-close" onClick={closeMatchModal}>
                ×
              </button>
            </header>
            <div className="modal-body">
              {matchDetails ? (
                <>
                  <p>
                    <strong>{matchDetails.strEvent}</strong>
                  </p>
                  <p>{formatDateTime(matchDetails.dateEvent, matchDetails.strTime)}</p>
                  <p>{matchDetails.strStatus}</p>
                  <p>{matchDetails.strVenue}</p>
                  {matchDetails.strDescriptionEN && (
                    <p>{matchDetails.strDescriptionEN}</p>
                  )}
                </>
              ) : (
                <p>Loading details…</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;