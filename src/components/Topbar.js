import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchLeagues, searchPlayers, searchTeams } from "../api/apiFootball";

const SUPPORTED_FOOTBALL_LEAGUES = new Set([
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "UEFA Champions League",
  "South African Premier Soccer League",
]);

function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ players: [], clubs: [], leagues: [] });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const searchPanelRef = useRef(null);
  const profileDropdownRef = useRef(null);

  const getPageMeta = () => {
    switch (location.pathname) {
      case "/":
        return { title: "Dashboard", icon: "bx-home" };
      case "/players":
        return { title: "Players", icon: "bx-user" };
      case "/teams":
        return { title: "Teams", icon: "bx-group" };
      case "/comparison":
        return { title: "Player Comparison", icon: "bx-git-compare" };
      case "/timeline":
        return { title: "Performance Timeline", icon: "bx-time-five" };
      default:
        return { title: "Dashboard", icon: "bx-home" };
    }
  };

  const pageMeta = getPageMeta();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        timeZone: 'Africa/Johannesburg',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      };
      setCurrentTime(now.toLocaleString('en-ZA', options));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults({ players: [], clubs: [], leagues: [] });
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchPanelRef.current?.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileDropdownRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileOpen]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!isSearchOpen || query.length < 2) {
      setSearchResults({ players: [], clubs: [], leagues: [] });
      setSearchLoading(false);
      return;
    }

    let isActive = true;

    const timeoutId = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [players, clubs, leagues] = await Promise.all([
          searchPlayers(query),
          searchTeams(query),
          fetchLeagues(),
        ]);

        if (!isActive) return;

        const normalizedQuery = query.toLowerCase();
        const filteredLeagues = (leagues || []).filter((league) => {
          const leagueName = league.strLeague || "";
          return SUPPORTED_FOOTBALL_LEAGUES.has(leagueName) && leagueName.toLowerCase().includes(normalizedQuery);
        });

        const filteredClubs = (clubs || []).filter((club) => {
          const leagueName = club?.strLeague || "";
          const sportName = String(club?.strSport || "Soccer").toLowerCase();
          return SUPPORTED_FOOTBALL_LEAGUES.has(leagueName) && (sportName === "soccer" || sportName === "");
        });

        const supportedClubNames = new Set(filteredClubs.map((club) => (club?.strTeam || "").toLowerCase()));
        const filteredPlayers = (players || []).filter((player) => {
          const sportName = String(player?.strSport || "Soccer").toLowerCase();
          const teamName = String(player?.strTeam || "").toLowerCase();
          if (sportName && sportName !== "soccer") return false;
          if (!teamName) return false;
          return supportedClubNames.size === 0 ? true : supportedClubNames.has(teamName);
        });

        setSearchResults({
          players: filteredPlayers.slice(0, 5),
          clubs: filteredClubs.slice(0, 5),
          leagues: filteredLeagues.slice(0, 5),
        });
      } catch (error) {
        console.error("Topbar search failed:", error);
        if (isActive) {
          setSearchResults({ players: [], clubs: [], leagues: [] });
        }
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    }, 260);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [isSearchOpen, searchQuery]);

  const totalSearchResults = useMemo(
    () => searchResults.players.length + searchResults.clubs.length + searchResults.leagues.length,
    [searchResults]
  );

  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent("footballpulse:toggleSidebar"));
  };

  const toggleSearchPanel = () => {
    setIsSearchOpen((prev) => !prev);
  };

  const toggleProfileDropdown = () => {
    setIsProfileOpen((prev) => !prev);
  };

  const handleSearchResultClick = (type, payload) => {
    setIsSearchOpen(false);

    if (type === "player") {
      navigate("/players", {
        state: {
          prefillPlayerSearch: payload?.strPlayer || "",
          preselectTeam: payload?.strTeam || "",
          preselectPlayerId: payload?.idPlayer || "",
          preselectPlayerName: payload?.strPlayer || "",
        },
      });
      return;
    }

    if (type === "club") {
      navigate("/teams", {
        state: {
          prefillTeamSearch: payload?.strTeam || "",
          preselectLeague: payload?.strLeague || "",
        },
      });
      return;
    }

    if (type === "league") {
      navigate("/comparison", {
        state: {
          prefillLeague: payload?.strLeague || "",
        },
      });
    }
  };

  const handleSearchInputKeyDown = (event) => {
    if (event.key !== "Enter") return;

    const firstPlayer = searchResults.players[0];
    const firstClub = searchResults.clubs[0];
    const firstLeague = searchResults.leagues[0];

    if (firstPlayer) {
      handleSearchResultClick("player", firstPlayer);
      return;
    }

    if (firstClub) {
      handleSearchResultClick("club", firstClub);
      return;
    }

    if (firstLeague) {
      handleSearchResultClick("league", firstLeague);
    }
  };

  return (
    <div className="topbar">
      <div className="topbar-title">
        <button
          type="button"
          className="topbar-menu-btn"
          aria-label="Toggle navigation menu"
          onClick={toggleSidebar}
        >
          <i className="bx bx-menu"></i>
        </button>
        <span className="topbar-title-icon">
          <i className={`bx ${pageMeta.icon}`}></i>
        </span>
        <div className="text">{pageMeta.title}</div>
      </div>

      <div className="flex items-center gap-4 topbar-actions">
        <div className="topbar-search" ref={searchPanelRef}>
          <button
            type="button"
            className="topbar-search-trigger topbar-action-icon"
            title="Search players, clubs and leagues"
            onClick={toggleSearchPanel}
            aria-expanded={isSearchOpen}
            aria-label="Open topbar search"
          >
            <i className="bx bx-search"></i>
          </button>

          {isSearchOpen ? (
            <div className="topbar-search-panel">
              <div className="topbar-search-input-wrap">
                <i className="bx bx-search"></i>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchInputKeyDown}
                  placeholder="Search football players, clubs and leagues"
                  autoFocus
                />
              </div>

              <div className="topbar-search-results">
                {searchLoading ? <p className="topbar-search-state">Searching latest data...</p> : null}

                {!searchLoading && searchQuery.trim().length < 2 ? (
                  <p className="topbar-search-state">Type at least 2 characters.</p>
                ) : null}

                {!searchLoading && searchQuery.trim().length >= 2 && totalSearchResults === 0 ? (
                  <p className="topbar-search-state">No players, clubs, or leagues found.</p>
                ) : null}

                {searchResults.players.length > 0 ? (
                  <div className="topbar-search-group">
                    <h4>Players</h4>
                    {searchResults.players.map((player) => (
                      <button
                        key={`player-${player.idPlayer || player.strPlayer}`}
                        type="button"
                        className="topbar-search-item"
                        onClick={() => handleSearchResultClick("player", player)}
                      >
                        <span>{player.strPlayer || "Unknown Player"}</span>
                        <small>{player.strTeam || "Club Unknown"}</small>
                      </button>
                    ))}
                  </div>
                ) : null}

                {searchResults.clubs.length > 0 ? (
                  <div className="topbar-search-group">
                    <h4>Clubs</h4>
                    {searchResults.clubs.map((club) => (
                      <button
                        key={`club-${club.idTeam || club.strTeam}`}
                        type="button"
                        className="topbar-search-item"
                        onClick={() => handleSearchResultClick("club", club)}
                      >
                        <span>{club.strTeam || "Unknown Club"}</span>
                        <small>{club.strLeague || club.strCountry || "League Unknown"}</small>
                      </button>
                    ))}
                  </div>
                ) : null}

                {searchResults.leagues.length > 0 ? (
                  <div className="topbar-search-group">
                    <h4>Leagues</h4>
                    {searchResults.leagues.map((league) => (
                      <button
                        key={`league-${league.idLeague || league.strLeague}`}
                        type="button"
                        className="topbar-search-item"
                        onClick={() => handleSearchResultClick("league", league)}
                      >
                        <span>{league.strLeague || "Unknown League"}</span>
                        <small>{league.strCountry || "Global"}</small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
        <div className="topbar-profile" ref={profileDropdownRef}>
          <div className="user">
            <img src="/assets/img/User.jpg" alt="user" />
          </div>
          <div className="user-info topbar-profile-trigger" onClick={toggleProfileDropdown}>
            <span className="user-name">Refilwe Mahlawe</span>
            <span className="profile-settings">
              Profile Settings <i className={`bx ${isProfileOpen ? "bx-caret-up" : "bx-caret-down"}`}></i>
            </span>
          </div>
          {isProfileOpen ? (
            <div className="profile-dropdown">
              <button className="profile-dropdown-item">
                <i className="bx bx-bell"></i>
                <span>Notifications</span>
              </button>
              <button className="profile-dropdown-item">
                <i className="bx bx-cog"></i>
                <span>Settings</span>
              </button>
              <div className="profile-dropdown-divider"></div>
              <button className="profile-dropdown-item profile-dropdown-logout">
                <i className="bx bx-log-out"></i>
                <span>Logout</span>
              </button>
            </div>
          ) : null}
        </div>

        <div className="date-time">
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
}

export default Topbar;