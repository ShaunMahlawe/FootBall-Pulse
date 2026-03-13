function PlayerCard({ player }) {
  return (
    <div className="player-card" style={{ backgroundImage: `url(${player.image})` }}>
      <div className="player-info">
        <span className="player-name">{player.name}</span>
        <span className="player-position">{player.position}</span>
        <div className="player-stats-hover">
          <span>Goals: {player.goals}</span>
          <span>Assists: {player.assists}</span>
          <span>Rating: {player.rating}</span>
        </div>
      </div>
    </div>
  );
}

export default PlayerCard;