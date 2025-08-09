import React from 'react';
import { Routes, Route } from 'react-router-dom';
import App from './App';
import Admin from './pages/Admin';

function MainApp() {
  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

export default MainApp;