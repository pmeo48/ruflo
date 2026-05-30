import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import DailyPicks from './pages/DailyPicks.jsx';
import GameAnalysis from './pages/GameAnalysis.jsx';
import Parlays from './pages/Parlays.jsx';
import History from './pages/History.jsx';
import Analytics from './pages/Analytics.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/picks" element={<DailyPicks />} />
        <Route path="/analysis" element={<GameAnalysis />} />
        <Route path="/parlays" element={<Parlays />} />
        <Route path="/history" element={<History />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
