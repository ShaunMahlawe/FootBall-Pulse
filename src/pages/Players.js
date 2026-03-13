import { useEffect, useState } from "react";
import { fetchPlayers, fetchPlayerDetails } from "../api/apiFootball";

function Players() {
  const [players, setPlayers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("Barcelona");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const popularTeams = [
    "Barcelona",
    "Real Madrid",
    "Manchester United",
    "Manchester City",
    "Liverpool",
    "Chelsea",
    "Arsenal",
    "Bayern Munich",
    "Paris Saint-Germain",
    "Juventus"
  ];

  useEffect(() => {
    async function loadPlayers() {
      try {
        setLoading(true);
        const data = await fetchPlayers(selectedTeam);
        setPlayers(data || []);
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

  return (
    <div className="home">
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Players</h1>
          <p className="page-subtitle">Explore player statistics and performance data</p>
        </div>

        {/* Team Selector and Search */}
        <div className="players-controls">
          <div className="control-group">
            <label>Select Team:</label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="team-select"
            >
              {popularTeams.map(team => (
                <option key={team} value={team}>
                  {team}
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
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading players from {selectedTeam}...</p>
          </div>
        ) : (
          <div className="players-list">
            {displayedPlayers.length > 0 ? (
              displayedPlayers.slice(0, 24).map(player => (
                <div
                  key={player.idPlayer || player.id}
                  className="player-item"
                  onClick={() => handlePlayerClick(player)}
                >
                  <div className="player-photo">
                    <img
                      src={player.strThumb || player.strCutout || `https://via.placeholder.com/120x120?text=${player.strPlayer?.charAt(0) || 'P'}`}
                      alt={player.strPlayer || player.name}
                      onError={(e) => {
                        e.target.src = `https://via.placeholder.com/120x120?text=${(player.strPlayer || player.name)?.charAt(0) || 'P'}`;
                      }}
                    />
                  </div>
                  <div className="player-info">
                    <h3>{player.strPlayer || player.name}</h3>
                    <p className="player-position">{player.strPosition || player.position || 'Unknown'}</p>
                    <p className="player-nationality">{player.strNationality || player.nationality || 'Unknown'}</p>
                    <div className="player-stats">
                      <span className="stat-item">
                        <strong>Age:</strong> {player.dateBorn ? new Date().getFullYear() - new Date(player.dateBorn).getFullYear() : 'N/A'}
                      </span>
                      <span className="stat-item">
                        <strong>Height:</strong> {player.strHeight || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-players">
                <p>{searchTerm ? `No players found for "${searchTerm}"` : `No players found for ${selectedTeam}`}</p>
                <p>{searchTerm ? 'Try a different search term.' : 'Try selecting a different team.'}</p>
              </div>
            )}
          </div>
        )}

        {/* Player Details Modal */}
        {selectedPlayer && (
          <div className="player-modal-overlay" onClick={closePlayerDetails}>
            <div className="player-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div className="modal-player-info">
                  <img
                    src={selectedPlayer.strThumb || selectedPlayer.strCutout || `https://via.placeholder.com/150x150?text=${selectedPlayer.strPlayer?.charAt(0) || 'P'}`}
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
                          <strong>Age:</strong> {playerDetails.dateBorn ? new Date().getFullYear() - new Date(playerDetails.dateBorn).getFullYear() : 'N/A'}
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
  );
}

export default Players;