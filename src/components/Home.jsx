import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="container">
      <h1>🚀 SUPER GAME HUB</h1>
      <p style={{opacity: 0.8}}>Choose your challenge (100 Levels)</p>
      
      <div className="menu-grid">
        
        {/* Game 1 */}
        <div className="card" onClick={() => navigate('/speed')}>
          <span className="icon-large">⚡</span>
          <h2>Speed Clicker</h2>
          <p>Test your reflexes</p>
        </div>

        {/* Game 2 */}
        <div className="card" onClick={() => navigate('/math')}>
          <span className="icon-large">🧮</span>
          <h2>Math Master</h2>
          <p>Train your brain</p>
        </div>

        {/* Game 3 */}
        <div className="card" onClick={() => navigate('/riddle')}>
          <span className="icon-large">🧩</span>
          <h2>Mind Riddles</h2>
          <p>Think outside the box</p>
        </div>
      
        {/* Game 4 */}
        <div className="card" onClick={() => navigate('/word')}>
          <span className="icon-large">🔠</span>
          <h2>Word Scramble</h2>
          <p>Fix the Spelling</p>
        </div>

        {/* Game 5 */}
        <div className="card" onClick={() => navigate('/sequence')}>
          <span className="icon-large">🎹</span>
          <h2>Cyber Pattern</h2>
          <p>Follow the Lights</p>
        </div>

        {/* Game 6 */}
        <div className="card" onClick={() => navigate('/reaction')}>
          <span className="icon-large">⚡</span>
          <h2>Reflex God</h2>
          <p>Reaction Time Test</p>
        </div>
        
        {/* Game 7 */}
        <div className="card" onClick={() => navigate('/hack')}>
          <span className="icon-large">💻</span>
          <h2>Cyber Breach</h2>
          <p>Hack the System</p>
        </div>

        {/* Game 8 */}
        <div className="card" onClick={() => navigate('/cube')}>
          <span className="icon-large">🧊</span>
          <h2>Logic Cube 3D</h2>
          <p>Solve the Puzzle</p>
        </div>

        {/* Game 9 */}
        <div className="card" onClick={() => navigate('/chess')}>
          <span className="icon-large">♟️</span>
          <h2>Cyber Chess</h2>
          <p>3D Royal Battle</p>
        </div>

        {/* Game 10 */}
        <div className="card" onClick={() => navigate('/laser')}>
          <span className="icon-large">🔦</span>
          <h2>Neon Laser</h2>
          <p>Optic Puzzle</p>
        </div>

        {/* Game 11 */}
        <div className="card" onClick={() => navigate('/angle')}>
          <span className="icon-large">📐</span>
          <h2>Angle Master</h2>
          <p>Geometry Challenge</p>
        </div>

        {/* Game 12: Reflex Grid (Added properly to match others) */}
        <div className="card" onClick={() => navigate('/reflex')}>
          <span className="icon-large">⚡</span>
          <h2>Reflex Grid</h2>
          <p>Click the blink!</p>
        </div>

        <div className="card" onClick={() => navigate('/racer')}>
          <span className="icon-large">🏎️</span>
          <h2>Neon Racer</h2>
          <p>Infinite 3D Drift</p>
        </div>

      </div>
    </div>
  );
}

export default Home;