import { useEffect, useState } from "react";
import { fetchPlayers, fetchPlayerDetails, fetchTeams } from "../api/apiFootball";
import Topbar from "../components/Topbar";
import { getPlayerVisual } from "../utils/playerVisuals";

const LEAGUE_OPTIONS = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
];

function getPlayerAge(dateBorn) {
  if (!dateBorn) return "N/A";
  return new Date().getFullYear() - new Date(dateBorn).getFullYear();
}

function normalisePlayers(players) {
  return (players || [])
    .filter(
      (player) =>
        player &&
        player.strPlayer &&
        player.strPosition &&
        player.strStatus !== "Coaching" &&
        !/coach/i.test(player.strPosition)
    )
    .sort((left, right) => (left.strPlayer || "").localeCompare(right.strPlayer || ""));
}

function Players() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(LEAGUE_OPTIONS[0]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        const data = await fetchTeams(selectedLeague);
        const sortedTeams = (data || []).sort((left, right) =>
          (left.strTeam || "").localeCompare(right.strTeam || "")
        );

        setTeams(sortedTeams);
        setSelectedTeam((currentTeam) => {
          if (sortedTeams.some((team) => team.strTeam === currentTeam)) {
            return currentTeam;
          }
          return sortedTeams[0]?.strTeam || "";
        });
      } catch (error) {
        console.error("Error loading teams:", error);
        setTeams([]);
        setSelectedTeam("");
      } finally {
        setLoading(false);
      }
    }

    loadTeams();
  }, [selectedLeague]);

  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      return;
    }

    async function loadPlayers() {
      try {
        setLoading(true);
        const data = await fetchPlayers(selectedTeam);
        setPlayers(normalisePlayers(data));
        setLastUpdated(
          new Date().toLocaleString("en-ZA", {
            timeZone: "Africa/Johannesburg",
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (error) {
        console.error("Error loading players:", error);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    loadPlayers();
  }, [selectedTeam]);

  const handlePlayerClick = async (player) => {
    setSelectedPlayer(player);
    setPlayerDetails(null);
    try {
      const details = await fetchPlayerDetails(player.idPlayer);
      setPlayerDetails(details);
    } catch (error) {
      console.error("Error loading player details:", error);
    }
  };

  const closePlayerDetails = () => {
    setSelectedPlayer(null);
    setPlayerDetails(null);
  };

  const displayedPlayers = players.filter(player =>
    (player.strPlayer || player.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const seasonWindowLabel = "Coverage: 2023 to present";

  return (
    <div className="home">
      <Topbar />
      <div className="dashboard-shell page-flow-shell">
      <div className="page-container page-flow-container">
        <div className="page-header">
          <div className="page-title-row">
            <span className="page-title-icon">
              <i className="bx bx-user"></i>
            </span>
            <h1 className="page-title">Players</h1>
          </div>
          <p className="page-subtitle">Live current squad and player profile data sourced from major leagues, with {seasonWindowLabel.toLowerCase()}.</p>
        </div>

        <div className="dashboard-panel players-controls-panel">
        <div className="players-controls">
          <div className="control-group">
            <label>Select League:</label>
            <select
              value={selectedLeague}
              onChange={(e) => setSelectedLeague(e.target.value)}
              className="team-select"
            >
              {LEAGUE_OPTIONS.map((league) => (
                <option key={league} value={league}>
                  {league}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Select Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="team-select"
            >
              {teams.map((team) => (
                <option key={team.idTeam} value={team.strTeam}>
                  {team.strTeam}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Search Players:</label>
            <input
              type="text"
              placeholder="Search by player name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="player-search"
            />
          </div>

          <div className="control-group">
            <label>Season Window</label>
            <div className="team-select players-meta-pill">{seasonWindowLabel}</div>
          </div>

          <div className="control-group">
            <label>Last Refresh</label>
            <div className="team-select players-meta-pill">{lastUpdated || "Loading..."}</div>
          </div>
        </div>
        </div>

        {loading ? (
          <div className="dashboard-panel loading-container">
            <div className="loading-spinner"></div>
            <p>Loading players from {selectedTeam || selectedLeague}...</p>
          </div>
        ) : (
          <div className="dashboard-panel players-list-panel">
          <div className="players-list">
            {displayedPlayers.length > 0 ? (
              displayedPlayers.slice(0, 24).map((player) => {
                const playerImage = getPlayerVisual(player, {
                  name: player.strPlayer,
                  team: player.strTeam || selectedTeam,
                });

                return (
                  <div
                    key={player.idPlayer || player.id}
                    className="player-item player-overlay-card"
                    style={{ backgroundImage: `url(${playerImage})` }}
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="player-overlay-content">
                      <h3 className="player-overlay-name">{player.strPlayer || player.name}</h3>
                      <p className="player-overlay-position">{player.strPosition || player.position || 'Unknown'}</p>
                      <p className="player-overlay-meta">{player.strNationality || player.nationality || 'Unknown'} · {player.strTeam || selectedTeam || 'Unknown Club'}</p>
                      <div className="player-overlay-stats">
                        <span className="stat-item">
                          <strong>Age:</strong> {getPlayerAge(player.dateBorn)}
                        </span>
                        <span className="stat-item">
                          <strong>Height:</strong> {player.strHeight || 'N/A'}
                        </span>
                        <span className="stat-item">
                          <strong>Status:</strong> {player.strStatus || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-players">
                <p>{searchTerm ? `No players found for "${searchTerm}"` : `No players found for ${selectedTeam}`}</p>
                <p>{searchTerm ? 'Try a different search term.' : 'Try selecting a different team.'}</p>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Player Details Modal */}
        {selectedPlayer && (
          <div className="player-modal-overlay" onClick={closePlayerDetails}>
            <div className="player-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-player-info">
                  <img
                    src={getPlayerVisual(playerDetails || selectedPlayer, {
                      name: selectedPlayer.strPlayer,
                      team: selectedPlayer.strTeam || selectedTeam,
                    })}
                    alt={selectedPlayer.strPlayer || selectedPlayer.name}
                    className="modal-player-photo"
                  />
                  <div>
                    <h2>{selectedPlayer.strPlayer || selectedPlayer.name}</h2>
                    <p className="modal-player-position">{selectedPlayer.strPosition || selectedPlayer.position}</p>
                    <p className="modal-player-nationality">{selectedPlayer.strNationality || selectedPlayer.nationality}</p>
                  </div>
                </div>
                <button className="close-button" onClick={closePlayerDetails}>×</button>
              </div>

              <div className="modal-content">
                {playerDetails && (
                  <div className="player-details-grid">
                    <div className="detail-section">
                      <h3>Personal Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <strong>Full Name:</strong> {playerDetails.strPlayer || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Birth Date:</strong> {playerDetails.dateBorn || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Age:</strong> {getPlayerAge(playerDetails.dateBorn)}
                        </div>
                        <div className="detail-item">
                          <strong>Nationality:</strong> {playerDetails.strNationality || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Height:</strong> {playerDetails.strHeight || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Weight:</strong> {playerDetails.strWeight || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Birth Place:</strong> {playerDetails.strBirthLocation || 'N/A'}
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h3>Career Information</h3>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <strong>Position:</strong> {playerDetails.strPosition || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Current Team:</strong> {playerDetails.strTeam || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Preferred Side:</strong> {playerDetails.strSide || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Status:</strong> {playerDetails.strStatus || 'N/A'}
                        </div>
                        <div className="detail-item">
                          <strong>Sport:</strong> {playerDetails.strSport || 'Football'}
                        </div>
                      </div>
                    </div>

                    {playerDetails.strDescriptionEN && (
                      <div className="detail-section">
                        <h3>Biography</h3>
                        <p className="player-description">
                          {playerDetails.strDescriptionEN}
                        </p>
                      </div>
                    )}

                    {playerDetails.strThumb && (
                      <div className="detail-section">
                        <h3>Player Photo</h3>
                        <img
                          src={playerDetails.strThumb}
                          alt={playerDetails.strPlayer}
                          className="player-full-image"
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

export default Players;