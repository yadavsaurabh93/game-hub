import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function LaserGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [grid, setGrid] = useState([]); 
  const [solutionGrid, setSolutionGrid] = useState([]); 
  const [gridSize, setGridSize] = useState(6);
  const [laserPath, setLaserPath] = useState([]); 
  const [status, setStatus] = useState('playing'); 
  const [shake, setShake] = useState(false);
  const [isAutoSolving, setIsAutoSolving] = useState(false);

  const audioCtxRef = useRef(null);
  
  // Responsive Cell Size
  const CELL_SIZE = Math.min(65, Math.floor(window.innerHeight * 0.6 / gridSize)); 

  // --- SOUND ENGINE ---
  const playSound = (type) => {
    try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'click') {
          osc.type = 'triangle'; osc.frequency.setValueAtTime(600, ctx.currentTime); 
          gain.gain.setValueAtTime(0.05, ctx.currentTime);
          osc.start(); osc.stop(ctx.currentTime + 0.05);
        } else if (type === 'win') {
          osc.type = 'sine'; 
          osc.frequency.setValueAtTime(523.25, ctx.currentTime); 
          osc.frequency.exponentialRampToValueAtTime(1046.50, ctx.currentTime + 0.5); 
          gain.gain.setValueAtTime(0.1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          osc.start(); osc.stop(ctx.currentTime + 0.5);
        }
    } catch(e) {}
  };

  // --- GUARANTEED SOLVABLE GENERATOR ---
  const generateSolvableLevel = useCallback((size) => {
    let newGrid = Array(size).fill(null).map(() => Array(size).fill(null).map(() => ({ type: 'empty', rot: 0 })));
    let pathCells = new Set(); 
    
    let r = Math.floor(Math.random() * (size - 2)) + 1;
    let c = 0;
    let dir = 'right';
    newGrid[r][c] = { type: 'source' };
    pathCells.add(`${r},${c}`); 
    
    let currR = r, currC = c, steps = 0, active = true;

    while(active && steps < 40) {
        let nextR = currR, nextC = currC;
        if (dir === 'right') nextC++;
        else if (dir === 'left') nextC--;
        else if (dir === 'up') nextR--;
        else if (dir === 'down') nextR++;

        if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size) {
            newGrid[currR][currC] = { type: 'target' };
            active = false;
        } else {
            currR = nextR; currC = nextC;
            pathCells.add(`${currR},${currC}`);
            
            if (Math.random() < 0.35 && steps > 1 && steps < 35) {
                let rot = 0, oldDir = dir;
                if (dir === 'right' || dir === 'left') {
                    dir = Math.random() > 0.5 ? 'up' : 'down';
                    if (currR === 0) dir = 'down';
                    if (currR === size - 1) dir = 'up';
                    rot = (oldDir === 'right' && dir === 'up') || (oldDir === 'left' && dir === 'down') ? 0 : 90;
                } else {
                    dir = Math.random() > 0.5 ? 'right' : 'left';
                    if (currC === 0) dir = 'right';
                    if (currC === size - 1) dir = 'left';
                    rot = (oldDir === 'down' && dir === 'left') || (oldDir === 'up' && dir === 'right') ? 0 : 90;
                }
                newGrid[currR][currC] = { type: 'mirror', rot: rot };
            }
        }
        steps++;
        if (steps === 39) newGrid[currR][currC] = { type: 'target' };
    }

    for(let i=0; i<size; i++) {
        for(let j=0; j<size; j++) {
            if (newGrid[i][j].type === 'empty' && !pathCells.has(`${i},${j}`) && Math.random() < 0.15) {
                newGrid[i][j] = { type: 'wall' };
            }
        }
    }

    setSolutionGrid(JSON.parse(JSON.stringify(newGrid)));
    const playerGrid = JSON.parse(JSON.stringify(newGrid));
    playerGrid.forEach(row => row.forEach(cell => {
        if (cell.type === 'mirror') cell.rot = Math.random() > 0.5 ? 0 : 90;
    }));
    setGrid(playerGrid);
    setStatus('playing');
  }, []);

  const fetchLevel = useCallback(() => {
    setStatus('loading');
    setIsAutoSolving(false);
    const size = Math.min(6 + Math.floor(level / 2), 12);
    setGridSize(size);
    generateSolvableLevel(size);
  }, [level, generateSolvableLevel]);

  useEffect(() => { fetchLevel(); }, [fetchLevel]);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'r' || e.key === 'R') fetchLevel(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fetchLevel]);

  const autoSolve = () => {
    setIsAutoSolving(true);
    setGrid(JSON.parse(JSON.stringify(solutionGrid)));
    setTimeout(() => setIsAutoSolving(false), 500);
  };

  // --- LASER ENGINE ---
  useEffect(() => {
    if (status !== 'playing' || grid.length === 0) return;
    let r, c, dir = 'right';
    grid.forEach((row, i) => row.forEach((cell, j) => {
        if (cell.type === 'source') { r = i; c = j; }
    }));
    
    let path = [{ x: c * CELL_SIZE + CELL_SIZE/2, y: r * CELL_SIZE + CELL_SIZE/2 }];
    let active = true, steps = 0, hitTarget = false;

    while(active && steps < 150) { 
        steps++;
        let nextR = r, nextC = c;
        if (dir === 'right') nextC++; else if (dir === 'left') nextC--; 
        else if (dir === 'down') nextR++; else if (dir === 'up') nextR--;

        if (nextR < 0 || nextR >= gridSize || nextC < 0 || nextC >= gridSize) {
            path.push({ x: nextC * CELL_SIZE + CELL_SIZE/2, y: nextR * CELL_SIZE + CELL_SIZE/2 });
            active = false; break;
        }

        const cell = grid[nextR][nextC];
        path.push({ x: nextC * CELL_SIZE + CELL_SIZE/2, y: nextR * CELL_SIZE + CELL_SIZE/2 });

        if (cell.type === 'target') { hitTarget = true; active = false; } 
        else if (cell.type === 'wall' || cell.type === 'source') { active = false; }
        else if (cell.type === 'mirror') {
            if (cell.rot === 0) {
              if (dir === 'right') dir = 'up'; else if (dir === 'left') dir = 'down'; 
              else if (dir === 'down') dir = 'left'; else if (dir === 'up') dir = 'right'; 
            } else {
              if (dir === 'right') dir = 'down'; else if (dir === 'left') dir = 'up'; 
              else if (dir === 'down') dir = 'right'; else if (dir === 'up') dir = 'left'; 
            }
        }
        r = nextR; c = nextC;
    }
    setLaserPath(path);

    if (hitTarget && status === 'playing') {
        setStatus('won'); playSound('win'); setShake(true);
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setLevel(l => l + 1), 2000); 
    }
  }, [grid, status, gridSize, CELL_SIZE]); 

  return (
    <div style={{ 
      height: '100vh', width: '100vw', 
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1b 100%)', 
      color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative', fontFamily: '"Segoe UI", Roboto, sans-serif',
      animation: shake ? 'shake 0.4s ease-in-out' : 'none' 
    }}>
      
      {/* HEADER SECTION */}
      <div style={{ position: 'absolute', top: '40px', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{ 
          fontSize: '2.5rem', margin: 0, fontWeight: '300', letterSpacing: '8px', 
          background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}>
          Prism Logic
        </h1>
        <div style={{ 
          marginTop: '10px', padding: '5px 20px', borderRadius: '20px', 
          background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', color: '#4facfe', fontSize: '0.9rem'
        }}>
          LEVEL {level} • {gridSize}x{gridSize}
        </div>
      </div>

      {/* GAME BOARD */}
      <div style={{ 
        position: 'relative', padding: '15px', borderRadius: '20px',
        background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${gridSize}, ${CELL_SIZE}px)`, gap: '4px' }}>
          {grid.map((row, r) => row.map((cell, c) => (
            <div key={`${r}-${c}`} 
                 onClick={() => { if (cell.type === 'mirror' && status === 'playing') { playSound('click'); const newG = [...grid]; newG[r][c].rot = newG[r][c].rot === 0 ? 90 : 0; setGrid([...newG]); } }}
                 style={{ 
                   width: CELL_SIZE, height: CELL_SIZE, borderRadius: '8px',
                   background: cell.type === 'wall' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)', 
                   display: 'flex', alignItems: 'center', justifyContent: 'center', 
                   cursor: cell.type === 'mirror' ? 'pointer' : 'default', transition: 'all 0.3s' 
                 }}>
              
              {cell.type === 'source' && (
                <div style={{ 
                  width: '60%', height: '60%', background: '#4facfe', borderRadius: '50%',
                  boxShadow: '0 0 20px #4facfe', position: 'relative'
                }}>
                  <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '20px', height: '10px', background: '#4facfe' }}></div>
                </div>
              )}

              {cell.type === 'target' && (
                <div style={{ 
                  width: '70%', height: '70%', border: '2px dashed #f093fb', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'spin 4s linear infinite'
                }}>
                  <div style={{ width: '40%', height: '40%', background: '#f093fb', borderRadius: '50%', boxShadow: '0 0 15px #f093fb' }}></div>
                </div>
              )}

              {cell.type === 'wall' && (
                <div style={{ width: '40%', height: '40%', border: '1px solid rgba(255,255,255,0.2)', transform: 'rotate(45deg)' }}></div>
              )}

              {cell.type === 'mirror' && (
                <div style={{ 
                  width: '80%', height: '6px', background: '#fff', borderRadius: '10px',
                  boxShadow: '0 0 15px rgba(255,255,255,0.8)',
                  transform: `rotate(${cell.rot === 0 ? -45 : 45}deg)`, transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                }}></div>
              )}
            </div>
          )))}
        </div>

        {/* LASER LAYER */}
        <svg style={{ position: 'absolute', top: 15, left: 15, width: gridSize*CELL_SIZE + (gridSize-1)*4, height: gridSize*CELL_SIZE + (gridSize-1)*4, pointerEvents: 'none', overflow: 'visible' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <polyline 
            points={laserPath.map(p => `${p.x + (p.x/CELL_SIZE)*4 - 2},${p.y + (p.y/CELL_SIZE)*4 - 2}`).join(' ')} 
            fill="none" stroke="#4facfe" strokeWidth="3" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* CONTROLS */}
      <div style={{ marginTop: '50px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button onClick={() => navigate('/')} style={{ 
          background: 'none', border: '1px solid #ff4d4d', color: '#ff4d4d',
          padding: '12px 25px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>Exit Game</button>

        <button onClick={fetchLevel} style={{ 
          background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
          padding: '12px 25px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.8rem', letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>Restart (R)</button>
        
        <button onClick={autoSolve} style={{ 
          background: 'linear-gradient(90deg, #f093fb 0%, #f5576c 100%)', border: 'none', color: '#fff',
          padding: '12px 25px', borderRadius: '30px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '2px',
          boxShadow: '0 10px 20px rgba(245, 87, 108, 0.3)', textTransform: 'uppercase'
        }}>Auto Solve</button>
      </div>

      {/* WIN OVERLAY */}
      {status === 'won' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.8)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(12px)', animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ color: '#4facfe', fontSize: '1rem', letterSpacing: '5px', marginBottom: '10px' }}>PUZZLE</div>
          <h1 style={{ fontSize: '4rem', margin: 0, fontWeight: '200', letterSpacing: '10px' }}>SOLVED</h1>
          <div style={{ width: '100px', height: '2px', background: '#f093fb', marginTop: '20px' }}></div>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shake { 
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        button { transition: all 0.2s ease; }
        button:hover { transform: translateY(-3px); filter: brightness(1.2); }
        button:active { transform: translateY(0); }
      `}</style>
    </div>
  );
}

export default LaserGame;