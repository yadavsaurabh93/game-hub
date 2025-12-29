import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

/**
 * ============================================================================
 * HIGHWAY RACER: FINAL STABLE BUILD
 * ============================================================================
 * Features:
 * - Real World Theme (No Cyber/Neon)
 * - Working Pause/Exit/Resume
 * - Glitch-Free Rendering Engine
 * - Robust Error Handling
 * ============================================================================
 */

// --- UTILS ---
const Utils = {
  timestamp: () => new Date().getTime(),
  limit: (value, min, max) => Math.max(min, Math.min(value, max)),
  randomInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  randomChoice: (options) => options[Utils.randomInt(0, options.length - 1)],
  percentRemaining: (n, total) => (n % total) / total,
  accelerate: (v, accel, dt) => v + (accel * dt),
  interpolate: (a, b, percent) => a + (b - a) * percent,
  easeIn: (a, b, percent) => a + (b - a) * Math.pow(percent, 2),
  easeOut: (a, b, percent) => a + (b - a) * (1 - Math.pow(1 - percent, 2)),
  easeInOut: (a, b, percent) => a + (b - a) * ((-Math.cos(percent * Math.PI) / 2) + 0.5),
  project: (p, cameraX, cameraY, cameraZ, cameraDepth, width, height, roadWidth) => {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = cameraDepth / p.camera.z;
    p.screen.x = Math.round((width / 2) + (p.screen.scale * p.camera.x * width / 2));
    p.screen.y = Math.round((height / 2) - (p.screen.scale * p.camera.y * height / 2));
    p.screen.w = Math.round((p.screen.scale * roadWidth * width / 2));
  },
  overlap: (x1, w1, x2, w2, percent) => {
    var half = (percent || 1) / 2;
    var min1 = x1 - (w1 * half);
    var max1 = x1 + (w1 * half);
    var min2 = x2 - (w2 * half);
    var max2 = x2 + (w2 * half);
    return !((max1 < min2) || (min1 > max2));
  }
};

// --- CONFIG ---
const CFG = {
    fps: 60,
    width: 1024,
    height: 768,
    lanes: 3,
    roadWidth: 2000,
    segmentLength: 200,
    rumbleLength: 3,
    cameraHeight: 1000,
    drawDistance: 300,
    fieldOfView: 100,
    fogDensity: 5,
    maxSpeed: 12000,
    accel: 30,
    breaking: -80,
    decel: -30,
    offRoadDecel: -100,
    offRoadLimit: 2000,
    centrifugal: 0.3
};

const COLORS = {
    SKY:  '#72D7EE',
    TREE: '#005108',
    FOG:  '#005108',
    LIGHT:  { road: '#6B6B6B', grass: '#10AA10', rumble: '#555555', lane: '#CCCCCC'  },
    DARK:   { road: '#696969', grass: '#009A00', rumble: '#BBBBBB'                   },
    START:  { road: 'white',   grass: 'white',   rumble: 'white'                     },
    FINISH: { road: 'black',   grass: 'black',   rumble: 'black'                     }
};

// --- AUDIO (SAFE MODE) ---
class AudioController {
    constructor() {
        this.ctx = null;
        this.osc = null;
        this.gain = null;
    }
    init() {
        if(this.ctx) return;
        try {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AC();
            this.osc = this.ctx.createOscillator();
            this.gain = this.ctx.createGain();
            this.osc.type = 'sawtooth';
            this.osc.frequency.value = 60;
            this.gain.gain.value = 0.05;
            this.osc.connect(this.gain);
            this.gain.connect(this.ctx.destination);
            this.osc.start();
        } catch (e) {
            console.log("Audio failed to initialize, continuing without sound.");
        }
    }
    update(ratio) {
        if(this.ctx && this.osc) {
            this.osc.frequency.setTargetAtTime(60 + (ratio * 400), this.ctx.currentTime, 0.1);
        }
    }
    stop() {
        if(this.ctx) { this.ctx.close(); this.ctx = null; }
    }
}
const AudioSys = new AudioController();

// --- GAME COMPONENT ---
const RealisticRacer = () => {
    const navigate = useNavigate();
    const canvasRef = useRef(null);
    const frameId = useRef(null);

    // Game State Refs
    const G = useRef({
        speed: 0,
        position: 0,
        playerX: 0,
        score: 0,
        distance: 0,
        health: 100,
        nitro: 100,
        keyLeft: false, keyRight: false, keyFaster: false, keySlower: false, keyNitro: false,
        segments: [],
        cars: [],
        trackLength: 0,
        lastTime: 0,
        skyOffset: 0,
        hillOffset: 0,
        treeOffset: 0
    });

    const [uiState, setUiState] = useState("MENU"); // MENU, PLAY, PAUSED, OVER
    const [hud, setHud] = useState({ speed: 0, score: 0, health: 100 });

    // --- ROAD GENERATION ---
    const resetRoad = () => {
        G.current.segments = [];
        const addSegment = (curve, y) => {
            const n = G.current.segments.length;
            G.current.segments.push({
                index: n,
                p1: { world: { y: lastY(), z:  n   * CFG.segmentLength }, camera: {}, screen: {} },
                p2: { world: { y: y,       z: (n+1) * CFG.segmentLength }, camera: {}, screen: {} },
                curve: curve,
                sprites: [],
                cars: [],
                color: Math.floor(n/CFG.rumbleLength)%2 ? COLORS.DARK : COLORS.LIGHT
            });
        };
        const lastY = () => (G.current.segments.length === 0) ? 0 : G.current.segments[G.current.segments.length-1].p2.world.y;

        const addRoad = (enter, hold, leave, curve, y) => {
            const startY = lastY();
            const endY = startY + (Math.floor(y) * CFG.segmentLength);
            const total = enter + hold + leave;
            for(let n = 0; n < enter; n++) addSegment(Utils.easeIn(0, curve, n/enter), Utils.easeInOut(startY, endY, n/total));
            for(let n = 0; n < hold;  n++) addSegment(curve, Utils.easeInOut(startY, endY, (enter+n)/total));
            for(let n = 0; n < leave; n++) addSegment(Utils.easeInOut(curve, 0, n/leave), Utils.easeInOut(startY, endY, (enter+hold+n)/total));
        };

        // Generate Track
        addRoad(50, 50, 50, 0, 0); 
        addRoad(50, 50, 50, 2, 2000); 
        addRoad(50, 50, 50, -2, -2000); 
        addRoad(100, 100, 100, 0, 0);
        addRoad(50, 50, 50, 3, 0);
        addRoad(50, 50, 50, -3, 0);
        addRoad(200, 200, 200, 0, 0);

        G.current.trackLength = G.current.segments.length * CFG.segmentLength;

        // Reset Traffic
        G.current.cars = [];
        for (let n = 0; n < 40; n++) {
            const offset = Math.random() * G.current.segments.length;
            const z = offset * CFG.segmentLength;
            G.current.cars.push({
                offset: Utils.randomChoice([-0.5, 0.5]),
                z,
                speed: 3000 + Math.random() * 5000,
                color: ['#000', '#fff', '#800', '#224488'][Math.floor(Math.random()*4)]
            });
        }
    };

    // --- RENDERER ---
    const render = () => {
        const ctx = canvasRef.current.getContext('2d');
        const w = CFG.width;
        const h = CFG.height;
        const S = G.current;
        const baseSegment = S.segments[Math.floor(S.position/CFG.segmentLength) % S.segments.length];
        const basePercent = Utils.percentRemaining(S.position, CFG.segmentLength);
        const playerSegment = S.segments[Math.floor((S.position+CFG.cameraHeight)/CFG.segmentLength) % S.segments.length];
        const playerPercent = Utils.percentRemaining(S.position+CFG.cameraHeight, CFG.segmentLength);
        const playerY = Utils.interpolate(playerSegment.p1.world.y, playerSegment.p2.world.y, playerPercent);
        
        let x = 0;
        let dx = - (baseSegment.curve * basePercent);
        let maxY = h;

        ctx.clearRect(0,0,w,h);

        // 1. SKY & BACKGROUND
        const renderBack = () => {
            // Sky
            const grad = ctx.createLinearGradient(0,0,0,h);
            grad.addColorStop(0, '#4488ff'); grad.addColorStop(1, '#aaccff');
            ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
            
            // Mountains
            ctx.fillStyle = '#1e4d2b';
            ctx.beginPath(); ctx.moveTo(0, h/2);
            for(let i=0; i<=w; i+=20) {
                const offset = S.hillOffset * 1000;
                ctx.lineTo(i, h/2 - 50 - Math.sin((i+offset)*0.01)*50);
            }
            ctx.lineTo(w, h/2); ctx.fill();
        };
        renderBack();

        // 2. ROAD
        for(let n=0; n<CFG.drawDistance; n++) {
            const segment = S.segments[(baseSegment.index + n) % S.segments.length];
            const looped = segment.index < baseSegment.index;
            const camZ = S.position - (looped ? S.trackLength : 0);
            
            Utils.project(segment.p1, (S.playerX * CFG.roadWidth) - x,      CFG.cameraHeight + playerY, camZ, CFG.cameraHeight, w, h, CFG.roadWidth);
            Utils.project(segment.p2, (S.playerX * CFG.roadWidth) - x - dx, CFG.cameraHeight + playerY, camZ, CFG.cameraHeight, w, h, CFG.roadWidth);
            
            x += dx;
            dx += segment.curve;
            
            if (segment.p1.camera.z <= CFG.cameraHeight || segment.p2.screen.y >= maxY || segment.p2.screen.y >= segment.p1.screen.y) continue;
            
            // Draw Road
            const { x:x1, y:y1, w:w1 } = segment.p1.screen;
            const { x:x2, y:y2, w:w2 } = segment.p2.screen;

            // Grass
            ctx.fillStyle = segment.color.grass; ctx.fillRect(0, y2, w, y1-y2);
            // Rumble
            ctx.fillStyle = segment.color.rumble;
            const r1 = w1/5; const r2 = w2/5;
            ctx.beginPath(); ctx.moveTo(x1-w1-r1, y1); ctx.lineTo(x1-w1, y1); ctx.lineTo(x2-w2, y2); ctx.lineTo(x2-w2-r2, y2); ctx.fill();
            ctx.beginPath(); ctx.moveTo(x1+w1+r1, y1); ctx.lineTo(x1+w1, y1); ctx.lineTo(x2+w2, y2); ctx.lineTo(x2+w2+r2, y2); ctx.fill();
            // Road
            ctx.fillStyle = segment.color.road;
            ctx.beginPath(); ctx.moveTo(x1-w1, y1); ctx.lineTo(x1+w1, y1); ctx.lineTo(x2+w2, y2); ctx.lineTo(x2-w2, y2); ctx.fill();
            // Lane
            if(segment.color.lane) {
                ctx.fillStyle = segment.color.lane;
                const l1 = w1/40; const l2 = w2/40;
                ctx.beginPath(); ctx.moveTo(x1-l1, y1); ctx.lineTo(x1+l1, y1); ctx.lineTo(x2+l2, y2); ctx.lineTo(x2-l2, y2); ctx.fill();
            }
            
            maxY = y1;

            // Draw Traffic
            S.cars.forEach(car => {
                if(car.z >= segment.p1.world.z && car.z < segment.p2.world.z) {
                    const percent = Utils.percentRemaining(car.z, CFG.segmentLength);
                    const scale = Utils.interpolate(segment.p1.screen.scale, segment.p2.screen.scale, percent);
                    const cx = Utils.interpolate(segment.p1.screen.x, segment.p2.screen.x, percent) + (scale * car.offset * CFG.roadWidth * w/2);
                    const cy = Utils.interpolate(segment.p1.screen.y, segment.p2.screen.y, percent);
                    const cw = 400 * scale * w/2;
                    const ch = 200 * scale * w/2;
                    
                    ctx.fillStyle = car.color;
                    ctx.fillRect(cx - cw/2, cy - ch, cw, ch);
                    ctx.fillStyle = 'red';
                    ctx.fillRect(cx - cw/3, cy - ch*0.8, cw/4, ch/5);
                    ctx.fillRect(cx + cw/10, cy - ch*0.8, cw/4, ch/5);
                }
            });
        }

        // 3. DRAW PLAYER CAR
        const renderPlayer = () => {
            const cx = w/2;
            const cy = h - 100;
            const bounce = (Math.random() * (S.speed/CFG.maxSpeed) * 3);
            const steerAngle = (S.playerX * 10) + (S.keyLeft ? -5 : 0) + (S.keyRight ? 5 : 0);

            ctx.save();
            ctx.translate(cx, cy + bounce);
            ctx.rotate(steerAngle * Math.PI / 180);
            ctx.scale(3, 3); 

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.ellipse(0, 10, 50, 15, 0, 0, Math.PI*2); ctx.fill();
            // Body
            ctx.fillStyle = '#D00000';
            ctx.beginPath(); ctx.moveTo(-50, 0); ctx.lineTo(50, 0); ctx.lineTo(45, -20); ctx.lineTo(-45, -20); ctx.fill();
            // Roof
            ctx.fillStyle = '#222';
            ctx.beginPath(); ctx.moveTo(-40, -20); ctx.lineTo(40, -20); ctx.lineTo(35, -35); ctx.lineTo(-35, -35); ctx.fill();
            // Lights
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(-45, -5, 15, 8); ctx.fillRect(30, -5, 15, 8);
            
            if (S.keyNitro && S.nitro > 0) {
                ctx.fillStyle = '#00FFFF';
                ctx.beginPath(); ctx.moveTo(-25, 10); ctx.lineTo(-20, 30+Math.random()*10); ctx.lineTo(-15, 10); ctx.fill();
                ctx.beginPath(); ctx.moveTo(15, 10); ctx.lineTo(20, 30+Math.random()*10); ctx.lineTo(25, 10); ctx.fill();
            }
            ctx.restore();
        };
        renderPlayer();
    };

    // --- PHYSICS UPDATE ---
    const update = (dt) => {
        const S = G.current;
        const playerSegment = S.segments[Math.floor(S.position/CFG.segmentLength) % S.segments.length];
        
        // Speed
        const maxSpeed = S.keyNitro ? CFG.maxSpeed * 1.4 : CFG.maxSpeed;
        const accel = S.keyNitro ? CFG.accel * 1.5 : CFG.accel;

        if (S.keyFaster) S.speed = Utils.accelerate(S.speed, accel, dt);
        else if (S.keySlower) S.speed = Utils.accelerate(S.speed, CFG.breaking, dt);
        else S.speed = Utils.accelerate(S.speed, CFG.decel, dt);

        // Steering
        if (S.keyLeft) S.playerX = S.playerX - (dt * 2 * (S.speed/CFG.maxSpeed));
        else if (S.keyRight) S.playerX = S.playerX + (dt * 2 * (S.speed/CFG.maxSpeed));

        S.playerX = S.playerX - (dt * (S.speed/CFG.maxSpeed) * playerSegment.curve * CFG.centrifugal);
        
        if ((S.playerX < -1 || S.playerX > 1) && (S.speed > CFG.offRoadLimit)) {
            S.speed = Utils.accelerate(S.speed, CFG.offRoadDecel, dt);
        }
        S.playerX = Utils.limit(S.playerX, -2, 2);
        S.speed = Utils.limit(S.speed, 0, maxSpeed);
        S.position = (S.position + (S.speed * dt)) % S.trackLength;
        S.distance += S.speed * dt;

        // Nitro
        if(S.keyNitro && S.nitro > 0) S.nitro -= 25 * dt;
        else if(!S.keyNitro && S.nitro < 100) S.nitro += 5 * dt;

        // Parallax
        S.hillOffset = (S.hillOffset + playerSegment.curve * 0.002 * (S.speed/CFG.maxSpeed)) % 1;

        // Traffic Collision
        S.cars.forEach(car => {
            car.z = (car.z + car.speed * dt) % S.trackLength;
            if (car.z > S.position - CFG.segmentLength && car.z < S.position + CFG.segmentLength) {
                if (Utils.overlap(S.playerX, 0.6, car.offset, 0.6, 0.8)) {
                    S.speed = S.speed / 2;
                    S.health -= 10;
                    if(S.health <= 0) setUiState("OVER");
                }
            }
        });

        AudioSys.update(S.speed/CFG.maxSpeed);

        if(Math.random() > 0.8) {
            setHud({ speed: Math.floor(S.speed/100), score: Math.floor(S.distance/1000), health: S.health });
        }
    };

    // --- GAME LOOP ---
    const loop = (time) => {
        if (uiState === "PLAY") {
            const dt = Math.min(1, (time - G.current.lastTime) / 1000);
            G.current.lastTime = time;
            update(dt);
            render();
            frameId.current = requestAnimationFrame(loop);
        }
    };

    useEffect(() => {
        if (uiState === "PLAY") {
            if(G.current.segments.length === 0) resetRoad();
            AudioSys.init();
            G.current.lastTime = performance.now();
            frameId.current = requestAnimationFrame(loop);
        } else {
            AudioSys.stop();
            cancelAnimationFrame(frameId.current);
        }
        return () => { cancelAnimationFrame(frameId.current); AudioSys.stop(); }
    }, [uiState]);

    useEffect(() => {
        const resize = () => { if(canvasRef.current) { canvasRef.current.width = CFG.width; canvasRef.current.height = CFG.height; }};
        window.addEventListener('resize', resize); resize();

        const kd = (e) => {
            const k = e.keyCode;
            if(k===KEY.LEFT||k===KEY.A) G.current.keyLeft=true;
            if(k===KEY.RIGHT||k===KEY.D) G.current.keyRight=true;
            if(k===KEY.UP||k===KEY.W) G.current.keyFaster=true;
            if(k===KEY.DOWN||k===KEY.S) G.current.keySlower=true;
            if(k===KEY.SHIFT) G.current.keyNitro=true;
            if(k===KEY.ESC) setUiState(s => s==='PLAY'?'PAUSED':'PLAY');
        };
        const ku = (e) => {
            const k = e.keyCode;
            if(k===KEY.LEFT||k===KEY.A) G.current.keyLeft=false;
            if(k===KEY.RIGHT||k===KEY.D) G.current.keyRight=false;
            if(k===KEY.UP||k===KEY.W) G.current.keyFaster=false;
            if(k===KEY.DOWN||k===KEY.S) G.current.keySlower=false;
            if(k===KEY.SHIFT) G.current.keyNitro=false;
        };
        window.addEventListener('keydown', kd); window.addEventListener('keyup', ku);
        return () => { window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); window.removeEventListener('resize', resize); }
    }, []);

    const handleExit = () => { AudioSys.stop(); navigate("/"); };

    // --- STYLES ---
    const styles = `
      @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@900&display=swap');
      body { margin: 0; background: #111; overflow: hidden; font-family: 'Roboto', sans-serif; }
      canvas { width: 100vw; height: 100vh; display: block; }
      .hud { position: absolute; inset: 0; pointer-events: none; padding: 20px; display: flex; flex-direction: column; justify-content: space-between; z-index: 10; color: #fff; }
      .box { background: rgba(0,0,0,0.5); padding: 10px 20px; border: 2px solid white; transform: skewX(-10deg); }
      .bar { width: 200px; height: 10px; background: #333; margin-top: 5px; border: 1px solid #fff; }
      .fill { height: 100%; transition: width 0.1s; }
      .menu { position: absolute; inset: 0; background: rgba(0,0,0,0.9); display: flex; flex-direction: column; justify-content: center; alignItems: center; color: white; z-index: 100; }
      .btn { pointer-events: auto; background: #C00; color: white; border: 2px solid white; padding: 15px 40px; font-size: 2rem; font-weight: bold; cursor: pointer; transform: skewX(-10deg); margin: 10px; }
      .btn:hover { background: #F00; scale: 1.1; }
      .btn-sm { padding: 5px 15px; font-size: 1rem; background: #333; cursor: pointer; border: 1px solid white; margin-left: 10px; color: white; pointer-events: auto; }
    `;

    return (
        <div style={{width:'100vw', height:'100vh'}}>
            <style>{styles}</style>
            <canvas ref={canvasRef} />

            {uiState === "PLAY" && (
                <div className="hud">
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                        <div className="box">
                            <div>ARMOR: {Math.floor(hud.health)}%</div>
                            <div className="bar"><div className="fill" style={{width:`${hud.health}%`, background: hud.health<30?'red':'#0f0'}}></div></div>
                            <div style={{marginTop:'10px'}}>SCORE: {hud.score}</div>
                        </div>
                        <div style={{pointerEvents:'auto'}}>
                            <button className="btn-sm" onClick={() => setUiState("PAUSED")}>PAUSE</button>
                            <button className="btn-sm" style={{background:'#500'}} onClick={handleExit}>EXIT</button>
                        </div>
                    </div>
                    <div className="box" style={{alignSelf:'flex-end', textAlign:'right'}}>
                        <div style={{fontSize:'4rem', lineHeight:0.8}}>{hud.speed}</div>
                        <div>KM/H</div>
                    </div>
                </div>
            )}

            {uiState === "MENU" && (
                <div className="menu">
                    <h1 style={{fontSize:'6rem', margin:0, color:'#e00'}}>TITAN RACER</h1>
                    <button className="btn" onClick={() => setUiState("PLAY")}>START RACE</button>
                    <p style={{marginTop:'20px', color:'#aaa'}}>ARROWS TO DRIVE | SHIFT FOR NITRO</p>
                </div>
            )}

            {uiState === "PAUSED" && (
                <div className="menu" style={{background:'rgba(0,0,0,0.7)'}}>
                    <h1>PAUSED</h1>
                    <button className="btn" onClick={() => setUiState("PLAY")}>RESUME</button>
                    <button className="btn" style={{background:'#555'}} onClick={handleExit}>EXIT GAME</button>
                </div>
            )}

            {uiState === "OVER" && (
                <div className="menu">
                    <h1 style={{color:'red'}}>WRECKED</h1>
                    <h2>SCORE: {hud.score}</h2>
                    <button className="btn" onClick={() => { 
                        G.current.health=100; G.current.speed=0; G.current.score=0; 
                        resetRoad(); setUiState("PLAY"); 
                    }}>RETRY</button>
                    <button className="btn" style={{background:'#555'}} onClick={handleExit}>EXIT</button>
                </div>
            )}
        </div>
    );
};

export default RealisticRacer;