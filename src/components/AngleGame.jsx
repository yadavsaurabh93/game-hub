import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// --- DATA ---
const RESULT_QUOTES = [
  ['Not quite right!', 'You missed the mark!', 'Measurements all over!', 'Precision needs work!'],
  ['Not too shabby.', 'Getting sharper!', 'Not perfect, but better!'],
  ['Angles on point!', 'Unparalleled precision!', "Amazing! You're acute-y!", 'Wow! So precise!'],
];

const CHANGING_QUOTES = [
  ["I'm such a-cute-y!", "Tiny slice of pi!", "You're doing great!"],
  ["I'm wide open!", 'Keep going!', 'Wow!', 'Wheee!!'],
  ["I'm so obtuse!", 'The bigger the better!', "Life's too short for right angles!", 'Whoa!'],
];

function AngleGame() {
  const navigate = useNavigate();

  // --- STATE ---
  const [rotateVal, setRotateVal] = useState(40);
  const [goal, setGoal] = useState(85);
  const [isDragging, setIsDragging] = useState(false);
  const [gameStats, setGameStats] = useState({ level: 1, totalAccuracy: 0 });
  const [faceIndex, setFaceIndex] = useState(0); 
  const [currentQuote, setCurrentQuote] = useState("Hi, I'm NG the Angle!");
  
  // Result
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState({ accuracy: 0, quote: '' });
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);

  const staticArrowRef = useRef(null);
  const lastInteraction = useRef({ val: 75 });

  useEffect(() => { resetGame(); }, []);

  const resetGame = () => {
    setGoal(Math.floor(Math.random() * 360));
    setRotateVal(40);
    setShowResult(false);
    setAnimatedAccuracy(0);
    setCurrentQuote("Hi, I'm NG the Angle!");
    setFaceIndex(0);
  };

  // --- DRAG LOGIC ---
  const handleStart = () => setIsDragging(true);
  const handleEnd = () => setIsDragging(false);

  const handleMove = (e) => {
    if (!isDragging || !staticArrowRef.current) return;
    const clientX = e.touches ? e.touches[0].pageX : e.pageX;
    const clientY = e.touches ? e.touches[0].pageY : e.pageY;

    const rect = staticArrowRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2; 
    const centerY = rect.top + rect.height - 4; // Adjust pivot

    const pointX = clientX - centerX;
    const pointY = clientY - centerY;

    let angle = 0;
    if (pointX >= 0 && pointY < 0) angle = 90 - (Math.atan2(Math.abs(pointY), pointX) * 180) / Math.PI;
    else if (pointX >= 0 && pointY >= 0) angle = 90 + (Math.atan2(pointY, pointX) * 180) / Math.PI;
    else if (pointX < 0 && pointY >= 0) angle = 270 - (Math.atan2(pointY, Math.abs(pointX)) * 180) / Math.PI;
    else angle = 270 + (Math.atan2(Math.abs(pointY), Math.abs(pointX)) * 180) / Math.PI;

    setRotateVal(angle);

    // Update Face/Quote randomly
    if (angle > 75 && Math.abs(angle - lastInteraction.current.val) > 70 && Math.random() > 0.5) {
      lastInteraction.current.val = angle;
      setFaceIndex(Math.floor(Math.random() * 6));
      let quotes = CHANGING_QUOTES[1];
      if (angle < 110) quotes = CHANGING_QUOTES[0];
      else if (angle >= 230) quotes = CHANGING_QUOTES[2];
      setCurrentQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }
  };

  const submitGuess = () => {
    const calcAcc = Math.abs(100 - (Math.abs(goal - rotateVal) / 180) * 100);
    const finalAccuracy = Math.max(0, calcAcc);

    let qIdx = 1;
    if (finalAccuracy < 50) qIdx = 0;
    else if (finalAccuracy >= 85) qIdx = 2;
    
    setResultData({ accuracy: finalAccuracy, quote: RESULT_QUOTES[qIdx][Math.floor(Math.random() * RESULT_QUOTES[qIdx].length)] });
    setShowResult(true);
    setGameStats(p => ({ level: p.level + 1, totalAccuracy: p.totalAccuracy + finalAccuracy }));
    animateAccuracy(0, finalAccuracy);
  };

  const animateAccuracy = (current, target) => {
    if (current >= target) return;
    const next = Math.min(current + (target - current > 20 ? 2 : 0.5), target);
    setAnimatedAccuracy(next);
    if (next < target) requestAnimationFrame(() => animateAccuracy(next, target));
  };

  const overallAvg = gameStats.level > 1 ? (gameStats.totalAccuracy / (gameStats.level - 1)).toFixed(1) : '0.0';
  const indicatorStyle = 0.487 * rotateVal - 179.5;
  const indicatorRotation = `rotate(${253 + rotateVal}deg)`;

  return (
    <div 
      onMouseMove={handleMove} onTouchMove={handleMove} onMouseUp={handleEnd} onTouchEnd={handleEnd}
      style={{
        position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
        background: '#fff', color: '#333', // FORCE DARK TEXT
        fontFamily: "'Segoe UI', Roboto, sans-serif",
        display:'flex', justifyContent:'center', alignItems:'center',
        userSelect:'none', overflow:'hidden'
      }}
    >
      {/* FORCE RESET STYLES FOR THIS COMPONENT */}
      <style>{`
        .angle-game-text { text-shadow: none !important; color: #333 !important; }
        .angle-btn-text { color: #333 !important; text-shadow: none !important; }
      `}</style>

      <svg style={{ width: 0, height: 0, position: 'absolute' }}>
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff4500" />
            <stop offset="50%" stopColor="#ff0099" />
            <stop offset="100%" stopColor="#9900ff" />
          </linearGradient>
        </defs>
      </svg>

      <div style={{display:'flex', width:'100%', maxWidth:'1000px', flexDirection: window.innerWidth < 768 ? 'column-reverse' : 'row', padding:'20px'}}>
        
        {/* LEFT: INTERACTION */}
        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', position:'relative'}}>
             <h1 className="angle-game-text" style={{fontSize:'3.5rem', margin:'0', fontWeight:'800'}}>Goal: {goal}º</h1>
             
             <div className="angle-game-text" style={{fontSize:'1.5rem', color:'#ff0099 !important', fontWeight:'600', height:'30px', margin:'10px 0', opacity: rotateVal>=74?1:0}}>
                 "{currentQuote}"
             </div>

             <div style={{height:'350px', width:'350px', position:'relative', display:'flex', justifyContent:'center', alignItems:'flex-end'}}>
                 {/* STATIC ARROW */}
                 <div ref={staticArrowRef} style={{height:'150px', width:'4px', background:'#000', position:'absolute', bottom:0, borderRadius:'5px 5px 0 0'}}>
                    <div style={{width:'8px', height:'8px', background:'#000', borderRadius:'50%', position:'absolute', bottom:'-4px', left:'-2px'}}></div>
                    {rotateVal >= 20 && (
                      <div style={{position:'absolute', width:'75px', height:'75px', bottom:'-37.5px', left:'-35.5px', transformOrigin:'center', transform:indicatorRotation, pointerEvents:'none'}}>
                          <svg viewBox="0 0 75 75"><path d="m64.37,45.4c-3.41,11.62-14.15,20.1-26.87,20.1-15.46,0-28-12.54-28-28s12.54-28,28-28,28,12.54,28,28" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" strokeDasharray="180" strokeDashoffset={indicatorStyle} /><polyline points="69.63 36.05 65.29 40.39 60.96 36.05" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    )}
                    <div style={{position:'absolute', bottom:'10px', left:'15px', width:'100px', height:'80px', opacity:rotateVal>=74?1:0, pointerEvents:'none'}}>
                        <FaceSVG index={faceIndex} />
                    </div>
                 </div>

                 {/* MOVING ARROW */}
                 <div onMouseDown={handleStart} onTouchStart={handleStart} style={{height:'150px', width:'40px', position:'absolute', bottom:0, transformOrigin:'bottom center', transform:`rotate(${rotateVal}deg)`, cursor:'grab', display:'flex', justifyContent:'center', zIndex:10}}>
                     <div style={{width:'4px', height:'100%', background:'#000', borderRadius:'5px 5px 0 0', position:'relative'}}>
                         <div style={{position:'absolute', top:'-4px', left:'-6px', width:'4px', height:'20px', background:'#000', borderRadius:'0 0 5px 5px', transform:'rotate(45deg)'}}></div>
                         <div style={{position:'absolute', top:'-4px', right:'-6px', width:'4px', height:'20px', background:'#000', borderRadius:'0 0 5px 5px', transform:'rotate(-45deg)'}}></div>
                     </div>
                 </div>
             </div>
        </div>

        {/* RIGHT: STATS */}
        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
            <div style={{textAlign:'center'}}>
                <h2 className="angle-game-text" style={{margin:'5px', fontSize:'1.5rem'}}>Level: {gameStats.level}</h2>
                <h2 className="angle-game-text" style={{margin:'5px', fontSize:'1.5rem'}}>Avg Accuracy: {overallAvg}%</h2>
                
                <button onClick={submitGuess} disabled={showResult}
                    style={{
                        marginTop: '30px', background: 'linear-gradient(90deg, #ff4500, #ff0099, #9900ff)',
                        border:'none', borderRadius:'8px', padding:'3px', cursor:'pointer', opacity: showResult ? 0.5 : 1
                    }}
                >
                    <div className="angle-btn-text" style={{background:'#fff', padding:'12px 40px', borderRadius:'6px', fontSize:'1.2rem', fontWeight:'bold', textTransform:'uppercase'}}>
                        Guess Angle
                    </div>
                </button>
            </div>
        </div>
      </div>

      {/* RESULT MODAL */}
      {showResult && (
        <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(255,255,255,0.95)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
            <div style={{background:'#fff', padding:'30px', borderRadius:'20px', boxShadow:'0 20px 60px rgba(0,0,0,0.15)', textAlign:'center', width:'90%', maxWidth:'450px', border:'1px solid #eee'}}>
                <button onClick={resetGame} style={{position:'absolute', top:'20px', right:'20px', background:'none', border:'none', fontSize:'2rem', cursor:'pointer', color:'#999'}}>✕</button>
                <div style={{display:'flex', justifyContent:'space-around', margin:'20px 0', fontSize:'1.2rem'}}>
                    <div><small style={{color:'#888'}}>Goal</small><br/><strong style={{color:'#000'}}>{goal}º</strong></div>
                    <div><small style={{color:'#888'}}>Actual</small><br/><strong style={{color:'#000'}}>{rotateVal.toFixed(1)}º</strong></div>
                </div>
                <h1 style={{background:'linear-gradient(90deg, #ff4500, #ff0099)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'4rem', margin:0, fontWeight:'900'}}>{animatedAccuracy.toFixed(1)}%</h1>
                <h3 style={{margin:0, color:'#555', letterSpacing:'2px'}}>ACCURATE</h3>
                <div style={{height:'120px', margin:'20px auto', width:'120px'}}><ResultPersonSVG accuracy={resultData.accuracy} /></div>
                <p style={{fontSize:'1.1rem', color:'#444', fontStyle:'italic'}}>"{resultData.quote}"</p>
                <button onClick={resetGame} style={{background:'linear-gradient(90deg, #ff4500, #ff0099)', border:'none', borderRadius:'50px', padding:'15px 50px', color:'#fff', fontWeight:'bold', fontSize:'1.2rem', cursor:'pointer', boxShadow:'0 5px 15px rgba(255,0,153,0.4)', marginTop:'10px'}}>PLAY AGAIN</button>
            </div>
        </div>
      )}

      <button onClick={(e)=>{e.stopPropagation(); navigate('/')}} style={{position:'absolute', top:20, left:20, background:'#fff', border:'2px solid #eee', padding:'8px 20px', borderRadius:'30px', cursor:'pointer', fontWeight:'bold', color:'#555', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>← EXIT</button>
    </div>
  );
}

// --- SVGs ---
const FaceSVG = ({ index }) => {
    const s = { fill:'none', stroke:'#000', strokeLinecap:'round', strokeWidth:'7px', strokeMiterlimit:10 };
    const e = { fill:'#fff' };
    return (
        <svg viewBox="0 0 103.41 84.33" style={{width:'100%', height:'100%'}}>
             {index === 0 && <g><path style={s} d="m65.65,55.83v11c0,7.73-6.27,14-14,14h0c-7.73,0-14-6.27-14-14v-11" /><line style={s} x1="51.52" y1="65.83" x2="51.65" y2="57.06" /><path style={s} d="m19.8,44.06c7.26,7.89,18.83,13,31.85,13s24.59-5.11,31.85-13" /><path style={{...s, strokeWidth:'6px'}} d="m3,14.33c3.35-5.71,9.55-9.54,16.65-9.54,6.66,0,12.53,3.37,16,8.5" /><path style={{...s, strokeWidth:'6px'}} d="m100.3,14.33c-3.35-5.71-9.55-9.54-16.65-9.54-6.66,0-12.53,3.37-16,8.5" /></g>}
             {index === 1 && <g><path style={{...s, strokeLinejoin:'round'}} d="m22.11,48.83c-.08.65-.14,1.3-.14,1.97,0,11.94,13.37,21.62,29.87,21.62s29.87-9.68,29.87-21.62c0-.66-.06-1.32-.14-1.97H22.11Z" /><circle cx="19.26" cy="12.56" r="12.37" /><circle cx="84.25" cy="12.56" r="12.37" /><circle style={e} cx="14.86" cy="8.94" r="4.24" /><circle style={e} cx="80.29" cy="8.76" r="4.24" /></g>}
             {index >= 2 && <g><circle cx="19.2" cy="12.72" r="12.37" /><circle cx="84.19" cy="12.72" r="12.37" /><circle style={e} cx="14.8" cy="9.09" r="4.24" /><circle style={e} cx="80.22" cy="8.92" r="4.24" /><path style={s} d="m19.45,44.33c7.26,7.89,18.83,13,31.85,13s24.59-5.11,31.85-13" /></g>}
        </svg>
    );
};

const ResultPersonSVG = ({ accuracy }) => {
    const i = { fill:'none', stroke:'#000', strokeLinecap:'round', strokeLinejoin:'round', strokeWidth:'3px' };
    const h = { fill:'none', stroke:'#000', strokeLinecap:'round', strokeMiterlimit:10, strokeWidth:'4px' };
    const g = { fill:'#fff' };
    return (
        <svg viewBox="0 0 119.07 114.91" style={{width:'100%', height:'100%'}}>
            <g><polyline style={i} points="1.5 103.62 56.44 1.5 40.73 8.68" /><line style={i} x1="59.1" y1="18.56" x2="56.44" y2="1.5" /><polyline style={i} points="1.61 103.6 117.57 102.9 103.74 92.56" /><line style={i} x1="103.86" y1="113.41" x2="117.57" y2="102.9" /><path style={i} d="m12.97,84.22c6.4,4.04,10.47,11.28,10.2,19.25" /></g>
            {accuracy > 80 ? <g><path style={h} d="m52.59,70.26c3.95,4.3,10.25,7.08,17.34,7.08s13.38-2.78,17.34-7.08" /><path style={h} d="m43.44,54.08c1.82-3.11,5.2-5.19,9.06-5.19,3.62,0,6.82,1.84,8.71,4.63" /><path style={h} d="m96.41,54.08c-1.82-3.11-5.2-5.19-9.06-5.19-3.62,0-6.82,1.84-8.71,4.63" /></g> : <g><circle cx="51.55" cy="53.12" r="6.73" /><circle cx="86.92" cy="53.12" r="6.73" /><circle style={g} cx="49.15" cy="51.14" r="2.31" /><circle style={g} cx="84.77" cy="51.05" r="2.31" /><path style={h} d="m84.01,81.41c-2.37-5.86-8.11-10-14.83-10s-12.45,4.14-14.83,10" /></g>}
        </svg>
    );
};

export default AngleGame;