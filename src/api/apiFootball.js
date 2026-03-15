// TheSportsDB API - Free, reliable, and comprehensive football data
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';
const DEFAULT_TTL = 5 * 60 * 1000;
const LIVE_TTL = 15 * 1000;
const UPCOMING_TTL = 60 * 1000;

const responseCache = new Map();
const inflightRequests = new Map();

function getCacheKey(path, params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return `${path}${query ? `?${query}` : ""}`;
}

async function fetchJson(path, params = {}, { ttl = DEFAULT_TTL } = {}) {
  const cacheKey = getCacheKey(path, params);
  const now = Date.now();
  const cachedEntry = responseCache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > now) {
    return cachedEntry.data;
  }

  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey);
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const request = fetch(`${BASE_URL}/${path}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`)
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

export function clearApiCache() {
  responseCache.clear();
  inflightRequests.clear();
}

export async function fetchPlayers(teamName, season = 2023) {
  try {
    // First get team details to get team ID
    const teamData = await fetchJson('searchteams.php', { t: teamName });

    if (!teamData.teams || teamData.teams.length === 0) {
      console.warn(`No team found for: ${teamName}`);
      return [];
    }

    const teamId = teamData.teams[0].idTeam;

    // Get players for the team
    const playersData = await fetchJson('lookup_all_players.php', { id: teamId });
    if (Array.isArray(playersData.player)) {
      return playersData.player;
    }
    return playersData.player ? Object.values(playersData.player) : [];
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
}

export async function fetchTeams(leagueName = "English Premier League", season = 2023) {
  try {
    // Get teams for a specific league
    const data = await fetchJson('search_all_teams.php', { l: leagueName });
    return data.teams || [];
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function fetchFixtures(teamId) {
  try {
    // Get last 10 fixtures for a team
    const data = await fetchJson('eventslast.php', { id: teamId }, { ttl: UPCOMING_TTL });
    return data.results || [];
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
}

export async function fetchPlayerDetails(playerId) {
  try {
    const data = await fetchJson('lookupplayer.php', { id: playerId });
    return data.players ? data.players[0] : null;
  } catch (error) {
    console.error("Error fetching player details:", error);
    return null;
  }
}

export async function fetchLeagues() {
  try {
    const data = await fetchJson('all_leagues.php');
    // Filter for soccer leagues only
    return data.leagues ? data.leagues.filter(league => league.strSport === "Soccer") : [];
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export async function fetchLeagueTable(leagueId) {
  try {
    const data = await fetchJson('lookuptable.php', { l: leagueId, s: '2023-2024' }, { ttl: UPCOMING_TTL });
    return data.table || [];
  } catch (error) {
    console.error("Error fetching league table:", error);
    return [];
  }
}

export async function fetchLeagueDetails(leagueId) {
  try {
    const data = await fetchJson('lookupleague.php', { id: leagueId });
    return data.leagues ? data.leagues[0] : null;
  } catch (error) {
    console.error("Error fetching league details:", error);
    return null;
  }
}

export async function fetchTeamDetails(teamId) {
  try {
    const data = await fetchJson('lookupteam.php', { id: teamId });
    return data.teams ? data.teams[0] : null;
  } catch (error) {
    console.error("Error fetching team details:", error);
    return null;
  }
}

export async function fetchTeamByName(teamName) {
  try {
    const data = await fetchJson('searchteams.php', { t: teamName });
    return data.teams ? data.teams[0] : null;
  } catch (error) {
    console.error("Error fetching team by name:", error);
    return null;
  }
}

export async function fetchMatchDetails(eventId) {
  try {
    const data = await fetchJson('lookupevent.php', { id: eventId }, { ttl: LIVE_TTL });
    return data.events ? data.events[0] : null;
  } catch (error) {
    console.error("Error fetching match details:", error);
    return null;
  }
}

export async function fetchLiveMatches(leagueName) {
  try {
    const data = await fetchJson('livescore.php', { l: leagueName }, { ttl: LIVE_TTL });
    return data.events || [];
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

export async function fetchUpcomingMatches(leagueId) {
  try {
    const data = await fetchJson('eventsnextleague.php', { id: leagueId }, { ttl: UPCOMING_TTL });
    return data.events || [];
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

export async function searchPlayers(playerName) {
  try {
    const data = await fetchJson('searchplayers.php', { p: playerName });
    return data.player || [];
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}
