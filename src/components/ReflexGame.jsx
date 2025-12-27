import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const ReflexGame = () => {
  const navigate = useNavigate();
  
  // --- SETTINGS ---
  const INITIAL_START_TIME = 10.00; 
  const GRID_SIZE = 25; 
  
  // --- STATES ---
  const [gameState, setGameState] = useState('waiting'); 
  const [grid, setGrid] = useState(Array(25).fill(null));
  const [score, setScore] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0); 
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_START_TIME);
  const [isShaking, setIsShaking] = useState(false);

  // --- STATS ---
  const [bestClick, setBestClick] = useState(() => localStorage.getItem('reflexBest') || 0);
  const [avgClick, setAvgClick] = useState(0);
  const [lastClick, setLastClick] = useState(0);
  const clickTimesRef = useRef([]); 

  // --- REFS FOR CORE LOGIC (Hardware Speed) ---
  const timerRef = useRef(null);
  const currentMaxTimeRef = useRef(INITIAL_START_TIME); 
  const internalSecondsRef = useRef(INITIAL_START_TIME); 
  const spawnTimeRef = useRef(0);
  const isProcessingRef = useRef(false);

  // --- GAME FUNCTIONS ---

  const startGame = () => {
    setScore(0);
    setAnimatedScore(0);
    setLives(3);
    setLevel(1);
    setAvgClick(0);
    setLastClick(0);
    clickTimesRef.current = [];
    isProcessingRef.current = false;
    
    currentMaxTimeRef.current = INITIAL_START_TIME;
    internalSecondsRef.current = INITIAL_START_TIME;
    setSecondsLeft(INITIAL_START_TIME);
    
    setGameState('playing');
    spawnNext();
    startEngine();
  };

  const startEngine = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      // Direct reference update for maximum speed
      internalSecondsRef.current = parseFloat((internalSecondsRef.current - 0.01).toFixed(2));
      
      // Update UI state
      setSecondsLeft(internalSecondsRef.current);

      // --- CRITICAL: Timer Check (Accurate 0.00 check) ---
      if (internalSecondsRef.current <= 0) {
        handleAction('TIMEOUT');
      }
    }, 10);
  };

  const handleAction = (type, index = null) => {
    // Prevent double triggers (isProcessing flag)
    if (isProcessingRef.current || (gameState !== 'playing' && type !== 'TIMEOUT')) return;
    isProcessingRef.current = true;

    if (type === 'TARGET' && grid[index] === 'target') {
      // --- SUCCESS ---
      const reactionTime = Date.now() - spawnTimeRef.current;
      setLastClick(reactionTime);
      clickTimesRef.current.push(reactionTime);
      
      const newAvg = Math.round(clickTimesRef.current.reduce((a, b) => a + b) / clickTimesRef.current.length);
      setAvgClick(newAvg);

      if (bestClick === 0 || reactionTime < bestClick) {
        setBestClick(reactionTime);
        localStorage.setItem('reflexBest', reactionTime);
      }

      setScore((s) => {
        const newScore = s + 1;
        if (newScore % 5 === 0) {
          setLevel(l => l + 1);
          currentMaxTimeRef.current = Math.max(0.7, currentMaxTimeRef.current * 0.88);
        }
        return newScore;
      });

      resetTimerAndSpawn();
    } else {
      // --- FAILURE (Timeout, Miss, or Trap) ---
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 300);

      setLives((prevLives) => {
        const updatedLives = prevLives - 1;
        if (updatedLives > 0) {
          resetTimerAndSpawn();
          return updatedLives;
        } else {
          finishGame();
          return 0;
        }
      });
    }
  };

  const resetTimerAndSpawn = () => {
    internalSecondsRef.current = currentMaxTimeRef.current;
    setSecondsLeft(currentMaxTimeRef.current);
    spawnNext();
    isProcessingRef.current = false;
  };

  const spawnNext = () => {
    const newGrid = Array(25).fill(null);
    const targetIdx = Math.floor(Math.random() * 25);
    newGrid[targetIdx] = 'target';
    
    if (level >= 3) {
      let trapIdx;
      do { trapIdx = Math.floor(Math.random() * 25); } while (trapIdx === targetIdx);
      newGrid[trapIdx] = 'trap';
    }
    setGrid(newGrid);
    spawnTimeRef.current = Date.now();
  };

  const finishGame = () => {
    setGameState('gameover');
    if (timerRef.current) clearInterval(timerRef.current);

    let start = 0;
    const end = score;
    const increment = Math.max(1, Math.ceil(end / 40));
    const counter = setInterval(() => {
      start += increment;
      if (start >= end) {
        setAnimatedScore(end);
        clearInterval(counter);
      } else {
        setAnimatedScore(start);
      }
    }, 25);
  };

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#0a0a0c',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'JetBrains Mono', monospace", color: '#f8fafc', userSelect: 'none',
      backgroundColor: isShaking ? '#450a0a' : '#0a0a0c',
      transition: 'background 0.2s'
    }}>
      
      {/* --- EXIT BUTTON (PC Top Right Corner) --- */}
      <button 
        onClick={() => navigate('/')}
        style={{
          position: 'absolute', top: '25px', right: '40px',
          padding: '10px 25px', background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid #ef4444', color: '#ef4444', borderRadius: '8px',
          fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', zIndex: 10
        }}
        onMouseEnter={(e) => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
        onMouseLeave={(e) => { e.target.style.background = 'rgba(239, 68, 68, 0.1)'; e.target.style.color = '#ef4444'; }}
      >
        EXIT SIMULATION
      </button>

      {/* PC TOP HUD */}
      <div style={{
        width: '850px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '20px', background: 'rgba(30, 41, 59, 0.8)', backdropFilter: 'blur(10px)',
        borderRadius: '15px', border: '1px solid #334155', marginBottom: '20px', gap: '15px'
      }}>
        <div style={{textAlign: 'center'}}><div style={{fontSize: '10px', color: '#64748b'}}>SCORE</div><div style={{fontSize: '1.4rem', fontWeight: '900'}}>{score}</div></div>
        <div style={{textAlign: 'center'}}><div style={{fontSize: '10px', color: '#64748b'}}>LAST</div><div style={{fontSize: '1.4rem', fontWeight: '900', color: '#38bdf8'}}>{lastClick}ms</div></div>
        <div style={{textAlign: 'center'}}><div style={{fontSize: '10px', color: '#64748b'}}>BEST</div><div style={{fontSize: '1.4rem', fontWeight: '900', color: '#4ade80'}}>{bestClick}ms</div></div>
        <div style={{textAlign: 'center'}}><div style={{fontSize: '10px', color: '#64748b'}}>AVG</div><div style={{fontSize: '1.4rem', fontWeight: '900', color: '#a78bfa'}}>{avgClick}ms</div></div>
        <div style={{textAlign: 'center'}}><div style={{fontSize: '10px', color: '#64748b'}}>LEVEL</div><div style={{fontSize: '1.4rem', fontWeight: '900', color: '#fbbf24'}}>{level}</div></div>
      </div>

      {/* --- NUMERIC TIMER --- */}
      <div style={{
        fontSize: '5rem', fontWeight: '900', marginBottom: '10px',
        color: secondsLeft < 3 ? '#ef4444' : '#f8fafc',
        textShadow: secondsLeft < 3 ? '0 0 30px #ef4444' : 'none',
        fontVariantNumeric: 'tabular-nums'
      }}>
        {secondsLeft.toFixed(2)}s
      </div>

      {/* PC GRID (500x500) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px',
        width: '500px', height: '500px', 
        padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '15px', border: '1px solid #334155'
      }}>
        {grid.map((type, i) => (
          <div
            key={i}
            onMouseDown={() => handleAction('TARGET', i)}
            style={{
              width: '88px', height: '88px',
              background: type === 'target' ? '#38bdf8' : type === 'trap' ? '#ef4444' : '#1e293b',
              borderRadius: '10px', cursor: 'pointer', transition: 'all 0.05s',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: type === 'target' ? '0 0 25px rgba(56,189,248,0.5)' : 'none',
              border: '1px solid #334155'
            }}
          >
            {type === 'target' && <div style={{width: '14px', height: '14px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px #fff'}} />}
            {type === 'trap' && <span style={{fontSize: '24px'}}>💀</span>}
          </div>
        ))}
      </div>

      {/* SYSTEM INTEGRITY (HP) */}
      <div style={{marginTop: '30px', textAlign: 'center'}}>
        <div style={{fontSize: '10px', color: '#64748b', marginBottom: '10px', letterSpacing: '2px'}}>SYSTEM INTEGRITY</div>
        <div style={{display: 'flex', gap: '12px'}}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{
              width: '70px', height: '5px', background: i < lives ? '#ef4444' : '#334155',
              boxShadow: i < lives ? '0 0 10px #ef4444' : 'none', transition: '0.4s'
            }} />
          ))}
        </div>
      </div>

      {/* OVERLAY: START / MISSION FAILED */}
      {gameState !== 'playing' && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10, 10, 12, 0.98)',
          backdropFilter: 'blur(15px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            textAlign: 'center', padding: '60px', background: '#1e293b', borderRadius: '24px', 
            border: '1px solid #475569', boxShadow: '0 30px 60px rgba(0,0,0,0.6)', maxWidth: '500px', width: '90%'
          }}>
            <h1 style={{fontSize: '2.8rem', fontWeight: '900', color: '#fff', margin: '0 0 15px 0'}}>
              {gameState === 'gameover' ? 'MISSION FAILED' : 'SYSTEM READY'}
            </h1>
            {gameState === 'gameover' && (
              <div style={{margin: '35px 0'}}>
                <div style={{fontSize: '7rem', fontWeight: '900', color: '#ef4444', lineHeight: 0.9}}>{animatedScore}</div>
                <p style={{fontSize: '13px', color: '#94a3b8', margin: '15px 0'}}>FINAL SCORE ANALYZED</p>
              </div>
            )}
            <button 
              onClick={startGame}
              style={{
                width: '100%', padding: '20px', fontSize: '1.2rem', fontWeight: '900',
                background: '#fff', color: '#0f172a', border: 'none', borderRadius: '15px', cursor: 'pointer'
              }}
            >
              {gameState === 'gameover' ? 'REBOOT SESSION' : 'INITIALIZE SIMULATION'}
            </button>
            <div style={{marginTop: '25px', color: '#64748b', cursor: 'pointer', fontSize: '13px'}} onClick={() => navigate('/')}>EXIT_TO_MENU</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReflexGame;