import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { PatientIntakeView } from './views/PatientIntakeView';
import { PatientResultView } from './views/PatientResultView';
import { NurseLoginView } from './views/NurseLoginView';
import { NurseDashboardView } from './views/NurseDashboardView';
import { NurseCaseDetailView } from './views/NurseCaseDetailView';

export const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-clinical-bg text-clinical-text">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<PatientIntakeView />} />
            <Route path="/result/:sessionId" element={<PatientResultView />} />
            <Route path="/login" element={<NurseLoginView />} />
            <Route path="/nurse" element={<NurseDashboardView />} />
            <Route path="/nurse/case/:id" element={<NurseCaseDetailView />} />
          </Routes>
        </main>

        <footer className="bg-white border-t border-clinical-border py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-clinical-muted">
            <p>CLINTRACE — Patient Intake & Clinical Routing System &copy; 2026. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

export default App;
