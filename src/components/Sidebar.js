import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.body.classList.contains("dark") || false;
  });
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <nav className={`sidebar ${isCollapsed ? "close" : ""}`}>
      <header>
        <div className="image-text">
          <span className="image">
            <img src="/assets/img/logo.png" alt="logo" />
          </span>

          <div className="text header-text">
            <span className="name">Football</span>
            <span className="profession">Pulse</span>
          </div>
        </div>

        <div className="toggle" onClick={toggleSidebar}>
          <i className={`bx ${isCollapsed ? "bx-chevron-right" : "bx-chevron-left"}`} />
        </div>
      </header>

      <div className="menu-bar">
        <div className="menu">
          <ul className="menu-links">
            <li className="search-box">
              <i className="bx bx-search icon"></i>
              <input type="search" placeholder="Search..." />
            </li>
            <li className="nav-link">
              <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                <i className="bx bx-dashboard icon"></i>
                <span className="text nav-text">Dashboard</span>
              </Link>
            </li>
            <li className="nav-link">
              <Link to="/players" className={location.pathname === "/players" ? "active" : ""}>
                <i className="bx bx-user icon"></i>
                <span className="text nav-text">Players</span>
              </Link>
            </li>
            <li className="nav-link">
              <Link to="/teams" className={location.pathname === "/teams" ? "active" : ""}>
                <i className="bx bx-group icon"></i>
                <span className="text nav-text">Teams</span>
              </Link>
            </li>
            <li className="nav-link">
              <Link to="/comparison" className={location.pathname === "/comparison" ? "active" : ""}>
                <i className="bx bx-bar-chart-big icon"></i>
                <span className="text nav-text">Comparison</span>
              </Link>
            </li>
            <li className="nav-link">
              <Link to="/timeline" className={location.pathname === "/timeline" ? "active" : ""}>
                <i className="bx bx-time icon"></i>
                <span className="text nav-text">Timeline</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="bottom-content">
          <li className="nav-link">
            <button onClick={() => alert("Logout functionality not implemented yet")} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', height: '100%' }}>
              <i className="bx bx-log-out icon"></i>
              <span className="text nav-text">Logout</span>
            </button>
          </li>

          <li className="mode" onClick={toggleTheme}>
            <div className="sun-moon">
              <i className="bx bx-moon icon moon"></i>
              <i className="bx bx-sun icon sun"></i>
            </div>
            <span className="mode-text text">Dark Mode</span>
            <div className="toggle-switch">
              <span className="switch"></span>
            </div>
          </li>
        </div>
      </div>
    </nav>
  );
}

export default Sidebar;