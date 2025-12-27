import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css'; // Global Styles Import

// Components Import kar rahe hain
import Home from './components/Home';
import SpeedGame from './components/SpeedGame';
import MathGame from './components/MathGame';
import RiddleGame from './components/RiddleGame';
import WordGame from './components/WordGame';
import SequenceGame from './components/SequenceGame';
import ReactionGame from './components/ReactionGame';
import HackGame from './components/HackGame'; 
import CubeGame from './components/CubeGame';
import ChessGame from './components/ChessGame';
import LaserGame from './components/LaserGame';
import AngleGame from './components/AngleGame'; 
import ReflexGame from './components/ReflexGame';
import CyberRacer from './components/CyberRacer';// Import toh sahi tha ✅

function App() {
  return (
    <Router>
      <div className="main-wrapper">
        <Routes>
          {/* Main Menu */}
          <Route path="/" element={<Home />} />
          
          {/* Game Routes */}
          <Route path="/speed" element={<SpeedGame />} />
          <Route path="/math" element={<MathGame />} />
          <Route path="/riddle" element={<RiddleGame />} />
          <Route path="/word" element={<WordGame />} /> 
          <Route path="/sequence" element={<SequenceGame />} />
          <Route path="/reaction" element={<ReactionGame />} />
          <Route path="/hack" element={<HackGame />} />
          <Route path="/cube" element={<CubeGame />} />
          <Route path="/chess" element={<ChessGame />} />
          <Route path="/laser" element={<LaserGame />} />
          <Route path="/angle" element={<AngleGame />} />
          <Route path="/reflex" element={<ReflexGame />} />
          <Route path="/racer" element={<CyberRacer />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;