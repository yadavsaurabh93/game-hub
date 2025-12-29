import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const TowerMaster = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // --- UI STATE ---
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('tower_god_score')) || 0);
  const [gameState, setGameState] = useState("START"); // START, PLAY, OVER

  // --- GAME ENGINE ---
  const G = useRef({
    width: 0, height: 0,
    ctx: null,
    stack: [],
    current: null,
    debris: [],
    particles: [], // Sparks, shockwaves
    floaters: [],  // Floating text
    bgObjects: [], // Stars, clouds
    
    cameraY: 0,
    shake: 0,
    flash: 0,      // Screen flash intensity
    
    // Physics & Logic
    baseSpeed: 5,
    currentSpeed: 5,
    perfectTolerance: 5, 
    
    // Aesthetics
    time: 0,       // Global time for animations
    theme: 'STONE' // STONE, MARBLE, GOLD, OBSIDIAN, NEON
  });

  // --- SETUP ---
  useEffect(() => {
    const cvs = canvasRef.current;
    // Alpha: false for performance optimization
    const ctx = cvs.getContext('2d', { alpha: false }); 
    
    const init = () => {
      cvs.width = window.innerWidth;
      cvs.height = window.innerHeight;
      G.current.width = cvs.width;
      G.current.height = cvs.height;
      G.current.ctx = ctx;
      initBackground();
    };

    init();
    window.addEventListener('resize', init);
    
    let loopId;
    const loop = () => {
      gameLoop();
      loopId = requestAnimationFrame(loop);
    };
    loop();
    
    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(loopId);
    };
  }, [gameState]);

  const initBackground = () => {
      G.current.bgObjects = [];
      // Clouds
      for(let i=0; i<10; i++) {
          G.current.bgObjects.push({
              type: 'cloud',
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight * 0.8,
              size: Math.random() * 80 + 40,
              speed: Math.random() * 0.2 + 0.05,
              opacity: Math.random() * 0.3 + 0.1
          });
      }
      // Stars (Always generated, visible based on height)
      for(let i=0; i<80; i++) {
          G.current.bgObjects.push({
              type: 'star',
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              size: Math.random() * 2 + 0.5,
              blinkSpeed: Math.random() * 0.1,
              offset: Math.random() * 10
          });
      }
  };

  const startGame = () => {
    const { width, height } = G.current;
    G.current.stack = [];
    G.current.debris = [];
    G.current.particles = [];
    G.current.floaters = [];
    G.current.cameraY = 0;
    G.current.shake = 0;
    G.current.flash = 0;
    G.current.currentSpeed = G.current.baseSpeed;
    G.current.theme = 'STONE';
    
    // Base Block
    const baseSize = 250;
    G.current.stack.push({
      x: width / 2 - baseSize / 2,
      y: height - 200,
      w: baseSize,
      h: 50,
      color: '#5D4037',
      type: 'BASE'
    });

    spawnNextBlock();
    setScore(0);
    setCombo(0);
    setGameState("PLAY");
  };

  const spawnNextBlock = () => {
    const prev = G.current.stack[G.current.stack.length - 1];
    
    // Difficulty Curve: Faster as you go up
    const level = G.current.stack.length;
    let speedMult = 1 + (level * 0.05);
    if(speedMult > 3.0) speedMult = 3.0; // Cap speed
    
    G.current.currentSpeed = G.current.baseSpeed * speedMult;

    // Material Upgrade Logic (Visuals)
    let color = '#795548'; // Stone
    let type = 'STONE';
    
    if (level > 10) { color = '#90A4AE'; type = 'MARBLE'; } // Silver/Marble
    if (level > 25) { color = '#FFD700'; type = 'GOLD'; }   // Gold
    if (level > 45) { color = '#212121'; type = 'OBSIDIAN'; } // Black
    if (level > 70) { color = '#00E5FF'; type = 'NEON'; }     // Cyber

    G.current.theme = type;

    G.current.current = {
      x: -400, // Start off-screen
      y: prev.y - 50, 
      w: prev.w,
      h: 50,
      dir: 1,
      color: color,
      type: type
    };
  };

  // --- LOGIC ---
  const handleTap = (e) => {
    if (gameState !== "PLAY") return;
    e.stopPropagation();

    const curr = G.current.current;
    const prev = G.current.stack[G.current.stack.length - 1];

    if (!curr || !prev) return;

    const delta = curr.x - prev.x;
    const overhang = Math.abs(delta);
    const overlap = curr.w - overhang;

    if (overlap > 0) {
      // SUCCESS HIT
      let isPerfect = false;

      // Perfect Drop Logic
      if (overhang < G.current.perfectTolerance) {
          isPerfect = true;
          curr.x = prev.x; // Snap to center
          curr.w = prev.w;
          
          setCombo(c => {
              const newCombo = c + 1;
              // Combo Bonus: Grow Block if stack is thin
              if (newCombo >= 3) {
                  if (curr.w < 250) {
                      curr.w += 10;
                      curr.x -= 5;
                      addFloater(curr.x + curr.w/2, curr.y, "SIZE UP!", '#00E676');
                  }
                  // Mega Particle Effect
                  createShockwave(curr.x + curr.w/2, curr.y + curr.h, true);
              } else {
                  createShockwave(curr.x + curr.w/2, curr.y + curr.h, false);
              }
              
              if(newCombo > 4) addFloater(curr.x + curr.w/2, curr.y, "GODLIKE!", '#FF00FF');
              else if(newCombo > 2) addFloater(curr.x + curr.w/2, curr.y, "PERFECT!", '#FFD700');
              
              return newCombo;
          });

          setScore(s => s + 2);
          G.current.flash = 8; 
          G.current.shake = 5;
      } 
      else {
          // Imperfect Drop (Cut Logic)
          setCombo(0);
          curr.w = overlap;
          
          let cutX, cutW;
          if (delta > 0) {
            curr.x = prev.x + overhang; 
            cutX = curr.x + curr.w;
            cutW = overhang;
          } else {
            curr.x = prev.x;
            cutX = prev.x - overhang;
            cutW = overhang;
          }
          
          spawnDebris(cutX, curr.y, cutW, curr.h, curr.color);
          addFloater(curr.x + curr.w/2, curr.y, "+1", '#FFF');
          setScore(s => s + 1);
          G.current.shake = 3;
      }

      G.current.stack.push(curr);
      spawnNextBlock();

    } else {
      // GAME OVER (Missed Completely)
      spawnDebris(curr.x, curr.y, curr.w, curr.h, curr.color);
      G.current.shake = 20;
      G.current.flash = 20;
      gameOver();
    }
  };

  const gameOver = () => {
    setGameState("OVER");
    if (score > highScore) {
        setHighScore(score);
        localStorage.setItem('tower_god_score', score);
    }
  };

  // --- FX GENERATORS ---
  const spawnDebris = (x, y, w, h, color) => {
    G.current.debris.push({
      x, y, w, h, color,
      vx: (Math.random() - 0.5) * 10,
      vy: -5,
      rot: 0,
      vRot: (Math.random() - 0.5) * 0.4
    });
  };

  const createShockwave = (x, y, isBig) => {
      // Expanding Ring
      G.current.particles.push({ 
          type:'ring', x, y, r: 10, alpha: 1, 
          color: 'white', grow: isBig ? 8 : 4 
      });
      
      // Sparks
      const count = isBig ? 20 : 10;
      for(let i=0; i<count; i++) {
          G.current.particles.push({
              type: 'spark',
              x, y,
              vx: (Math.random()-0.5) * (isBig?25:15),
              vy: (Math.random()-0.5) * (isBig?25:15),
              life: 1.0,
              color: isBig ? '#FFD700' : '#FFF',
              gravity: 0.5
          });
      }
  };

  const addFloater = (x, y, text, color) => {
      G.current.floaters.push({ x, y, text, color, life: 1.0, vy: -3 });
  };

  // --- DRAWING LOOP ---
  const gameLoop = () => {
    const { ctx, width, height, stack, current, debris, particles, floaters, bgObjects } = G.current;
    G.current.time += 0.05;

    // 0. Camera & Shake Logic
    // Target moves up as stack grows
    const targetCamY = Math.max(0, (stack.length - 4) * 50);
    // Smooth Lerp (0.08 is the smoothness factor)
    G.current.cameraY += (targetCamY - G.current.cameraY) * 0.08;
    
    let sx = 0, sy = 0;
    if (G.current.shake > 0) {
        sx = (Math.random() - 0.5) * G.current.shake;
        sy = (Math.random() - 0.5) * G.current.shake;
        G.current.shake *= 0.9; // Decay shake
        if(G.current.shake < 0.5) G.current.shake = 0;
    }

    // 1. Draw Background (Dynamic Gradients)
    drawAtmosphere(ctx, width, height, stack.length);

    ctx.save();
    // Apply Camera Transform
    ctx.translate(0, G.current.cameraY + sy);
    ctx.translate(sx, 0);

    // 2. Draw Debris (Falling pieces)
    debris.forEach((d, i) => {
        d.x += d.vx; d.y += d.vy; d.vy += 0.8; d.rot += d.vRot;
        ctx.save();
        ctx.translate(d.x + d.w/2, d.y + d.h/2);
        ctx.rotate(d.rot);
        // Draw centered
        drawTexturedBlock(ctx, -d.w/2, -d.h/2, d.w, d.h, d.color, 'DEBRIS');
        ctx.restore();
        if(d.y > height - G.current.cameraY + 300) debris.splice(i, 1);
    });

    // 3. Draw Stacked Blocks
    stack.forEach(block => {
        drawTexturedBlock(ctx, block.x, block.y, block.w, block.h, block.color, block.type);
    });

    // 4. Draw Current Moving Block
    if (current && gameState === "PLAY") {
        current.x += G.current.currentSpeed * current.dir;
        
        // Bounce off walls
        if (current.x > width - 50 && current.dir > 0) current.dir = -1;
        else if (current.x < 50 && current.dir < 0) current.dir = 1;
        
        drawTexturedBlock(ctx, current.x, current.y, current.w, current.h, current.color, current.type);
        
        // Ghost/Guide Shadow (Transparency helps alignment)
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(current.x, height - G.current.cameraY, current.w, 10);
    }

    // 5. Draw Particles
    particles.forEach((p, i) => {
        if(p.type === 'ring') {
            p.r += p.grow || 5; 
            p.alpha -= 0.05;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
            ctx.strokeStyle = `rgba(255,255,255,${p.alpha})`; ctx.lineWidth = 4; ctx.stroke();
            if(p.alpha <= 0) particles.splice(i, 1);
        } else {
            p.x += p.vx; p.y += p.vy; 
            if(p.gravity) p.vy += p.gravity;
            p.life -= 0.02;
            ctx.fillStyle = p.color; 
            ctx.globalAlpha = p.life;
            ctx.fillRect(p.x, p.y, 5, 5); 
            ctx.globalAlpha = 1;
            if(p.life <= 0) particles.splice(i, 1);
        }
    });

    // 6. Floating Text
    floaters.forEach((f, i) => {
        f.y += f.vy; 
        f.life -= 0.02;
        ctx.fillStyle = f.color;
        ctx.font = '900 28px "Segoe UI"';
        ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
        ctx.globalAlpha = f.life;
        ctx.fillText(f.text, f.x, f.y);
        ctx.globalAlpha = 1; ctx.shadowBlur = 0;
        if(f.life <= 0) floaters.splice(i, 1);
    });

    ctx.restore();

    // 7. Screen Flash (Impact Effect)
    if (G.current.flash > 0) {
        ctx.fillStyle = `rgba(255,255,255,${G.current.flash * 0.05})`;
        ctx.fillRect(0, 0, width, height);
        G.current.flash--;
    }

    // 8. Ground (Only visible at start)
    const groundY = height - 150 + G.current.cameraY + sy;
    if (groundY > -300) {
        const grd = ctx.createLinearGradient(0, groundY, 0, groundY + 300);
        grd.addColorStop(0, '#2E7D32');
        grd.addColorStop(1, '#1B5E20');
        ctx.fillStyle = grd;
        ctx.fillRect(0, groundY, width, 400);
    }
  };

  // --- RENDER HELPERS ---
  
  const drawAtmosphere = (ctx, w, h, level) => {
      let c1, c2;
      // Interpolate Sky Color based on stack height
      if (level < 15) { c1 = "#29B6F6"; c2 = "#E1F5FE"; } // Day
      else if (level < 35) { c1 = "#F57C00"; c2 = "#1A237E"; } // Sunset
      else if (level < 60) { c1 = "#4A148C"; c2 = "#000000"; } // Deep Space
      else { c1 = "#000000"; c2 = "#121212"; } // Void

      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, c1);
      grd.addColorStop(1, c2);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      // Stars (Twinkle)
      if (level > 25) {
          ctx.fillStyle = 'white';
          G.current.bgObjects.forEach(o => {
              if (o.type === 'star') {
                  const flicker = Math.sin(G.current.time * o.blinkSpeed + o.offset);
                  ctx.globalAlpha = Math.abs(flicker);
                  ctx.beginPath(); ctx.arc(o.x, o.y, o.size, 0, Math.PI*2); ctx.fill();
                  ctx.globalAlpha = 1;
              }
          });
      }
      
      // Clouds (Parallax)
      if (level < 50) {
          G.current.bgObjects.forEach(o => {
              if (o.type === 'cloud') {
                  o.x += o.speed;
                  if (o.x > w + 100) o.x = -150;
                  ctx.fillStyle = `rgba(255,255,255,${o.opacity})`;
                  // Parallax effect: Clouds move slower than camera
                  const py = o.y + G.current.cameraY * 0.5;
                  ctx.beginPath();
                  ctx.arc(o.x, py, o.size, 0, Math.PI*2);
                  ctx.arc(o.x+50, py+10, o.size*0.8, 0, Math.PI*2);
                  ctx.arc(o.x-50, py+10, o.size*0.8, 0, Math.PI*2);
                  ctx.fill();
              }
          });
      }
  };

  const drawTexturedBlock = (ctx, x, y, w, h, color, type) => {
      const d = 15; // 3D Depth amount

      // 1. Side Face (Darker)
      ctx.fillStyle = adjustColor(color, -40);
      ctx.beginPath();
      ctx.moveTo(x+w, y); ctx.lineTo(x+w+d, y-d); ctx.lineTo(x+w+d, y+h-d); ctx.lineTo(x+w, y+h);
      ctx.fill();

      // 2. Top Face (Lighter)
      ctx.fillStyle = adjustColor(color, 40);
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x+d, y-d); ctx.lineTo(x+w+d, y-d); ctx.lineTo(x+w, y);
      ctx.fill();

      // 3. Front Face
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);

      // 4. Texture & Details
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      
      if (type === 'STONE') {
          ctx.fillRect(x+10, y+10, 10, 5);
          ctx.fillRect(x+w-20, y+h-15, 5, 5);
      } else if (type === 'MARBLE') {
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x, y+h); ctx.lineTo(x+w, y); ctx.stroke();
      } else if (type === 'GOLD') {
          // Shimmer animation
          const shinePos = (G.current.time * 10) % (w + 100);
          const grad = ctx.createLinearGradient(x + shinePos - 20, y, x + shinePos + 20, y+h);
          grad.addColorStop(0, 'rgba(255,255,255,0)');
          grad.addColorStop(0.5, 'rgba(255,255,255,0.6)');
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = grad;
          ctx.fillRect(x, y, w, h);
      } else if (type === 'NEON') {
          // Neon Glow
          ctx.shadowBlur = 20;
          ctx.shadowColor = color;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.strokeRect(x+5, y+5, w-10, h-10);
          ctx.shadowBlur = 0;
      }

      // Border Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
  };

  const adjustColor = (color, amount) => {
      // Simple helper doesn't modify hex, usually requires library. 
      // For this pure React version, we rely on opacity layering for shadow/highlight
      return color; 
  };

  // --- UI COMPONENTS ---
  const uiOverlayStyle = {
      position:'absolute', inset:0, display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', color:'white',
      fontFamily: '"Segoe UI", sans-serif', textShadow: '0 5px 15px rgba(0,0,0,0.5)',
      zIndex: 20, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)'
  };

  return (
    <div onClick={handleTap} style={{
        width:'100vw', height:'100vh', overflow:'hidden', cursor:'pointer',
        background:'#333', userSelect:'none'
    }}>
      {/* HUD */}
      <div style={{position:'absolute', top:40, width:'100%', textAlign:'center', zIndex:10, pointerEvents:'none'}}>
          <h1 style={{fontSize:'7rem', margin:0, color:'white', fontWeight:'900', textShadow:'0 10px 30px rgba(0,0,0,0.5)'}}>
              {score}
          </h1>
          {combo > 1 && (
             <div style={{
                 color: combo > 4 ? '#FF00FF' : '#FFEB3B', 
                 fontSize:'2rem', fontWeight:'bold', 
                 animation:'pulse 0.3s infinite alternate',
                 textShadow: '0 0 20px currentColor'
             }}>
                 {combo}x STREAK 🔥
             </div>
          )}
      </div>

      <div style={{position:'absolute', top:20, right:20, zIndex:30}}>
          <button onClick={(e)=>{e.stopPropagation(); navigate('/')}} style={{
              background:'rgba(255,255,255,0.1)', backdropFilter:'blur(5px)', border:'1px solid rgba(255,255,255,0.3)', 
              color:'white', padding:'10px 20px', borderRadius:'20px', cursor:'pointer', fontWeight:'bold'
          }}>EXIT</button>
      </div>

      {/* MENUS */}
      {gameState !== "PLAY" && (
        <div style={uiOverlayStyle}>
           {gameState === "START" ? (
               <>
                 <h1 style={{
                     fontSize:'6rem', marginBottom:'0', lineHeight:1,
                     background:'linear-gradient(to bottom, #FFF, #CCC)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                     filter: 'drop-shadow(0 0 20px rgba(255,215,0,0.5))'
                 }}>TOWER<br/>GOD</h1>
                 <p style={{fontSize:'1.5rem', color:'#EEE', marginTop:'10px', letterSpacing:'2px'}}>ULTIMATE EDITION</p>
                 <button onClick={(e)=>{e.stopPropagation(); startGame()}} style={btnStyle}>START BUILDING</button>
               </>
           ) : (
               <>
                 <h2 style={{fontSize:'4rem', color:'#FF5252', marginBottom:'10px'}}>TOWER FELL</h2>
                 <div style={{
                     background:'rgba(255,255,255,0.1)', padding:'30px', borderRadius:'20px', 
                     textAlign:'center', minWidth:'250px', marginBottom:'30px', border:'1px solid rgba(255,255,255,0.1)'
                 }}>
                     <div style={{fontSize:'1rem', color:'#AAA', letterSpacing:'2px'}}>FINAL SCORE</div>
                     <div style={{fontSize:'4rem', fontWeight:'bold'}}>{score}</div>
                     <div style={{
                         borderTop:'1px solid rgba(255,255,255,0.2)', marginTop:'15px', paddingTop:'15px', 
                         fontSize:'1.2rem', color:'#FFD700'
                     }}>BEST: {highScore}</div>
                 </div>
                 <button onClick={(e)=>{e.stopPropagation(); startGame()}} style={btnStyle}>TRY AGAIN</button>
               </>
           )}
        </div>
      )}

      <canvas ref={canvasRef} style={{display:'block'}} />
      <style>{`
        @keyframes pulse { from { transform: scale(1); opacity:1; } to { transform: scale(1.1); opacity:0.8; } }
      `}</style>
    </div>
  );
};

const btnStyle = {
    padding: '20px 60px', fontSize: '1.8rem', fontWeight: 'bold',
    background: 'linear-gradient(45deg, #FFD700, #FFCA28)', color: '#3E2723', 
    border: 'none', borderRadius: '50px',
    cursor: 'pointer', boxShadow: '0 10px 30px rgba(255, 215, 0, 0.4)', marginTop: '20px',
    transition: 'transform 0.1s, box-shadow 0.2s'
};

export default TowerMaster;