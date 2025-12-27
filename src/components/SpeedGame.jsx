import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SpeedGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [nums, setNums] = useState([]);
  const [next, setNext] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [status, setStatus] = useState('loading');
  const [serverMsg, setServerMsg] = useState("");

  const fetchLevel = async (lvl) => {
    try {
      // API call to your backend
      const res = await fetch(`http://localhost:5000/api/speed/${lvl}`);
      const data = await res.json();
      setTimeLeft(data.timeLimit);
      setServerMsg(data.message);
      
      let arr = Array.from({length:20}, (_,i)=>i+1).sort(()=> Math.random()-0.5);
      setNums(arr);
      setNext(1);
      setStatus('playing');
    } catch(e) { 
        console.error(e);
        // Fallback agar backend available na ho
        setTimeLeft(30);
        setServerMsg("SEQUENCE_INITIALIZED: CLICK IN ORDER");
        let arr = Array.from({length:20}, (_,i)=>i+1).sort(()=> Math.random()-0.5);
        setNums(arr);
        setNext(1);
        setStatus('playing');
    }
  };

  useEffect(() => { fetchLevel(level); }, [level]);

  useEffect(() => {
    if(status !== 'playing') return;
    if(timeLeft <= 0) { setStatus('lost'); return; }
    const timer = setInterval(()=> setTimeLeft(t=>t-1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status]);

  const handleClick = (n) => {
    if(n === next) {
      if(n === 20) {
          if(level === 100) setStatus('won');
          else setLevel(l => l + 1);
      } else {
          setNext(next + 1);
      }
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1b 100%)',
      color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, sans-serif', overflow: 'hidden', position: 'relative'
    }}>

      {/* HEADER SECTION */}
      <div style={{ position: 'absolute', top: '30px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ 
          fontSize: '2.2rem', margin: 0, fontWeight: '300', letterSpacing: '6px',
          background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}>
          Reflex Core
        </h1>
        <div style={{ fontSize: '0.8rem', color: '#4facfe', opacity: 0.8, letterSpacing: '2px', marginTop: '5px' }}>
          {serverMsg}
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ 
        display: 'flex', gap: '40px', marginBottom: '30px', 
        padding: '15px 40px', borderRadius: '40px',
        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#f093fb', textTransform: 'uppercase' }}>Timer</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 5 ? '#ff4d4d' : '#fff' }}>{timeLeft}s</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#4facfe', textTransform: 'uppercase' }}>Level</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{level}</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', color: '#00f2fe', textTransform: 'uppercase' }}>Find</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>#{next}</div>
        </div>
      </div>

      {/* GAME GRID */}
      {status === 'playing' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(5, 110px)', 
          gap: '15px', 
          padding: '25px',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.6)'
        }}>
          {nums.map(n => (
            <div 
              key={n} 
              onClick={() => handleClick(n)}
              style={{
                width: '110px', height: '110px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', fontWeight: '300', borderRadius: '15px',
                cursor: 'pointer', transition: 'all 0.2s ease',
                background: n < next 
                  ? 'rgba(79, 172, 254, 0.05)' 
                  : 'rgba(255,255,255,0.05)',
                border: n < next
                  ? '1px solid rgba(79, 172, 254, 0.3)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: n < next ? '#4facfe' : '#fff',
                opacity: n < next ? 0.2 : 1,
                // Glow effect removed as requested
                boxShadow: 'none'
              }}
              className="num-box"
            >
              {n}
            </div>
          ))}
        </div>
      )}

      {/* STATUS OVERLAYS */}
      {status === 'lost' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.9)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>⏰</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '10px', margin: 0 }}>TIMED OUT</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px', padding: '15px 40px', background: '#ff4d4d', color: '#fff',
              border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              letterSpacing: '2px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(255, 77, 77, 0.3)'
            }}
          >RETRY SEQUENCE</button>
        </div>
      )}

      {status === 'won' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.9)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🎉</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '10px', margin: 0 }}>COMPLETED</h2>
          <p style={{ color: '#4facfe' }}>Reflex test finished.</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '30px', padding: '15px 40px', background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              letterSpacing: '2px', fontWeight: 'bold'
            }}
          >RETURN HOME</button>
        </div>
      )}

      {/* NAVIGATION */}
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '12px 35px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.8rem',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}
        >
          Exit Game
        </button>
      </div>

      <style>{`
        .num-box:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          border-color: #4facfe !important;
          transform: translateY(-2px);
        }
        .num-box:active {
          transform: translateY(0) scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default SpeedGame;