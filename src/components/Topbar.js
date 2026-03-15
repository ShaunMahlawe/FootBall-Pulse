import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

function Topbar() {
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState("");

  const getPageMeta = () => {
    switch (location.pathname) {
      case "/":
        return { title: "Dashboard", icon: "bx-home" };
      case "/players":
        return { title: "Players", icon: "bx-user" };
      case "/teams":
        return { title: "Teams", icon: "bx-group" };
      case "/comparison":
        return { title: "Player Comparison", icon: "bx-bar-chart-big" };
      case "/timeline":
        return { title: "Performance Timeline", icon: "bx-time-five" };
      default:
        return { title: "Dashboard", icon: "bx-home" };
    }
  };

  const pageMeta = getPageMeta();

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
      <div className="topbar-title">
        <span className="topbar-title-icon">
          <i className={`bx ${pageMeta.icon}`}></i>
        </span>
        <div className="text">{pageMeta.title}</div>
      </div>

      <div className="flex items-center gap-4">
        <i className="bx bx-bell icon topbar-action-icon"></i>
        <i className="bx bx-cog icon topbar-action-icon"></i>
        <i className="bx bx-log-out icon topbar-action-icon" title="Logout"></i>

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