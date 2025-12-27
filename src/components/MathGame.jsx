import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MathGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  const fetchQ = async (lvl) => {
    try {
      // API call to your backend
      const res = await fetch(`http://localhost:5000/api/math/${lvl}`);
      const result = await res.json();
      setData(result);
      setStatus('playing');
    } catch(e) { 
      console.error(e);
      // Fallback agar backend offline ho (Testing ke liye)
      setData({
        q: "12 * 4",
        opts: [44, 48, 52, 46],
        ans: 48
      });
      setStatus('playing');
    }
  };

  useEffect(() => { fetchQ(level); }, [level]);

  const handleAns = (val) => {
    if(val === data.ans) {
      if(level === 100) setStatus('won');
      else { 
        setData(null); 
        setLevel(l => l + 1); 
      }
    } else {
      setStatus('lost');
    }
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f1b 100%)',
      color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Segoe UI", Roboto, sans-serif', overflow: 'hidden', position: 'relative'
    }}>

      {/* HEADER */}
      <div style={{ position: 'absolute', top: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', margin: 0, fontWeight: '300', letterSpacing: '8px', 
          background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}>
          Neural Math
        </h1>
        <div style={{ 
          marginTop: '10px', padding: '5px 25px', borderRadius: '20px', 
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: '#4facfe', fontSize: '0.9rem', letterSpacing: '2px'
        }}>
          LEVEL {level} / 100
        </div>
      </div>

      {/* MAIN GAME BOX */}
      {status === 'playing' && data && (
        <div style={{
          maxWidth: '600px', width: '90%',
          padding: '40px', borderRadius: '30px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          textAlign: 'center',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <span style={{ fontSize: '1rem', color: '#f093fb', textTransform: 'uppercase', letterSpacing: '3px' }}>Evaluate Sequence</span>
            <h1 style={{ 
              fontSize: '4.5rem', margin: '15px 0', fontWeight: '200',
              textShadow: '0 0 20px rgba(255,255,255,0.1)'
            }}>
              {data.q} <span style={{ color: '#4facfe' }}>= ?</span>
            </h1>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '20px',
            marginTop: '30px'
          }}>
            {data.opts.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAns(opt)}
                style={{
                  padding: '20px', fontSize: '1.5rem', borderRadius: '15px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
                  fontWeight: '300'
                }}
                className="math-opt-btn"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAYS (LOST/WON) */}
      {status === 'lost' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.9)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>❌</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '10px', margin: 0 }}>CALCULATION ERROR</h2>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '30px', padding: '15px 40px', background: '#ff4d4d', color: '#fff',
              border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              letterSpacing: '2px', fontWeight: 'bold'
            }}
          >RE-CALIBRATE</button>
        </div>
      )}

      {status === 'won' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.9)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🏆</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '10px', margin: 0 }}>GENIUS DETECTED</h2>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '30px', padding: '15px 40px', background: 'linear-gradient(90deg, #00f2fe 0%, #4facfe 100%)',
              color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              letterSpacing: '2px', fontWeight: 'bold'
            }}
          >TERMINATE SESSION</button>
        </div>
      )}

      {/* BOTTOM EXIT BUTTON */}
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '12px 35px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.8rem',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}
        >
          Return to Hub
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .math-opt-btn:hover {
          background: rgba(79, 172, 254, 0.15) !important;
          border-color: #4facfe !important;
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .math-opt-btn:active {
          transform: translateY(0) scale(0.95);
        }
      `}</style>
    </div>
  );
}

export default MathGame;