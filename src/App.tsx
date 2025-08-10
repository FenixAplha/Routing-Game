// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Capture } from './routes/Capture';
import { Admin } from './routes/Admin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg">
        <Routes>
          <Route path="/capture" element={<Capture />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/" element={<Navigate to="/capture" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
