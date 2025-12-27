import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

/* ===================================================================
   🏆 CHESS 3D: GOLD VS STEEL EDITION (WITH CHECKMATE)
   =================================================================== */

// --- 1. ASSETS ---
const initialBoard = [
  ['br', 'bn', 'bb', 'bq', 'bk', 'bb', 'bn', 'br'],
  ['bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp', 'bp'],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp', 'wp'],
  ['wr', 'wn', 'wb', 'wq', 'wk', 'wb', 'wn', 'wr'],
];

const getPieceIcon = (code) => {
  const icons = {
    wp: '♟', wr: '♜', wn: '♞', wb: '♝', wq: '♛', wk: '♚',
    bp: '♟', br: '♜', bn: '♞', bb: '♝', bq: '♛', bk: '♚'
  };
  return icons[code] || '';
};

const formatTime = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? '0' : ''}${sec}`;
};

// --- 2. GAME COMPONENT ---
function ChessGame() {
  const navigate = useNavigate();
  
  // --- STATE ---
  const [board, setBoard] = useState(initialBoard);
  const [turn, setTurn] = useState('w');
  const [selected, setSelected] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [captured, setCaptured] = useState({ w: [], b: [] });
  const [gameMode, setGameMode] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [moveLog, setMoveLog] = useState([]);
  const [timers, setTimers] = useState({ w: 600, b: 600 });
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // --- LOGIC: TIMER ---
  useEffect(() => {
    if (!gameMode || gameOver) return;
    const interval = setInterval(() => {
      setTimers(prev => {
        if (prev[turn] <= 0) { 
            setGameOver(true); 
            setWinner(turn === 'w' ? 'b' : 'w');
            return prev; 
        }
        return { ...prev, [turn]: prev[turn] - 1 };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [turn, gameMode, gameOver]);

  // --- LOGIC: MOVES ---
  const calculateValidMoves = useCallback((currentBoard, r, c, piece) => {
    const moves = [];
    const color = piece[0];
    const type = piece[1];
    
    const addIfValid = (nr, nc) => {
      if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
        const target = currentBoard[nr][nc];
        if (!target || target[0] !== color) {
          moves.push({ r: nr, c: nc });
          return !!target; 
        }
      }
      return true; 
    };

    const slide = (dr, dc) => {
      for (let i = 1; i < 8; i++) {
        if (addIfValid(r + i * dr, c + i * dc)) break; 
        if (currentBoard[r + i * dr][c + i * dc]) break; 
      }
    };

    if (type === 'p') {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (!currentBoard[r + dir]?.[c]) {
          moves.push({ r: r + dir, c });
          if (r === startRow && !currentBoard[r + dir * 2]?.[c]) moves.push({ r: r + dir * 2, c });
      }
      if (currentBoard[r + dir]?.[c - 1]?.[0] && currentBoard[r + dir]?.[c - 1]?.[0] !== color) moves.push({ r: r + dir, c: c - 1 });
      if (currentBoard[r + dir]?.[c + 1]?.[0] && currentBoard[r + dir]?.[c + 1]?.[0] !== color) moves.push({ r: r + dir, c: c + 1 });
    }
    else if (type === 'r') { slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1); }
    else if (type === 'b') { slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1); }
    else if (type === 'q') { slide(1, 0); slide(-1, 0); slide(0, 1); slide(0, -1); slide(1, 1); slide(1, -1); slide(-1, 1); slide(-1, -1); }
    else if (type === 'k') { [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].forEach(([dr, dc]) => addIfValid(r+dr, c+dc)); }
    else if (type === 'n') { [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]].forEach(([dr, dc]) => addIfValid(r+dr, c+dc)); }

    return moves;
  }, []);

  const executeMove = useCallback((from, to) => {
    setBoard(prevBoard => {
        const newBoard = prevBoard.map(row => [...row]);
        const movingPiece = newBoard[from.r][from.c];
        const targetPiece = newBoard[to.r][to.c];

        if (targetPiece) {
            setCaptured(prev => ({ ...prev, [targetPiece[0]]: [...prev[targetPiece[0]], targetPiece] }));
            
            // --- CHECKMATE LOGIC ADDED HERE ---
            if (targetPiece[1] === 'k') {
                setGameOver(true);
                setWinner(movingPiece[0]); // 'w' or 'b'
            }
        }

        const cols = ['A','B','C','D','E','F','G','H'];
        const rows = ['8','7','6','5','4','3','2','1'];
        setMoveLog(prev => [`${movingPiece[1].toUpperCase()}: ${cols[from.c]}${rows[from.r]} ➝ ${cols[to.c]}${rows[to.r]}`, ...prev]);

        newBoard[to.r][to.c] = movingPiece;
        newBoard[from.r][from.c] = '';

        if (movingPiece[1] === 'p' && (to.r === 0 || to.r === 7)) {
            newBoard[to.r][to.c] = movingPiece[0] + 'q';
        }
        return newBoard;
    });
    
    // Switch turn only if game is not over
    if (!gameOver) {
        setTurn(prev => prev === 'w' ? 'b' : 'w');
        setSelected(null);
        setValidMoves([]);
    }
  }, [gameOver]);

  const makeBotMove = useCallback(() => {
    if(gameOver) return;
    let allMoves = [];
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell && cell[0] === 'b') {
                const moves = calculateValidMoves(board, r, c, cell);
                moves.forEach(m => {
                    allMoves.push({ from: {r, c}, to: m });
                });
            }
        });
    });

    if (allMoves.length === 0) return;

    let bestMove = null;
    
    // AI Priority: Capture King > Random Capture > Random Move
    const kingCapture = allMoves.find(m => board[m.to.r][m.to.c] === 'wk');
    
    if (kingCapture) {
        bestMove = kingCapture;
    } else {
        const captureMoves = allMoves.filter(m => board[m.to.r][m.to.c] !== '');
        if (captureMoves.length > 0) bestMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        else bestMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    if (bestMove) executeMove(bestMove.from, bestMove.to);
    setIsBotThinking(false);
  }, [board, calculateValidMoves, executeMove, gameOver]);

  useEffect(() => {
    if (gameMode === 'bot' && turn === 'b' && !isBotThinking && !gameOver) {
        setIsBotThinking(true);
        setTimeout(makeBotMove, 800); 
    }
  }, [turn, gameMode, isBotThinking, makeBotMove, gameOver]);

  const handleSquareClick = (r, c) => {
    if ((gameMode === 'bot' && turn === 'b') || gameOver) return;

    const clickedPiece = board[r][c];
    const isMyPiece = clickedPiece && clickedPiece[0] === turn;

    if (isMyPiece) {
      setSelected({ r, c });
      setValidMoves(calculateValidMoves(board, r, c, clickedPiece));
      return;
    }

    if (selected) {
      const isValid = validMoves.some(m => m.r === r && m.c === c);
      if (isValid) {
        executeMove(selected, { r, c });
      } else {
        setSelected(null);
        setValidMoves([]);
      }
    }
  };

  const handleRestart = () => {
      setBoard(initialBoard);
      setTurn('w');
      setCaptured({ w: [], b: [] });
      setMoveLog([]);
      setTimers({ w: 600, b: 600 });
      setGameOver(false);
      setWinner(null);
  };

  // --- MENU ---
  if (!gameMode) {
      return (
        <div style={{
            position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
            background: 'radial-gradient(circle at center, #1a1a1a 0%, #000 100%)',
            display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center',
            fontFamily:'"Cinzel", serif', color:'#d4af37'
        }}>
            <h1 style={{fontSize:'5rem', fontWeight:'900', letterSpacing:'5px', textShadow:'0 0 30px #d4af37', marginBottom:'10px'}}>
                ROYAL CHESS
            </h1>
            <p style={{color:'#aaa', marginBottom:'60px', letterSpacing:'2px', fontFamily:'sans-serif'}}>GOLD VS STEEL EDITION</p>
            
            <div style={{display:'flex', gap:'40px'}}>
                <button onClick={() => setGameMode('pvp')} className="menu-btn gold">
                    PLAYER VS PLAYER
                </button>
                <button onClick={() => setGameMode('bot')} className="menu-btn steel">
                    PLAYER VS CPU
                </button>
            </div>
            
            <button onClick={() => navigate('/')} style={{marginTop:'80px', border:'none', background:'transparent', color:'#555', cursor:'pointer', fontSize:'1rem'}}>EXIT TO LOBBY</button>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap');
                .menu-btn {
                    padding: 25px 50px; border: none; borderRadius: 5px;
                    font-size: 1.2rem; fontWeight: bold; cursor: pointer; transition: 0.3s;
                    text-transform: uppercase; letter-spacing: 2px;
                }
                .menu-btn.gold {
                    background: linear-gradient(45deg, #FFD700, #FDB931);
                    color: #000; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
                }
                .menu-btn.steel {
                    background: linear-gradient(45deg, #bdc3c7, #2c3e50);
                    color: #fff; box-shadow: 0 0 20px rgba(189, 195, 199, 0.4);
                }
                .menu-btn:hover { transform: scale(1.05); filter: brightness(1.2); }
            `}</style>
        </div>
      );
  }

  // --- GAME RENDER ---
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'radial-gradient(circle at center, #2b2b2b 0%, #000000 100%)',
      perspective: '1200px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center',
      fontFamily: '"Segoe UI", sans-serif'
    }}>
      
      {/* LEFT PANEL */}
      <div style={{position:'absolute', left:30, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:'25px', width:'180px'}}>
         <div className={`timer-card gold ${turn==='w' ? 'active' : ''}`}>
            <span className="label">GOLD (WHITE)</span>
            <span className="time">{formatTime(timers.w)}</span>
            <div className="captured">{captured.b.map((p,i)=><span key={i}>{getPieceIcon(p)}</span>)}</div>
         </div>
         <div className={`timer-card steel ${turn==='b' ? 'active' : ''}`}>
            <span className="label">STEEL (BLACK)</span>
            <span className="time">{formatTime(timers.b)}</span>
            <div className="captured">{captured.w.map((p,i)=><span key={i}>{getPieceIcon(p)}</span>)}</div>
         </div>
      </div>

      {/* CENTER: THE 3D BOARD (FIXED SIZE) */}
      <div style={{
         transform: 'rotateX(50deg) translateZ(-50px)', 
         transformStyle: 'preserve-3d',
         width: '600px', height: '600px',
         background: '#111', 
         borderRadius: '4px',
         padding: '16px',
         boxShadow: '0 50px 100px rgba(0,0,0,0.9), inset 0 0 60px rgba(0,0,0,0.8)',
         borderBottom: '20px solid #000'
      }}>
        <div style={{
            display:'grid', 
            gridTemplateColumns:'repeat(8, 71px)', 
            gridTemplateRows:'repeat(8, 71px)',
            width: '568px', height: '568px',
            transformStyle: 'preserve-3d',
            border: '5px solid #333'
        }}>
        {board.map((row, r) => 
          row.map((cell, c) => {
            const isBlack = (r + c) % 2 === 1;
            const isSelected = selected?.r === r && selected?.c === c;
            const isValid = validMoves.some(m => m.r === r && m.c === c);
            const pieceColor = cell[0] === 'w' ? 'gold' : 'steel';
            
            return (
              <div 
                key={`${r}-${c}`}
                onClick={() => handleSquareClick(r, c)}
                style={{
                  width: '71px', height: '71px',
                  background: isBlack 
                    ? 'linear-gradient(45deg, #222, #333)' 
                    : 'linear-gradient(45deg, #ddd, #fff)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  cursor: 'pointer',
                  zIndex: 10 + r,
                  boxShadow: isSelected ? 'inset 0 0 20px #FFD700' : 'none'
                }}
              >
                {isValid && (
                    <div style={{
                        position:'absolute', width:'30%', height:'30%', borderRadius:'50%', 
                        background: board[r][c] ? 'rgba(255, 50, 50, 0.8)' : 'rgba(0, 255, 100, 0.6)',
                        transform: 'translateZ(2px)', boxShadow: '0 0 15px currentColor'
                    }} />
                )}
                
                {cell && (
                    <div className={`piece-container ${isSelected ? 'lifted' : ''}`}>
                        <div className={`chess-piece ${pieceColor}`}>{getPieceIcon(cell)}</div>
                        <div className={`piece-base ${pieceColor}`}></div>
                        <div className="reflection">{getPieceIcon(cell)}</div>
                    </div>
                )}
              </div>
            );
          })
        )}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
          position:'absolute', right:30, top:'50%', transform:'translateY(-50%)',
          width:'200px', height:'400px', background:'rgba(20,20,20,0.9)', borderRadius:'10px',
          padding:'15px', display:'flex', flexDirection:'column',
          border: '1px solid #333'
      }}>
          <h4 style={{marginTop:0, color:'#d4af37', borderBottom:'1px solid #444', paddingBottom:'10px', textAlign:'center'}}>WAR LOG</h4>
          <div style={{overflowY:'auto', flex:1, display:'flex', flexDirection:'column', gap:'5px'}}>
              {moveLog.map((m, i) => (
                  <div key={i} style={{fontSize:'0.8rem', color:'#aaa', borderBottom:'1px solid #333', padding:'4px 0'}}>
                      <span style={{color:'#666', marginRight:'10px'}}>{moveLog.length - i}.</span> {m}
                  </div>
              ))}
          </div>
      </div>

      {/* VICTORY OVERLAY (CHECKMATE SCREEN) */}
      {gameOver && (
          <div style={{
              position:'fixed', top:0, left:0, width:'100vw', height:'100vh', zIndex:200,
              background:'rgba(0,0,0,0.85)', backdropFilter:'blur(5px)',
              display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center'
          }}>
              <h1 style={{
                  fontSize:'5rem', color: winner==='w' ? '#FFD700' : '#bdc3c7',
                  textShadow:'0 0 50px currentColor', marginBottom:'10px'
              }}>
                  {winner === 'w' ? 'GOLD WINS!' : 'STEEL WINS!'}
              </h1>
              <p style={{color:'#fff', fontSize:'1.5rem', marginBottom:'40px', letterSpacing:'5px'}}>CHECKMATE / KING CAPTURED</p>
              
              <div style={{display:'flex', gap:'20px'}}>
                  <button onClick={handleRestart} className="menu-btn gold">PLAY AGAIN</button>
                  <button onClick={() => navigate('/')} className="menu-btn steel">EXIT</button>
              </div>
          </div>
      )}

      {/* CONTROLS */}
      <div style={{position:'absolute', bottom:30, display:'flex', gap:'20px'}}>
        <button onClick={() => setGameMode(null)} className="ctrl-btn">MENU</button>
        <button onClick={() => navigate('/')} className="ctrl-btn red">FORFEIT</button>
      </div>

      {/* --- CSS MAGIC --- */}
      <style>{`
        .piece-container {
            width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;
            transform-style: preserve-3d; transform-origin: center bottom;
            transform: rotateX(-50deg) translateZ(5px); transition: transform 0.2s ease;
            pointer-events: none;
        }
        .piece-container.lifted { transform: rotateX(-50deg) translateZ(60px) scale(1.2); }

        .chess-piece {
            font-size: 4.5rem; line-height: 1; font-weight: 900;
            background-clip: text; -webkit-background-clip: text; color: transparent;
            filter: drop-shadow(0 5px 2px rgba(0,0,0,0.5)); position: relative; z-index: 2;
        }
        .chess-piece.gold { background-image: linear-gradient(to bottom, #FFF8DC, #FFD700, #B8860B); }
        .chess-piece.steel { background-image: linear-gradient(to bottom, #fff, #bdc3c7, #2c3e50); }

        .piece-base {
            position: absolute; bottom: 10px; width: 40px; height: 10px;
            border-radius: 50%; transform: rotateX(60deg);
            box-shadow: 0 5px 10px rgba(0,0,0,0.8); z-index: 1;
        }
        .piece-base.gold { background: radial-gradient(circle, #B8860B, #555); border: 1px solid #FFD700; }
        .piece-base.steel { background: radial-gradient(circle, #7f8c8d, #222); border: 1px solid #bdc3c7; }

        .reflection {
            position: absolute; bottom: -35px; transform: scaleY(-1) skewX(-10deg);
            opacity: 0.2; filter: blur(2px); color: #fff; font-size: 4.5rem; pointer-events: none;
        }

        .timer-card {
            padding: 15px; borderRadius: 8px; box-shadow: 0 5px 20px rgba(0,0,0,0.5);
            transition: 0.3s; border: 1px solid rgba(255,255,255,0.1);
        }
        .timer-card.gold { background: linear-gradient(45deg, #111, #222); border-left: 4px solid #FFD700; color: #FFD700; }
        .timer-card.steel { background: linear-gradient(45deg, #111, #222); border-left: 4px solid #bdc3c7; color: #bdc3c7; }
        .timer-card.active { transform: scale(1.1); box-shadow: 0 0 20px rgba(255, 215, 0, 0.2); border: 1px solid rgba(255,255,255,0.3); }
        
        .timer-card .time { font-size: 2rem; font-weight: 800; font-family: monospace; display: block; margin: 5px 0; color: #fff; }
        .timer-card .captured { font-size: 1.2rem; min-height: 20px; }

        .ctrl-btn {
            background: #222; border: 1px solid #444; padding: 12px 30px; borderRadius: 30px;
            color: #aaa; fontWeight: bold; cursor: pointer; transition: 0.2s;
        }
        .ctrl-btn:hover { background: #333; color: #fff; }
        .ctrl-btn.red { border-color: #e74c3c; color: #e74c3c; }
        .ctrl-btn.red:hover { background: #e74c3c; color: #fff; }
        
        .menu-btn {
            padding: 25px 50px; border: none; borderRadius: 5px;
            font-size: 1.2rem; fontWeight: bold; cursor: pointer; transition: 0.3s;
            text-transform: uppercase; letter-spacing: 2px;
        }
        .menu-btn.gold { background: linear-gradient(45deg, #FFD700, #FDB931); color: #000; box-shadow: 0 0 20px rgba(255, 215, 0, 0.4); }
        .menu-btn.steel { background: linear-gradient(45deg, #bdc3c7, #2c3e50); color: #fff; box-shadow: 0 0 20px rgba(189, 195, 199, 0.4); }
        .menu-btn:hover { transform: scale(1.05); filter: brightness(1.2); }
      `}</style>

    </div>
  );
}

export default ChessGame;