import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
  { to: "/", icon: "bx-home", label: "Dashboard" },
  { to: "/players", icon: "bx-user", label: "Players" },
  { to: "/teams", icon: "bx-group", label: "Teams" },
  { to: "/comparison", icon: "bx-git-compare", label: "Comparison" },
  { to: "/timeline", icon: "bx-time", label: "Timeline" },
];

function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.body.classList.contains("dark") || false;
  });
  const [search, setSearch] = useState("");
  const searchInputRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    const handleOpenSearch = () => {
      setIsCollapsed(false);
      requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    };

    window.addEventListener("footballpulse:openSidebarSearch", handleOpenSearch);

    return () => {
      window.removeEventListener("footballpulse:openSidebarSearch", handleOpenSearch);
    };
  }, []);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const openSearch = () => {
    setIsCollapsed(false);
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  };

  const filteredLinks = NAV_LINKS.filter((link) =>
    link.label.toLowerCase().includes(search.toLowerCase())
  );

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
            <li
              className="search-box"
              onClick={openSearch}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openSearch();
                }
              }}
              role="button"
              tabIndex={0}
            >
              <i className="bx bx-search icon" onClick={openSearch}></i>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </li>
            {filteredLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className={location.pathname === link.to ? "active" : ""}>
                  <i className={`bx ${link.icon} icon`}></i>
                  <span className="text nav-text">{link.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bottom-content">
          <li>
            <button onClick={() => alert("Logout functionality not implemented yet")}>
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