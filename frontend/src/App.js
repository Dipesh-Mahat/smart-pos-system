import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Component to redirect to the HTML pages
function HTMLPageRedirect({ page }) {
  useEffect(() => {
    window.location.href = `/pages/${page}.html`;
  }, [page]);

  return <div className="loading">Loading...</div>;
}

// Main App component
function App() {
  return (
    <Router>
      <Routes>
        {/* Redirect root to index.html */}
        <Route path="/" element={<HTMLPageRedirect page="index" />} />
        
        {/* Redirect specific routes to their HTML counterparts */}
        <Route path="/login" element={<HTMLPageRedirect page="login" />} />
        <Route path="/dashboard" element={<HTMLPageRedirect page="dashboard" />} />
        <Route path="/inventory" element={<HTMLPageRedirect page="inventory" />} />
        <Route path="/items" element={<HTMLPageRedirect page="itemManagement" />} />
        <Route path="/transactions" element={<HTMLPageRedirect page="transactions" />} />
        <Route path="/reports" element={<HTMLPageRedirect page="reports" />} />
        <Route path="/suppliers" element={<HTMLPageRedirect page="suppliers" />} />
        <Route path="/settings" element={<HTMLPageRedirect page="settings" />} />
        
        {/* Fallback for any other route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
