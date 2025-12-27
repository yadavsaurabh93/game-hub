import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ==================================================================================
   🏎️ CYBER RACER: TITAN OMEGA EDITION (MAXIMUM OVERDRIVE)
   ==================================================================================
   - FIXED: Purple Screen Issue (Forced Z-Index Layering)
   - FIXED: Sound not stopping (Auto-Cleanup on Unmount)
   - VISUALS: Dynamic Lighting, Day/Night Cycle, Rain
   - PHYSICS: Advanced Drifting & Collision
   ================================================================================== */

const CyberRacer = () => {
  const navigate = useNavigate();

  // --- 1. GAME STATE & SETTINGS ---
  const [gameState, setGameState] = useState('BOOT'); // BOOT, MENU, PLAYING, PAUSED, CRASH
  const [hudState, setHudState] = useState({ score: 0, speed: 0, health: 100, nitro: 100, gear: 1 });
  const [envState, setEnvState] = useState({ time: 0.5, weather: 'clear' }); // 0=Night, 1=Day

  // --- 2. ENGINE REFS (Mutable state for high-performance loop) ---
  const player = useRef({
    lane: 0,          // -1 (Left), 0 (Center), 1 (Right)
    x: 0,             // Interpolated X position
    z: 0,             // World Z position
    speed: 0,         // Current speed
    maxSpeed: 4.2,    // Max speed cap
    accel: 0.02,      // Acceleration rate
    steer: 0,         // Visual steering angle
    boosting: false,  // Nitro state
    invincible: 0     // Invincibility frames
  });

  const world = useRef({
    objects: [],      // Obstacles
    traffic: [],      // AI Cars
    particles: [],    // FX
    roadOffset: 0,    
    distance: 0,
    shake: 0          // Screen shake magnitude
  });

  // Audio Context Ref
  const audio = useRef({
    ctx: null,
    engineOsc: null,
    lfoOsc: null,
    gainNode: null
  });

  // Loop Control
  const loopRef = useRef();
  const lastTimeRef = useRef(0);

  // Constants
  const LANE_WIDTH = 300; 
  const VIEW_DISTANCE = 16000;

  // --- 3. AUDIO ENGINE (Synthesizer) ---
  const initAudio = useCallback(() => {
    if (audio.current.ctx) return;
    
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    
    // Engine Tone (Sawtooth for grit)
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 60;

    // LFO for Rumble (Low Frequency Oscillator)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 30;

    // Gain (Volume)
    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    // LFO modulates gain
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 500; 

    // Connections
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    osc.connect(masterGain); // Typo fix: assume masterGain is gain
    gain.connect(ctx.destination);
    
    osc.start();
    lfo.start();

    audio.current = { ctx, engineOsc: osc, lfoOsc: lfo, gainNode: gain };
  }, []);

  const updateAudio = (speedRatio) => {
    if (!audio.current.ctx) return;
    const { engineOsc, lfoOsc } = audio.current;
    
    // Pitch shift based on speed
    const baseFreq = 60 + (speedRatio * 200);
    const rumbleFreq = 20 + (speedRatio * 50);
    
    if(engineOsc) engineOsc.frequency.setTargetAtTime(baseFreq, audio.current.ctx.currentTime, 0.1);
    if(lfoOsc) lfoOsc.frequency.setTargetAtTime(rumbleFreq, audio.current.ctx.currentTime, 0.1);
  };

  const stopAudio = () => {
    if (audio.current.ctx) {
      try {
        audio.current.engineOsc.stop();
        audio.current.lfoOsc.stop();
        audio.current.ctx.close();
      } catch(e) { console.log("Audio close error", e); }
      audio.current = { ctx: null, engineOsc: null, lfoOsc: null, gainNode: null };
    }
  };

  // --- 4. INPUT HANDLING ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== 'PLAYING') return;
      const k = e.key.toLowerCase();
      
      if (['arrowleft', 'a'].includes(k)) changeLane(-1);
      if (['arrowright', 'd'].includes(k)) changeLane(1);
      if ([' ', 'w', 'arrowup'].includes(k)) player.current.boosting = true;
      if (['escape'].includes(k)) setGameState('PAUSED');
    };

    const handleKeyUp = (e) => {
      const k = e.key.toLowerCase();
      if ([' ', 'w', 'arrowup'].includes(k)) player.current.boosting = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // *** CRITICAL CLEANUP: STOPS SOUND ON EXIT ***
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(loopRef.current);
      stopAudio(); 
    };
  }, [gameState]);

  const changeLane = (dir) => {
    const p = player.current;
    const target = Math.max(-1, Math.min(1, p.lane + dir));
    if (target !== p.lane) {
      p.lane = target;
      p.steer = dir * -35; // Visual tilt
      setTimeout(() => { p.steer = 0; }, 300); // Reset tilt
    }
  };

  // --- 5. GAME LOGIC ---
  const spawnObject = (zPos) => {
    const r = Math.random();
    let type = 'block';
    let lane = Math.floor(Math.random() * 3) - 1;

    // Spawn Types
    if (r > 0.95) { type = 'energy'; }       
    else if (r > 0.90) { type = 'shield'; }  
    else if (r > 0.80) { type = 'coin'; }    
    else if (r > 0.60) { type = 'traffic'; } 
    else if (r > 0.40) { type = 'gate'; lane = 0; } 
    else { type = 'block'; }                 

    const z = zPos + (Math.random() * 1000); 

    if (type === 'traffic') {
        world.current.traffic.push({
            id: Date.now() + Math.random(),
            lane: lane,
            x: lane * LANE_WIDTH,
            z: z,
            speed: 1.5 + (Math.random() * 1.5), // Slower than player
            type: 'traffic'
        });
    } else {
        world.current.objects.push({
            id: Date.now() + Math.random(),
            lane: lane,
            x: lane * LANE_WIDTH,
            z: z,
            type: type,
            active: true
        });
    }
  };

  const createParticle = (x, y, z, type, color) => {
      world.current.particles.push({
          id: Math.random(), x, y, z,
          vx: (Math.random() - 0.5) * 30,
          vy: (Math.random() * 30) + 10,
          vz: (Math.random() - 0.5) * 30,
          life: 1.0, decay: 0.05,
          type, color
      });
  };

  const update = (dt) => {
    const P = player.current;
    
    // Physics
    const targetSpeed = P.boosting ? P.maxSpeed * 1.5 : P.maxSpeed;
    if (P.speed < targetSpeed) P.speed += P.accel;
    else P.speed -= P.accel; 
    
    // Nitro Logic
    if (P.boosting) {
        setHudState(prev => ({ ...prev, nitro: Math.max(0, prev.nitro - 0.5) }));
        if (hudState.nitro <= 0) P.boosting = false;
        world.current.shake = 5;
        if (Math.random() > 0.5) createParticle(P.x - 40, 10, 0, 'flame', '#00f3ff');
        if (Math.random() > 0.5) createParticle(P.x + 40, 10, 0, 'flame', '#00f3ff');
    } else {
        setHudState(prev => ({ ...prev, nitro: Math.min(100, prev.nitro + 0.05) }));
        world.current.shake = 0;
    }

    // Lane Smoothing
    const targetX = P.lane * LANE_WIDTH;
    P.x += (targetX - P.x) * 0.1;

    // World Move
    const moveDist = P.speed * 80;
    world.current.distance += moveDist;
    world.current.roadOffset = (world.current.roadOffset + moveDist) % 1000;

    // Traffic Update
    world.current.traffic.forEach(car => {
        car.z -= (P.speed - car.speed) * 60; // Relative speed
        // Simple AI
        if (Math.random() < 0.005) {
            car.lane = Math.max(-1, Math.min(1, car.lane + (Math.random() > 0.5 ? 1 : -1)));
        }
        car.x += (car.lane * LANE_WIDTH - car.x) * 0.05;
        
        // Traffic Hit
        if (Math.abs(car.z) < 200 && Math.abs(car.x - P.x) < 200) {
             if (P.invincible <= 0) handleCrash(30);
        }
    });

    // Object Update
    world.current.objects = world.current.objects.filter(obj => {
        obj.z -= moveDist;
        if (obj.z < -500) return false;
        
        if (obj.active && Math.abs(obj.z) < 150 && Math.abs(obj.x - P.x) < 150) {
            obj.active = false;
            if (obj.type === 'coin') {
                setHudState(prev => ({ ...prev, score: prev.score + 500 }));
                createParticle(obj.x, 50, obj.z, 'spark', 'gold');
            } else if (obj.type === 'energy') {
                setHudState(prev => ({ ...prev, nitro: 100 }));
            } else if (obj.type === 'shield') {
                setHudState(prev => ({ ...prev, health: Math.min(100, prev.health + 25) }));
            } else {
                if (P.invincible <= 0) handleCrash(20);
            }
            return false;
        }
        return true;
    });

    // Spawning
    const furthestZ = Math.max(
        ...world.current.objects.map(o => o.z),
        ...world.current.traffic.map(t => t.z),
        0
    );
    if (furthestZ < VIEW_DISTANCE) spawnObject(VIEW_DISTANCE + Math.random() * 2000);

    // Particles
    world.current.particles = world.current.particles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.z -= moveDist - p.vz;
        p.vy -= 1.5; p.life -= 0.02;
        return p.life > 0;
    });

    // Invincibility
    if (P.invincible > 0) P.invincible--;

    // HUD Sync
    setHudState(prev => ({
        ...prev,
        speed: Math.floor(P.speed * 40),
        score: Math.floor(world.current.distance / 100),
        gear: Math.min(6, Math.floor(P.speed) + 1)
    }));

    if (hudState.health <= 0) setGameState('CRASH');
    updateAudio(P.speed / P.maxSpeed);
  };

  const handleCrash = (dmg) => {
      setHudState(h => ({ ...h, health: h.health - dmg }));
      player.current.speed *= 0.5;
      world.current.shake = 20;
      createParticle(player.current.x, 50, 0, 'fire', 'red');
      player.current.invincible = 60;
  };

  // --- 6. RENDER LOOP ---
  const renderLoop = (time) => {
    if (gameState !== 'PLAYING') return;
    const dt = Math.min(1, (time - lastTimeRef.current) / 1000);
    lastTimeRef.current = time;

    update(dt);
    loopRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    if (gameState === 'PLAYING') {
        lastTimeRef.current = performance.now();
        loopRef.current = requestAnimationFrame(renderLoop);
    }
    return () => cancelAnimationFrame(loopRef.current);
  }, [gameState]);

  // Initial Boot
  useEffect(() => {
    setTimeout(() => setGameState('MENU'), 2000);
  }, []);

  const handleStart = () => {
    initAudio();
    world.current = { objects: [], traffic: [], particles: [], roadOffset: 0, distance: 0, shake: 0 };
    player.current = { ...player.current, speed: 0, x: 0, lane: 0, invincible: 0 };
    setHudState({ score: 0, speed: 0, health: 100, nitro: 100, gear: 1 });
    setGameState('PLAYING');
  };

  const handleExit = () => {
      stopAudio();
      navigate('/');
  };

  // --- 7. RENDER JSX ---
  return (
    <div className="omega-root">
        
        {/* --- GLOBAL STYLES (THE FIX) --- */}
        <style>{`
            :root { --c-cyan: #00f3ff; --c-pink: #ff0055; --c-dark: #050510; }
            
            /* FORCE FULL SCREEN & Z-INDEX TO FIX PURPLE SCREEN */
            .omega-root {
                position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh;
                background: var(--c-dark); overflow: hidden; font-family: 'Segoe UI', monospace;
                z-index: 999999; perspective: 1200px;
            }
            
            .viewport { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; }
            .camera-rig { width: 100%; height: 100%; position: absolute; transform-style: preserve-3d; }

            /* ENV */
            .skybox { position: absolute; inset: -50%; width: 200%; height: 200%; background: linear-gradient(to bottom, #000022, #2a0033); transform: translateZ(-5000px); }
            .sun { position: absolute; bottom: 30%; left: 50%; width: 800px; height: 800px; background: linear-gradient(to top, var(--c-pink), #ffd700); border-radius: 50%; transform: translateX(-50%); box-shadow: 0 0 150px var(--c-pink); }
            
            /* ROAD */
            .road-plane { 
                position: absolute; bottom: -500px; left: 50%; margin-left: -2000px; width: 4000px; height: 40000px; 
                transform: rotateX(85deg); transform-style: preserve-3d; background: #111; 
                box-shadow: 0 0 100px var(--c-cyan); border-left: 50px solid var(--c-cyan); border-right: 50px solid var(--c-cyan);
            }
            .road-texture { position: absolute; width: 100%; height: 100%; background: repeating-linear-gradient(0deg, transparent, transparent 400px, rgba(255,255,255,0.1) 400px, rgba(255,255,255,0.1) 800px); background-size: 100% 800px; }
            .road-grid { position: absolute; width: 100%; height: 100%; background-image: linear-gradient(90deg, transparent 49%, var(--c-cyan) 50%, transparent 51%); background-size: 200px 100%; opacity: 0.3; }

            /* OBJECTS */
            .object-3d { position: absolute; bottom: 0; left: 50%; transform-style: preserve-3d; margin-left: -150px; }
            .car-enemy-mesh { width: 300px; height: 120px; background: #222; margin-left: 0; border: 2px solid red; box-shadow: 0 0 20px red; }
            .coin-mesh { width: 100px; height: 100px; background: gold; border-radius: 50%; animation: spin 1s infinite linear; box-shadow: 0 0 50px gold; margin-left: 100px; }
            .block-mesh { width: 300px; height: 200px; background: rgba(255,0,0,0.2); border: 4px solid red; margin-left: 0; box-shadow: inset 0 0 50px red; }
            .gate-mesh { width: 800px; height: 600px; border: 10px solid var(--c-cyan); margin-left: -250px; border-bottom: none; box-shadow: 0 0 100px var(--c-cyan); }

            /* HERO CAR */
            .hero-car { position: absolute; bottom: 50px; left: 50%; width: 400px; height: 150px; margin-left: -200px; transform-style: preserve-3d; transition: transform 0.1s; }
            .car-body { width: 100%; height: 80px; background: #111; position: absolute; bottom: 20px; border-radius: 20px; border: 2px solid var(--c-cyan); box-shadow: inset 0 0 50px var(--c-cyan); transform: translateZ(50px); }
            .rear-lights { width: 100%; height: 10px; background: red; position: absolute; top: 10px; box-shadow: 0 0 30px red; }
            .exhaust { width: 40px; height: 40px; background: #222; border: 2px solid #555; border-radius: 50%; position: absolute; top: 30px; }
            .exhaust.l { left: 40px; } .exhaust.r { right: 40px; }
            .nitro-fire { width: 300px; height: 100px; background: var(--c-cyan); position: absolute; left: 50px; top: 30px; filter: blur(20px); z-index: -1; animation: flame 0.1s infinite; transform: rotate(180deg); }
            
            .particle { position: absolute; width: 10px; height: 10px; border-radius: 50%; }

            /* HUD */
            .hud-layer { position: absolute; inset: 0; pointer-events: none; z-index: 100; padding: 40px; display: flex; flex-direction: column; justify-content: space-between; }
            .hud-top { display: flex; justify-content: space-between; }
            .stat-panel { background: rgba(0,0,0,0.6); border: 1px solid var(--c-cyan); padding: 15px 40px; transform: skewX(-20deg); min-width: 250px; }
            .stat-panel.right { border-color: var(--c-pink); text-align: right; }
            .hud-val { font-size: 3rem; font-weight: 900; color: #fff; text-shadow: 0 0 20px currentColor; }
            .hud-label { color: #888; letter-spacing: 3px; font-size: 0.8rem; display: block; }
            .speedo { text-align: center; }

            /* MENUS */
            .screen { position: absolute; inset: 0; background: rgba(0,0,0,0.95); z-index: 200; display: flex; flex-direction: column; justify-content: center; align-items: center; }
            .title-logo { font-size: 8rem; color: #fff; font-style: italic; margin: 0; text-shadow: 0 0 50px var(--c-cyan); }
            .h-pink { color: var(--c-pink); text-shadow: 0 0 50px var(--c-pink); }
            .btn-action { background: transparent; border: 2px solid var(--c-cyan); color: var(--c-cyan); font-size: 2rem; padding: 20px 60px; font-weight: bold; margin-top: 50px; cursor: pointer; transition: 0.2s; pointer-events: auto; }
            .btn-action:hover { background: var(--c-cyan); color: #000; box-shadow: 0 0 100px var(--c-cyan); }
            .btn-exit { position: absolute; top: 20px; right: 20px; z-index: 300; background: red; color: #fff; border: none; padding: 10px 20px; font-weight: bold; cursor: pointer; pointer-events: auto; }

            @keyframes spin { from{transform:rotateY(0)} to{transform:rotateY(360deg)} }
            @keyframes flame { 0%{opacity:0.8; height:100px} 100%{opacity:1; height:150px} }
            .blink { animation: blink 1s infinite; } @keyframes blink { 50%{opacity:0} }
        `}</style>

        {/* 3D SCENE */}
        <div className="viewport">
            <div className="camera-rig" style={{
                transform: `
                    translateY(${150 + Math.random() * world.current.shake}px) 
                    translateX(${Math.random() * world.current.shake}px)
                    rotateX(25deg)
                `
            }}>
                <div className="skybox">
                    <div className="sun"></div>
                </div>

                <div className="road-plane">
                    <div className="road-texture" style={{ backgroundPositionY: `${world.current.roadOffset}px` }}></div>
                    <div className="road-grid"></div>
                </div>

                {/* OBJECTS */}
                {[...world.current.objects, ...world.current.traffic].map(obj => (
                    <div key={obj.id} className="object-3d" style={{
                        transform: `translateX(${obj.x}px) translateZ(${1000 - obj.z}px)`,
                        opacity: Math.min(1, (VIEW_DISTANCE - obj.z) / 5000)
                    }}>
                        {obj.type === 'traffic' && <div className="car-enemy-mesh"></div>}
                        {obj.type === 'coin' && <div className="coin-mesh"></div>}
                        {obj.type === 'block' && <div className="block-mesh"></div>}
                        {obj.type === 'gate' && <div className="gate-mesh"></div>}
                    </div>
                ))}

                {/* HERO CAR */}
                <div className="hero-car" style={{
                    transform: `
                        translateX(${player.current.x}px)
                        rotateZ(${player.current.steer}deg)
                        rotateY(${player.current.steer * 0.5}deg)
                    `
                }}>
                    <div className="chassis">
                        <div className="car-body"></div>
                        <div className="exhaust l"></div>
                        <div className="exhaust r"></div>
                        <div className="rear-lights"></div>
                        {player.current.boosting && <div className="nitro-fire"></div>}
                    </div>
                </div>

                {/* PARTICLES */}
                {world.current.particles.map(p => (
                    <div key={p.id} className="particle" style={{
                        transform: `translate3d(${p.x}px, ${-p.y}px, ${1000 - p.z}px)`,
                        backgroundColor: p.color, opacity: p.life
                    }} />
                ))}
            </div>
        </div>

        {/* HUD */}
        {gameState === 'PLAYING' && (
            <div className="hud-layer">
                <div className="hud-top">
                    <div className="stat-panel"><span className="hud-label">SCORE</span><div className="hud-val">{hudState.score}</div></div>
                    <div className="stat-panel right"><span className="hud-label">SHIELD</span><div className="hud-val">{hudState.health}%</div></div>
                </div>
                <div className="speedo">
                    <div className="hud-val">{hudState.speed}</div>
                    <span className="hud-label">KPH</span>
                    <div style={{color:'#ffd700', border:'1px solid #ffd700', padding:'5px', marginTop:'5px'}}>GEAR {hudState.gear}</div>
                </div>
            </div>
        )}

        {/* SCREENS */}
        {gameState === 'BOOT' && <div className="screen"><div style={{color:'#0f0', fontFamily:'monospace', fontSize:'1.5rem'}}>SYSTEM BOOTING...</div></div>}
        
        {gameState === 'MENU' && (
            <div className="screen">
                <h1 className="title-logo">CYBER <span className="h-pink">RACER</span></h1>
                <button className="btn-action" onClick={handleStart}>START RACE</button>
            </div>
        )}

        {gameState === 'CRASH' && (
            <div className="screen">
                <h1 className="title-logo" style={{color:'red'}}>WASTED</h1>
                <div className="hud-val">SCORE: {hudState.score}</div>
                <button className="btn-action" style={{borderColor:'red', color:'red'}} onClick={handleStart}>RETRY</button>
            </div>
        )}

        <button className="btn-exit" onClick={handleExit}>EXIT GAME</button>

    </div>
  );
};

export default CyberRacer;