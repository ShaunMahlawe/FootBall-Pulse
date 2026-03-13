import { useEffect, useState } from "react";

const BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";

export default function usePlayers(teamName) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getPlayers() {
      if (!teamName) return;

      try {
        setLoading(true);
        setError(null);

        // First get team details to get team ID
        const teamRes = await fetch(`${BASE_URL}/searchteams.php?t=${encodeURIComponent(teamName)}`);

        if (!teamRes.ok) {
          throw new Error(`Failed to fetch team: ${teamRes.status}`);
        }

        const teamData = await teamRes.json();

        if (!teamData.teams || teamData.teams.length === 0) {
          throw new Error(`No team found for: ${teamName}`);
        }

        const teamId = teamData.teams[0].idTeam;

        // Get players for the team
        const playersRes = await fetch(`${BASE_URL}/lookup_all_players.php?id=${teamId}`);

        if (!playersRes.ok) {
          throw new Error(`Failed to fetch players: ${playersRes.status}`);
        }

        const playersData = await playersRes.json();

        // Transform the data to match our expected format
        const formattedPlayers = (playersData.player || []).map(player => ({
          id: player.idPlayer,
          name: player.strPlayer,
          photo: player.strThumb || player.strCutout,
          position: player.strPosition,
          nationality: player.strNationality,
          birthDate: player.dateBorn,
          height: player.strHeight,
          weight: player.strWeight,
          description: player.strDescriptionEN,
          // Mock stats for demo purposes
          stats: {
            goals: Math.floor(Math.random() * 30) + 1,
            assists: Math.floor(Math.random() * 20) + 1,
            shots: Math.floor(Math.random() * 100) + 20,
            passes: Math.floor(Math.random() * 50) + 70,
            tackles: Math.floor(Math.random() * 40) + 5,
            saves: player.strPosition === "Goalkeeper" ? Math.floor(Math.random() * 150) + 50 : 0
          }
        }));

        setPlayers(formattedPlayers);
      } catch (err) {
        console.error("Error fetching players:", err);
        setError(err.message);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }

    getPlayers();
  }, [teamName]);

  return { players, loading, error };
}