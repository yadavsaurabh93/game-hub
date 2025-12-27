import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function ReactionGame() {
  const navigate = useNavigate();
  
  // States
  const [gameState, setGameState] = useState('idle'); 
  const [lights, setLights] = useState(0); 
  const [score, setScore] = useState(null);
  const [rating, setRating] = useState(null);
  const [shake, setShake] = useState(false);

  // Refs
  const sequenceTimer = useRef(null);
  const randomTimer = useRef(null);
  const startTime = useRef(0);

  // Advanced Dark Mode Ratings
  const getRating = (ms) => {
    if (ms < 0) return { label: "JUMP START DETECTED", color: "#ff4757", rank: "DSQ", desc: "Protocol breached." };
    if (ms < 150) return { label: "CYBERNETIC REFLEX", color: "#a29bfe", rank: "S-RANK", desc: "Beyond human limits." };
    if (ms < 220) return { label: "ACE PILOT", color: "#2ed573", rank: "A-RANK", desc: "Elite reaction speed." };
    if (ms < 300) return { label: "STABLE OPERATOR", color: "#eccc68", rank: "B-RANK", desc: "Consistent performance." };
    if (ms < 450) return { label: "LATENCY DETECTED", color: "#ffa502", rank: "C-RANK", desc: "Focus calibration needed." };
    return { label: "SYSTEM TIMEOUT", color: "#ff4757", rank: "DNF", desc: "Response too slow." };
  };

  const startSequence = () => {
    setGameState('sequence');
    setScore(null);
    setRating(null);
    setLights(0);
    setShake(false);

    let currentLight = 0;
    sequenceTimer.current = setInterval(() => {
      currentLight++;
      setLights(currentLight);
      if (currentLight === 5) {
        clearInterval(sequenceTimer.current);
        setGameState('ready');
        triggerLightsOut();
      }
    }, 750);
  };

  const triggerLightsOut = () => {
    const delay = Math.floor(Math.random() * 2500) + 1000;
    randomTimer.current = setTimeout(() => {
      setLights(0);
      setGameState('go');
      startTime.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'idle' || gameState === 'result') {
      startSequence();
    } 
    else if (gameState === 'sequence' || gameState === 'ready') {
      clearInterval(sequenceTimer.current);
      clearTimeout(randomTimer.current);
      setGameState('result');
      setScore("JUMP START");
      setRating(getRating(-1));
      setLights(5);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } 
    else if (gameState === 'go') {
      const reaction = Date.now() - startTime.current;
      setGameState('result');
      setScore(`${reaction} ms`);
      setRating(getRating(reaction));
    }
  };

  return (
    <div 
      onMouseDown={handleClick}
      style={{
        height: '100vh', width: '100vw',
        background: '#0a0a0c', // Deep Dark Base
        color: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative',
        cursor: 'pointer', userSelect: 'none',
        animation: shake ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
      }}
    >
      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 10px rgba(255, 71, 87, 0.4); }
          50% { box-shadow: 0 0 30px rgba(255, 71, 87, 0.8); }
          100% { box-shadow: 0 0 10px rgba(255, 71, 87, 0.4); }
        }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* BACKGROUND DECORATION */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.05, pointerEvents: 'none', background: 'radial-gradient(circle at 50% 50%, #3498db, transparent)' }}></div>

      {/* HEADER SECTION */}
      <div style={{ position: 'absolute', top: '50px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0, fontWeight: '900', letterSpacing: '6px', color: '#fff', textShadow: '0 0 15px rgba(255,255,255,0.2)' }}>
          REFLEX CORE
        </h1>
        <div style={{ 
          marginTop: '10px', padding: '5px 25px', borderRadius: '4px', 
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#adb5bd', fontSize: '0.8rem', letterSpacing: '3px'
        }}>
          SYSTEM RANK: F1 PROTOCOL
        </div>
      </div>

      {/* DARK LIGHT BOARD */}
      <div style={{
        background: '#161b22',
        padding: '35px 55px',
        borderRadius: '20px',
        display: 'flex',
        gap: '20px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.6), inset 0 2px 10px rgba(255,255,255,0.05)',
        border: '1px solid #30363d',
        marginBottom: '60px',
        position: 'relative'
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            width: '60px', height: '60px',
            borderRadius: '50%',
            background: lights >= i ? '#ff4757' : '#0d1117',
            boxShadow: lights >= i 
              ? '0 0 35px #ff4757, 0 0 15px #ff4757' 
              : 'inset 0 4px 8px rgba(0,0,0,0.5)',
            border: '3px solid #000',
            transition: 'background 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: (gameState === 'ready' && lights >= i) ? 'glowPulse 0.4s infinite' : 'none'
          }}></div>
        ))}
      </div>

      {/* INTERACTIVE HUD */}
      <div style={{textAlign: 'center', height: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
        {gameState === 'idle' && (
          <div style={{animation: 'fadeIn 0.5s ease'}}>
            <h2 style={{fontSize: '0.9rem', color: '#8b949e', letterSpacing: '4px'}}>WAITING FOR COMMAND</h2>
            <h1 style={{fontSize: '3rem', color: '#fff', margin: '10px 0', fontWeight: '900'}}>TAP TO LAUNCH</h1>
          </div>
        )}

        {gameState === 'sequence' && (
          <h1 style={{color: '#ff4757', fontSize: '3rem', fontWeight: '900', letterSpacing: '5px'}}>
            SEQUENCE START
          </h1>
        )}
        
        {gameState === 'ready' && (
          <h1 style={{color: '#ff4757', fontSize: '4rem', fontWeight: '900', letterSpacing: '2px'}}>
            STAY...
          </h1>
        )}

        {gameState === 'go' && (
          <h1 style={{fontSize: '7rem', color: '#2ed573', margin: 0, fontWeight: '900', textShadow: '0 0 40px rgba(46, 213, 115, 0.4)'}}>
            GO!
          </h1>
        )}

        {/* DARK RESULT CARD */}
        {gameState === 'result' && rating && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '30px 60px',
            borderRadius: '15px',
            border: `1px solid ${rating.color}44`,
            backdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.4s ease-out'
          }}>
            <div style={{color: rating.color, fontSize: '0.7rem', fontWeight:'900', letterSpacing: '3px'}}>{rating.rank}</div>
            <h1 style={{fontSize: '5rem', color: '#fff', margin: '5px 0', fontWeight: '900', lineHeight: 1}}>
              {score}
            </h1>
            <p style={{color: rating.color, margin: 0, fontWeight: '700', fontSize: '1.2rem'}}>{rating.label}</p>
            <p style={{color: '#8b949e', fontSize: '0.8rem', marginTop: '8px', letterSpacing: '1px'}}>{rating.desc}</p>
          </div>
        )}
      </div>

      {/* FOOTER ACTIONS */}
      <div style={{ position: 'absolute', bottom: '60px', textAlign: 'center' }}>
        {gameState === 'result' && (
          <p style={{color: '#8b949e', fontSize: '0.8rem', marginBottom: '20px', letterSpacing: '2px'}}>TAP ANYWHERE TO RESET</p>
        )}
        <button 
          onClick={(e) => { e.stopPropagation(); navigate('/'); }}
          style={{
            background: 'transparent', border: '1px solid #30363d', color: '#8b949e',
            padding: '12px 40px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: '900', letterSpacing: '2px', transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {e.target.style.borderColor = '#fff'; e.target.style.color = '#fff'}}
          onMouseOut={(e) => {e.target.style.borderColor = '#30363d'; e.target.style.color = '#8b949e'}}
        >
          ABORT MISSION
        </button>
      </div>
    </div>
  );
}

export default ReactionGame;