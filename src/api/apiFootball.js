// RapidAPI (API-Football) is primary. TheSportsDB is used as a safe fallback
// when no RapidAPI key is configured.
const RAPIDAPI_BASE_URL = process.env.REACT_APP_RAPIDAPI_BASE_URL || "https://api-football-v1.p.rapidapi.com/v3";
const RAPIDAPI_HOST = process.env.REACT_APP_RAPIDAPI_HOST || "api-football-v1.p.rapidapi.com";
const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY || "";
const SPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";
const DEFAULT_TTL = 5 * 60 * 1000;
const LIVE_TTL = 15 * 1000;
const UPCOMING_TTL = 60 * 1000;

const responseCache = new Map();
const inflightRequests = new Map();

function getCurrentSeasonYear() {
  const now = new Date();
  const month = now.getMonth() + 1;
  return month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
}

function getCurrentSeasonRangeLabel() {
  const seasonStart = getCurrentSeasonYear();
  return `${seasonStart}-${seasonStart + 1}`;
}

const LEAGUE_MAP = {
  "English Premier League": { apiId: 39, legacyId: 4328, country: "England" },
  "Spanish La Liga": { apiId: 140, legacyId: 4335, country: "Spain" },
  "Italian Serie A": { apiId: 135, legacyId: 4332, country: "Italy" },
  "German Bundesliga": { apiId: 78, legacyId: 4331, country: "Germany" },
  "French Ligue 1": { apiId: 61, legacyId: 4334, country: "France" },
  "UEFA Champions League": { apiId: 2, legacyId: 4480, country: "Europe" },
  "South African Premier Soccer League": { apiId: 288, legacyId: 4620, country: "South Africa" },
};

const LEGACY_ID_TO_NAME = Object.entries(LEAGUE_MAP).reduce((acc, [name, value]) => {
  acc[value.legacyId] = name;
  return acc;
}, {});

const API_ID_TO_NAME = Object.entries(LEAGUE_MAP).reduce((acc, [name, value]) => {
  acc[value.apiId] = name;
  return acc;
}, {});

function getCacheKey(provider, path, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return `${provider}:${path}${query ? `?${query}` : ""}`;
}

function createSearchParams(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });
  return searchParams;
}

function isRapidApiConfigured() {
  return Boolean(RAPIDAPI_KEY);
}

async function fetchWithCache(provider, url, path, params = {}, requestInit = {}, { ttl = DEFAULT_TTL } = {}) {
  const cacheKey = getCacheKey(provider, path, params);
  const now = Date.now();
  const cachedEntry = responseCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.data;
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const request = fetch(url, requestInit)
    .then(async (res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      responseCache.set(cacheKey, {
        data,
        expiresAt: now + ttl,
      });
      return data;
    })
    .finally(() => {
      inflightRequests.delete(cacheKey);
    });

  inflightRequests.set(cacheKey, request);
  return request;
}

async function fetchRapidApi(path, params = {}, { ttl = DEFAULT_TTL } = {}) {
  if (!isRapidApiConfigured()) {
    throw new Error("RapidAPI key is missing. Set REACT_APP_RAPIDAPI_KEY in your environment.");
  }

  const searchParams = createSearchParams(params);
  const url = `${RAPIDAPI_BASE_URL}/${path}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  return fetchWithCache(
    "rapidapi",
    url,
    path,
    params,
    {
      headers: {
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": RAPIDAPI_HOST,
      },
    },
    { ttl }
  );
}

async function fetchSportsDb(path, params = {}, { ttl = DEFAULT_TTL } = {}) {
  const searchParams = createSearchParams(params);
  const url = `${SPORTSDB_BASE_URL}/${path}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return fetchWithCache("sportsdb", url, path, params, {}, { ttl });
}

function normalizeLeagueName(league) {
  if (!league) return "";
  if (typeof league === "number" || /^\d+$/.test(String(league))) {
    const numeric = Number(league);
    return LEGACY_ID_TO_NAME[numeric] || API_ID_TO_NAME[numeric] || "";
  }
  return String(league).trim();
}

function resolveLeagueIds(league) {
  const leagueName = normalizeLeagueName(league);
  if (!leagueName) {
    return { leagueName: "", apiId: null, legacyId: null, country: "" };
  }

  const mapped = LEAGUE_MAP[leagueName];
  if (mapped) {
    return {
      leagueName,
      apiId: mapped.apiId,
      legacyId: mapped.legacyId,
      country: mapped.country,
    };
  }

  if (typeof league === "number" || /^\d+$/.test(String(league))) {
    const numeric = Number(league);
    if (API_ID_TO_NAME[numeric]) {
      const known = LEAGUE_MAP[API_ID_TO_NAME[numeric]];
      return {
        leagueName: API_ID_TO_NAME[numeric],
        apiId: numeric,
        legacyId: known?.legacyId || null,
        country: known?.country || "",
      };
    }

    return {
      leagueName: `League ${numeric}`,
      apiId: numeric,
      legacyId: numeric,
      country: "",
    };
  }

  return {
    leagueName,
    apiId: null,
    legacyId: null,
    country: "",
  };
}

function mapRapidLeague(entry) {
  const league = entry?.league || {};
  const country = entry?.country || {};
  const name = normalizeLeagueName(league.name || "") || league.name;
  const mapped = LEAGUE_MAP[name] || null;

  return {
    idLeague: String(mapped?.legacyId || league.id || ""),
    strLeague: name || "",
    strCountry: country.name || mapped?.country || "",
    strBadge: league.logo || country.flag || "",
    apiLeagueId: league.id || null,
  };
}

function mapRapidTeam(entry, fallbackLeagueName = "") {
  const team = entry?.team || entry || {};
  const venue = entry?.venue || {};

  return {
    idTeam: String(team.id || ""),
    strTeam: team.name || "",
    strTeamBadge: team.logo || "",
    strTeamLogo: team.logo || "",
    strCountry: team.country || "",
    strLeague: fallbackLeagueName,
    intFormedYear: team.founded || "",
    strStadium: venue.name || "",
    intStadiumCapacity: venue.capacity || "",
    strWebsite: "",
    strDescriptionEN: "",
    strStadiumThumb: venue.image || "",
  };
}

function mapRapidSquadPlayer(player, teamName = "") {
  return {
    idPlayer: String(player?.id || ""),
    strPlayer: player?.name || "",
    strTeam: teamName,
    strPosition: player?.position || "",
    strNumber: player?.number || "",
    strNationality: player?.nationality || "",
    dateBorn: "",
    strHeight: "",
    strWeight: "",
    strThumb: player?.photo || "",
    strCutout: player?.photo || "",
    strStatus: "Active",
  };
}

function normalizeMatchStatus(shortStatus = "") {
  const liveCodes = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT"]);
  if (liveCodes.has(shortStatus)) return "LIVE";
  if (shortStatus === "FT") return "Match Finished";
  if (shortStatus === "NS") return "Not Started";
  return shortStatus || "Unknown";
}

function mapRapidFixture(entry) {
  const fixture = entry?.fixture || {};
  const teams = entry?.teams || {};
  const goals = entry?.goals || {};
  const status = fixture?.status || {};

  return {
    idEvent: String(fixture.id || ""),
    idHomeTeam: String(teams.home?.id || ""),
    idAwayTeam: String(teams.away?.id || ""),
    strHomeTeam: teams.home?.name || "",
    strAwayTeam: teams.away?.name || "",
    strHomeTeamBadge: teams.home?.logo || "",
    strAwayTeamBadge: teams.away?.logo || "",
    intHomeScore: goals.home ?? "",
    intAwayScore: goals.away ?? "",
    strStatus: normalizeMatchStatus(status.short),
    strLeague: entry?.league?.name || "",
    dateEvent: fixture.date || "",
    strTimestamp: fixture.date || "",
  };
}

async function callProvider(rapidCall, sportsDbCall) {
  if (isRapidApiConfigured()) {
    return rapidCall();
  }

  console.warn("RapidAPI key not found. Falling back to TheSportsDB.");
  return sportsDbCall();
}

export function clearApiCache() {
  responseCache.clear();
  inflightRequests.clear();
}

export async function fetchPlayers(teamName, season = getCurrentSeasonYear()) {
  try {
    return await callProvider(
      async () => {
        const teamData = await fetchRapidApi("teams", { search: teamName });
        const teamEntry = (teamData.response || [])[0];
        const team = mapRapidTeam(teamEntry);

        if (!team.idTeam) {
          console.warn(`No team found for: ${teamName}`);
          return [];
        }

        const playersData = await fetchRapidApi("players/squads", { team: team.idTeam }, { ttl: UPCOMING_TTL });
        const players = playersData?.response?.[0]?.players || [];
        return players.map((player) => mapRapidSquadPlayer(player, team.strTeam || teamName));
      },
      async () => {
        const teamData = await fetchSportsDb("searchteams.php", { t: teamName });

        if (!teamData.teams || teamData.teams.length === 0) {
          console.warn(`No team found for: ${teamName}`);
          return [];
        }

        const teamId = teamData.teams[0].idTeam;
        const playersData = await fetchSportsDb("lookup_all_players.php", { id: teamId });

        if (Array.isArray(playersData.player)) {
          return playersData.player;
        }

        return playersData.player ? Object.values(playersData.player) : [];
      }
    );
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
}

export async function fetchTeams(leagueName = "English Premier League", season = getCurrentSeasonYear()) {
  try {
    return await callProvider(
      async () => {
        const league = resolveLeagueIds(leagueName);
        let response = [];

        if (league.apiId) {
          const data = await fetchRapidApi("teams", { league: league.apiId, season }, { ttl: UPCOMING_TTL });
          response = data.response || [];
        }

        if (response.length === 0) {
          const fallbackSearch = await fetchRapidApi("teams", { search: league.leagueName || leagueName }, { ttl: UPCOMING_TTL });
          response = fallbackSearch.response || [];
        }

        return response.map((entry) => mapRapidTeam(entry, league.leagueName || leagueName));
      },
      async () => {
        const data = await fetchSportsDb("search_all_teams.php", { l: leagueName });
        return data.teams || [];
      }
    );
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function fetchFixtures(teamId) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("fixtures", { team: teamId, last: 10 }, { ttl: UPCOMING_TTL });
        return (data.response || []).map(mapRapidFixture);
      },
      async () => {
        const data = await fetchSportsDb("eventslast.php", { id: teamId }, { ttl: UPCOMING_TTL });
        return data.results || [];
      }
    );
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
}

export async function fetchPlayerDetails(playerId, season = getCurrentSeasonYear()) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("players", { id: playerId, season }, { ttl: UPCOMING_TTL });
        const payload = (data.response || [])[0] || null;
        if (!payload) return null;

        const player = payload.player || {};
        const stats = payload.statistics?.[0] || {};

        return {
          idPlayer: String(player.id || ""),
          strPlayer: player.name || "",
          strTeam: stats.team?.name || "",
          strPosition: stats.games?.position || "",
          strNationality: player.nationality || "",
          dateBorn: player.birth?.date || "",
          strHeight: player.height || "",
          strWeight: player.weight || "",
          strThumb: player.photo || "",
          strCutout: player.photo || "",
          strDescriptionEN: player.description || "",
          strStatus: "Active",
          intGoals: stats.goals?.total ?? 0,
          intAssists: stats.goals?.assists ?? 0,
          intShots: stats.shots?.total ?? 0,
          intShotsOnTarget: stats.shots?.on ?? 0,
          intPasses: stats.passes?.total ?? 0,
          intPassesCompleted: stats.passes?.accuracy ?? 0,
          intTackles: stats.tackles?.total ?? 0,
          intSaves: stats.goals?.saves ?? 0,
        };
      },
      async () => {
        const data = await fetchSportsDb("lookupplayer.php", { id: playerId });
        return data.players ? data.players[0] : null;
      }
    );
  } catch (error) {
    console.error("Error fetching player details:", error);
    return null;
  }
}

export async function fetchLeagues() {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("leagues", { type: "league", current: true }, { ttl: DEFAULT_TTL });
        const leagues = (data.response || [])
          .map(mapRapidLeague)
          .filter((league) => league.strLeague);

        const preferredOrder = [
          "English Premier League",
          "Spanish La Liga",
          "Italian Serie A",
          "German Bundesliga",
          "French Ligue 1",
          "UEFA Champions League",
        ];

        preferredOrder.forEach((name) => {
          if (!leagues.find((entry) => entry.strLeague === name)) {
            const mapped = LEAGUE_MAP[name];
            leagues.push({
              idLeague: String(mapped.legacyId),
              strLeague: name,
              strCountry: mapped.country,
              strBadge: "",
              apiLeagueId: mapped.apiId,
            });
          }
        });

        return leagues.sort((a, b) => (a.strLeague || "").localeCompare(b.strLeague || ""));
      },
      async () => {
        const data = await fetchSportsDb("all_leagues.php");
        return data.leagues ? data.leagues.filter((league) => league.strSport === "Soccer") : [];
      }
    );
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export async function fetchLeagueTable(leagueId, season = getCurrentSeasonYear()) {
  try {
    return await callProvider(
      async () => {
        const league = resolveLeagueIds(leagueId);
        if (!league.apiId) return [];

        const data = await fetchRapidApi("standings", { league: league.apiId, season }, { ttl: UPCOMING_TTL });
        const standings = data.response?.[0]?.league?.standings?.[0] || [];
        return standings.map((entry) => ({
          name: entry.team?.name,
          logo: entry.team?.logo,
          rank: entry.rank,
          points: entry.points,
          played: entry.all?.played,
          win: entry.all?.win,
          draw: entry.all?.draw,
          lose: entry.all?.lose,
          goalsDiff: entry.goalsDiff,
        }));
      },
      async () => {
        const data = await fetchSportsDb("lookuptable.php", { l: leagueId, s: getCurrentSeasonRangeLabel() }, { ttl: UPCOMING_TTL });
        return data.table || [];
      }
    );
  } catch (error) {
    console.error("Error fetching league table:", error);
    return [];
  }
}

export async function fetchLeagueDetails(leagueId) {
  try {
    return await callProvider(
      async () => {
        const league = resolveLeagueIds(leagueId);
        if (!league.apiId) return null;

        const data = await fetchRapidApi("leagues", { id: league.apiId }, { ttl: DEFAULT_TTL });
        const entry = (data.response || [])[0] || null;
        if (!entry) return null;

        const mapped = mapRapidLeague(entry);
        return {
          ...mapped,
          strCurrentSeason: String(entry?.seasons?.find((season) => season.current)?.year || ""),
        };
      },
      async () => {
        const data = await fetchSportsDb("lookupleague.php", { id: leagueId });
        return data.leagues ? data.leagues[0] : null;
      }
    );
  } catch (error) {
    console.error("Error fetching league details:", error);
    return null;
  }
}

export async function fetchTeamDetails(teamId) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("teams", { id: teamId }, { ttl: DEFAULT_TTL });
        const team = mapRapidTeam((data.response || [])[0]);
        return team.idTeam ? team : null;
      },
      async () => {
        const data = await fetchSportsDb("lookupteam.php", { id: teamId });
        return data.teams ? data.teams[0] : null;
      }
    );
  } catch (error) {
    console.error("Error fetching team details:", error);
    return null;
  }
}

export async function fetchTeamByName(teamName) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("teams", { search: teamName }, { ttl: DEFAULT_TTL });
        const team = mapRapidTeam((data.response || [])[0]);
        return team.idTeam ? team : null;
      },
      async () => {
        const data = await fetchSportsDb("searchteams.php", { t: teamName });
        return data.teams ? data.teams[0] : null;
      }
    );
  } catch (error) {
    console.error("Error fetching team by name:", error);
    return null;
  }
}

export async function fetchMatchDetails(eventId) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("fixtures", { id: eventId }, { ttl: LIVE_TTL });
        return data.response?.[0] ? mapRapidFixture(data.response[0]) : null;
      },
      async () => {
        const data = await fetchSportsDb("lookupevent.php", { id: eventId }, { ttl: LIVE_TTL });
        return data.events ? data.events[0] : null;
      }
    );
  } catch (error) {
    console.error("Error fetching match details:", error);
    return null;
  }
}

export async function fetchLiveMatches(leagueName) {
  try {
    return await callProvider(
      async () => {
        const league = resolveLeagueIds(leagueName);
        if (!league.apiId) return [];

        const data = await fetchRapidApi("fixtures", { league: league.apiId, live: "all" }, { ttl: LIVE_TTL });
        return (data.response || []).map(mapRapidFixture);
      },
      async () => {
        const data = await fetchSportsDb("livescore.php", { l: leagueName }, { ttl: LIVE_TTL });
        return data.events || [];
      }
    );
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

export async function fetchUpcomingMatches(leagueId) {
  try {
    return await callProvider(
      async () => {
        const league = resolveLeagueIds(leagueId);
        if (!league.apiId) return [];

        const data = await fetchRapidApi("fixtures", { league: league.apiId, next: 15 }, { ttl: UPCOMING_TTL });
        return (data.response || []).map(mapRapidFixture);
      },
      async () => {
        const data = await fetchSportsDb("eventsnextleague.php", { id: leagueId }, { ttl: UPCOMING_TTL });
        return data.events || [];
      }
    );
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

export async function searchPlayers(playerName) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("players/profiles", { search: playerName }, { ttl: DEFAULT_TTL });
        return (data.response || []).map((entry) => {
          const player = entry.player || entry || {};
          const stats = entry.statistics?.[0] || {};

          return {
            idPlayer: String(player.id || ""),
            strPlayer: player.name || "",
            strTeam: stats.team?.name || "",
            strPosition: stats.games?.position || "",
            strNationality: player.nationality || "",
            dateBorn: player.birth?.date || "",
            strHeight: player.height || "",
            strWeight: player.weight || "",
            strThumb: player.photo || "",
            strCutout: player.photo || "",
            strStatus: "Active",
          };
        });
      },
      async () => {
        const data = await fetchSportsDb("searchplayers.php", { p: playerName });
        return data.player || [];
      }
    );
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}

export async function searchTeams(teamName) {
  try {
    return await callProvider(
      async () => {
        const data = await fetchRapidApi("teams", { search: teamName }, { ttl: DEFAULT_TTL });
        return (data.response || []).map((entry) => mapRapidTeam(entry));
      },
      async () => {
        const data = await fetchSportsDb("searchteams.php", { t: teamName }, { ttl: DEFAULT_TTL });
        return data.teams || [];
      }
    );
  } catch (error) {
    console.error("Error searching teams:", error);
    return [];
  }
}
