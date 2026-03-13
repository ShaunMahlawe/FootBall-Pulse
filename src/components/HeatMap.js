function HeatMap() {
  return (
    <div className="player-card" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white'
    }}>
      <h2 style={{
        fontSize: '24px',
        fontWeight: '600',
        marginBottom: '16px',
        textAlign: 'center'
      }}>
        Player Movement Heatmap
      </h2>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <span style={{ fontSize: '32px' }}>📊</span>
      </div>
      <p style={{
        textAlign: 'center',
        opacity: '0.9',
        fontSize: '14px'
      }}>
        Interactive heatmap visualization coming soon
      </p>
    </div>
  );
}

export default HeatMap;