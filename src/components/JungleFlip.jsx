import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ============================================================================
 * GAME: JUNGLE FLIP - ANIMATED HUMAN EDITION
 * FEATURES: 
 * - NEW: Enhanced Animated Human Character (Running, Bobbing)
 * - Character Appearance changes in Hell Mode
 * - Mode Switch every 50 Points (Jungle <-> Hell)
 * - Full Inputs (W/S, Arrows, Touch, Space)
 * ============================================================================
 */

// --- UTILS ---
const randomRange = (min, max) => Math.random() * (max - min) + min;

// --- CONFIGURATION ---
const MODES = {
  JUNGLE: {
    GRAVITY: 0.65, JUMP: 13, INC: 0.002,
    THEME: { SKY: ['#4FADFF', '#B3E5FC'], GROUND: '#4CAF50', OBS: '#5D4037', TEXT: '#FFF' }
  },
  HELL: {
    GRAVITY: 1.0, JUMP: 17, INC: 0.004,
    THEME: { SKY: ['#000000', '#330000'], GROUND: '#800000', OBS: '#FF0000', TEXT: '#FF0000' }
  }
};

// --- AUDIO SYSTEM ---
class AudioController {
    constructor() { this.ctx = null; }
    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
    }
    playTone(freq, type, dur) {
        if (!this.ctx) return;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = type; o.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(0.1, this.ctx.currentTime); g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + dur);
        o.connect(g); g.connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur);
    }
    playJump() { this.playTone(300, 'sine', 0.15); }
    playCoin() { this.playTone(1000, 'square', 0.1); }
    playLevelUp() { this.playTone(150, 'sawtooth', 0.8); }
    playCrash() { this.playTone(100, 'sawtooth', 0.4); }
}
const AudioSys = new AudioController();

// --- MAIN COMPONENT ---
const JungleFlip = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const reqRef = useRef();
  
  // Image
  const playerImgRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  // State
  const [gameState, setGameState] = useState("MENU"); 
  const [uiScore, setUiScore] = useState(0);
  const [uiMode, setUiMode] = useState("JUNGLE");
  const [highScore, setHighScore] = useState(0);
  const [notification, setNotification] = useState(""); 

  // --- GAME ENGINE ---
  const G = useRef({
    width: 0, height: 0, frame: 0, speed: 0, shake: 0, glitch: 0,
    score: 0, level: 1, currentMode: "JUNGLE",
    // runFrame added for animation timing
    player: { x: 100, y: 0, size: 45, vy: 0, inverted: false, rotation: 0, runFrame: 0, trail: [] },
    obstacles: [], coins: [], clouds: [], particles: []
  });

  // Load Assets
  useEffect(() => {
      const savedScore = localStorage.getItem('jungle_highscore');
      if(savedScore) setHighScore(parseInt(savedScore));
      
      const img = new Image(); img.src = "/player.png";
      img.onload = () => { playerImgRef.current = img; setImgLoaded(true); };
  }, []);

  // --- INIT ---
  const initGame = () => {
    const cvs = canvasRef.current;
    if(!cvs) return;
    
    G.current = {
      width: cvs.width, height: cvs.height, frame: 0, speed: 7, shake: 0, glitch: 0,
      score: 0, level: 1, currentMode: "JUNGLE",
      player: { x: 100, y: cvs.height - 100, size: 45, vy: 0, inverted: false, rotation: 0, runFrame: 0, trail: [] },
      obstacles: [], coins: [], particles: [],
      clouds: Array.from({length: 8}, () => ({ x: randomRange(0, cvs.width), y: randomRange(0, cvs.height), size: randomRange(20, 60), speed: randomRange(0.5, 2) }))
    };
    
    setUiScore(0);
    setUiMode("JUNGLE");
    setGameState("PLAY");
    setNotification("START!");
    setTimeout(() => setNotification(""), 1000);
    AudioSys.init();
  };

  // --- CONTROLS ---
  useEffect(() => {
    const handleInput = (e) => {
        if(["Space", "ArrowUp", "ArrowDown", "w", "s"].includes(e.key)) e.preventDefault();

        if (gameState === "PLAY") {
            const P = G.current.player;
            let didFlip = false;
            if (e.code === "Escape") { setGameState("PAUSED"); return; }

            // Directional & Toggle
            if ((e.key === "ArrowUp" || e.key === "w") && !P.inverted) { P.inverted = true; didFlip = true; }
            else if ((e.key === "ArrowDown" || e.key === "s") && P.inverted) { P.inverted = false; didFlip = true; }
            else if (e.code === "Space" || e.code === "Enter" || e.type === "mousedown" || e.type === "touchstart") {
                P.inverted = !P.inverted; didFlip = true;
            }

            if (didFlip) {
                P.vy = 0; AudioSys.playJump();
                spawnParticles(P.x, P.y + (P.inverted ? 0 : P.size), '#fff', 5);
            }
        } 
        else if (["MENU", "PAUSED", "OVER"].includes(gameState)) {
            if (e.code === "Enter" || e.code === "Space") {
                if(gameState === "PAUSED") setGameState("PLAY"); else initGame();
            }
        }
    };

    window.addEventListener("keydown", handleInput);
    window.addEventListener("mousedown", handleInput);
    window.addEventListener("touchstart", handleInput);
    return () => {
        window.removeEventListener("keydown", handleInput);
        window.removeEventListener("mousedown", handleInput);
        window.removeEventListener("touchstart", handleInput);
    }
  }, [gameState]);

  const spawnParticles = (x, y, color, count) => {
      for(let i=0; i<count; i++) G.current.particles.push({ x: x, y: y, vx: randomRange(-4,4), vy: randomRange(-4,4), life: 1.0, color });
  };

  // --- LOGIC ---
  const update = () => {
      const State = G.current; const P = State.player;
      const SETS = MODES[State.currentMode];

      // --- MODE SWITCH LOGIC (Every 50 Points) ---
      const calculatedLevel = Math.floor(State.score / 50) + 1;
      
      if (calculatedLevel > State.level) {
          State.level = calculatedLevel;
          State.currentMode = calculatedLevel % 2 === 0 ? "HELL" : "JUNGLE";
          
          setUiMode(State.currentMode);
          State.shake = 20;
          State.speed += 1.5; 
          AudioSys.playLevelUp();
          
          setNotification(State.currentMode === "HELL" ? "🔥 ENTERING HELL 🔥" : "🌲 BACK TO JUNGLE 🌲");
          setTimeout(() => setNotification(""), 2000);
      }

      if(State.currentMode === 'HELL') {
          if(Math.random() > 0.98) State.glitch = 3;
          if(State.glitch > 0) State.glitch--;
      }
      if(State.shake > 0) State.shake *= 0.9;

      // Physics
      const gravity = P.inverted ? -SETS.GRAVITY : SETS.GRAVITY;
      P.vy += gravity; P.y += P.vy;
      // Increase animation frame for running
      P.runFrame += 0.25; 

      // Rotation Logic
      const targetRot = P.inverted ? Math.PI : 0;
      P.rotation += (targetRot - P.rotation) * 0.2;

      const floorY = State.height - 70 - P.size; const ceilY = 70;
      if(!P.inverted) { if(P.y > floorY) { P.y = floorY; P.vy = 0; } } 
      else { if(P.y < ceilY) { P.y = ceilY; P.vy = 0; } }

      State.speed += SETS.INC; State.frame++;
      
      // Spawner
      const spawnRate = Math.max(30, Math.floor(1000 / State.speed));
      if(State.frame % spawnRate === 0) {
          const isTop = Math.random() > 0.5;
          const obsY = isTop ? 70 : State.height - 70 - 70;
          State.obstacles.push({ x: State.width, y: obsY, w: 50, h: 70, passed: false });
          if(Math.random() > 0.6) State.coins.push({ x: State.width + 100, y: isTop ? State.height - 150 : 150, w: 30, h: 30, taken: false });
      }

      // Move
      const move = (arr) => { arr.forEach(o => o.x -= State.speed); return arr.filter(o => o.x > -100); };
      State.obstacles = move(State.obstacles);
      State.coins = move(State.coins);
      State.clouds.forEach(c => { c.x -= (State.speed * 0.5); if(c.x < -100) c.x = State.width + 100; });
      State.particles.forEach(p => { p.x -= State.speed; p.y += p.vy; p.life -= 0.05; }); State.particles = State.particles.filter(p => p.life > 0);

      // Collisions
      State.obstacles.forEach(o => {
          if (P.x+10 < o.x+o.w && P.x+P.size-10 > o.x && P.y+10 < o.y+o.h && P.y+P.size-10 > o.y) {
              State.shake = 30; AudioSys.playCrash(); 
              if(State.score > highScore) { setHighScore(State.score); localStorage.setItem('jungle_highscore', State.score); }
              setGameState("OVER");
          }
          if (!o.passed && P.x > o.x + o.w) {
              o.passed = true; State.score += 1; setUiScore(State.score);
          }
      });

      State.coins.forEach(c => {
          if (!c.taken && P.x < c.x+c.w && P.x+P.size > c.x && P.y < c.y+c.h && P.y+P.size > c.y) {
              c.taken = true; State.score += 5; setUiScore(State.score); AudioSys.playCoin(); spawnParticles(c.x, c.y, '#FFD700', 8);
          }
      });
  };

  // --- RENDER ---
  const draw = (ctx) => {
      const State = G.current; const w = State.width; const h = State.height;
      const SETS = MODES[State.currentMode].THEME;
      const isHell = State.currentMode === 'HELL';
      
      ctx.save();

      if(isHell && State.glitch > 0) ctx.translate(randomRange(-5,5), randomRange(-5,5));
      if(State.shake > 0.5) ctx.translate(randomRange(-State.shake, State.shake), randomRange(-State.shake, State.shake));

      // Background
      const grad = ctx.createLinearGradient(0, 0, 0, h); grad.addColorStop(0, SETS.SKY[0]); grad.addColorStop(1, SETS.SKY[1]);
      ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);

      // Clouds
      ctx.fillStyle = isHell ? 'rgba(255,0,0,0.2)' : 'rgba(255,255,255,0.6)'; 
      State.clouds.forEach(c => { ctx.beginPath(); ctx.arc(c.x, c.y, c.size, 0, Math.PI*2); ctx.fill(); });

      // Ground
      ctx.fillStyle = SETS.GROUND; ctx.fillRect(0, 0, w, 70); ctx.fillRect(0, h-70, w, 70);
      
      // Obstacles
      ctx.fillStyle = SETS.OBS;
      State.obstacles.forEach(o => {
          if (!isHell) {
              ctx.fillRect(o.x, o.y, o.w, o.h);
              ctx.strokeStyle = '#3E2723'; ctx.lineWidth = 4; ctx.strokeRect(o.x, o.y, o.w, o.h);
              ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x+o.w, o.y+o.h); ctx.stroke();
          } else {
              ctx.beginPath();
              if(o.y < h/2) { ctx.moveTo(o.x, 70); ctx.lineTo(o.x+o.w/2, 70+o.h); ctx.lineTo(o.x+o.w, 70); } 
              else { ctx.moveTo(o.x, h-70); ctx.lineTo(o.x+o.w/2, h-70-o.h); ctx.lineTo(o.x+o.w, h-70); }
              ctx.fill();
          }
      });

      // Coins
      State.coins.filter(c => !c.taken).forEach(c => {
          ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(c.x+15, c.y+15, 12, 0, Math.PI*2); ctx.fill();
      });

      // PLAYER RENDER
      const P = State.player;
      ctx.save();
      ctx.translate(P.x + P.size/2, P.y + P.size/2);
      ctx.rotate(P.rotation);
      
      if (imgLoaded && playerImgRef.current) {
          // Custom Image
          ctx.drawImage(playerImgRef.current, -P.size/2, -P.size/2, P.size, P.size);
          if (isHell) { ctx.globalCompositeOperation = "source-atop"; ctx.fillStyle = "rgba(255,0,0,0.3)"; ctx.fillRect(-P.size/2, -P.size/2, P.size, P.size); }
      } else {
          // --- NEW ANIMATED HUMAN CHARACTER ---
          const skin = '#FFDCB1';
          const shirt = isHell ? '#330000' : '#2196F3'; // Red in Hell, Blue in Jungle
          const pants = isHell ? '#1a1a1a' : '#795548'; // Black in Hell, Brown in Jungle
          
          // Animation math
          const cycle = P.runFrame;
          const bob = Math.abs(Math.sin(cycle*2)) * 3; // Bouncing effect
          const legSwing = 0.6;
          const armSwing = 0.7;

          ctx.translate(0, -bob); // Apply bouncing

          // DRAW LEGS (Back first)
          ctx.fillStyle = pants;
          ctx.save(); ctx.translate(0, 10); ctx.rotate(Math.sin(cycle + Math.PI)*legSwing);
          ctx.beginPath(); ctx.roundRect(-4, 0, 8, 18, 4); ctx.fill(); ctx.restore();

          // DRAW ARMS (Back first)
          ctx.fillStyle = skin;
          ctx.save(); ctx.translate(0, -2); ctx.rotate(Math.sin(cycle)*armSwing);
          ctx.beginPath(); ctx.roundRect(-3, 0, 6, 15, 3); ctx.fill(); ctx.restore();

          // DRAW BODY
          ctx.fillStyle = shirt;
          ctx.beginPath(); ctx.roundRect(-8, -5, 16, 20, 5); ctx.fill();

          // DRAW LEGS (Front)
          ctx.fillStyle = pants;
          ctx.save(); ctx.translate(0, 10); ctx.rotate(Math.sin(cycle)*legSwing);
          ctx.beginPath(); ctx.roundRect(-4, 0, 8, 18, 4); ctx.fill(); ctx.restore();

          // DRAW ARMS (Front)
          ctx.fillStyle = skin;
          ctx.save(); ctx.translate(0, -2); ctx.rotate(Math.sin(cycle + Math.PI)*armSwing);
          ctx.beginPath(); ctx.roundRect(-3, 0, 6, 15, 3); ctx.fill(); ctx.restore();

          // DRAW HEAD
          ctx.fillStyle = skin;
          ctx.beginPath(); ctx.arc(0, -14, 11, 0, Math.PI*2); ctx.fill();
          
          // Eyes
          ctx.fillStyle = isHell ? 'red' : 'black';
          ctx.beginPath(); ctx.arc(4, -14, 2, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(7, -14, 2, 0, Math.PI*2); ctx.fill();
      }
      ctx.restore();

      // Particles
      State.particles.forEach(p => { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1.0; });

      // Vignette for Hell
      if (isHell) {
          const grad = ctx.createRadialGradient(w/2, h/2, 200, w/2, h/2, 800);
          grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(50,0,0,0.6)');
          ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
      }

      ctx.restore();
  };

  // --- LOOPS ---
  const loop = () => { if(gameState === "PLAY") { update(); if(canvasRef.current) draw(canvasRef.current.getContext('2d')); reqRef.current = requestAnimationFrame(loop); } };
  useEffect(() => { if(gameState === "PLAY") reqRef.current = requestAnimationFrame(loop); else if(canvasRef.current && gameState === "MENU") { const ctx = canvasRef.current.getContext('2d'); ctx.fillStyle = '#333'; ctx.fillRect(0,0,2000,2000); } return () => cancelAnimationFrame(reqRef.current); }, [gameState]);
  useEffect(() => { const resize = () => { if(canvasRef.current) { canvasRef.current.width = window.innerWidth; canvasRef.current.height = window.innerHeight; } }; window.addEventListener('resize', resize); resize(); return () => window.removeEventListener('resize', resize); }, []);

  // --- STYLES ---
  const isHell = uiMode === 'HELL';
  const FONT = isHell ? 'Creepster' : 'Titan One';
  const BTN_COLOR = isHell ? 'red' : '#4CAF50';
  
  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Creepster&family=Titan+One&display=swap');
    body { margin: 0; background: ${isHell?'#000':'#333'}; overflow: hidden; font-family: '${FONT}', cursive; user-select: none; transition: background 0.5s; }
    
    .overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.85); display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 10; color: white; }
    
    .panel { 
        padding: 40px; text-align: center; border-radius: 20px; 
        background: ${isHell?'#000':'#8D6E63'}; border: 5px solid ${isHell?'red':'#5D4037'};
        box-shadow: 0 10px 30px rgba(0,0,0,0.5); min-width: 320px;
    }
    
    .title { font-size: 4rem; margin: 0 0 20px 0; color: ${isHell?'red':'#FFEB3B'}; animation: ${isHell?'shake 0.2s infinite':'none'}; }
    
    .btn { background: ${BTN_COLOR}; color: white; border: none; padding: 15px 40px; font-family: inherit; font-size: 2rem; cursor: pointer; border-radius: 10px; margin-top: 20px; transition: 0.2s; }
    .btn:hover { transform: scale(1.1); }
    
    .hud { position: absolute; top: 20px; left: 20px; font-size: 3rem; color: ${isHell?'red':'white'}; z-index: 5; text-shadow: 2px 2px 0 black; }
    .controls { position: absolute; top: 20px; right: 20px; z-index: 5; display: flex; gap: 10px; }
    .btn-icon { width: 50px; height: 50px; border-radius: 50%; border: 3px solid white; background: #333; color: white; font-size: 1.2rem; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    
    .notification { 
        position: absolute; top: 30%; width: 100%; text-align: center; 
        font-size: 4rem; color: ${isHell?'red':'yellow'}; 
        text-shadow: 4px 4px 0 black; animation: pop 0.5s ease; pointer-events: none; z-index: 8; 
    }
    @keyframes shake { 0% { transform: translate(1px, 1px); } 50% { transform: translate(-1px, -2px); } }
    @keyframes pop { 0% { transform: scale(0); } 80% { transform: scale(1.2); } 100% { transform: scale(1); } }
  `;

  return (
    <div style={{width:'100vw', height:'100vh'}}>
      <style>{styles}</style>
      <canvas ref={canvasRef} />
      {gameState === "PLAY" && (
        <>
          <div className="hud">{uiScore}</div>
          <div className="controls">
             <button className="btn-icon" onClick={() => setGameState("PAUSED")}>||</button>
             <button className="btn-icon" style={{background:'#D32F2F'}} onClick={() => navigate("/")}>X</button>
          </div>
          {notification && <div className="notification">{notification}</div>}
        </>
      )}
      {gameState === "MENU" && (
        <div className="overlay">
           <div className="panel">
              <h1 className="title">JUNGLE FLIP</h1>
              <p>BEST: {highScore}</p>
              <button className="btn" onClick={initGame}>START</button>
           </div>
        </div>
      )}
      {gameState === "PAUSED" && (
        <div className="overlay">
           <div className="panel">
              <h1>PAUSED</h1>
              <button className="btn" onClick={() => setGameState("PLAY")}>RESUME</button>
              <button className="btn" style={{background:'#333', marginTop:'10px'}} onClick={() => navigate("/")}>EXIT</button>
           </div>
        </div>
      )}
      {gameState === "OVER" && (
        <div className="overlay">
           <div className="panel">
              <h1 style={{color: isHell?'red':'orange'}}>{isHell ? 'YOU DIED' : 'CRASHED!'}</h1>
              <h2>SCORE: {uiScore}</h2>
              <button className="btn" onClick={initGame}>RETRY</button>
              <button className="btn" style={{background:'#333', marginTop:'10px'}} onClick={() => setGameState("MENU")}>MENU</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default JungleFlip;