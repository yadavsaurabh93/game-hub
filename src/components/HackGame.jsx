import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function HackGame() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(1);
  const [layers, setLayers] = useState([]);
  const [currentLayerIndex, setCurrentLayerIndex] = useState(0);
  
  // Advanced State
  const [cursorPos, setCursorPos] = useState(0); 
  const [direction, setDirection] = useState(1); 
  const [status, setStatus] = useState('loading'); 
  const [logs, setLogs] = useState(["[SYSTEM]: NEURAL_SYNC_ESTABLISHED"]);
  const [shake, setShake] = useState(false);
  const [glitch, setGlitch] = useState(false);
  
  const requestRef = useRef();
  const canvasRef = useRef(null);

  // --- DARK NEURAL GRID BACKGROUND ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrame;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
    }));

    const draw = () => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = status === 'denied' ? 'rgba(255, 0, 0, 0.25)' : 'rgba(0, 242, 254, 0.2)';
      ctx.lineWidth = 0.5;

      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      animationFrame = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animationFrame); window.removeEventListener('resize', resize); };
  }, [status]);

  const addLog = useCallback((msg) => {
    setLogs(prev => [`> ${msg}`, ...prev].slice(0, 10));
  }, []);

  const fetchHack = useCallback(async (lvl) => {
    setStatus('loading');
    addLog(`INITIATING_BRUTE_FORCE_L${lvl}...`);
    try {
      const res = await fetch(`http://localhost:5000/api/hack/${lvl}`);
      const data = await res.json();
      
      // IMPOSSIBLE LOGIC: Levels become progressively harder
      const impossibleLayers = data.layers.map((l, index) => ({
        ...l,
        speed: Math.max(2, l.speed - (lvl * 0.8)), 
        width: Math.max(3, l.width - (lvl * 0.5) - (index * 0.5))
      }));
      
      setLayers(impossibleLayers);
      setCurrentLayerIndex(0);
      setCursorPos(0);
      setStatus('active');
    } catch(e) { 
      // Hard Fallback if server is offline
      const fallbackLayers = Array.from({length: 4 + Math.floor(lvl/5)}, (_, i) => ({
        position: 15 + Math.random() * 60,
        width: 10 - (lvl * 0.2),
        speed: 7 - (lvl * 0.1)
      }));
      setLayers(fallbackLayers);
      setCurrentLayerIndex(0);
      setStatus('active');
    }
  }, [addLog]);

  useEffect(() => { fetchHack(level); }, [level, fetchHack]);

  // --- ULTRA-FAST MOVEMENT LOOP ---
  useEffect(() => {
    if(status !== 'active' || layers.length === 0) return;
    const currentConfig = layers[currentLayerIndex];
    let lastTime = performance.now();

    const animate = (time) => {
      const deltaTime = time - lastTime;
      // Variable speed logic to confuse the user
      const speedPulse = Math.sin(time / 500) * 0.5 + 1;
      
      if (deltaTime > (currentConfig.speed * speedPulse)) {
        setCursorPos(prev => {
          let next = prev + (direction * 3); 
          if (next >= 100) { setDirection(-1); return 100; }
          if (next <= 0) { setDirection(1); return 0; }
          return next;
        });
        lastTime = time;
      }
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [status, layers, currentLayerIndex, direction]);

  const handleHack = () => {
    if(status !== 'active') return;
    const currentConfig = layers[currentLayerIndex];
    const zoneStart = currentConfig.position;
    const zoneEnd = currentConfig.position + currentConfig.width;

    if (cursorPos >= zoneStart && cursorPos <= zoneEnd) {
      addLog(`NODE_${currentLayerIndex + 1}_BREACHED_SUCCESSFULLY.`);
      setGlitch(true);
      setTimeout(() => setGlitch(false), 150);

      if (currentLayerIndex + 1 === layers.length) {
        setStatus('hacked');
        addLog(`TOTAL_SYSTEM_COMPROMISE_COMPLETE.`);
        setTimeout(() => setLevel(l => l + 1), 2000);
      } else {
        setCurrentLayerIndex(i => i + 1);
        setCursorPos(0);
      }
    } else {
      setStatus('denied');
      setShake(true);
      addLog(`CRITICAL_ERROR: SECURITY_LOCKDOWN.`);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div onMouseDown={handleHack} style={{ 
      height: '100vh', width: '100vw', background: '#000', 
      overflow: 'hidden', cursor: 'crosshair', fontFamily: '"JetBrains Mono", monospace',
      animation: shake ? 'shake 0.3s infinite' : 'none',
      filter: glitch ? 'invert(1) hue-rotate(180deg)' : 'none'
    }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {/* TOP HUD */}
      <div style={{ position: 'absolute', top: 30, left: 40, right: 40, display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ color: '#00f2fe', border: '1px solid #1a1a1a', padding: '10px 20px', background: 'rgba(0,0,0,0.7)', fontSize: '0.8rem', letterSpacing: '4px' }}>
            ROOT@MAINFRAME:~# L{level}
        </div>
        <button onClick={(e) => {e.stopPropagation(); navigate('/')}} style={{
          background: 'transparent', border: '1px solid #ff4757', padding: '10px 25px', color: '#ff4757', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s'
        }} onMouseOver={(e) => e.target.style.background = '#ff4757'} onMouseOut={(e) => e.target.style.background = 'transparent'}>
          ABORT MISSION
        </button>
      </div>

      <div style={{ position: 'relative', zIndex: 5, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* LOG PANEL (LEFT) */}
        <div style={{ 
          position: 'absolute', left: 40, width: '300px', height: '350px',
          background: 'rgba(5, 5, 5, 0.9)', padding: '20px', border: '1px solid #111',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)', pointerEvents: 'none'
        }}>
          <div style={{ color: '#333', fontSize: '0.7rem', marginBottom: '15px', borderBottom: '1px solid #111' }}>TERMINAL_OUTPUT:</div>
          {logs.map((log, i) => (
            <div key={i} style={{ fontSize: '0.7rem', color: log.includes('ERROR') ? '#ff4757' : '#00f2fe', marginBottom: '6px' }}>
              {log}
            </div>
          ))}
        </div>

        {/* BREACH INTERFACE (CENTER) */}
        <div style={{
          width: '700px', background: 'rgba(10, 10, 10, 0.98)', 
          border: `1px solid ${status === 'denied' ? '#ff4757' : '#1a1a1a'}`,
          padding: '50px', borderRadius: '4px', textAlign: 'center',
          boxShadow: status === 'denied' ? '0 0 100px rgba(255, 71, 87, 0.15)' : '0 40px 100px rgba(0,0,0,0.9)'
        }}>
          
          <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#444', fontSize: '0.7rem', letterSpacing: '2px' }}>FIREWALL_LAYER: {currentLayerIndex + 1}/{layers.length}</div>
            <div style={{ color: '#00f2fe', fontSize: '0.7rem', fontWeight: 'bold' }}>SPEED_MOD: {(level * 0.1).toFixed(1)}x</div>
          </div>

          {status === 'active' && (
            <div style={{ position: 'relative', height: '100px', background: '#050505', border: '1px solid #111', overflow: 'hidden' }}>
              {/* TARGET ZONE */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${layers[currentLayerIndex]?.position}%`,
                width: `${layers[currentLayerIndex]?.width}%`,
                background: 'rgba(0, 242, 254, 0.15)',
                borderLeft: '2px solid #00f2fe',
                borderRight: '2px solid #00f2fe',
                boxShadow: '0 0 30px rgba(0, 242, 254, 0.3)'
              }}></div>

              {/* CURSOR */}
              <div style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${cursorPos}%`,
                width: '4px', background: '#fff',
                boxShadow: '0 0 20px #fff',
                zIndex: 10
              }}></div>
            </div>
          )}

          {status === 'hacked' && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <h1 style={{ color: '#00f2fe', fontSize: '4.5rem', letterSpacing: '15px', textShadow: '0 0 30px #00f2fe' }}>SUCCESS</h1>
              <p style={{ color: '#444', letterSpacing: '5px' }}>EXTRACTING_ENCRYPTED_DATA...</p>
            </div>
          )}

          {status === 'denied' && (
            <div>
                <h1 style={{ color: '#ff4757', fontSize: '4.5rem', textShadow: '0 0 30px #ff4757' }}>LOCKDOWN</h1>
                <p style={{ color: '#444', marginBottom: '30px' }}>ACCESS_REVOKED_BY_MAINFRAME</p>
                <button onClick={() => {setLevel(1); fetchHack(1);}} style={{
                    background: '#ff4757', color: '#fff', border: 'none', padding: '15px 50px', cursor: 'pointer', fontWeight: 'bold', letterSpacing: '2px'
                }}>RE-CONNECT</button>
            </div>
          )}

          {status === 'active' && (
            <div style={{ marginTop: '40px', color: '#222', fontSize: '0.7rem', letterSpacing: '10px', animation: 'blink 1s infinite' }}>
                TAP_TO_BYPASS_NODE
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10%, 30%, 50%, 70%, 90% { transform: translate(-10px, 0); }
          20%, 40%, 60%, 80% { transform: translate(10px, 0); }
        }
      `}</style>
    </div>
  );
}

export default HackGame;