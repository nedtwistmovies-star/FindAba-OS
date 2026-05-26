import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Trophy, Play, RotateCcw, 
  Zap, Package, AlertTriangle, Bike 
} from 'lucide-react';

interface GameState {
  score: number;
  distance: number;
  fuel: number;
  isGameOver: boolean;
  isPaused: boolean;
  highScore: number;
}

const CarryGoDash: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    distance: 0,
    fuel: 100,
    isGameOver: false,
    isPaused: true,
    highScore: parseInt(localStorage.getItem('carry_go_highscore') || '0'),
  });

  const requestRef = useRef<number>();
  const playerRef = useRef({ x: 150, y: 450, width: 40, height: 60 });
  const obstaclesRef = useRef<any[]>([]);
  const collectiblesRef = useRef<any[]>([]);
  const speedRef = useRef(5);
  const frameCountRef = useRef(0);

  const initGame = () => {
    setGameState(prev => ({
      ...prev,
      score: 0,
      distance: 0,
      fuel: 100,
      isGameOver: false,
      isPaused: false,
    }));
    obstaclesRef.current = [];
    collectiblesRef.current = [];
    speedRef.current = 5;
    playerRef.current = { x: 150, y: 450, width: 40, height: 60 };
  };

  const update = () => {
    if (gameState.isGameOver || gameState.isPaused) return;

    frameCountRef.current++;
    speedRef.current += 0.001; // Gradually increase difficulty

    // Update Distance & Fuel
    setGameState(prev => ({
      ...prev,
      distance: prev.distance + speedRef.current / 10,
      fuel: Math.max(0, prev.fuel - 0.05),
    }));

    if (gameState.fuel <= 0) {
      endGame();
    }

    // Spawn Obstacles
    if (frameCountRef.current % 60 === 0) {
      const lane = Math.floor(Math.random() * 3);
      obstaclesRef.current.push({
        x: lane * 100 + 30,
        y: -50,
        width: 40,
        height: 40,
        type: Math.random() > 0.5 ? 'pothole' : 'car',
      });
    }

    // Spawn Collectibles
    if (frameCountRef.current % 100 === 0) {
      const lane = Math.floor(Math.random() * 3);
      collectiblesRef.current.push({
        x: lane * 100 + 40,
        y: -50,
        width: 20,
        height: 20,
        type: Math.random() > 0.7 ? 'fuel' : 'package',
      });
    }

    // Move & Filter Obstacles
    obstaclesRef.current = obstaclesRef.current.filter(obs => {
      obs.y += speedRef.current;
      // Collision detection
      if (
        playerRef.current.x < obs.x + obs.width &&
        playerRef.current.x + playerRef.current.width > obs.x &&
        playerRef.current.y < obs.y + obs.height &&
        playerRef.current.y + playerRef.current.height > obs.y
      ) {
        endGame();
        return false;
      }
      return obs.y < 600;
    });

    // Move & Filter Collectibles
    collectiblesRef.current = collectiblesRef.current.filter(col => {
      col.y += speedRef.current;
      // Collision detection
      if (
        playerRef.current.x < col.x + col.width &&
        playerRef.current.x + playerRef.current.width > col.x &&
        playerRef.current.y < col.y + col.height &&
        playerRef.current.y + playerRef.current.height > col.y
      ) {
        if (col.type === 'fuel') {
          setGameState(prev => ({ ...prev, fuel: Math.min(100, prev.fuel + 20) }));
        } else {
          setGameState(prev => ({ ...prev, score: prev.score + 100 }));
        }
        return false;
      }
      return col.y < 600;
    });
  };

  const endGame = () => {
    setGameState(prev => {
      const isNewHigh = prev.score > prev.highScore;
      if (isNewHigh) {
        localStorage.setItem('carry_go_highscore', prev.score.toString());
      }
      return {
        ...prev,
        isGameOver: true,
        highScore: isNewHigh ? prev.score : prev.highScore,
      };
    });
  };

  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, 300, 600);

    // Draw Road
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, 300, 600);
    
    // Lane markers
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([20, 20]);
    ctx.beginPath();
    ctx.moveTo(100, 0); ctx.lineTo(100, 600);
    ctx.moveTo(200, 0); ctx.lineTo(200, 600);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Player
    ctx.fillStyle = '#FFD700'; // Aba Gold
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFD700';
    ctx.fillRect(playerRef.current.x, playerRef.current.y, playerRef.current.width, playerRef.current.height);
    ctx.shadowBlur = 0;

    // Draw Obstacles
    obstaclesRef.current.forEach(obs => {
      ctx.fillStyle = obs.type === 'pothole' ? '#333' : '#ff4444';
      ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
    });

    // Draw Collectibles
    collectiblesRef.current.forEach(col => {
      ctx.fillStyle = col.type === 'fuel' ? '#00ff88' : '#00aaff';
      ctx.beginPath();
      ctx.arc(col.x + col.width / 2, col.y + col.height / 2, col.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const loop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    update();
    draw(ctx);
    requestRef.current = requestAnimationFrame(loop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(loop);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState.isPaused, gameState.isGameOver]);

  const moveLeft = () => {
    playerRef.current.x = Math.max(30, playerRef.current.x - 100);
  };

  const moveRight = () => {
    playerRef.current.x = Math.min(230, playerRef.current.x + 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      moveLeft();
    } else if (e.key === 'ArrowRight') {
      moveRight();
    }
  };

  return (
    <div 
      className="min-h-screen bg-[#00120b] text-white flex flex-col items-center justify-center p-4 outline-none touch-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-black uppercase tracking-widest text-aba-gold leading-none">Carry-Go Dash</h2>
          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">Aba Logistics Arcade</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Game Container */}
      <div className="relative group w-full max-w-[300px] flex-1 min-h-0">
        <div className="absolute -inset-4 bg-aba-gold/10 blur-3xl opacity-50 pointer-events-none" />
        
        <div className="relative h-full bg-black rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl">
          {/* HUD */}
          <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-start z-10 pointer-events-none">
            <div className="space-y-1">
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Score</p>
              <p className="text-xl font-black text-aba-gold">{Math.floor(gameState.score)}</p>
            </div>
            <div className="text-right space-y-2">
              <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-aba-green"
                  animate={{ width: `${gameState.fuel}%` }}
                  transition={{ type: 'spring', bounce: 0 }}
                />
              </div>
              <p className="text-[8px] font-black uppercase text-white/40 tracking-widest">Fuel</p>
            </div>
          </div>

          <canvas 
            ref={canvasRef} 
            width={300} 
            height={600} 
            className="w-full h-full object-contain block"
          />

          {/* Overlays */}
          <AnimatePresence>
            {(gameState.isPaused || gameState.isGameOver) && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 text-center z-20"
              >
                <div className="w-full max-h-full overflow-y-auto py-4 space-y-4">
                  {gameState.isGameOver ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <AlertTriangle size={24} className="text-red-500" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter">Out of Fuel!</h3>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/10 inline-block">
                        <p className="text-[7px] font-black uppercase text-white/40 tracking-widest mb-0.5">Final Score</p>
                        <p className="text-2xl font-black text-aba-gold">{gameState.score}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-aba-gold/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Bike size={24} className="text-aba-gold" />
                      </div>
                      <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">Ready to Deliver?</h3>
                      <p className="text-white/40 text-[9px] font-medium max-w-[180px] mx-auto leading-relaxed">
                        Dodge potholes and cars. Collect packages and fuel!
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col gap-2 max-w-[200px] mx-auto">
                    <button 
                      onClick={initGame}
                      className="w-full py-3 bg-aba-gold text-aba-dark rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      {gameState.isGameOver ? <RotateCcw size={16} /> : <Play size={16} />}
                      {gameState.isGameOver ? "Try Again" : "Start Delivery"}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[7px] font-black uppercase text-white/20 tracking-widest">
                      <Trophy size={8} /> High Score: {gameState.highScore}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile Touch Controls Overlay */}
          {!gameState.isPaused && !gameState.isGameOver && (
            <div className="absolute inset-0 z-10 flex">
              <button 
                className="flex-1 h-full active:bg-white/5 transition-colors"
                onClick={moveLeft}
                aria-label="Move Left"
              />
              <button 
                className="flex-1 h-full active:bg-white/5 transition-colors"
                onClick={moveRight}
                aria-label="Move Right"
              />
            </div>
          )}
        </div>
      </div>

      {/* Controls Help */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <div className="flex gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-black">←</div>
              <div className="w-8 h-8 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center text-[10px] font-black">→</div>
            </div>
            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Tap Sides to Move</p>
          </div>
          <div className="h-10 w-px bg-white/10" />
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-[#00aaff] rounded-full" />
                <span className="text-[8px] font-black uppercase text-white/60">+100</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 bg-[#00ff88] rounded-full" />
                <span className="text-[8px] font-black uppercase text-white/60">Fuel</span>
              </div>
            </div>
            <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Collectibles</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarryGoDash;
