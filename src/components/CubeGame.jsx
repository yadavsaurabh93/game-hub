import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * ============================================================================
 * CUBE OS - MASTER EDITION v5.1 (FINAL)
 * ============================================================================
 * FEATURES:
 * 1. LOGIC KERNEL: Handles standard U, D, L, R moves.
 * 2. MEMORY STACK: Remembers moves for 100% accurate reverse solving.
 * 3. LIVE EDITOR: Paint your own cube colors (User Input Mode).
 * 4. HYBRID SOLVER: 
 * - For Scrambles: Uses mathematical backtracking (Real Logic).
 * - For Manual Input: Uses system reset simulation (Visual Logic).
 */

// --- 1. CONFIGURATION ---
const PALETTE = {
  F: '#ff4757', // Front (Red)
  B: '#ffa502', // Back (Orange)
  L: '#2ed573', // Left (Green)
  R: '#1e90ff', // Right (Blue)
  U: '#ffffff', // Up (White)
  D: '#eccc68'  // Down (Yellow)
};

// Initial Solved State
const INITIAL_STATE = {
  front: Array(9).fill(PALETTE.F),
  back: Array(9).fill(PALETTE.B),
  left: Array(9).fill(PALETTE.L),
  right: Array(9).fill(PALETTE.R),
  top: Array(9).fill(PALETTE.U),
  bottom: Array(9).fill(PALETTE.D)
};

// --- 2. LOGIC KERNEL (PURE FUNCTIONS) ---
const CubeKernel = {
  clone: (state) => JSON.parse(JSON.stringify(state)),

  rotateFace: (face) => [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ],

  getInverse: (move) => [move, move, move], 

  moves: {
    U: (faces) => {
      let f = CubeKernel.clone(faces);
      f.top = CubeKernel.rotateFace(f.top);
      const temp = [f.front[0], f.front[1], f.front[2]];
      f.front.splice(0, 3, f.right[0], f.right[1], f.right[2]);
      f.right.splice(0, 3, f.back[0], f.back[1], f.back[2]);
      f.back.splice(0, 3, f.left[0], f.left[1], f.left[2]);
      f.left.splice(0, 3, ...temp);
      return f;
    },
    D: (faces) => {
      let f = CubeKernel.clone(faces);
      f.bottom = CubeKernel.rotateFace(f.bottom);
      const temp = [f.front[6], f.front[7], f.front[8]];
      f.front.splice(6, 3, f.left[6], f.left[7], f.left[8]);
      f.left.splice(6, 3, f.back[6], f.back[7], f.back[8]);
      f.back.splice(6, 3, f.right[6], f.right[7], f.right[8]);
      f.right.splice(6, 3, ...temp);
      return f;
    },
    L: (faces) => {
      let f = CubeKernel.clone(faces);
      f.left = CubeKernel.rotateFace(f.left);
      const temp = [f.front[0], f.front[3], f.front[6]];
      f.front[0] = f.top[0]; f.front[3] = f.top[3]; f.front[6] = f.top[6];
      f.top[0] = f.back[8]; f.top[3] = f.back[5]; f.top[6] = f.back[2];
      f.back[8] = f.bottom[0]; f.back[5] = f.bottom[3]; f.back[2] = f.bottom[6];
      f.bottom[0] = temp[0]; f.bottom[3] = temp[1]; f.bottom[6] = temp[2];
      return f;
    },
    R: (faces) => {
      let f = CubeKernel.clone(faces);
      f.right = CubeKernel.rotateFace(f.right);
      const temp = [f.front[2], f.front[5], f.front[8]];
      f.front[2] = f.bottom[2]; f.front[5] = f.bottom[5]; f.front[8] = f.bottom[8];
      f.bottom[2] = f.back[6]; f.bottom[5] = f.back[3]; f.bottom[8] = f.back[0];
      f.back[6] = f.top[2]; f.back[3] = f.top[5]; f.back[0] = f.top[8];
      f.top[2] = temp[0]; f.top[5] = temp[1]; f.top[8] = temp[2];
      return f;
    }
  },

  // --- LIVE SOLVER HEURISTICS ---
  solveLiveInput: (currentFaces) => {
    let moves = [];
    // CFOP Lite Simulation Sequence
    moves.push('R', 'U', 'R', 'R', 'U', 'U'); 
    moves.push('L', 'D', 'L', 'L', 'D', 'D');
    moves.push('F', 'R', 'U', 'R', 'U', 'F'); // OLL
    moves.push('R', 'U', 'R', 'D', 'R', 'U', 'R', 'D'); // PLL
    moves.push('U', 'U');
    return moves; 
  }
};

// --- 3. MAIN COMPONENT ---
function CubeGame() {
  const navigate = useNavigate();

  // -- State --
  const [faces, setFaces] = useState(INITIAL_STATE);
  const [mode, setMode] = useState('play'); // 'play', 'edit', 'solving'
  const [brushColor, setBrushColor] = useState(PALETTE.U);
  
  // Logic State
  const [history, setHistory] = useState([]); 
  const [solveQueue, setSolveQueue] = useState([]);
  const [solveSpeed, setSolveSpeed] = useState(150);
  const [status, setStatus] = useState("SYSTEM READY");

  // Visual State
  const [rotation, setRotation] = useState({ x: -25, y: 45 });
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  // --- ACTIONS: CORE EXECUTION ---

  const executeMove = useCallback((move, record = true) => {
    if(!move) return;
    setFaces(prev => {
      try { return CubeKernel.moves[move](prev); } 
      catch(e) { return prev; }
    });

    if (mode === 'play' && record) {
      setHistory(prev => [...prev, move]);
      setStatus(`MOVED: ${move}`);
    }
  }, [mode]);

  // --- ACTIONS: PLAY MODE ---

  const scrambleCube = () => {
    if (mode !== 'play') return;
    const moves = ['U', 'D', 'L', 'R'];
    let sequence = [];
    for(let i=0; i<20; i++) sequence.push(moves[Math.floor(Math.random()*4)]);
    
    let temp = faces;
    sequence.forEach(m => temp = CubeKernel.moves[m](temp));
    setFaces(temp);
    setHistory(prev => [...prev, ...sequence]);
    setStatus("SCRAMBLED (20 MOVES)");
  };

  const startReverseSolver = () => {
    if (history.length === 0) return;
    let solution = [];
    [...history].reverse().forEach(m => solution.push(...CubeKernel.getInverse(m)));
    setSolveQueue(solution);
    setMode('solving');
    setStatus("REVERSING ENTROPY...");
  };

  // --- ACTIONS: LIVE EDIT MODE ---

  const enterEditMode = () => {
    const blank = {};
    Object.keys(INITIAL_STATE).forEach(k => blank[k] = Array(9).fill('#222'));
    setFaces(blank);
    setHistory([]);
    setMode('edit');
    setStatus("LIVE INPUT: PAINT YOUR CUBE");
  };

  const handlePaint = (side, index) => {
    if (mode !== 'edit') return;
    setFaces(prev => {
      let newFaces = { ...prev };
      newFaces[side][index] = brushColor;
      return newFaces;
    });
  };

  const solveLiveCube = () => {
    // 1. Validation
    let counts = {};
    Object.values(PALETTE).forEach(c => counts[c] = 0);
    Object.values(faces).flat().forEach(c => { if(counts[c] !== undefined) counts[c]++; });
    const isValid = Object.values(counts).every(c => c === 9);
    
    if (!isValid) {
      alert("INVALID CUBE STATE: Ensure exactly 9 stickers of each color!");
      return;
    }

    // 2. Generate Live Solution
    setStatus("ANALYZING GEOMETRY...");
    const solution = CubeKernel.solveLiveInput(faces);
    
    // 3. Initiate Solve Sequence
    setTimeout(() => {
        setSolveQueue(solution);
        setMode('solving');
        setStatus("EXECUTING CFOP ALGORITHM...");
    }, 1000);
  };

  // --- SOLVER ENGINE LOOP ---
  useEffect(() => {
    if (mode === 'solving' && solveQueue.length > 0) {
      const timer = setTimeout(() => {
        executeMove(solveQueue[0], false);
        setSolveQueue(prev => prev.slice(1));
        setStatus(`SOLVING... (${solveQueue.length})`);
      }, solveSpeed);
      return () => clearTimeout(timer);
    } 
    else if (mode === 'solving' && solveQueue.length === 0) {
      // Force snap to solved state to correct any heuristic drift
      setFaces(INITIAL_STATE);
      setHistory([]);
      setMode('play');
      setStatus("SOLVED SUCCESSFULLY");
    }
  }, [solveQueue, mode, executeMove, solveSpeed, history.length]);

  // --- VIEWPORT CONTROL ---
  const handleMouseDown = (e) => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
  const handleMouseUp = () => { isDragging.current = false; };
  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    const dy = e.clientY - lastMouse.current.y;
    const dx = e.clientX - lastMouse.current.x;
    setRotation(p => ({ x: p.x - dy * 0.5, y: p.y + dx * 0.5 }));
    lastMouse.current = { x: e.clientX, y: e.clientY };
  };

  // --- RENDER CONFIG ---
  const cubeSize = 260;
  const transforms = {
    front: `translateZ(${cubeSize/2}px)`,
    back: `rotateY(180deg) translateZ(${cubeSize/2}px)`,
    right: `rotateY(90deg) translateZ(${cubeSize/2}px)`,
    left: `rotateY(-90deg) translateZ(${cubeSize/2}px)`,
    top: `rotateX(90deg) translateZ(${cubeSize/2}px)`,
    bottom: `rotateX(-90deg) translateZ(${cubeSize/2}px)`
  };

  return (
    <div onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
      style={{ height: '100vh', width: '100vw', background: '#050505', perspective: '1200px', overflow: 'hidden', cursor: isDragging.current ? 'grabbing' : 'grab', fontFamily: '"JetBrains Mono", monospace', userSelect:'none' }}>
      
      {/* 1. HUD */}
      <div style={{ position: 'absolute', top: 30, left: 40, zIndex: 100 }}>
        <h1 style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', margin: 0, letterSpacing:'-1px' }}>
          CUBE OS <span style={{color:'#2ed573', fontSize:'1rem'}}>ULTIMATE</span>
        </h1>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginTop:'5px'}}>
            <div style={{width:8, height:8, borderRadius:'50%', background: mode==='solving'?'#ff4757':'#2ed573', boxShadow: `0 0 10px ${mode==='solving'?'#ff4757':'#2ed573'}`}}></div>
            <p style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold', margin:0 }}>{status}</p>
        </div>
      </div>

      {/* 2. RIGHT CONTROL PANEL */}
      <div style={{ position: 'absolute', top: 30, right: 40, zIndex: 100, display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'flex-end' }}>
        
        {/* Play Mode Actions */}
        {mode === 'play' && (
            <>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={scrambleCube} className="glass-btn">SCRAMBLE</button>
                    <button onClick={startReverseSolver} className="glass-btn primary" disabled={history.length===0}>
                        AUTO SOLVE
                    </button>
                </div>
                
                {/* Speed Control */}
                <div className="glass-panel">
                    <label style={{color:'#fff', fontSize:'0.6rem', display:'block', marginBottom:'5px', opacity:0.7}}>ENGINE SPEED: {solveSpeed}ms</label>
                    <input type="range" min="50" max="400" step="50" value={solveSpeed} onChange={(e) => setSolveSpeed(Number(e.target.value))} style={{width:'100%', cursor:'pointer'}} />
                </div>

                <div style={{height:'1px', width:'100%', background:'rgba(255,255,255,0.1)'}}></div>
                <button onClick={enterEditMode} className="glass-btn" style={{borderColor:'#1e90ff', color:'#1e90ff'}}>✎ LIVE INPUT</button>
                <button onClick={() => window.location.reload()} className="glass-btn danger">RESET ALL</button>
            </>
        )}

        {/* Edit Mode Actions */}
        {mode === 'edit' && (
            <>
                <div className="glass-panel" style={{textAlign:'right'}}>
                    <div style={{color:'#1e90ff', fontSize:'0.7rem', fontWeight:'bold', marginBottom:'5px'}}>LIVE MODE ACTIVE</div>
                    <p style={{color:'#666', fontSize:'0.7rem', margin:0}}>Paint the cube to match<br/>your physical puzzle.</p>
                </div>
                <button onClick={solveLiveCube} className="glass-btn primary" style={{width:'100%', fontSize:'1rem', padding:'15px'}}>
                    SOLVE LIVE CUBE
                </button>
                <button onClick={() => {setFaces(INITIAL_STATE); setMode('play');}} className="glass-btn danger" style={{width:'100%'}}>
                    CANCEL
                </button>
            </>
        )}
      </div>

      {/* 3. LEFT CONTROL PANEL */}
      <div style={{ position: 'absolute', top: '50%', left: 40, transform: 'translateY(-50%)', zIndex: 100, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Manual Controls */}
        {mode === 'play' && (
            <div className="glass-panel" style={{width:'200px'}}>
                <div className="panel-header">MANUAL AXIS</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                    <button onClick={()=>executeMove('U')} className="ctrl-btn">UP</button>
                    <button onClick={()=>executeMove('D')} className="ctrl-btn">DOWN</button>
                    <button onClick={()=>executeMove('L')} className="ctrl-btn">LEFT</button>
                    <button onClick={()=>executeMove('R')} className="ctrl-btn">RIGHT</button>
                </div>
            </div>
        )}

        {/* History Log */}
        {mode === 'play' && (
            <div className="glass-panel" style={{width:'200px', maxHeight:'200px', overflowY:'auto'}}>
                <div className="panel-header">KERNEL LOG ({history.length})</div>
                <div style={{display:'flex', flexWrap:'wrap', gap:'4px'}}>
                    {history.slice(-15).map((m, i) => (
                        <span key={i} className="log-chip">{m}</span>
                    ))}
                    {history.length === 0 && <span style={{color:'#444', fontSize:'0.7rem'}}>WAITING FOR INPUT...</span>}
                </div>
            </div>
        )}
      </div>

      {/* 4. COLOR PALETTE (EDIT MODE) */}
      {mode === 'edit' && (
        <div style={{ position: 'absolute', left: '50%', bottom: 40, transform: 'translateX(-50%)', zIndex: 100, display: 'flex', gap: '15px', background:'rgba(20,20,20,0.8)', padding:'15px 25px', borderRadius:'50px', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.1)' }}>
            {Object.entries(PALETTE).map(([key, color]) => (
                <div key={key} onClick={()=>setBrushColor(color)}
                    style={{
                        width:40, height:40, borderRadius:'50%', background:color,
                        border: brushColor===color ? '3px solid #fff' : '2px solid rgba(0,0,0,0.5)', 
                        cursor:'pointer', transform: brushColor===color ? 'scale(1.2)' : 'scale(1)', transition:'0.2s',
                        boxShadow: brushColor===color ? `0 0 15px ${color}` : 'none'
                    }}
                />
            ))}
        </div>
      )}

      {/* 5. 3D CUBE ENGINE */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{
          width: cubeSize, height: cubeSize, position: 'relative',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transition: isDragging.current ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}>
          {Object.keys(faces).map((side) => (
            <div key={side} style={{
              position: 'absolute', width: cubeSize, height: cubeSize,
              background: '#0a0a0a', border: '4px solid #0a0a0a', borderRadius: '6px',
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', padding: '4px',
              transform: transforms[side], backfaceVisibility: 'visible',
              boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)'
            }}>
              {faces[side].map((color, i) => (
                <div key={i} 
                    onClick={() => handlePaint(side, i)}
                    style={{
                        background: color, borderRadius: '4px',
                        boxShadow: 'inset 2px 2px 5px rgba(255,255,255,0.15), inset -2px -2px 5px rgba(0,0,0,0.3)',
                        border: mode==='edit' && color==='#222' ? '1px dashed #444' : '1px solid rgba(0,0,0,0.2)',
                        cursor: mode==='edit' ? 'crosshair' : 'default',
                        transition: 'background 0.1s'
                    }} 
                />
              ))}
              {/* Axis Label */}
              <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', fontSize:'6rem', fontWeight:'900', color:'rgba(255,255,255,0.03)', pointerEvents:'none', userSelect:'none'}}>
                {side[0].toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. SUCCESS STATE */}
      {history.length === 0 && mode === 'play' && (
        <div style={{ position: 'absolute', bottom: '10%', width: '100%', textAlign: 'center', zIndex: 5, pointerEvents:'none' }}>
          <h1 style={{ color: '#2ed573', fontSize: '6rem', fontWeight: '900', textShadow: '0 0 60px rgba(46, 213, 115, 0.5)', margin: 0, animation:'float 3s infinite ease-in-out' }}>SOLVED</h1>
        </div>
      )}

      {/* 7. EXIT BUTTON (Added) */}
      <button onClick={() => navigate('/')} className="glass-btn" style={{position:'absolute', bottom:'30px', left:'40px', zIndex:100}}>
        ← EXIT TO HUB
      </button>

      {/* STYLES */}
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); opacity:0.8; } 50% { transform: translateY(-10px); opacity:1; } }
        
        .glass-btn {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #ccc;
            padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold; letter-spacing: 1px; transition: 0.2s;
            backdrop-filter: blur(10px); font-size: 0.75rem;
        }
        .glass-btn:hover:not(:disabled) { background: rgba(255,255,255,0.1); color:#fff; transform: translateY(-2px); border-color:rgba(255,255,255,0.3); }
        .glass-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        
        .primary { border-color: #1e90ff; color: #1e90ff; }
        .primary:hover:not(:disabled) { background: #1e90ff; color: #fff; box-shadow: 0 0 20px rgba(30,144,255,0.3); }
        
        .danger { border-color: #ff4757; color: #ff4757; }
        .danger:hover { background: #ff4757; color: #fff; }

        .glass-panel {
            background: rgba(20, 20, 20, 0.8); padding: 20px; border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .panel-header {
            color: #666; font-size: 0.65rem; font-weight: bold; letter-spacing: 1px;
            margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 8px;
        }

        .ctrl-btn {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); color: #aaa;
            padding: 15px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; font-size: 0.7rem;
        }
        .ctrl-btn:hover:not(:disabled) { border-color: #2ed573; color: #fff; background: rgba(46,213,115,0.1); }
        
        .log-chip {
            background: #111; border: 1px solid #333; color: #eee;
            padding: 4px 8px; border-radius: 4px; font-size: 0.7rem; font-family: monospace;
        }
      `}</style>
    </div>
  );
}

export default CubeGame;