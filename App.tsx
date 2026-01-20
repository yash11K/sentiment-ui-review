import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import AIAnalysisPage from './pages/AIAnalysisPage';
import ReviewsPage from './pages/ReviewsPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="ai-analysis" element={<AIAnalysisPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="staff" element={<div className="p-10 text-center text-text-tertiary">Staff Performance Module (Coming Soon)</div>} />
          <Route path="settings" element={<div className="p-10 text-center text-text-tertiary">Settings Module (Coming Soon)</div>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;