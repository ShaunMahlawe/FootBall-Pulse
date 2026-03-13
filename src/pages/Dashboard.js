import { useEffect, useMemo, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import PlayerCard from "../components/PlayerCard";
import PlayerComparison from "../components/PlayerComparison";
import HeatMap from "../components/HeatMap";
import {
  fetchPlayers,
  fetchTeams,
  fetchLiveMatches,
  fetchUpcomingMatches,
  fetchMatchDetails,
  fetchTeamDetails,
} from "../api/apiFootball";

function Dashboard() {
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalTeams: 0,
    topLeagues: 5,
  });
  const [matches, setMatches] = useState([]);
  const teamCacheRef = useRef({});
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchDetails, setMatchDetails] = useState(null);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  const leagueOptions = [
    { id: 4328, name: "English Premier League" },
    { id: 4335, name: "Spanish La Liga" },
    { id: 4332, name: "Italian Serie A" },
    { id: 4331, name: "German Bundesliga" },
    { id: 4334, name: "French Ligue 1" },
  ];

  const [selectedLeague, setSelectedLeague] = useState(leagueOptions[0]);

  const featuredMatch = useMemo(() => matches[0] || null, [matches]);

  const getTeamBadge = (teamId) => {
    return teamCacheRef.current[teamId]?.strTeamBadge || "/assets/img/logo.png";
  };

  const openMatchDetails = async (match) => {
    setSelectedMatch(match);
    setMatchDetails(null);
    setIsMatchModalOpen(true);

    const details = await fetchMatchDetails(match.idEvent);
    setMatchDetails(details);
  };

  const closeMatchModal = () => {
    setIsMatchModalOpen(false);
    setMatchDetails(null);
  };

  const formatDateTime = (dateStr, timeStr) => {
    if (!dateStr) return "TBD";
    const dateTime = new Date(`${dateStr}T${timeStr || "00:00:00"}`);
    return dateTime.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const player1 = { name: "Mkhitaryan", stats: [80, 75, 85, 60, 90] };
  const player2 = { name: "Messi", stats: [90, 95, 90, 50, 95] };
  const playerExample = {
    name: "Messi",
    position: "Forward",
    image: "/assets/img/Messi.jpg",
    goals: 25,
    assists: 15,
    rating: 9.2
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const [playersData, teamsData] = await Promise.all([
          fetchPlayers("Manchester United"), // Team name instead of ID
          fetchTeams(selectedLeague.name),
        ]);

        setStats({
          totalPlayers: playersData?.length || 0,
          totalTeams: teamsData?.length || 0,
          topLeagues: 5,
        });
      } catch (error) {
        console.error("Error loading dashboard stats:", error);
        // Set fallback stats
        setStats({
          totalPlayers: 25,
          totalTeams: 20,
          topLeagues: 5,
        });
      }
    }

    async function loadMatches() {
      try {
        let results = await fetchLiveMatches(selectedLeague.name);
        if (!results || results.length === 0) {
          results = await fetchUpcomingMatches(selectedLeague.id);
        }

        setMatches(results);
        await cacheTeamsForMatches(results);
      } catch (error) {
        console.error("Error loading matches:", error);
      }
    }

    async function cacheTeamsForMatches(events) {
      const uniqueTeamIds = new Set();
      events.forEach((evt) => {
        if (evt.idHomeTeam) uniqueTeamIds.add(evt.idHomeTeam);
        if (evt.idAwayTeam) uniqueTeamIds.add(evt.idAwayTeam);
      });

      const missingIds = Array.from(uniqueTeamIds).filter(
        (id) => !teamCacheRef.current[id]
      );

      const updates = {};
      await Promise.all(
        missingIds.map(async (teamId) => {
          const details = await fetchTeamDetails(teamId);
          if (details) updates[teamId] = details;
        })
      );

      if (Object.keys(updates).length) {
        teamCacheRef.current = { ...teamCacheRef.current, ...updates };
      }
    }

    loadStats();
    loadMatches();
  }, [selectedLeague]);
  return (
    <div className="home">
      <Topbar />
      <div className="page-container">
        {/* Dashboard Header (matches + player spotlight + stats) */}
        <div className="dashboard-header">
          <div className="match-card">
            <div className="match-card-top">
              <div className="match-card-top-left">
                <span className="match-league">{selectedLeague.name}</span>
                <div className="search-box">
                  <select
                    className="league-select"
                    value={selectedLeague.id}
                    onChange={(e) => {
                      const newLeague = leagueOptions.find((l) => l.id === Number(e.target.value));
                      if (newLeague) {
                        setSelectedLeague(newLeague);
                        setMatches([]);
                      }
                    }}
                  >
                    {leagueOptions.map((league) => (
                      <option key={league.id} value={league.id}>
                        {league.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <span className={`match-live ${featuredMatch?.strStatus === "LIVE" ? "live" : ""}`}>
                {featuredMatch?.strStatus || "Upcoming"}
              </span>
            </div>

            {featuredMatch ? (
              <>
                <div className="match-score">
                  <div className="team">
                    <img
                      src={getTeamBadge(featuredMatch.idHomeTeam)}
                      alt={featuredMatch.strHomeTeam}
                    />
                    <span className="team-name">{featuredMatch.strHomeTeam}</span>
                  </div>
                  <div className="score">
                    <span>{featuredMatch.intHomeScore || "-"}</span>
                    <span className="divider">:</span>
                    <span>{featuredMatch.intAwayScore || "-"}</span>
                  </div>
                  <div className="team">
                    <img
                      src={getTeamBadge(featuredMatch.idAwayTeam)}
                      alt={featuredMatch.strAwayTeam}
                    />
                    <span className="team-name">{featuredMatch.strAwayTeam}</span>
                  </div>
                </div>

                <div className="match-meta">
                  <span className="match-minute">
                    {formatDateTime(featuredMatch.dateEvent, featuredMatch.strTime)}
                  </span>
                  {featuredMatch.strStatus === "LIVE" ? (
                    <button
                      className="btn btn-outline"
                      onClick={() => openMatchDetails(featuredMatch)}
                    >
                      Match Details
                    </button>
                  ) : (
                    <button className="btn btn-outline" disabled>
                      Not Started
                    </button>
                  )}
                </div>

                <div className="match-stats">
                  <div className="stat-item">
                    <span className="stat-number">{stats.totalPlayers}</span>
                    <span className="stat-label">Active Players</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.totalTeams}</span>
                    <span className="stat-label">Teams Tracked</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{stats.topLeagues}</span>
                    <span className="stat-label">Top Leagues</span>
                  </div>
                </div>

                {matches.length > 1 && (
                  <div className="match-list">
                    {matches.slice(0, 3).map((m) => (
                      <button
                        key={m.idEvent}
                        className={`match-list-item ${m.idEvent === featuredMatch.idEvent ? "active" : ""}`}
                        onClick={() => openMatchDetails(m)}
                      >
                        <span className="match-time">
                          {formatDateTime(m.dateEvent, m.strTime)}
                        </span>
                        <span className="match-teams">
                          {m.strHomeTeam} vs {m.strAwayTeam}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="match-empty">
                <p>No live or upcoming matches found right now.</p>
              </div>
            )}
          </div>

          <div className="player-hero-card">
            <div className="player-hero-header">
              <div>
                <h2>Henrikh Mkhitaryan</h2>
                <p className="player-position">Midfielder</p>
              </div>
              <div className="player-rating">
                <span>7.85</span>
                <i className="bx bx-trending-up" />
              </div>
            </div>
            <div className="player-hero-body">
              <div className="player-image">
                <img src={playerExample.image} alt={playerExample.name} />
              </div>
              <div className="player-stats">
                <div className="stat">
                  <span className="stat-label">Goals</span>
                  <span className="stat-value">{playerExample.goals}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Assists</span>
                  <span className="stat-value">{playerExample.assists}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Rating</span>
                  <span className="stat-value">{playerExample.rating}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="stats-card">
            <div className="stats-card-header">
              <h3>Passing Direction %</h3>
              <span className="badge">Live</span>
            </div>
            <div className="stats-bars">
              <div className="stats-row">
                <span className="label">Backward</span>
                <div className="bar">
                  <div className="fill" style={{ width: "26.16%" }} />
                </div>
                <span className="value">26.16</span>
              </div>
              <div className="stats-row">
                <span className="label">Right</span>
                <div className="bar">
                  <div className="fill" style={{ width: "16.7%" }} />
                </div>
                <span className="value">16.7</span>
              </div>
              <div className="stats-row">
                <span className="label">Left</span>
                <div className="bar">
                  <div className="fill" style={{ width: "35.98%" }} />
                </div>
                <span className="value">35.98</span>
              </div>
              <div className="stats-row">
                <span className="label">Forward</span>
                <div className="bar">
                  <div className="fill" style={{ width: "21.16%" }} />
                </div>
                <span className="value">21.16</span>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Analytics Section */}
        <div className="dashboard-section">
          <h2>Featured Analytics</h2>
          <div className="dashboard-cards">
            <PlayerCard player={playerExample} />
            <PlayerComparison player1={player1} player2={player2} />
            <HeatMap />
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