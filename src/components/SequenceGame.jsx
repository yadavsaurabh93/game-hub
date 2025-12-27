import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function SequenceGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [sequence, setSequence] = useState([]); 
  const [userStep, setUserStep] = useState(0);   
  const [showing, setShowing] = useState(false); 
  const [flash, setFlash] = useState(null);      
  const [statusMsg, setStatusMsg] = useState("SYSTEM_READY");
  const [isError, setIsError] = useState(false);

  // Advanced Sequence Playback Logic
  const playSequence = useCallback((seq) => {
    if (!seq || seq.length === 0) return;
    setShowing(true);
    setStatusMsg("SCANNING DATA...");
    let i = 0;
    
    const interval = setInterval(() => {
      setFlash(seq[i]);
      
      setTimeout(() => {
        setFlash(null);
      }, 400); 

      i++;
      if (i >= seq.length) {
        clearInterval(interval);
        setTimeout(() => {
          setShowing(false);
          setStatusMsg("REPLICATE SEQUENCE");
        }, 600);
      }
    }, 800); 
  }, []);

  const fetchGame = useCallback(async (lvl) => {
    try {
      setFlash(null);
      setIsError(false);
      setStatusMsg("CONNECTING TO CORE...");
      
      const res = await fetch(`http://localhost:5000/api/sequence/${lvl}`);
      if (!res.ok) throw new Error("Network issues");
      
      const data = await res.json();
      
      // Error Fix: Agar backend sirf 0-3 bhej raha hai, toh hum use 9 boxes ke liye adapt karenge
      const validSeq = data.sequence.map(num => num % 9); 
      
      setSequence(validSeq); 
      setUserStep(0);
      playSequence(validSeq);
    } catch (e) { 
      console.error("Backend Error: ", e);
      // Robust Fallback: Har level par pattern lamba hota jayega
      const fallbackSeq = Array.from({length: 2 + lvl}, () => Math.floor(Math.random() * 9));
      setSequence(fallbackSeq);
      setUserStep(0);
      playSequence(fallbackSeq);
    }
  }, [playSequence]);

  useEffect(() => { 
    fetchGame(level); 
  }, [level, fetchGame]);

  const handleClick = (index) => {
    if (showing || isError) return; 
    
    setFlash(index);
    setTimeout(() => setFlash(null), 150);

    if (index === sequence[userStep]) {
      if (userStep + 1 === sequence.length) {
        setStatusMsg("DATA_VALIDATED");
        setTimeout(() => setLevel(l => l + 1), 1000);
      } else {
        setUserStep(s => s + 1);
      }
    } else {
      setIsError(true);
      setStatusMsg("ACCESS_DENIED");
      // Vibration/Shake Effect
      setTimeout(() => {
        fetchGame(level);
      }, 1200);
    }
  };

  // Professional Lab Palette
  const colors = [
    '#339AF0', '#22B8CF', '#20C997', 
    '#51CF66', '#94D82D', '#FCC419', 
    '#FF922B', '#FF6B6B', '#845EF7'
  ];

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#f8fafc',
      color: '#1e293b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", sans-serif', overflow: 'hidden', position: 'relative'
    }}>

      {/* TOP LAB INTERFACE */}
      <div style={{ position: 'absolute', top: '20px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: '800', letterSpacing: '2px', color: '#0f172a' }}>
          MEMORY_SYNC <span style={{color: '#3b82f6'}}>v3.0</span>
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '15px' }}>
          <div style={tagStyle}>UNIT: {level}</div>
          <div style={{...tagStyle, background: isError ? '#fee2e2' : '#eff6ff', color: isError ? '#dc2626' : '#2563eb'}}>
            {statusMsg}
          </div>
        </div>
      </div>

      {/* GRID MODULE */}
      <div id="game-container" style={{
        padding: '30px', borderRadius: '48px',
        background: '#ffffff',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e2e8f0',
        maxWidth: '520px', width: '90%',
        animation: isError ? 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both' : 'none'
      }}>
        
        <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '12px', 
        }}>
          {Array.from({length: 9}).map((_, i) => (
            <div 
              key={i} 
              onClick={() => handleClick(i)} 
              style={{
                width: '100%', 
                aspectRatio: '1/1',
                backgroundColor: flash === i ? colors[i] : '#f1f5f9',
                borderRadius: '24px', 
                cursor: showing ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                transform: flash === i ? 'scale(0.95)' : 'scale(1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: flash === i ? `2px solid #fff` : '2px solid transparent',
                boxShadow: flash === i ? `0 0 25px ${colors[i]}88` : 'none',
                opacity: showing && flash !== i ? 0.5 : 1
              }}
            >
              <span style={{ fontSize: '0.8rem', color: flash === i ? '#fff' : '#94a3b8', fontWeight: 'bold' }}>
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* EXIT HUB */}
      <div style={{ position: 'absolute', bottom: '30px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#fff', border: '1px solid #e2e8f0', color: '#64748b',
            padding: '12px 30px', borderRadius: '50px', cursor: 'pointer', fontSize: '0.8rem',
            fontWeight: '600', transition: 'all 0.3s'
          }}
          onMouseOver={(e) => {e.target.style.borderColor = '#3b82f6'; e.target.style.color = '#3b82f6'}}
          onMouseOut={(e) => {e.target.style.borderColor = '#e2e8f0'; e.target.style.color = '#64748b'}}
        >
          TERMINATE EXPERIMENT
        </button>
      </div>

      <style>{`
        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }
        body { background: #f8fafc; margin: 0; }
      `}</style>
    </div>
  );
}

const tagStyle = {
  background: '#fff', 
  padding: '6px 16px', 
  borderRadius: '12px', 
  fontSize: '0.7rem', 
  fontWeight: 'bold', 
  color: '#475569',
  border: '1px solid #e2e8f0',
  letterSpacing: '1px',
  textTransform: 'uppercase'
};

export default SequenceGame;