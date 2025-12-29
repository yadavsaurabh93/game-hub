import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ============================================================================
 * GAME: THE ULTIMATE WOODSMITH (Advanced Version)
 * UPDATES: 
 * 1. Added Sword & Shield Blueprints.
 * 2. Added Texture Generator.
 * 3. Completion Tracking (Cannot skip without working).
 * 4. Realistic Polish Effect.
 * ============================================================================
 */

// --- BLUEPRINTS (Designs) ---
const SHAPES = {
    DAGGER: (p, w, h) => {
        const cx = w / 2; const cy = h / 2;
        p.moveTo(cx, cy - 150); // Tip
        p.bezierCurveTo(cx + 40, cy - 50, cx + 30, cy + 100, cx + 15, cy + 150); 
        p.lineTo(cx + 40, cy + 150); 
        p.lineTo(cx + 15, cy + 170); 
        p.lineTo(cx + 15, cy + 250); 
        p.lineTo(cx - 15, cy + 250);
        p.lineTo(cx - 15, cy + 170);
        p.lineTo(cx - 40, cy + 150);
        p.lineTo(cx - 15, cy + 150);
        p.bezierCurveTo(cx - 30, cy + 100, cx - 40, cy - 50, cx, cy - 150);
    },
    AXE: (p, w, h) => {
        const cx = w / 2; const cy = h / 2;
        p.rect(cx - 10, cy - 50, 20, 250); // Handle
        p.moveTo(cx - 10, cy);
        p.quadraticCurveTo(cx - 80, cy - 50, cx - 100, cy + 80); 
        p.quadraticCurveTo(cx - 50, cy + 50, cx - 10, cy + 50);
        p.moveTo(cx + 10, cy);
        p.quadraticCurveTo(cx + 80, cy - 50, cx + 100, cy + 80);
        p.quadraticCurveTo(cx + 50, cy + 50, cx + 10, cy + 50);
    },
    SWORD: (p, w, h) => {
        const cx = w / 2; const cy = h / 2;
        p.rect(cx - 8, cy - 180, 16, 300); // Blade
        p.rect(cx - 40, cy + 120, 80, 15); // Guard
        p.rect(cx - 10, cy + 135, 20, 60); // Handle
        p.arc(cx, cy + 200, 15, 0, Math.PI*2); // Pommel
    },
    SHIELD: (p, w, h) => {
        const cx = w / 2; const cy = h / 2;
        p.moveTo(cx - 60, cy - 80);
        p.lineTo(cx + 60, cy - 80);
        p.lineTo(cx + 60, cy);
        p.bezierCurveTo(cx + 60, cy + 80, cx, cy + 120, cx, cy + 120);
        p.bezierCurveTo(cx, cy + 120, cx - 60, cy + 80, cx - 60, cy);
        p.lineTo(cx - 60, cy - 80);
    }
};

const WoodCarver = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  
  // State
  const [gameState, setGameState] = useState("MENU"); // MENU, CARVE, POLISH, DONE
  const [toolType, setToolType] = useState("CHISEL"); // CHISEL, GOUGE
  const [toolSize, setToolSize] = useState(30);
  const [health, setHealth] = useState(100);
  const [carvedPercent, setCarvedPercent] = useState(0); // Track progress
  
  // Engine Refs (No re-renders)
  const G = useRef({
    isDown: false,
    ctx: null,      // Wood Layer
    oCtx: null,     // Overlay Layer
    width: 0, height: 0,
    particles: [],
    path: null,     // The Shape Object (Path2D)
    shake: 0,
    carvedPixels: 0        
  });

  // --- INITIALIZATION ---
  const initGame = (shapeKey) => {
      setGameState("CARVE");
      setHealth(100);
      setCarvedPercent(0);
      setToolSize(30);
      setToolType("CHISEL");
      G.current.particles = [];
      G.current.carvedPixels = 0;
      G.current.path = null;
      
      setTimeout(() => setupCanvas(shapeKey), 50);
  };

  const setupCanvas = (shapeKey) => {
      const cvs = canvasRef.current;
      const oCvs = overlayRef.current;
      if (!cvs || !oCvs) return;

      const w = window.innerWidth > 600 ? 500 : window.innerWidth - 20;
      const h = window.innerHeight * 0.75;
      
      cvs.width = w; cvs.height = h;
      oCvs.width = w; oCvs.height = h;
      
      G.current.width = w;
      G.current.height = h;
      G.current.ctx = cvs.getContext('2d');
      G.current.oCtx = oCvs.getContext('2d');

      // 1. Draw Raw Wood with Gradient
      const ctx = G.current.ctx;
      const grd = ctx.createLinearGradient(0, 0, w, 0);
      grd.addColorStop(0, "#5D4037");
      grd.addColorStop(0.5, "#8D6E63");
      grd.addColorStop(1, "#5D4037");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);
      
      // Wood Grain Texture
      ctx.strokeStyle = 'rgba(62, 39, 35, 0.3)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for(let i=0; i<w; i+=15) {
          ctx.moveTo(i, 0); 
          ctx.bezierCurveTo(i+Math.random()*40, h/2, i-Math.random()*40, h, i, h);
      }
      ctx.stroke();

      // 2. Define the Path (Blueprint)
      const p = new Path2D();
      if(SHAPES[shapeKey]) {
          SHAPES[shapeKey](p, w, h);
          p.closePath();
          G.current.path = p; 
      }
  };

  // --- INPUT HANDLING ---
  const handleStart = (e) => {
      G.current.isDown = true;
      processInput(e);
  };
  
  const handleEnd = () => { G.current.isDown = false; };
  
  const handleMove = (e) => {
      if (!G.current.isDown) return;
      if(e.cancelable) e.preventDefault(); 
      processInput(e);
  };

  const processInput = (e) => {
      if ((gameState !== "CARVE" && gameState !== "POLISH") || !G.current.path) return;

      const cvs = canvasRef.current;
      if(!cvs) return;

      const rect = cvs.getBoundingClientRect();
      let clientX, clientY;
      if (e.touches && e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
      } else {
          clientX = e.clientX;
          clientY = e.clientY;
      }
      
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      performAction(x, y);
  };

  const performAction = (x, y) => {
      const ctx = G.current.ctx;
      const { path } = G.current;
      if(!path || !ctx) return;

      const isInside = ctx.isPointInPath(path, x, y);

      if (gameState === "CARVE") {
          if (isInside) {
              // DAMAGE: Hit the sculpture
              setHealth(h => Math.max(0, h - 2));
              spawnParticles(x, y, '#FF0000', 3); 
              G.current.shake = 5;
          } else {
              // CARVE: Removing excess wood
              ctx.globalCompositeOperation = 'destination-out';
              ctx.beginPath();
              if(toolType === "CHISEL") {
                  ctx.rect(x - toolSize/2, y - toolSize/2, toolSize, toolSize);
              } else {
                  ctx.arc(x, y, toolSize/2, 0, Math.PI*2);
              }
              ctx.fill();
              ctx.globalCompositeOperation = 'source-over';
              
              // Visual Feedback
              if (Math.random() > 0.6) spawnParticles(x, y, '#D7CCC8', 1);
              
              // Rough Progress Tracker (Simulation)
              G.current.carvedPixels += 1;
              if(G.current.carvedPixels % 20 === 0) {
                  setCarvedPercent(p => Math.min(100, p + 0.1));
              }
          }
      } 
      else if (gameState === "POLISH") {
          if (isInside) {
              // Apply Varnish (Only on the wood)
              ctx.globalCompositeOperation = 'source-atop'; 
              
              // Shiny effect
              const rad = ctx.createRadialGradient(x, y, 0, x, y, 25);
              rad.addColorStop(0, "rgba(255, 255, 200, 0.4)"); // Bright center
              rad.addColorStop(1, "rgba(255, 150, 0, 0.1)");   // Gold edge
              
              ctx.fillStyle = rad;
              ctx.beginPath(); ctx.arc(x, y, 25, 0, Math.PI*2); ctx.fill();
              
              if (Math.random() > 0.8) spawnParticles(x, y, '#FFD700', 1);
          }
      }
  };

  const spawnParticles = (x, y, color, count) => {
      for(let i=0; i<count; i++) {
          G.current.particles.push({
              x: x, y: y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 1) * 12,
              size: Math.random() * 5 + 2,
              life: 1.0,
              color: color
          });
      }
  };

  // --- GAME LOOP ---
  useEffect(() => {
      let animId;
      const loop = () => {
          if (gameState === "MENU") return;

          const oCtx = G.current.oCtx;
          const { width, height, particles, path, shake } = G.current;

          if(oCtx) {
              oCtx.clearRect(0, 0, width, height);

              // Shake Effect
              const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
              const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
              if (shake > 0) G.current.shake *= 0.9;

              oCtx.save();
              oCtx.translate(sx, sy);

              // Draw Blueprint Guide
              if (path && gameState !== "DONE") {
                  oCtx.strokeStyle = gameState === "POLISH" ? 'rgba(0,255,0,0.8)' : 'rgba(255,255,255,0.6)';
                  oCtx.lineWidth = 2;
                  oCtx.setLineDash([5, 5]);
                  oCtx.stroke(path);
                  oCtx.setLineDash([]);
              }

              // Update Particles
              for (let i = particles.length - 1; i >= 0; i--) {
                  let p = particles[i];
                  p.x += p.vx; p.y += p.vy;
                  p.vy += 0.8; // Gravity
                  p.life -= 0.04;

                  if (p.life <= 0) {
                      particles.splice(i, 1);
                  } else {
                      oCtx.fillStyle = p.color;
                      oCtx.globalAlpha = p.life;
                      oCtx.fillRect(p.x, p.y, p.size, p.size);
                      oCtx.globalAlpha = 1;
                  }
              }
              oCtx.restore();
          }
          animId = requestAnimationFrame(loop);
      };
      loop();
      return () => cancelAnimationFrame(animId);
  }, [gameState]);

  // --- STYLES ---
  const styles = `
    body { background: #2D1E1B; margin: 0; touch-action: none; overflow: hidden; font-family: 'Segoe UI', Tahoma, sans-serif; user-select: none; }
    .container { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(circle, #3E2723 0%, #1a100e 100%); }
    
    .hud { width: 90%; max-width: 500px; display: flex; justify-content: space-between; color: white; margin-bottom: 15px; font-weight: bold; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 10px; border: 1px solid #5D4037; }
    .health-bar { width: 120px; height: 15px; background: #333; border: 2px solid #555; border-radius: 4px; overflow: hidden; }
    .health-fill { height: 100%; transition: width 0.2s; }
    
    .canvas-wrapper { position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.9); border: 8px solid #4E342E; border-radius: 8px; background: #1a1a1a; cursor: crosshair; }
    .overlay-cvs { position: absolute; top: 0; left: 0; pointer-events: none; }
    
    .toolbar { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; width: 100%; max-width: 600px; }
    .btn { padding: 12px 24px; font-size: 1rem; border: none; cursor: pointer; background: #FFB300; color: #3E2723; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 0 #E65100; transition: all 0.1s; text-transform: uppercase; }
    .btn:active { transform: translateY(4px); box-shadow: none; }
    .btn:disabled { background: #555; color: #888; box-shadow: none; cursor: not-allowed; }
    .btn-red { background: #FF5252; color: white; box-shadow: 0 4px 0 #D32F2F; }
    .btn-tool { display: flex; flex-direction: column; align-items: center; font-size: 0.8rem; padding: 8px 16px; min-width: 80px; }
    .btn-tool.active { background: #FFF; border: 2px solid #FFB300; }
    
    .menu { position: absolute; inset: 0; background: rgba(0,0,0,0.92); display: flex; flex-direction: column; align-items: center; justify-content: center; color: white; z-index: 10; animation: fadeIn 0.5s; }
    .menu h1 { font-size: 3.5rem; color: #FFB300; text-shadow: 0 0 30px #E65100; text-align: center; line-height: 1; margin-bottom: 0; letter-spacing: 2px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 40px; }
    
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  `;

  return (
    <div className="container">
      <style>{styles}</style>

      {/* HUD */}
      {gameState !== "MENU" && gameState !== "DONE" && (
          <div className="hud">
              <div>
                 <div>INTEGRITY</div>
                 <div className="health-bar">
                    <div className="health-fill" style={{width:`${health}%`, background: health>50?'#00E676':'#FF1744'}} />
                 </div>
              </div>
              <div style={{textAlign:'right'}}>
                  <div>PROGRESS</div>
                  <div style={{color:'#FFB300'}}>{Math.floor(carvedPercent)}%</div>
              </div>
          </div>
      )}

      {/* CANVAS */}
      <div className="canvas-wrapper">
          <canvas 
            ref={canvasRef}
            onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
            onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
          />
          <canvas ref={overlayRef} className="overlay-cvs" />
      </div>

      {/* CONTROLS */}
      <div className="toolbar">
          {gameState === "CARVE" && (
              <>
                <button className={`btn btn-tool ${toolType==='CHISEL'?'active':''}`} onClick={() => {setToolType('CHISEL'); setToolSize(30);}}>
                    🟦 CHISEL
                </button>
                <button className={`btn btn-tool ${toolType==='GOUGE'?'active':''}`} onClick={() => {setToolType('GOUGE'); setToolSize(40);}}>
                    ⚪ GOUGE
                </button>
                <button className={`btn btn-tool ${toolSize===15?'active':''}`} onClick={() => {setToolType('GOUGE'); setToolSize(15);}}>
                    🔹 DETAIL
                </button>
                
                <div style={{flexBasis: '100%', height: '10px'}}></div>

                <button 
                    className="btn btn-red" 
                    onClick={() => setGameState("POLISH")}
                    disabled={carvedPercent < 10} // Force user to work
                >
                    {carvedPercent < 10 ? "CARVE MORE!" : "NEXT: POLISH"}
                </button>
              </>
          )}
          {gameState === "POLISH" && (
              <>
                <div style={{color:'white', marginBottom:'10px'}}>Move over shape to apply gold varnish!</div>
                <button className="btn" style={{background:'#00E676', color:'white', width:'100%'}} onClick={() => setGameState("DONE")}>
                    ✨ FINISH MASTERPIECE
                </button>
              </>
          )}
      </div>

      {/* MAIN MENU */}
      {gameState === "MENU" && (
          <div className="menu">
              <h1>WOOD<br/>SMITH</h1>
              <p style={{color:'#aaa', marginTop:'10px'}}>SELECT YOUR BLUEPRINT</p>
              <div className="grid">
                  <button className="btn" onClick={() => initGame("DAGGER")}>⚔️ DAGGER</button>
                  <button className="btn" onClick={() => initGame("AXE")}>🪓 AXE</button>
                  <button className="btn" onClick={() => initGame("SWORD")}>🗡️ SWORD</button>
                  <button className="btn" onClick={() => initGame("SHIELD")}>🛡️ SHIELD</button>
              </div>
          </div>
      )}

      {/* RESULT */}
      {gameState === "DONE" && (
          <div className="menu">
              <h1 style={{color: health>80?'#00E676':'#FF5252', fontSize:'4rem'}}>
                  {health > 80 ? "LEGENDARY!" : health > 40 ? "DECENT" : "RUINED"}
              </h1>
              <h2 style={{marginTop:'0'}}>INTEGRITY: {Math.floor(health)}%</h2>
              <p style={{color:'#ccc'}}>Click New Project to try another shape</p>
              <div className="grid">
                  <button className="btn" onClick={() => setGameState("MENU")}>NEW PROJECT</button>
                  <button className="btn btn-red" onClick={() => navigate('/')}>EXIT</button>
              </div>
          </div>
      )}
    </div>
  );
};

export default WoodCarver;