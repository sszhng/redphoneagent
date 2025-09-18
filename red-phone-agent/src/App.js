import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SolutionBuilder from './components/SolutionBuilder';
import ChatInterface from './components/ChatInterface';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/solution-builder" replace />} />
          <Route path="/solution-builder" element={
            <>
              {/* Main business application surface */}
              <SolutionBuilder />
              
              {/* Chat overlay positioned on top */}
              <ChatInterface />
            </>
          } />
          <Route path="/chat" element={<ChatInterface />} />
          <Route path="*" element={<Navigate to="/solution-builder" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
