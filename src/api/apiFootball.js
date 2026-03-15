// TheSportsDB API - Free, reliable, and comprehensive football data
const BASE_URL = 'https://www.thesportsdb.com/api/v1/json/3';

export async function fetchPlayers(teamName, season = 2023) {
  try {
    // First get team details to get team ID
    const teamRes = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);

    if (!teamRes.ok) {
      throw new Error(`HTTP error! status: ${teamRes.status}`);
    }

    const teamData = await teamRes.json();

    if (!teamData.teams || teamData.teams.length === 0) {
      console.warn(`No team found for: ${teamName}`);
      return [];
    }

    const teamId = teamData.teams[0].idTeam;

    // Get players for the team
    const playersRes = await fetch(`${BASE_URL}/lookup_all_players.php?id=${teamId}`);

    if (!playersRes.ok) {
      throw new Error(`HTTP error! status: ${playersRes.status}`);
    }

    const playersData = await playersRes.json();
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
    const res = await fetch(`${BASE_URL}/search_all_teams.php?l=${encodeURIComponent(leagueName)}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.teams || [];
  } catch (error) {
    console.error("Error fetching teams:", error);
    return [];
  }
}

export async function fetchFixtures(teamId) {
  try {
    // Get last 10 fixtures for a team
    const res = await fetch(`${BASE_URL}/eventslast.php?id=${teamId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Error fetching fixtures:", error);
    return [];
  }
}

export async function fetchPlayerDetails(playerId) {
  try {
    const res = await fetch(`${BASE_URL}/lookupplayer.php?id=${playerId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.players ? data.players[0] : null;
  } catch (error) {
    console.error("Error fetching player details:", error);
    return null;
  }
}

export async function fetchLeagues() {
  try {
    const res = await fetch(`${BASE_URL}/all_leagues.php`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    // Filter for soccer leagues only
    return data.leagues ? data.leagues.filter(league => league.strSport === "Soccer") : [];
  } catch (error) {
    console.error("Error fetching leagues:", error);
    return [];
  }
}

export async function fetchLeagueTable(leagueId) {
  try {
    const res = await fetch(`${BASE_URL}/lookuptable.php?l=${leagueId}&s=2023-2024`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.table || [];
  } catch (error) {
    console.error("Error fetching league table:", error);
    return [];
  }
}

export async function fetchLeagueDetails(leagueId) {
  try {
    const res = await fetch(`${BASE_URL}/lookupleague.php?id=${leagueId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.leagues ? data.leagues[0] : null;
  } catch (error) {
    console.error("Error fetching league details:", error);
    return null;
  }
}

export async function fetchTeamDetails(teamId) {
  try {
    const res = await fetch(`${BASE_URL}/lookupteam.php?id=${teamId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.teams ? data.teams[0] : null;
  } catch (error) {
    console.error("Error fetching team details:", error);
    return null;
  }
}

export async function fetchTeamByName(teamName) {
  try {
    const res = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.teams ? data.teams[0] : null;
  } catch (error) {
    console.error("Error fetching team by name:", error);
    return null;
  }
}

export async function fetchMatchDetails(eventId) {
  try {
    const res = await fetch(`${BASE_URL}/lookupevent.php?id=${eventId}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.events ? data.events[0] : null;
  } catch (error) {
    console.error("Error fetching match details:", error);
    return null;
  }
}

export async function fetchLiveMatches(leagueName) {
  try {
    const res = await fetch(`${BASE_URL}/livescore.php?l=${encodeURIComponent(leagueName)}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching live matches:", error);
    return [];
  }
}

export async function fetchUpcomingMatches(leagueId) {
  try {
    const res = await fetch(`${BASE_URL}/eventsnextleague.php?id=${leagueId}`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return data.events || [];
  } catch (error) {
    console.error("Error fetching upcoming matches:", error);
    return [];
  }
}

export async function searchPlayers(playerName) {
  try {
    const res = await fetch(`${BASE_URL}/searchplayers.php?p=${encodeURIComponent(playerName)}`);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data.player || [];
  } catch (error) {
    console.error("Error searching players:", error);
    return [];
  }
}
