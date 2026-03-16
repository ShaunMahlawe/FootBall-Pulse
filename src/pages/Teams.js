import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { clearApiCache, fetchTeams, fetchTeamDetails } from "../api/apiFootball";
import Topbar from "../components/Topbar";

const LEAGUE_OPTIONS = [
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

function normalizeLogoUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:image")) {
    return raw;
  }
  if (raw.startsWith("//")) {
    return `https:${raw}`;
  }
  return "";
}

function buildFallbackLogo(teamName = "Team", size = 100) {
  const label = String(teamName || "T").trim().charAt(0).toUpperCase() || "T";
  const fontSize = Math.max(24, Math.round(size * 0.42));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#0f766e"/>
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${Math.round(size * 0.33)}" fill="rgba(255,255,255,0.17)"/>
      <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="Poppins, Arial, sans-serif" font-size="${fontSize}" font-weight="700">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTeamLogoCandidates(team = {}) {
  const fields = [
    team.strTeamBadge,
    team.strBadge,
    team.strTeamLogo,
    team.strLogo,
    team.logo,
    team.strTeamJersey,
  ];

  const unique = [];
  fields.forEach((value) => {
    const normalized = normalizeLogoUrl(value);
    if (normalized && !unique.includes(normalized)) {
      unique.push(normalized);
    }
  });

  return unique;
}

function getPrimaryTeamLogo(team = {}, size = 100) {
  const candidates = getTeamLogoCandidates(team);
  return candidates[0] || buildFallbackLogo(team.strTeam, size);
}

function normalizeWebsiteUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
}

function handleTeamLogoError(event, team = {}, size = 100) {
  const image = event.currentTarget;
  const candidates = getTeamLogoCandidates(team);
  const currentIndex = Number(image.dataset.logoIndex || "0");
  const nextIndex = currentIndex + 1;

  if (nextIndex < candidates.length) {
    image.dataset.logoIndex = String(nextIndex);
    image.src = candidates[nextIndex];
    return;
  }

  image.onerror = null;
  image.src = buildFallbackLogo(team.strTeam, size);
}

function Teams() {
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("English Premier League");
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");
  const [pendingPreselectTeam, setPendingPreselectTeam] = useState("");
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
    const prefillLeague = location.state?.preselectLeague || "";
    const prefillTeamSearch = location.state?.prefillTeamSearch || "";
    const preselectTeam = location.state?.preselectTeam || "";

    if (prefillLeague && LEAGUE_OPTIONS.includes(prefillLeague)) {
      setSelectedLeague(prefillLeague);
    }

    if (prefillTeamSearch) {
      setTeamSearchTerm(prefillTeamSearch);
    }

    if (preselectTeam) {
      setPendingPreselectTeam(preselectTeam);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        const data = await fetchTeams(selectedLeague);
        const nextTeams = data || [];
        setTeams(nextTeams);

        const preselectedTeamName = pendingPreselectTeam.trim().toLowerCase();
        if (preselectedTeamName) {
          const matchedTeam = nextTeams.find(
            (team) => String(team?.strTeam || "").trim().toLowerCase() === preselectedTeamName
          );

          if (matchedTeam) {
            setSelectedTeam(matchedTeam);
            try {
              const details = await fetchTeamDetails(matchedTeam.idTeam);
              setTeamDetails(details);
            } catch (error) {
              console.error("Error loading preselected team details:", error);
            }
          }

          setPendingPreselectTeam("");
        }
      } catch (error) {
        console.error("Error loading teams:", error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, [selectedLeague, pendingPreselectTeam, refreshNonce]);

  useEffect(() => {
    async function reloadSelectedTeamDetails() {
      if (!selectedTeam?.idTeam) return;
      try {
        const details = await fetchTeamDetails(selectedTeam.idTeam);
        setTeamDetails(details);
      } catch (error) {
        console.error("Error refreshing team details:", error);
      }
    }

    reloadSelectedTeamDetails();
  }, [refreshNonce, selectedTeam]);

  const handleTeamClick = async (team) => {
    setSelectedTeam(team);
    try {
      const details = await fetchTeamDetails(team.idTeam);
      setTeamDetails(details);
    } catch (error) {
      console.error("Error loading team details:", error);
    }
  };

  const closeTeamDetails = () => {
    setSelectedTeam(null);
    setTeamDetails(null);
  };

  const filteredTeams = teams.filter((team) =>
    (team.strTeam || "").toLowerCase().includes(teamSearchTerm.trim().toLowerCase())
  );

  return (
    <div className="home">
      <Topbar />
      <div className="dashboard-shell page-flow-shell">
      <div className="page-container page-flow-container">
        <div className="page-header">
          <div className="page-title-row">
            <span className="page-title-icon">
              <i className="bx bx-group"></i>
            </span>
            <h1 className="page-title">Teams</h1>
          </div>
          <p className="page-subtitle">Explore teams from major football leagues worldwide</p>
        </div>

        {/* League Selector */}
        <div className="dashboard-panel league-selector-panel">
        <div className="league-selector">
          <div className="selector-group">
            <label>Select League:</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="league-select"
            >
              {LEAGUE_OPTIONS.map(league => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-group">
            <label>Search Team:</label>
            <input
              type="search"
              className="player-search"
              placeholder="Search by team name..."
              value={teamSearchTerm}
              onChange={(event) => setTeamSearchTerm(event.target.value)}
            />
          </div>
        </div>
        </div>

        {loading ? (
          <div className="dashboard-panel loading-container">
            <div className="loading-spinner"></div>
            <p>Loading teams from {selectedLeague}...</p>
          </div>
        ) : (
          <div className="dashboard-panel teams-list-panel">
          <div className="teams-list">
            {filteredTeams.length > 0 ? (
              filteredTeams.map(team => (
                <div
                  key={team.idTeam}
                  className="team-item"
                  onClick={() => handleTeamClick(team)}
                >
                  <div className="team-logo">
                    <img
                      src={getPrimaryTeamLogo(team, 100)}
                      data-logo-index="0"
                      alt={team.strTeam}
                      onError={(event) => handleTeamLogoError(event, team, 100)}
                    />
                  </div>
                  <div className="team-info">
                    <h3>{team.strTeam}</h3>
                    <p className="team-country">{team.strCountry || 'Unknown'}</p>
                    <p className="team-league">{team.strLeague || selectedLeague}</p>
                    <div className="team-stats">
                      <span className="stat-item">
                        <strong>Founded:</strong> {team.intFormedYear || 'N/A'}
                      </span>
                      <span className="stat-item">
                        <strong>Stadium:</strong> {team.strStadium || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-teams">
                <p>{teamSearchTerm ? `No teams found for "${teamSearchTerm}".` : `No teams found for ${selectedLeague}.`}</p>
                <p>{teamSearchTerm ? "Try a different search term." : "Try selecting a different league."}</p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Team Details Modal */}
        {selectedTeam && (
          <div className="team-modal-overlay" onClick={closeTeamDetails}>
            <div className="team-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-team-info">
                  <img
                    src={getPrimaryTeamLogo({ ...(selectedTeam || {}), ...(teamDetails || {}) }, 150)}
                    data-logo-index="0"
                    alt={selectedTeam.strTeam}
                    className="modal-team-logo"
                    onError={(event) => handleTeamLogoError(event, { ...(selectedTeam || {}), ...(teamDetails || {}) }, 150)}
                  />
                  <div>
                    <h2>{selectedTeam.strTeam}</h2>
                    <p className="modal-team-country">{selectedTeam.strCountry}</p>
                  </div>
                </div>
                <button className="close-button" onClick={closeTeamDetails}>×</button>
              </div>

              <div className="modal-content">
                {teamDetails && (
                  <div className="team-details-grid">
                    <div className="detail-section">
                      <h3>Club Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <strong>Founded:</strong> {teamDetails.intFormedYear || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Stadium:</strong> {teamDetails.strStadium || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Capacity:</strong> {teamDetails.intStadiumCapacity || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Website:</strong>
                          {normalizeWebsiteUrl(teamDetails.strWebsite) ? (
                            <a href={normalizeWebsiteUrl(teamDetails.strWebsite)} target="_blank" rel="noopener noreferrer">
                              {teamDetails.strWebsite}
                            </a>
                          ) : 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3>Description</h3>
                      <p className="team-description">
                        {teamDetails.strDescriptionEN || 'No description available.'}
                      </p>
                    </div>

                    {teamDetails.strStadiumThumb && (
                      <div className="detail-section">
                        <h3>Stadium</h3>
                        <img
                          src={teamDetails.strStadiumThumb}
                          alt={`${teamDetails.strStadium} stadium`}
                          className="stadium-image"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

export default Teams;