import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BottleFlipUltimate = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(localStorage.getItem('bf_tree_high') || 0);
  const [gameOver, setGameOver] = useState(false);

  const engine = useRef({
    ctx: null, w: 0, h: 0,
    bottle: { 
      x: 0, y: 0, prevY: 0, 
      vx: 0, vy: 0, 
      rot: 0, vRot: 0, 
      w: 30, h: 85, 
      landed: true, charge: 0, dir: 1,
      gravity: 0.75 // Thodi kam gravity taaki upar ja sake
    },
    platforms: [],
    lerpY: 0,
    keys: { a: false, d: false, w: false, space: false },
    active: true,
    audio: new Audio('https://www.soundjay.com/free-music/iron-man-01.mp3'),
    audioStarted: false
  });

  const stopAudio = () => {
    if (engine.current.audio) {
      engine.current.audio.pause();
      engine.current.audio.currentTime = 0;
      engine.current.audioStarted = false;
    }
  };

  const resetGame = () => {
    const e = engine.current;
    e.active = true;
    e.lerpY = 0;
    
    // Start Bottle
    e.bottle = { 
        ...e.bottle, 
        x: e.w/2 - 15, y: e.h - 150 - 85, prevY: e.h - 150 - 85,
        vx: 0, vy: 0, rot: 0, vRot: 0, 
        landed: true, charge: 0, dir: 1 
    };
    
    // Base Log
    e.platforms = [{ 
        x: e.w/2 - 100, y: e.h - 150, w: 200, h: 45, 
        side: 'center', scored: true 
    }];
    
    for(let i=0; i<6; i++) spawnPlatform();
    
    setScore(0);
    setGameOver(false);
  };

  const spawnPlatform = () => {
    const e = engine.current;
    const last = e.platforms[e.platforms.length - 1];
    
    let side = Math.random() > 0.5 ? 'left' : 'right';
    if (last.side !== 'center' && Math.random() > 0.6) side = last.side === 'left' ? 'right' : 'left';

    const width = 180 + Math.random() * 50; 
    const xPos = side === 'left' ? 0 : e.w - width;
    
    // GAP REDUCED: 220 se kam karke 190 kar diya taaki reach easy ho
    const gap = 180 + Math.random() * 20; 

    e.platforms.push({
      x: xPos,
      y: last.y - gap, 
      w: width,
      h: 40, 
      side: side,
      scored: false
    });
  };

  useEffect(() => {
    const cvs = canvasRef.current;
    engine.current.ctx = cvs.getContext('2d');
    
    const resize = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      engine.current.w = cvs.width;
      engine.current.h = cvs.height;
      resetGame();
    };
    window.addEventListener('resize', resize);
    resize();

    const update = () => {
      const e = engine.current;
      const b = e.bottle;

      if (b.landed) {
        if (e.keys.a) b.dir = -1;
        if (e.keys.d) b.dir = 1;
        // Faster Charge
        if (e.keys.space || e.keys.w) b.charge = Math.min(100, b.charge + 2.5);
      } else {
        b.prevY = b.y;

        // Physics Sub-stepping (3x for smoothness)
        for(let i=0; i<3; i++) {
            b.vy += b.gravity / 3;
            b.x += b.vx / 3;
            b.y += b.vy / 3;
            b.rot += b.vRot / 3;

            // Collision Check
            e.platforms.forEach(p => {
                if (b.x + b.w > p.x + 10 && b.x < p.x + p.w - 10) {
                    // Check if passed through top
                    const pTop = p.y + 15;
                    if (b.vy > 0 && b.y + b.h >= p.y && b.y + b.h <= p.y + 35) {
                        const r = Math.abs(b.rot % (Math.PI * 2));
                        if (r < 1.0 || r > 5.2) { 
                            b.landed = true;
                            b.y = p.y - b.h;
                            b.vx = 0; b.vy = 0; b.rot = 0; b.vRot = 0;
                            if (!p.scored) {
                                p.scored = true;
                                setScore(s => {
                                    const ns = s + 1;
                                    if(ns > highScore) {
                                        setHighScore(ns);
                                        localStorage.setItem('bf_tree_high', ns);
                                    }
                                    return ns;
                                });
                                spawnPlatform();
                            }
                            return;
                        }
                    }
                }
            });
            if(b.landed) break;
        }

        const target = (e.h * 0.7) - b.y;
        e.lerpY += (target - e.lerpY) * 0.12;

        if (b.y > (e.h * 1.5) - e.lerpY) { e.active = false; setGameOver(true); }
      }
    };

    const drawSideBranch = (ctx, p) => {
        ctx.fillStyle = '#4E342E'; 
        ctx.beginPath();
        if (p.side === 'left') {
            ctx.moveTo(0, p.y + p.h + 20); 
            ctx.quadraticCurveTo(p.w * 0.3, p.y + p.h, p.w, p.y + p.h);
            ctx.lineTo(p.w, p.y);
            ctx.lineTo(0, p.y);
        } else if (p.side === 'right') {
            ctx.moveTo(engine.current.w, p.y + p.h + 20); 
            ctx.quadraticCurveTo(p.x + p.w * 0.7, p.y + p.h, p.x, p.y + p.h);
            ctx.lineTo(p.x, p.y);
            ctx.lineTo(engine.current.w, p.y);
        } else {
            ctx.roundRect(p.x, p.y, p.w, p.h, 5);
        }
        ctx.fill();

        ctx.fillStyle = '#795548'; 
        ctx.fillRect(p.x, p.y, p.w, 8);

        ctx.fillStyle = '#2E7D32';
        if (p.side !== 'center') {
            const tipX = p.side === 'left' ? p.w : p.x;
            ctx.beginPath();
            ctx.ellipse(tipX, p.y + 15, 12, 22, p.side === 'left' ? -0.5 : 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const draw = () => {
      const { ctx, w, h, bottle: b, platforms, lerpY } = engine.current;
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#80DEEA'); 
      grad.addColorStop(1, '#E0F7FA'); 
      ctx.fillStyle = grad; 
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.translate(0, lerpY);

      ctx.fillStyle = '#3E2723'; 
      ctx.fillRect(0, -20000, 40, 40000); 
      ctx.fillRect(w - 40, -20000, 40, 40000);

      platforms.forEach(p => drawSideBranch(ctx, p));

      if (b.landed && b.charge > 2) {
        const cx = b.x + b.w/2;
        const cy = b.y + b.h/2;
        const len = 50 + (b.charge * 1.0);
        const angle = b.dir === 1 ? -Math.PI/4 : -Math.PI*0.75; 

        ctx.save();
        ctx.translate(cx, cy);
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.lineWidth = 6;
        ctx.strokeStyle = `hsl(${120 - b.charge}, 100%, 40%)`; 
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.translate(Math.cos(angle) * len, Math.sin(angle) * len);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-15, -10);
        ctx.lineTo(-15, 10);
        ctx.fillStyle = `hsl(${120 - b.charge}, 100%, 40%)`;
        ctx.fill();
        
        ctx.restore();
      }

      ctx.save();
      ctx.translate(b.x + b.w/2, b.y + b.h/2);
      ctx.rotate(b.rot);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; 
      ctx.strokeStyle = '#263238'; ctx.lineWidth = 2;
      ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h); ctx.strokeRect(-b.w/2, -b.h/2, b.w, b.h);
      ctx.fillStyle = '#0288D1'; ctx.fillRect(-b.w/2+3, 10, b.w-6, b.h/2-12); 
      ctx.fillStyle = '#D84315'; ctx.fillRect(-b.w/4, -b.h/2-10, b.w/2, 10);
      ctx.restore();

      ctx.restore();

      ctx.fillStyle = '#263238'; ctx.font = '900 45px Arial'; ctx.textAlign = 'left';
      ctx.fillText(`${score}`, 60, 70);
      ctx.font = 'bold 20px Arial'; ctx.fillStyle = '#546E7A';
      ctx.fillText(`BEST: ${highScore}`, 60, 100);

      if (b.landed && !gameOver) {
        ctx.fillStyle = '#CFD8DC'; ctx.fillRect(w/2 - 150, h - 80, 300, 15);
        ctx.fillStyle = '#43A047'; ctx.fillRect(w/2 - 150, h - 80, b.charge * 3, 15);
        ctx.font = 'bold 18px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = '#455A64';
        ctx.fillText(`USE 'A'/'D' TO AIM | POWER: ${Math.floor(b.charge)}%`, w/2, h - 95);
      }
    };

    const loop = () => {
      if (engine.current.active) update();
      draw();
      engine.current.animationFrame = requestAnimationFrame(loop);
    };
    loop();

    const handleKey = (ev) => {
      const e = engine.current;
      const down = ev.type === 'keydown';
      const k = ev.key.toLowerCase();
      
      if (!e.audioStarted && down) { 
        e.audio.loop = true; e.audio.play().catch(()=>{}); e.audioStarted = true; 
      }

      if (k === 'a') e.keys.a = down;
      if (k === 'd') e.keys.d = down;
      
      if (k === 'w' || ev.code === 'Space') {
        if (!down && e.bottle.landed && e.bottle.charge > 5) {
          const b = e.bottle;
          const p = b.charge / 100;
          // HIGH JUMP FIX: Vertical Velocity Increased (-16.5)
          b.vx = (4.8 + (p * 11.2)) * b.dir; 
          b.vy = -16.5 - (p * 15.0);
          b.vRot = (0.2 + (p * 0.2)) * b.dir; 
          
          b.landed = false;
        }
        e.keys.space = down;
        e.keys.w = down;
      }
    };

    window.addEventListener('keydown', handleKey);
    window.addEventListener('keyup', handleKey);
    return () => {
      cancelAnimationFrame(engine.current.animationFrame);
      stopAudio();
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('keyup', handleKey);
      window.removeEventListener('resize', resize);
    };
  }, [highScore]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#80DEEA', overflow: 'hidden', position: 'relative' }}>
      
      <button 
        onClick={() => { stopAudio(); navigate('/'); }}
        style={{ position: 'absolute', top: '30px', right: '30px', padding: '12px 30px', background: '#D32F2F', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', zIndex: 100 }}>
        EXIT GAME
      </button>

      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {gameOver && (
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(33, 33, 33, 0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <h1 style={{ color: '#FF5252', fontSize: '6rem', margin: 0 }}>WASTED</h1>
          <p style={{ color: '#E0E0E0', fontSize: '2rem', margin: '20px 0 40px' }}>SCORE: {score}</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button onClick={resetGame} style={{ padding: '18px 60px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>RETRY</button>
            <button onClick={() => { stopAudio(); navigate('/'); }} style={{ padding: '18px 60px', background: 'transparent', border: '2px solid white', color: 'white', borderRadius: '4px', fontSize: '1.5rem', fontWeight: 'bold', cursor: 'pointer' }}>EXIT</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BottleFlipUltimate;