import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Topbar() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState("");

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Dashboard";
      case "/players":
        return "Players";
      case "/teams":
        return "Teams";
      case "/comparison":
        return "Player Comparison";
      case "/timeline":
        return "Performance Timeline";
      default:
        return "Dashboard";
    }
  };

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

  return (
    <div className="topbar">
      <div className="text">{getPageTitle()}</div>

      <div className="flex items-center gap-4">
        <i className="bx bx-bell icon" style={{ fontSize: "24px", color: "var(--text-color)", cursor: "pointer" }}></i>
        <i className="bx bx-cog icon" style={{ fontSize: "24px", color: "var(--text-color)", cursor: "pointer" }}></i>
        <i className="bx bx-log-out icon" style={{ fontSize: "24px", color: "var(--text-color)", cursor: "pointer" }} title="Logout"></i>

        <div className="user">
          <img src="/assets/img/User.jpg" alt="user" />
        </div>

        <div className="user-info">
          <span className="user-name">Refilwe Mahlawe</span>
          <span className="profile-settings">
            Profile Settings <i className="bx bx-caret-down"></i>
          </span>
        </div>

        <div className="date-time">
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
}

export default Topbar;