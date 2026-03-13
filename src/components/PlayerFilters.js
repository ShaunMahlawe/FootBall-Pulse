function PlayerFilters({ onFilter }) {
  return (
    <div className="filters">
      <select onChange={e => onFilter("league", e.target.value)}>
        <option>Premier League</option>
        <option>La Liga</option>
        <option>Serie A</option>
      </select>

      <select onChange={e => onFilter("team", e.target.value)}>
        <option>Barcelona</option>
        <option>Real Madrid</option>
        <option>Arsenal</option>
      </select>

      <select onChange={e => onFilter("position", e.target.value)}>
        <option>Forward</option>
        <option>Midfielder</option>
        <option>Defender</option>
      </select>
    </div>
  );
}

export default PlayerFilters;