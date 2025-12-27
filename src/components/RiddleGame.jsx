import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function RiddleGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');

  const fetchRiddle = async (lvl) => {
    try {
      setStatus('loading');
      // API call to your backend
      const res = await fetch(`http://localhost:5000/api/riddle/${lvl}`);
      const result = await res.json();
      setData(result);
      setStatus('playing');
    } catch(e) { 
      console.error(e);
      // Fallback agar backend offline ho
      setData({
        question: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?",
        options: ["A Cloud", "An Echo", "A Shadow", "A Ghost"],
        answer: "An Echo",
        difficulty: "Medium"
      });
      setStatus('playing');
    }
  };

  useEffect(() => { fetchRiddle(level); }, [level]);

  const handleAnswer = (choice) => {
    if(choice === data.answer) {
      if(level === 100) setStatus('won');
      else setLevel(l => l + 1);
    } else {
      // Modern shake effect logic handles through CSS, no more ugly alerts
      const box = document.getElementById('game-container');
      box.style.animation = 'none';
      setTimeout(() => box.style.animation = 'shake 0.4s ease-in-out', 10);
    }
  };

  // Modern Color Palette for Difficulty
  const getDiffColor = (diff) => {
    if (diff.includes("DANGER")) return "#ff4d4d"; // Electric Red
    if (diff === "Hard") return "#f093fb"; // Neon Pink
    if (diff === "Medium") return "#4facfe"; // Cyan Blue
    return "#00f2fe"; // Light Blue
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
          background: 'linear-gradient(90deg, #f093fb 0%, #4facfe 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textTransform: 'uppercase'
        }}>
          Enigma Core
        </h1>
        <div style={{ fontSize: '0.8rem', color: '#4facfe', opacity: 0.6, letterSpacing: '3px', marginTop: '5px' }}>
          DECRYPT THE RIDDLE
        </div>
      </div>

      {/* GAME BOX */}
      {status === 'playing' && data && (
        <div id="game-container" style={{
          maxWidth: '700px', width: '90%',
          padding: '40px', borderRadius: '30px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
          position: 'relative',
          animation: 'fadeIn 0.6s ease'
        }}>
          
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'30px'}}>
            <h2 style={{opacity:0.6, margin:0, fontWeight: '300', fontSize: '1.2rem'}}>LEVEL {level}</h2>
            
            <span style={{
              border: `1px solid ${getDiffColor(data.difficulty)}`,
              padding: '6px 20px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 'bold',
              color: getDiffColor(data.difficulty),
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: `0 0 15px ${getDiffColor(data.difficulty)}44`
            }}>
              {data.difficulty}
            </span>
          </div>
          
          <div style={{ minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <h3 style={{
              fontSize: '1.6rem', fontStyle:'italic', margin: '0 0 40px 0', 
              lineHeight: '1.6', fontWeight: '300', color: '#e0e0e0', textAlign: 'center'
            }}>
              "{data.question}"
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px'
          }}>
            {data.options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAnswer(opt)}
                style={{
                  padding: '18px', fontSize: '1.1rem', borderRadius: '15px',
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff', cursor: 'pointer', transition: 'all 0.3s ease',
                  fontWeight: '300', outline: 'none'
                }}
                className="riddle-opt-btn"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {status === 'loading' && (
        <div style={{ textAlign: 'center' }}>
           <div className="loader"></div>
           <h2 style={{ fontWeight: '200', letterSpacing: '4px', marginTop: '20px', opacity: 0.7 }}>DECRYPTING...</h2>
        </div>
      )}

      {/* WON STATE */}
      {status === 'won' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: 'rgba(15, 15, 27, 0.9)', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, backdropFilter: 'blur(15px)'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🧠</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '200', letterSpacing: '10px', margin: 0 }}>ENIGMA MASTER</h2>
          <p style={{ color: '#4facfe', marginTop: '10px' }}>Your mind is a supercomputer.</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '30px', padding: '15px 40px', background: 'linear-gradient(90deg, #f093fb 0%, #4facfe 100%)',
              color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              letterSpacing: '2px', fontWeight: 'bold'
            }}
          >TERMINATE SESSION</button>
        </div>
      )}

      {/* EXIT BUTTON */}
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#fff',
            padding: '12px 35px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.8rem',
            letterSpacing: '2px', textTransform: 'uppercase'
          }}
        >
          Exit to Hub
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }
        .riddle-opt-btn:hover {
          background: rgba(240, 147, 251, 0.1) !important;
          border-color: #f093fb !important;
          transform: translateY(-3px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .riddle-opt-btn:active {
          transform: translateY(0) scale(0.95);
        }
        .loader {
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-top: 2px solid #4facfe;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default RiddleGame;