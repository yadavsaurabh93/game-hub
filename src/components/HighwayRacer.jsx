import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const HighwayRacer = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  
  // --- UI STATE ---
  const [score, setScore] = useState(0);
  const [money, setMoney] = useState(0);
  const [speedDisplay, setSpeedDisplay] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false); // To init Audio
  
  const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('racer_god_score')) || 0);
  const [totalMoney, setTotalMoney] = useState(parseInt(localStorage.getItem('racer_total_money')) || 0);
  
  const [nitro, setNitro] = useState(100);
  const [health, setHealth] = useState(100);
  const [shield, setShield] = useState(0); 
  const [zone, setZone] = useState({ name: "🌲 GREEN VALLEY", progress: 0 });

  // --- SOUND ENGINE (Web Audio API) ---
  const Audio = useRef({
      ctx: null,
      engineOsc: null,
      engineGain: null,
      sirenOsc: null,
      sirenGain: null,
      isSirenPlaying: false,
      
      init: () => {
          if (!window.AudioContext) return;
          const AC = window.AudioContext || window.webkitAudioContext;
          Audio.current.ctx = new AC();
          
          // 1. Engine Sound (Sawtooth wave)
          const osc = Audio.current.ctx.createOscillator();
          const gain = Audio.current.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 50; // Idle
          gain.gain.value = 0; // Start silent
          osc.connect(gain);
          gain.connect(Audio.current.ctx.destination);
          osc.start();
          Audio.current.engineOsc = osc;
          Audio.current.engineGain = gain;

          // 2. Siren Sound (Modulated Sine)
          const sOsc = Audio.current.ctx.createOscillator();
          const sGain = Audio.current.ctx.createGain();
          sOsc.type = 'square';
          sOsc.frequency.value = 600;
          sGain.gain.value = 0;
          sOsc.connect(sGain);
          sGain.connect(Audio.current.ctx.destination);
          sOsc.start();
          Audio.current.sirenOsc = sOsc;
          Audio.current.sirenGain = sGain;
      },

      updateEngine: (speed) => {
          if (Audio.current.engineOsc) {
              // Pitch goes up with speed
              const targetFreq = 60 + (speed * 8); 
              Audio.current.engineOsc.frequency.setTargetAtTime(targetFreq, Audio.current.ctx.currentTime, 0.1);
              // Volume
              Audio.current.engineGain.gain.setTargetAtTime(speed > 1 ? 0.1 : 0, Audio.current.ctx.currentTime, 0.1);
          }
      },

      toggleSiren: (active) => {
          if (!Audio.current.sirenGain) return;
          const now = Audio.current.ctx.currentTime;
          if (active) {
              if (!Audio.current.isSirenPlaying) {
                  Audio.current.sirenGain.gain.setTargetAtTime(0.15, now, 0.1);
                  Audio.current.isSirenPlaying = true;
              }
              // Wee-Woo Effect
              const time = new Date().getTime() / 500;
              const freq = 600 + Math.sin(time * 10) * 200;
              Audio.current.sirenOsc.frequency.setValueAtTime(freq, now);
          } else {
              if (Audio.current.isSirenPlaying) {
                  Audio.current.sirenGain.gain.setTargetAtTime(0, now, 0.5);
                  Audio.current.isSirenPlaying = false;
              }
          }
      },

      playCrash: () => {
          if (!Audio.current.ctx) return;
          const osc = Audio.current.ctx.createOscillator();
          const gain = Audio.current.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(100, Audio.current.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(10, Audio.current.ctx.currentTime + 0.5);
          gain.gain.setValueAtTime(0.3, Audio.current.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, Audio.current.ctx.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(Audio.current.ctx.destination);
          osc.start();
          osc.stop(Audio.current.ctx.currentTime + 0.5);
      },

      playCollect: (type) => {
          if (!Audio.current.ctx) return;
          const osc = Audio.current.ctx.createOscillator();
          const gain = Audio.current.ctx.createGain();
          osc.type = type === 'SHIELD' ? 'square' : 'sine';
          const freq = type === 'SHIELD' ? 400 : 1200;
          osc.frequency.setValueAtTime(freq, Audio.current.ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(freq * 2, Audio.current.ctx.currentTime + 0.1);
          gain.gain.setValueAtTime(0.1, Audio.current.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, Audio.current.ctx.currentTime + 0.3);
          osc.connect(gain);
          gain.connect(Audio.current.ctx.destination);
          osc.start();
          osc.stop(Audio.current.ctx.currentTime + 0.3);
      }
  });

  // --- GAME ENGINE ---
  const G = useRef({
    ctx: null, width: 0, height: 0,
    active: false, frame: 0,
    speed: 0, baseSpeed: 10, maxSpeed: 50, distance: 0,
    isBoosting: false, isBraking: false, 
    currentMoney: 0, currentHealth: 100,
    theme: null,
    player: { x: 0, y: 0, w: 64, h: 110, lane: 1, targetX: 0, tilt: 0 },
    enemies: [], coins: [], powerups: [], particles: [], roadLines: [], laneX: []
  });

  const keys = useRef({ Left: false, Right: false, Up: false, Down: false, Space: false });

  // --- ZONES ---
  const ZONES = [
      { limit: 0, name: "🌲 GREEN VALLEY", colors: { ground: '#1B5E20', road: '#37474F', line: '#FFF' } },
      { limit: 5000, name: "🏜️ SANDSTORM", colors: { ground: '#E65100', road: '#4E342E', line: '#FFD700' } },
      { limit: 10000, name: "🌃 NEON CITY", colors: { ground: '#050505', road: '#1A237E', line: '#00E5FF' } },
      { limit: 15000, name: "🌌 QUANTUM WARP", colors: { ground: '#000000', road: 'rgba(0,0,0,0.8)', line: '#D500F9' } }
  ];

  useEffect(() => {
    const cvs = canvasRef.current;
    cvs.width = window.innerWidth;
    cvs.height = window.innerHeight;
    const ctx = cvs.getContext('2d', { alpha: false });
    G.current.ctx = ctx; G.current.width = cvs.width; G.current.height = cvs.height;
    
    // Lane Setup
    const roadW = Math.min(600, cvs.width * 0.9);
    G.current.laneWidth = roadW / 4;
    const startX = (cvs.width - roadW) / 2;
    G.current.laneX = [0, 1, 2, 3].map(i => startX + G.current.laneWidth * (i + 0.5));
    
    // Listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    let loopId;
    const loop = () => { if(G.current.active) gameLoop(); loopId = requestAnimationFrame(loop); };
    loop();
    
    return () => { 
        window.removeEventListener('keydown', handleKeyDown); 
        window.removeEventListener('keyup', handleKeyUp); 
        cancelAnimationFrame(loopId);
        // Cleanup Audio
        if(Audio.current.ctx) Audio.current.ctx.close();
    };
  }, []);

  const startGame = () => {
      // Init Audio on first interaction
      if(!Audio.current.ctx) Audio.current.init();
      else if(Audio.current.ctx.state === 'suspended') Audio.current.ctx.resume();
      
      setGameStarted(true);
      resetGame();
  };

  const resetGame = () => {
    const { height, laneX } = G.current;
    G.current.player.lane = 1; G.current.player.x = laneX[1]; G.current.player.targetX = laneX[1]; G.current.player.y = height - 180;
    G.current.enemies = []; G.current.coins = []; G.current.powerups = []; G.current.particles = [];
    G.current.speed = 0; G.current.distance = 0; G.current.currentMoney = 0; G.current.currentHealth = 100;
    G.current.roadLines = Array.from({length: 20}, (_, i) => i * 100);
    G.current.theme = ZONES[0].colors;
    
    setScore(0); setMoney(0); setNitro(100); setHealth(100); setShield(0); setGameOver(false); 
    G.current.active = true;
  };

  const handleKeyDown = (e) => {
      const k = e.code;
      if (k === 'ArrowLeft' || k === 'KeyA') changeLane(-1);
      if (k === 'ArrowRight' || k === 'KeyD') changeLane(1);
      if (k === 'Space') keys.current.Space = true;
      if (k === 'ArrowDown' || k === 'KeyS') keys.current.Down = true;
  };

  const handleKeyUp = (e) => {
      if (e.code === 'Space') keys.current.Space = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') keys.current.Down = false;
  };

  const changeLane = (dir) => {
      const p = G.current.player;
      const next = p.lane + dir;
      if (next >= 0 && next < 4) {
          p.lane = next; p.targetX = G.current.laneX[next]; p.tilt = dir * 25;
          spawnParticles(p.x, p.y + p.h, 6, '#333', 3);
      }
  };

  // --- GAME LOOP ---
  const gameLoop = () => {
    const { ctx, width, height, player, roadLines, laneX } = G.current;
    G.current.frame++;

    // 1. SOUND UPDATE
    Audio.current.updateEngine(G.current.speed);
    const policePresent = G.current.enemies.some(e => e.type === 'POLICE');
    Audio.current.toggleSiren(policePresent);

    // 2. PHYSICS
    if (keys.current.Space && nitro > 0) {
        G.current.isBoosting = true; G.current.speed += 0.8;
        if(G.current.speed > G.current.maxSpeed + 25) G.current.speed = G.current.maxSpeed + 25;
        setNitro(n => Math.max(0, n - 0.5));
        ctx.save(); ctx.translate((Math.random()-0.5)*6, (Math.random()-0.5)*6);
    } else if (keys.current.Down) {
        G.current.isBoosting = false; G.current.isBraking = true; G.current.speed *= 0.92;
        if(G.current.speed < 5) G.current.speed = 5;
        setNitro(n => Math.min(100, n + 0.3));
    } else {
        G.current.isBoosting = false; G.current.isBraking = false;
        const target = G.current.baseSpeed + (G.current.distance * 0.001); 
        G.current.speed += (target - G.current.speed) * 0.05;
        setNitro(n => Math.min(100, n + 0.1));
    }

    if (shield > 0) setShield(s => Math.max(0, s - 0.1));

    setSpeedDisplay(Math.floor(G.current.speed * 8));
    G.current.distance += G.current.speed * 0.1;
    const dist = Math.floor(G.current.distance);
    setScore(dist);

    // 3. ZONE LOGIC
    let currentZone = ZONES[0];
    let nextZoneLimit = ZONES[1].limit;
    for (let i = 0; i < ZONES.length; i++) {
        if (dist >= ZONES[i].limit) {
            currentZone = ZONES[i];
            nextZoneLimit = ZONES[i+1] ? ZONES[i+1].limit : dist + 10000;
        }
    }
    G.current.theme = currentZone.colors;
    setZone({ name: currentZone.name, progress: Math.min(100, ((dist - currentZone.limit) / (nextZoneLimit - currentZone.limit)) * 100) });

    // 4. DRAW
    ctx.fillStyle = G.current.theme.ground; ctx.fillRect(0, 0, width, height);
    if (dist >= 15000) { ctx.fillStyle = '#FFF'; for(let i=0; i<30; i++) ctx.fillRect(Math.random()*width, Math.random()*height, 2, G.current.speed*4); }

    const roadW = G.current.laneWidth * 4; const roadX = (width - roadW) / 2;
    if (dist >= 15000) {
        ctx.strokeStyle = '#D500F9'; ctx.lineWidth = 2; ctx.beginPath();
        for(let i=0; i<=4; i++) { const lx = roadX + G.current.laneWidth * i; ctx.moveTo(lx, 0); ctx.lineTo(lx, height); }
        ctx.stroke();
    } else {
        ctx.fillStyle = G.current.theme.road; ctx.fillRect(roadX, 0, roadW, height);
        ctx.fillStyle = G.current.theme.line; ctx.fillRect(roadX - 15, 0, 15, height); ctx.fillRect(roadX + roadW, 0, 15, height);
    }

    ctx.fillStyle = G.current.theme.line;
    roadLines.forEach((y, i) => {
        G.current.roadLines[i] += G.current.speed;
        if (G.current.roadLines[i] > height) G.current.roadLines[i] = -100;
        if (dist < 15000) for(let j=1; j<4; j++) ctx.fillRect(roadX + G.current.laneWidth * j - 2, G.current.roadLines[i], 4, 60);
    });

    // 5. ENTITIES
    player.x += (player.targetX - player.x) * 0.2; player.tilt *= 0.85;
    drawLambo(ctx, player.x, player.y, player.w, player.h, '#00E5FF', player.tilt, true, false);
    
    if (shield > 0) {
        ctx.save(); ctx.translate(player.x, player.y);
        ctx.strokeStyle = `rgba(0, 229, 255, ${Math.sin(G.current.frame*0.2)*0.3 + 0.5})`;
        ctx.lineWidth = 4; ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
        ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.restore();
    }

    // Spawn
    if (Math.random() < 0.03) { 
        const l = Math.floor(Math.random() * 4); const ex = laneX[l];
        if (isSafeSpawn(ex)) G.current.coins.push({ x: ex, y: -150, w: 40 });
    }
    if (Math.random() < 0.005) { 
        const l = Math.floor(Math.random() * 4); const ex = laneX[l];
        if (isSafeSpawn(ex)) G.current.powerups.push({ x: ex, y: -150, type: 'SHIELD' });
    }
    if (Math.random() < 0.02 + (dist * 0.000008)) { 
        const l = Math.floor(Math.random() * 4); const ex = laneX[l];
        if (isSafeSpawn(ex)) {
            const isPolice = Math.random() > 0.7 && dist > 1000;
            G.current.enemies.push({ x: ex, y: -150, w: 64, h: 110, speedOffset: Math.random() * 4 + 2, type: isPolice ? 'POLICE' : 'CIVILIAN', color: isPolice ? '#111' : ['#F44336', '#FFEB3B', '#FFF', '#76FF03'][Math.floor(Math.random()*4)] });
        }
    }

    updateEntities();
    if (G.current.isBoosting) ctx.restore();
  };

  const isSafeSpawn = (x) => {
      const { coins, enemies, powerups } = G.current;
      return coins.every(c => Math.abs(c.y - (-150)) > 100) && enemies.every(e => Math.abs(e.y - (-150)) > 250) && powerups.every(p => Math.abs(p.y - (-150)) > 100);
  };

  const updateEntities = () => {
      const { ctx, player, height } = G.current;

      for (let i = G.current.coins.length - 1; i >= 0; i--) {
          let c = G.current.coins[i]; c.y += G.current.speed;
          drawIcon(ctx, c.x, c.y, '$', '#FFD700');
          if (checkCollision(player, c, 50)) {
              Audio.current.playCollect('COIN'); // SOUND
              G.current.currentMoney += 20; setMoney(G.current.currentMoney); 
              spawnParticles(c.x, c.y, 10, '#FFD700', 5); G.current.coins.splice(i, 1);
          } else if (c.y > height + 100) G.current.coins.splice(i, 1);
      }

      for (let i = G.current.powerups.length - 1; i >= 0; i--) {
          let p = G.current.powerups[i]; p.y += G.current.speed;
          drawIcon(ctx, p.x, p.y, '🛡️', '#00E5FF');
          if (checkCollision(player, p, 50)) {
              Audio.current.playCollect('SHIELD'); // SOUND
              setShield(100); spawnParticles(p.x, p.y, 20, '#00E5FF', 8); G.current.powerups.splice(i, 1);
          } else if (p.y > height + 100) G.current.powerups.splice(i, 1);
      }

      for (let i = G.current.enemies.length - 1; i >= 0; i--) {
          let e = G.current.enemies[i]; 
          e.y += G.current.speed * 0.85 - e.speedOffset;
          drawLambo(ctx, e.x, e.y, e.w, e.h, e.color, 0, false, e.type === 'POLICE');

          if (checkCollision(player, e, 55)) {
              Audio.current.playCrash(); // SOUND
              if (shield > 0) {
                  spawnParticles(e.x, e.y, 40, '#FF5722', 15); setShield(0); G.current.enemies.splice(i, 1);
              } else {
                  const dmg = e.type === 'POLICE' ? 50 : 25; G.current.currentHealth -= dmg; setHealth(G.current.currentHealth);
                  spawnParticles(player.x, player.y, 30, '#FF0000', 10); e.y += 200; e.x += (Math.random() > 0.5 ? 100 : -100);
                  if (G.current.currentHealth <= 0) endGame();
              }
          }
          if (e.y > height + 200) G.current.enemies.splice(i, 1);
      }

      for (let i = G.current.particles.length - 1; i >= 0; i--) {
          let p = G.current.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05;
          if(p.life <= 0) G.current.particles.splice(i, 1); 
          else { ctx.fillStyle = p.color; ctx.globalAlpha = p.life; ctx.fillRect(p.x, p.y, p.size, p.size); ctx.globalAlpha = 1; }
      }
  };

  const checkCollision = (p, e, dist) => Math.abs(p.x - e.x) < dist && Math.abs(p.y - e.y) < dist + 20;

  const drawLambo = (ctx, x, y, w, h, color, tilt, isPlayer, isPolice) => {
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt * Math.PI / 180);
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.ellipse(0, h/2, w/1.4, h/4, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -h/2); ctx.lineTo(w/2, -h/2+20); ctx.lineTo(w/2, h/2-5); ctx.lineTo(w/2-10, h/2); ctx.lineTo(-w/2+10, h/2); ctx.lineTo(-w/2, h/2-5); ctx.lineTo(-w/2, -h/2+20); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(-w/2+10, -h/2+35); ctx.lineTo(w/2-10, -h/2+35); ctx.lineTo(w/2-15, h/2-30); ctx.lineTo(-w/2+15, h/2-30); ctx.fill();
      if (isPolice) { const tick = Math.floor(Date.now() / 100) % 2; ctx.fillStyle = tick ? '#F00' : '#00F'; ctx.fillRect(-w/2+5, -h/2+25, w/2-5, 8); ctx.fillStyle = tick ? '#00F' : '#F00'; ctx.fillRect(0, -h/2+25, w/2-5, 8); ctx.shadowBlur = 20; ctx.shadowColor = tick ? 'red' : 'blue'; ctx.fillRect(-w/2, -h/2+25, w, 8); ctx.shadowBlur = 0; }
      if (isPlayer || isPolice || zone.name !== "🌲 GREEN VALLEY") { ctx.fillStyle = '#FFF'; ctx.fillRect(-22, -h/2+5, 8, 5); ctx.fillRect(14, -h/2+5, 8, 5); ctx.fillStyle = (isPlayer && G.current.isBraking) ? '#FF0000' : '#880000'; ctx.shadowBlur = (isPlayer && G.current.isBraking) ? 20 : 0; ctx.shadowColor='red'; ctx.fillRect(-22, h/2-6, 10, 6); ctx.fillRect(12, h/2-6, 10, 6); ctx.shadowBlur=0; }
      if (isPlayer && G.current.isBoosting) { ctx.fillStyle = '#00FFFF'; ctx.shadowBlur = 20; ctx.shadowColor = 'cyan'; ctx.beginPath(); ctx.moveTo(-15, h/2); ctx.lineTo(-10, h/2+40+Math.random()*20); ctx.lineTo(-5, h/2); ctx.fill(); ctx.beginPath(); ctx.moveTo(15, h/2); ctx.lineTo(10, h/2+40+Math.random()*20); ctx.lineTo(5, h/2); ctx.fill(); ctx.shadowBlur = 0; }
      ctx.restore();
  };

  const drawIcon = (ctx, x, y, char, color) => {
      ctx.save(); ctx.translate(x, y); ctx.scale(Math.sin(G.current.frame * 0.1)+1.2, 1.2);
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.font = 'bold 20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline='middle'; ctx.fillText(char, 0, 2);
      ctx.restore();
  };

  const spawnParticles = (x, y, count, color, speed) => { for(let i=0; i<count; i++) G.current.particles.push({ x: x+(Math.random()-0.5)*20, y: y, vx: (Math.random()-0.5)*5, vy: Math.random()*speed, size: Math.random()*4+2, life: 1.0, color: color }); };

  const endGame = () => {
      G.current.active = false; setGameOver(true);
      Audio.current.playCrash(); // Final Crash Sound
      
      // Stop Engine/Siren
      if(Audio.current.engineGain) Audio.current.engineGain.gain.value = 0;
      if(Audio.current.sirenGain) Audio.current.sirenGain.gain.value = 0;

      const total = totalMoney + G.current.currentMoney;
      setTotalMoney(total); localStorage.setItem('racer_total_money', total);
      if(score > highScore) { setHighScore(score); localStorage.setItem('racer_god_score', score); }
  };

  // --- STYLES ---
  const styles = {
      container: { width: '100vw', height: '100vh', overflow: 'hidden', background: '#000', cursor: 'none', position: 'relative' },
      hud: { 
          position: 'absolute', top: 20, left: 20, zIndex: 10, width: '300px',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(20,20,20,0.9))', 
          padding: '20px', borderRadius: '15px', border: '1px solid #333',
          color: 'white', fontFamily: '"Segoe UI", sans-serif', boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
      },
      exitBtn: {
          position: 'absolute', top: 20, right: 20, zIndex: 50, padding: '10px 30px',
          background: 'rgba(255, 0, 0, 0.2)', border: '2px solid rgba(255, 255, 255, 0.3)',
          color: 'white', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer',
          backdropFilter: 'blur(5px)'
      },
      barContainer: { width: '100%', height: '8px', background: '#333', marginTop: '8px', borderRadius: '4px', overflow: 'hidden' },
      zoneFill: { height: '100%', width: `${zone.progress}%`, background: 'linear-gradient(90deg, #FF9800, #D500F9)', transition: 'width 0.2s' },
      overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', zIndex: 20 }
  };

  const handleExit = () => {
      if(Audio.current.ctx) Audio.current.ctx.close();
      navigate('/');
  };

  return (
    <div style={styles.container}>
      {/* EXIT BUTTON */}
      <button style={styles.exitBtn} onClick={handleExit}>EXIT GAME</button>

      {/* START SCREEN (Needed for Audio) */}
      {!gameStarted && (
          <div style={styles.overlay} onClick={startGame}>
              <h1 style={{fontSize:'5rem', color:'#00E5FF', margin:0, textShadow:'0 0 30px cyan'}}>HIGHWAY RACER</h1>
              <p style={{fontSize:'1.5rem', color:'#AAA', marginTop:'10px'}}>CLICK TO START ENGINE</p>
              <button style={{marginTop:'30px', padding:'15px 50px', fontSize:'1.5rem', background:'#00E5FF', border:'none', borderRadius:'50px', fontWeight:'bold', cursor:'pointer'}}>PLAY NOW 🔊</button>
          </div>
      )}

      {gameStarted && (
      <div style={styles.hud}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div style={{fontSize:'3.5rem', fontWeight:'900', fontStyle:'italic', lineHeight:1, color: G.current.isBoosting?'cyan':'white'}}>{speedDisplay}</div>
              <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'1.2rem', fontWeight:'bold'}}>GEAR {Math.min(7, Math.floor(speedDisplay/40)+1)}</div>
                  <div style={{fontSize:'0.8rem', color:'#888'}}>MPH</div>
              </div>
          </div>
          
          <div style={{marginTop:'15px', fontWeight:'bold', display:'flex', justifyContent:'space-between'}}>
              <span style={{color: health>30?'#00E676':'#F44336'}}>HEALTH {health}%</span>
              <span style={{color: '#FFD700'}}>${money}</span>
          </div>
          <div style={styles.barContainer}>
              <div style={{height:'100%', width:`${health}%`, background: health>30?'#00E676':'#F44336', transition:'width 0.2s'}} />
          </div>

          <div style={{marginTop:'10px', fontSize:'0.8rem', color:'#aaa'}}>NITRO / SHIELD</div>
          <div style={styles.barContainer}>
              <div style={{height:'100%', width:`${Math.max(nitro, shield)}%`, background: shield>0 ? '#2979FF' : '#FF9800', transition:'width 0.1s'}} />
          </div>

          <div style={{marginTop:'15px', fontSize:'0.8rem', color:'#aaa', letterSpacing:'1px'}}>{zone.name}</div>
          <div style={styles.barContainer}><div style={styles.zoneFill} /></div>
      </div>
      )}

      {gameStarted && (
      <div style={{position:'absolute', bottom:20, left:20, color:'rgba(255,255,255,0.4)', fontFamily:'monospace'}}>
          WASD/ARROWS • SPACE (Boost) • S (Brake)
      </div>
      )}

      {gameOver && (
          <div style={styles.overlay}>
              <h1 style={{fontSize:'7rem', color:'#D32F2F', margin:0, textShadow:'0 0 50px red', fontFamily:'Impact'}}>WASTED</h1>
              <div style={{textAlign:'center', marginTop:'20px'}}>
                  <div style={{fontSize:'2.5rem', color:'#FFD700', fontWeight:'bold'}}>${money}</div>
                  <div style={{fontSize:'1.2rem', color:'#AAA'}}>TOTAL LOOT: ${totalMoney}</div>
                  <hr style={{borderColor:'#333', width:'200px', margin:'20px auto'}}/>
                  <div style={{fontSize:'1.5rem', color:'#FFF'}}>DISTANCE: {score}m</div>
                  <div style={{color:'#00E5FF'}}>RECORD: {highScore}m</div>
              </div>
              <button onClick={resetGame} style={{marginTop:'40px', padding:'20px 80px', fontSize:'1.5rem', fontWeight:'bold', background: 'linear-gradient(45deg, #FF6F00, #FFD700)', border:'none', borderRadius:'50px', cursor:'pointer', color:'#000', boxShadow:'0 0 40px #FF6F00'}}>DRIVE AGAIN</button>
          </div>
      )}
      <canvas ref={canvasRef} style={{display:'block'}} />
    </div>
  );
};

export default HighwayRacer;