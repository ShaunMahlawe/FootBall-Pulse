import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { clearApiCache, fetchPlayers, fetchPlayerDetails, fetchTeamByName, fetchTeams } from "../api/apiFootball";
import Topbar from "../components/Topbar";
import { getPlayerProfileVisual } from "../utils/playerVisuals";

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

function buildPlayerBiography(playerDetails, selectedPlayer, selectedTeam) {
  const details = playerDetails || selectedPlayer || {};
  const providedBio = (details.strDescriptionEN || "").trim();
  if (providedBio) return providedBio;

  const name = details.strPlayer || selectedPlayer?.strPlayer || selectedPlayer?.name || "Player";
  const nationality = details.strNationality || selectedPlayer?.strNationality || selectedPlayer?.nationality;
  const position = details.strPosition || selectedPlayer?.strPosition || selectedPlayer?.position;
  const team = details.strTeam || selectedPlayer?.strTeam || selectedTeam;
  const status = details.strStatus || selectedPlayer?.strStatus;
  const preferredSide = details.strSide;
  const birthLocation = details.strBirthLocation;
  const height = details.strHeight;
  const weight = details.strWeight;

  const overviewParts = [];
  if (nationality) overviewParts.push(`${nationality} professional footballer`);
  if (position) overviewParts.push(`playing as ${position}`);
  if (team) overviewParts.push(`for ${team}`);

  const profileFacts = [];
  if (height) profileFacts.push(`Height: ${height}`);
  if (weight) profileFacts.push(`Weight: ${weight}`);
  if (preferredSide) profileFacts.push(`Preferred side: ${preferredSide}`);
  if (birthLocation) profileFacts.push(`Birth location: ${birthLocation}`);
  if (status) profileFacts.push(`Status: ${status}`);

  const overview = overviewParts.length > 0
    ? `${name} is a ${overviewParts.join(" ")}.`
    : `${name} is an active professional football player.`;

  if (profileFacts.length === 0) {
    return `${overview} A detailed written biography is not currently available from the data provider. Key profile attributes are shown above.`;
  }

  return `${overview} Profile summary: ${profileFacts.join(" | ")}.`;
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function Players() {
  const location = useLocation();
  const teamsCacheByLeagueRef = useRef({});
  const playersCacheByTeamRef = useRef({});

  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(LEAGUE_OPTIONS[0]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playerDetails, setPlayerDetails] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [clubBadge, setClubBadge] = useState("");
  const [pendingTopbarSelection, setPendingTopbarSelection] = useState(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const handleGlobalRefresh = () => {
      clearApiCache();
      teamsCacheByLeagueRef.current = {};
      playersCacheByTeamRef.current = {};
      setRefreshNonce((value) => value + 1);
    };

    window.addEventListener("footballpulse:refreshData", handleGlobalRefresh);

    return () => {
      window.removeEventListener("footballpulse:refreshData", handleGlobalRefresh);
    };
  }, []);

  useEffect(() => {
    const prefillPlayerSearch = location.state?.prefillPlayerSearch || "";
    const preselectLeague = location.state?.preselectLeague || "";
    const preselectTeam = location.state?.preselectTeam || "";
    const preselectPlayerId = location.state?.preselectPlayerId || "";
    const preselectPlayerName = location.state?.preselectPlayerName || "";

    if (preselectLeague && LEAGUE_OPTIONS.includes(preselectLeague)) {
      setSelectedLeague(preselectLeague);
    }

    if (prefillPlayerSearch) {
      setSearchTerm(prefillPlayerSearch);
    }

    if (preselectTeam) {
      setSelectedTeam(preselectTeam);
    }

    if (preselectPlayerId || preselectPlayerName) {
      setPendingTopbarSelection({
        id: String(preselectPlayerId || ""),
        name: String(preselectPlayerName || ""),
      });
    }
  }, [location.state]);

  useEffect(() => {
    async function loadTeams() {
      try {
        setLoading(true);
        const data = await fetchTeams(selectedLeague);
        const sortedTeams = (data || []).sort((left, right) =>
          (left.strTeam || "").localeCompare(right.strTeam || "")
        );

        teamsCacheByLeagueRef.current[selectedLeague] = sortedTeams;

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
  }, [selectedLeague, refreshNonce]);

  useEffect(() => {
    if (!selectedTeam) {
      setPlayers([]);
      return;
    }

    async function loadPlayers() {
      try {
        setLoading(true);
        const data = await fetchPlayers(selectedTeam);
        const normalizedPlayers = normalisePlayers(data);
        playersCacheByTeamRef.current[selectedTeam] = normalizedPlayers;
        setPlayers(normalizedPlayers);
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
  }, [selectedTeam, refreshNonce]);

  useEffect(() => {
    const query = normalizeSearchText(searchTerm);

    if (query.length < 2) {
      setGlobalSearchLoading(false);
      setGlobalSearchResults([]);
      return;
    }

    let isMounted = true;

    const timeoutId = setTimeout(async () => {
      setGlobalSearchLoading(true);

      try {
        const aggregatedMatches = [];

        for (const leagueName of LEAGUE_OPTIONS) {
          let leagueTeams = teamsCacheByLeagueRef.current[leagueName];
          if (!leagueTeams) {
            const fetchedTeams = await fetchTeams(leagueName);
            leagueTeams = (fetchedTeams || []).sort((left, right) =>
              (left.strTeam || "").localeCompare(right.strTeam || "")
            );
            teamsCacheByLeagueRef.current[leagueName] = leagueTeams;
          }

          for (const team of leagueTeams) {
            const teamName = team?.strTeam || "";
            if (!teamName) continue;

            let roster = playersCacheByTeamRef.current[teamName];
            if (!roster) {
              const fetchedPlayers = await fetchPlayers(teamName);
              roster = normalisePlayers(fetchedPlayers);
              playersCacheByTeamRef.current[teamName] = roster;
            }

            const matches = roster.filter((player) =>
              normalizeSearchText(player?.strPlayer || player?.name || "").includes(query)
            );

            matches.forEach((player) => {
              aggregatedMatches.push({
                ...player,
                __searchLeague: leagueName,
                __searchTeam: teamName,
              });
            });

            if (aggregatedMatches.length >= 48) break;
          }

          if (aggregatedMatches.length >= 48) break;
        }

        if (!isMounted) return;
        setGlobalSearchResults(aggregatedMatches.slice(0, 48));
      } catch (error) {
        console.error("Error searching across leagues and clubs:", error);
        if (isMounted) {
          setGlobalSearchResults([]);
        }
      } finally {
        if (isMounted) {
          setGlobalSearchLoading(false);
        }
      }
    }, 320);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [searchTerm, refreshNonce]);

  useEffect(() => {
    let isMounted = true;

    async function loadClubBadge() {
      if (!selectedTeam) {
        if (isMounted) {
          setClubBadge("");
        }
        return;
      }

      try {
        const team = await fetchTeamByName(selectedTeam);
        if (!isMounted) return;

        setClubBadge(team?.strTeamBadge || team?.strTeamLogo || "");
      } catch (error) {
        console.error("Error loading club badge:", error);
        if (isMounted) {
          setClubBadge("");
        }
      }
    }

    loadClubBadge();

    return () => {
      isMounted = false;
    };
  }, [selectedTeam, refreshNonce]);

  const handlePlayerClick = useCallback(async (player) => {
    if (player?.__searchLeague && player.__searchLeague !== selectedLeague) {
      setSelectedLeague(player.__searchLeague);
    }

    if (player?.__searchTeam && player.__searchTeam !== selectedTeam) {
      setSelectedTeam(player.__searchTeam);
    }

    setSelectedPlayer(player);
    setPlayerDetails(null);
    try {
      const details = await fetchPlayerDetails(player.idPlayer);
      setPlayerDetails(details);
    } catch (error) {
      console.error("Error loading player details:", error);
    }
  }, [selectedLeague, selectedTeam]);

  useEffect(() => {
    if (!pendingTopbarSelection || players.length === 0) {
      return;
    }

    const selectedById = pendingTopbarSelection.id
      ? players.find((player) => String(player.idPlayer || player.id || "") === pendingTopbarSelection.id)
      : null;

    const normalizedName = pendingTopbarSelection.name.trim().toLowerCase();
    const selectedByName = normalizedName
      ? players.find((player) => String(player.strPlayer || player.name || "").trim().toLowerCase() === normalizedName)
      : null;

    const nextSelection = selectedById || selectedByName || null;
    if (!nextSelection) {
      return;
    }

    handlePlayerClick(nextSelection);
    setPendingTopbarSelection(null);
  }, [pendingTopbarSelection, players, handlePlayerClick]);

  useEffect(() => {
    if (!pendingTopbarSelection || globalSearchLoading || globalSearchResults.length === 0) {
      return;
    }

    const selectedById = pendingTopbarSelection.id
      ? globalSearchResults.find((player) => String(player.idPlayer || player.id || "") === pendingTopbarSelection.id)
      : null;

    const normalizedName = normalizeSearchText(pendingTopbarSelection.name);
    const selectedByName = normalizedName
      ? globalSearchResults.find((player) => normalizeSearchText(player.strPlayer || player.name || "") === normalizedName)
      : null;

    const nextSelection = selectedById || selectedByName || null;
    if (!nextSelection) return;

    handlePlayerClick(nextSelection);
    setPendingTopbarSelection(null);
  }, [pendingTopbarSelection, globalSearchLoading, globalSearchResults, handlePlayerClick]);

  const closePlayerDetails = () => {
    setSelectedPlayer(null);
    setPlayerDetails(null);
  };

  const query = normalizeSearchText(searchTerm);
  const isCrossScopeSearch = query.length >= 2;

  const displayedPlayers = isCrossScopeSearch
    ? globalSearchResults
    : players.filter((player) =>
        normalizeSearchText(player.strPlayer || player.name || "").includes(query)
      );

  const biographyText = buildPlayerBiography(playerDetails, selectedPlayer, selectedTeam);

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
          <p className="page-subtitle">Live current squad and player profile data sourced from major leagues.</p>
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
            {globalSearchLoading ? (
              <div className="no-players">
                <p>Searching across all leagues and clubs...</p>
                <p>Finding player matches beyond the currently selected team.</p>
              </div>
            ) : displayedPlayers.length > 0 ? (
              displayedPlayers.slice(0, 24).map((player) => {
                const playerImage = getPlayerProfileVisual(player, {
                  name: player.strPlayer,
                  team: player.strTeam || player.__searchTeam || selectedTeam,
                });

                const resolvedTeamName = player.strTeam || player.__searchTeam || selectedTeam;
                const resolvedLeagueName = player.__searchLeague || selectedLeague;
                const cardClubBadge =
                  resolvedTeamName && resolvedTeamName === selectedTeam && clubBadge
                    ? clubBadge
                    : "/assets/img/logo.png";

                return (
                  <div
                    key={player.idPlayer || player.id}
                    className="player-item player-profile-card"
                    onClick={() => handlePlayerClick(player)}
                  >
                    <div className="player-profile-card-media">
                      <img
                        src={playerImage}
                        alt={player.strPlayer || player.name}
                        className="player-profile-card-photo"
                      />
                      <div className="player-overlay-content player-profile-card-content">
                        <h3 className="player-overlay-name">{player.strPlayer || player.name}</h3>
                        <p className="player-overlay-position">{player.strPosition || player.position || 'Unknown'}</p>
                        <div className="player-overlay-meta-row">
                          <img
                            src={cardClubBadge}
                            alt={`${resolvedTeamName || "Club"} logo`}
                            className="player-overlay-club-badge"
                          />
                          <p className="player-overlay-meta">{resolvedTeamName || 'Unknown Club'}</p>
                        </div>
                        {isCrossScopeSearch ? <p className="player-overlay-meta">{resolvedLeagueName}</p> : null}
                        <button
                          type="button"
                          className="player-overlay-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handlePlayerClick(player);
                          }}
                        >
                          View Player
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="no-players">
                <p>{searchTerm ? `No players found for "${searchTerm}" across leagues and clubs.` : `No players found for ${selectedTeam}`}</p>
                <p>{searchTerm ? 'Try a shorter or partial player name.' : 'Try selecting a different team.'}</p>
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
                    src={getPlayerProfileVisual(playerDetails || selectedPlayer, {
                      name: selectedPlayer.strPlayer,
                      team: selectedPlayer.strTeam || selectedTeam,
                    })}
                    alt={selectedPlayer.strPlayer || selectedPlayer.name}
                    className="modal-player-photo"
                  />
                  <div>
                    <h2>{selectedPlayer.strPlayer || selectedPlayer.name}</h2>
                    <p className="modal-player-position">{selectedPlayer.strPosition || selectedPlayer.position}</p>
                    <div className="modal-player-club-row">
                      <img
                        src={clubBadge || "/assets/img/logo.png"}
                        alt={`${selectedPlayer.strTeam || selectedTeam || "Club"} logo`}
                        className="modal-player-club-badge"
                      />
                      <span>{selectedPlayer.strTeam || selectedTeam || "Unknown Club"}</span>
                    </div>
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

                    <div className="detail-section">
                      <h3>Biography</h3>
                      <p className="player-description">
                        {biographyText}
                      </p>
                    </div>

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