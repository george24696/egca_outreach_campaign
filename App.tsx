import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import CompanyEditor from './components/CompanyEditor';
import CompanyPreview from './components/CompanyPreview';
import ComparisonDashboard from './components/ComparisonDashboard';
import Footer from './components/Footer';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={
              <>
                  <Navigation />
                  <Dashboard />
              </>
            } />
            <Route path="/compare" element={
              <>
                  <Navigation />
                  <ComparisonDashboard />
              </>
            } />
            <Route path="/company/:id" element={
               <>
                  <Navigation />
                  <CompanyEditor />
               </>
            } />
            <Route path="/preview/:id" element={<CompanyPreview />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;