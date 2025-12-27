import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WordGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [data, setData] = useState(null);
  const [userAns, setUserAns] = useState(""); 
  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState("");
  const [shake, setShake] = useState(false);

  const fetchWord = async (lvl) => {
    try {
      setStatus('loading');
      setUserAns("");
      setMsg("");
      const res = await fetch(`http://localhost:5000/api/word/${lvl}`);
      const result = await res.json();
      setData(result);
      setStatus('playing');
    } catch(e) { 
      console.error(e);
      setData({ scrambled: "REPTUCMPo", answer: "COMPUTER" });
      setStatus('playing');
    }
  };

  useEffect(() => { fetchWord(level); }, [level]);

  const checkAnswer = () => {
    if (!userAns) return;
    if (userAns.toUpperCase() === data.answer.toUpperCase()) {
      if(level === 100) setStatus('won');
      else {
        setMsg("EXCELLENT! NEXT SEQUENCE...");
        setTimeout(() => setLevel(l => l + 1), 1200);
      }
    } else {
      setMsg("INCORRECT. PLEASE TRY AGAIN.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') checkAnswer();
  };

  return (
    <div style={{
      height: '100vh', width: '100vw',
      background: '#f0f2f5', // Clean Light Background
      color: '#333', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Inter", "Segoe UI", sans-serif', overflow: 'hidden', position: 'relative',
      transition: 'background 0.5s ease'
    }}>

      {/* LIGHT HEADER */}
      <div style={{ position: 'absolute', top: '40px', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '2.5rem', margin: 0, fontWeight: '800', letterSpacing: '2px', 
          color: '#1a73e8' // Professional Blue
        }}>
          Word Master
        </h1>
        <div style={{ 
          marginTop: '10px', padding: '5px 25px', borderRadius: '30px', 
          background: '#fff', border: '1px solid #e0e0e0',
          color: '#5f6368', fontSize: '0.9rem', fontWeight: '600',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
        }}>
          LEVEL {level} • SPELLING CHALLENGE
        </div>
      </div>

      {/* GAME BOX - LIGHT NEUMORPHIC STYLE */}
      {status === 'playing' && data && (
        <div style={{
          maxWidth: '550px', width: '90%',
          padding: '50px 40px', borderRadius: '40px',
          background: '#ffffff',
          border: '1px solid #ffffff',
          boxShadow: '20px 20px 60px #d9d9d9, -20px -20px 60px #ffffff',
          textAlign: 'center',
          animation: shake ? 'shake 0.4s ease' : 'fadeIn 0.6s ease'
        }}>
          <p style={{ color: '#5f6368', letterSpacing: '1px', fontSize: '0.9rem', marginBottom: '10px', fontWeight: '500' }}>
            UNSCRAMBLE THE LETTERS:
          </p>

          <h1 style={{
            fontSize: '3.5rem', 
            letterSpacing: '10px', 
            margin: '20px 0',
            fontWeight: '900',
            color: '#202124',
          }}>
            {data.scrambled.toUpperCase()}
          </h1>

          <div style={{ position: 'relative', marginTop: '40px' }}>
            <input 
              type="text" 
              autoFocus
              value={userAns}
              onKeyDown={handleKeyDown}
              onChange={(e) => setUserAns(e.target.value)}
              placeholder="Your answer..."
              style={{
                width: '100%',
                padding: '15px 0',
                fontSize: '1.4rem',
                background: '#f8f9fa',
                border: '2px solid #e8eaed',
                borderRadius: '15px',
                color: '#202124',
                textAlign: 'center',
                outline: 'none',
                letterSpacing: '2px',
                transition: 'all 0.3s'
              }}
              className="light-input"
            />
          </div>

          <button 
            onClick={checkAnswer} 
            style={{
              marginTop: '40px',
              width: '100%',
              padding: '18px',
              borderRadius: '15px',
              background: '#1a73e8',
              border: 'none',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '1rem',
              letterSpacing: '1px',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(26, 115, 232, 0.3)',
              transition: 'all 0.3s'
            }}
          >
            CHECK ANSWER
          </button>

          {msg && (
            <div style={{
              marginTop: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              color: msg.includes('EXCELLENT') ? '#1e8e3e' : '#d93025',
              animation: 'fadeIn 0.3s ease'
            }}>
              {msg}
            </div>
          )}
        </div>
      )}

      {/* WON STATE */}
      {status === 'won' && (
        <div style={{ 
          position: 'absolute', inset: 0, background: '#f0f2f5', 
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
          zIndex: 100, animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ fontSize: '5rem', marginBottom: '10px' }}>🏆</div>
          <h2 style={{ fontSize: '3rem', fontWeight: '800', color: '#1a73e8', margin: 0 }}>WELL DONE!</h2>
          <p style={{ color: '#5f6368', fontSize: '1.2rem' }}>You've mastered all words.</p>
          <button 
            onClick={() => navigate('/')}
            style={{
              marginTop: '30px', padding: '15px 40px', background: '#1a73e8',
              color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '1rem',
              fontWeight: 'bold', boxShadow: '0 4px 15px rgba(26, 115, 232, 0.3)'
            }}
          >EXIT TO HUB</button>
        </div>
      )}

      {/* LIGHT BACK BUTTON */}
      <div style={{ position: 'absolute', bottom: '40px' }}>
        <button 
          onClick={() => navigate('/')}
          style={{
            background: '#fff', border: '1px solid #e0e0e0', color: '#5f6368',
            padding: '12px 35px', borderRadius: '30px', cursor: 'pointer', fontSize: '0.85rem',
            fontWeight: '600', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', transition: '0.3s'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .light-input:focus {
          border-color: #1a73e8 !important;
          background: #fff !important;
          box-shadow: 0 0 0 4px rgba(26, 115, 232, 0.1);
        }
        button:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}

export default WordGame;