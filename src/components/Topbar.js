import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchLeagues, searchPlayers, searchTeams } from "../api/apiFootball";

const SUPPORTED_FOOTBALL_LEAGUE_LIST = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "Dutch Eredivisie",
  "Eredivisie",
  "Portuguese Primeira Liga",
  "Primeira Liga",
  "Turkish Super Lig",
  "S\u00fcper Lig",
  "Brazilian Serie A",
  "American Major League Soccer",
  "Major League Soccer",
  "Saudi Pro League",
  "Saudi Professional League",
  "Saudi Arabian Pro League",
  "Saudi Arabia Pro League",
  "Saudi Arabia Professional League",
  "Roshn Saudi League",
  "Roshn Saudi Pro League",
  "UEFA Champions League",
  "South African Premier Soccer League",
];

const SUPPORTED_FOOTBALL_LEAGUES = new Set(SUPPORTED_FOOTBALL_LEAGUE_LIST);

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const NORMALIZED_SUPPORTED_LEAGUES = new Set(
  Array.from(SUPPORTED_FOOTBALL_LEAGUES).map((name) => normalizeText(name))
);

function isSupportedLeagueName(name) {
  const normalizedName = normalizeText(name);
  if (!normalizedName) return false;
  if (NORMALIZED_SUPPORTED_LEAGUES.has(normalizedName)) return true;

  // Handle practical alias variants from providers.
  if (normalizedName.includes("major league soccer") || normalizedName === "mls") return true;
  if (normalizedName.includes("saudi") && (normalizedName.includes("pro league") || normalizedName.includes("professional league") || normalizedName.includes("roshn"))) return true;
  if (normalizedName.includes("eredivisie")) return true;
  if (normalizedName.includes("primeira liga")) return true;
  if (normalizedName.includes("super lig") || normalizedName.includes("superlig")) return true;
  if (normalizedName.includes("sudafricana") || normalizedName.includes("south african premier soccer")) return true;

  return false;
}

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
        const [playersResult, clubsResult, leaguesResult] = await Promise.allSettled([
          searchPlayers(query),
          searchTeams(query),
          fetchLeagues(),
        ]);

        if (!isActive) return;

        const players = playersResult.status === "fulfilled" ? playersResult.value : [];
        const clubs = clubsResult.status === "fulfilled" ? clubsResult.value : [];
        const fetchedLeagues = leaguesResult.status === "fulfilled" ? leaguesResult.value : [];
        const leagues = fetchedLeagues.length > 0
          ? fetchedLeagues
          : SUPPORTED_FOOTBALL_LEAGUE_LIST.map((leagueName, index) => ({
              idLeague: `fallback-${index + 1}`,
              strLeague: leagueName,
              strCountry: "",
            }));

        const normalizedQuery = normalizeText(query);
        const filteredLeagues = (leagues || []).filter((league) => {
          const leagueName = league.strLeague || "";
          return isSupportedLeagueName(leagueName) && normalizeText(leagueName).includes(normalizedQuery);
        });

        const filteredClubs = (clubs || []).filter((club) => {
          const leagueName = club?.strLeague || "";
          const sportName = String(club?.strSport || "Soccer").toLowerCase();

          const teamName = normalizeText(club?.strTeam || "");
          const leagueText = normalizeText(leagueName);
          const countryText = normalizeText(club?.strCountry || "");
          const matchesQuery =
            teamName.includes(normalizedQuery) ||
            leagueText.includes(normalizedQuery) ||
            countryText.includes(normalizedQuery);

          // Some providers omit league name in team search responses; allow those through
          // if they match the query and are soccer data.
          const leagueSupportedOrUnknown = !leagueName || isSupportedLeagueName(leagueName);

          return (sportName === "soccer" || sportName === "") && leagueSupportedOrUnknown && matchesQuery;
        });

        const supportedClubNames = new Set(filteredClubs.map((club) => normalizeText(club?.strTeam || "")));
        const filteredPlayers = (players || []).filter((player) => {
          const sportName = String(player?.strSport || "Soccer").toLowerCase();
          const teamName = normalizeText(player?.strTeam || "");
          const playerName = normalizeText(player?.strPlayer || "");
          const matchesQuery = playerName.includes(normalizedQuery) || teamName.includes(normalizedQuery);

          if (sportName && sportName !== "soccer") return false;
          if (!matchesQuery) return false;
          if (!teamName) return true;
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

  useEffect(() => {
    const autoRefreshInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent("footballpulse:refreshData", {
        detail: { source: "topbar-auto" },
      }));
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(autoRefreshInterval);
    };
  }, []);

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
          preselectLeague: payload?.strLeague || "",
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
          preselectTeam: payload?.strTeam || "",
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