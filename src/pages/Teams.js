import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { fetchTeams, fetchTeamDetails } from "../api/apiFootball";
import Topbar from "../components/Topbar";

const LEAGUE_OPTIONS = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "UEFA Champions League",
  "South African Premier Soccer League",
];

function Teams() {
  const location = useLocation();
  const [teams, setTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState("English Premier League");
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [teamSearchTerm, setTeamSearchTerm] = useState("");

  useEffect(() => {
    const prefillLeague = location.state?.preselectLeague || "";
    const prefillTeamSearch = location.state?.prefillTeamSearch || "";

    if (prefillLeague && LEAGUE_OPTIONS.includes(prefillLeague)) {
      setSelectedLeague(prefillLeague);
    }

    if (prefillTeamSearch) {
      setTeamSearchTerm(prefillTeamSearch);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        const data = await fetchTeams(selectedLeague);
        setTeams(data || []);
      } catch (error) {
        console.error("Error loading teams:", error);
        setTeams([]);
      } finally {
        setLoading(false);
      }
    }
    loadTeams();
  }, [selectedLeague]);

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
                      src={team.strTeamBadge || team.strTeamLogo || `https://via.placeholder.com/100x100?text=${team.strTeam?.charAt(0) || 'T'}`}
                      alt={team.strTeam}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/100x100?text=${team.strTeam?.charAt(0) || 'T'}`;
                      }}
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
                    src={selectedTeam.strTeamBadge || selectedTeam.strTeamLogo || `https://via.placeholder.com/150x150?text=${selectedTeam.strTeam?.charAt(0) || 'T'}`}
                    alt={selectedTeam.strTeam}
                    className="modal-team-logo"
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
                          {teamDetails.strWebsite ? (
                            <a href={`https://${teamDetails.strWebsite}`} target="_blank" rel="noopener noreferrer">
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