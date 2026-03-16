import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Analytics from "./pages/Analytics";
import Timeline from "./pages/Timeline";

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

      <Sidebar />

      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/players" element={<Players />} />

        <Route path="/teams" element={<Teams />} />

        <Route path="/comparison" element={<Analytics />} />

        <Route path="/timeline" element={<Timeline />} />

      </Routes>

    </Router>
  );
}

export default App;