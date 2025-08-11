// App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { Capture } from './routes/Capture';
import { Admin } from './routes/Admin';
import { AICostCalculator } from './routes/AICostCalculator';
import { ImprovementsSummary } from './components/ui/ImprovementsSummary';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-dark-bg">
        <Navigation />
        <Routes>
          <Route path="/capture" element={<Capture />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/ai-cost-calculator" element={
            <div>
              <ImprovementsSummary />
              <AICostCalculator />
            </div>
          } />
          <Route path="/" element={<Navigate to="/ai-cost-calculator" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;