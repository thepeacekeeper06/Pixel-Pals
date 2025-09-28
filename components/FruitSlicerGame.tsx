import React, { useState, useEffect, useRef, useCallback } from 'react';
// FIX: 'Player' is an enum used as a value, so it cannot be imported using 'import type'. It is now imported as a value.
import type { PlayerInfo, Fruit, Point, Slice, SyncEventPayload } from '../types';
import { GameEvent, Player } from '../types';
import { syncService } from '../services/syncService';
import { FRUITS, GAME_CONFIG } from '../constants';

interface FruitSlicerGameProps {
  player: PlayerInfo;
  opponent: PlayerInfo;
  isHost: boolean;
}

// Preload images
const fruitImages: Record<string, HTMLImageElement> = {};
Object.entries(FRUITS).forEach(([name, src]) => {
    const img = new Image();
    img.src = src;
    fruitImages[name] = img;
});

export const FruitSlicerGame: React.FC<FruitSlicerGameProps> = ({ player, opponent, isHost }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<'idle' | 'running' | 'over'>('idle');
    const [fruits, setFruits] = useState<Fruit[]>([]);
    const [slices, setSlices] = useState<Slice[]>([]);
    const [scores, setScores] = useState({ [Player.Player1]: 0, [Player.Player2]: 0 });
    const [winner, setWinner] = useState<Player | null>(null);

    // FIX: The useRef hook was called without an initial value, which is not allowed when a type argument is provided. Initializing with null is the correct approach for a ref that will be populated later.
    const animationFrameId = useRef<number | null>(null);
    const lastSlicePoint = useRef<Point | null>(null);
    const isSlicing = useRef(false);

    const handleSyncEvent = useCallback((event: SyncEventPayload) => {
        switch (event.type) {
            case GameEvent.START_FRUIT_GAME:
                setGameState('running');
                break;
            case GameEvent.SPAWN_FRUIT:
                setFruits(prev => [...prev, event.payload]);
                break;
            case GameEvent.SLICE_ITEM:
                setFruits(prev => prev.filter(f => f.id !== event.payload.itemId));
                setScores(prev => ({
                    ...prev,
                    [event.payload.slicerId]: prev[event.payload.slicerId] + 1
                }));
                break;
            case GameEvent.GAME_OVER_FRUIT:
                setGameState('over');
                setWinner(event.payload.winner);
                break;
        }
    }, []);

    useEffect(() => {
        const handleGlobalSyncEvent = (event: Event) => {
            const customEvent = event as CustomEvent<SyncEventPayload>;
            handleSyncEvent(customEvent.detail);
        };
        
        window.addEventListener('sync-event', handleGlobalSyncEvent);
        
        return () => {
            window.removeEventListener('sync-event', handleGlobalSyncEvent);
        };
    }, [handleSyncEvent]);

    const startGame = () => {
        if (!isHost) return;
        setGameState('running');
        setScores({ [Player.Player1]: 0, [Player.Player2]: 0 });
        setFruits([]);
        setWinner(null);
        syncService.sendEvent({ type: GameEvent.START_FRUIT_GAME, payload: null });
    };
    
    // Host: Spawn fruits
    useEffect(() => {
        if (isHost && gameState === 'running') {
            const spawnInterval = setInterval(() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                
                const fruitTypes = Object.keys(FRUITS);
                const type = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
                
                const newFruit: Fruit = {
                    id: `${Date.now()}-${Math.random()}`,
                    type: type as keyof typeof FRUITS,
                    pos: { x: Math.random() * canvas.width, y: canvas.height + 50 },
                    velocity: {
                        x: (Math.random() - 0.5) * 8,
                        y: -12 - Math.random() * 5
                    }
                };
                setFruits(prev => [...prev, newFruit]);
                syncService.sendEvent({ type: GameEvent.SPAWN_FRUIT, payload: newFruit });

            }, GAME_CONFIG.SPAWN_INTERVAL);
            return () => clearInterval(spawnInterval);
        }
    }, [isHost, gameState]);

    const gameLoop = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw fruits
        const updatedFruits = fruits.map(f => {
            f.pos.x += f.velocity.x;
            f.pos.y += f.velocity.y;
            f.velocity.y += GAME_CONFIG.GRAVITY;
            return f;
        }).filter(f => f.pos.y < canvas.height + 100); // Keep if on screen
        setFruits(updatedFruits);
        
        updatedFruits.forEach(f => {
            ctx.save();
            ctx.translate(f.pos.x, f.pos.y);
            const img = fruitImages[f.type];
            if (img) {
                ctx.drawImage(img, -35, -35, 70, 70);
            }
            ctx.restore();
        });

        // Draw slices
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        const updatedSlices = slices.map(s => {
            s.tick -= GAME_CONFIG.SLICE_FADE_SPEED;
            return s;
        }).filter(s => s.tick > 0);
        setSlices(updatedSlices);

        updatedSlices.forEach(s => {
            if (s.points.length < 2) return;
            ctx.beginPath();
            ctx.moveTo(s.points[0].x, s.points[0].y);
            for(let i = 1; i < s.points.length; i++) {
                ctx.lineTo(s.points[i].x, s.points[i].y);
            }
            ctx.globalAlpha = Math.max(0, s.tick / 100);
            ctx.stroke();
            ctx.globalAlpha = 1;
        });

        animationFrameId.current = requestAnimationFrame(gameLoop);
    }, [fruits, slices]);

    useEffect(() => {
        if (gameState === 'running') {
            animationFrameId.current = requestAnimationFrame(gameLoop);
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [gameLoop, gameState]);

    const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleSliceStart = (e: React.MouseEvent | React.TouchEvent) => {
        if (gameState !== 'running') return;
        isSlicing.current = true;
        const point = getPoint(e);
        lastSlicePoint.current = point;
        setSlices(prev => [...prev, { id: `slice-${Date.now()}`, points: [point], tick: 100 }]);
    };

    const handleSliceMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isSlicing.current || gameState !== 'running') return;
        
        const point = getPoint(e);
        
        setSlices(prev => {
            const newSlices = [...prev];
            const currentSlice = newSlices[newSlices.length - 1];
            if (currentSlice) currentSlice.points.push(point);
            return newSlices;
        });

        // Collision check
        fruits.forEach(f => {
            const dist = Math.hypot(f.pos.x - point.x, f.pos.y - point.y);
            if (dist < 40) { // 40 is collision radius
                 if (f.type === 'bomb') {
                    const loser = player.id;
                    const gameWinner = loser === Player.Player1 ? Player.Player2 : Player.Player1;
                    syncService.sendEvent({ type: GameEvent.GAME_OVER_FRUIT, payload: { winner: gameWinner }});
                    setGameState('over');
                    setWinner(gameWinner);
                 } else {
                    syncService.sendEvent({ type: GameEvent.SLICE_ITEM, payload: { itemId: f.id, slicerId: player.id }});
                    setFruits(prev => prev.filter(fruit => fruit.id !== f.id));
                    setScores(prev => ({
                        ...prev,
                        [player.id]: prev[player.id] + 1
                    }));
                 }
            }
        });

        lastSlicePoint.current = point;
    };
    
    const handleSliceEnd = () => {
        isSlicing.current = false;
        lastSlicePoint.current = null;
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;
            }
        };
        resize();
        window.addEventListener('resize', resize);
        return () => window.removeEventListener('resize', resize);
    }, []);

    const playerScore = scores[player.id];
    const opponentScore = scores[opponent.id];
    
    return (
        <div className="w-screen h-screen bg-blue-900 bg-gradient-to-b from-blue-800 to-indigo-900 flex flex-col items-center justify-center font-sans relative overflow-hidden">
            <div className="absolute top-4 left-4 text-white bg-black/30 p-3 rounded-lg text-lg">
                <p><span className="font-bold">{player.name} (You):</span> {playerScore}</p>
            </div>
            <div className="absolute top-4 right-4 text-white bg-black/30 p-3 rounded-lg text-lg">
                 <p><span className="font-bold">{opponent.name}:</span> {opponentScore}</p>
            </div>

            <div className="w-full h-full max-w-7xl max-h-[80vh] relative cursor-crosshair">
                <canvas 
                    ref={canvasRef}
                    className="w-full h-full"
                    onMouseDown={handleSliceStart}
                    onMouseMove={handleSliceMove}
                    onMouseUp={handleSliceEnd}
                    onMouseLeave={handleSliceEnd}
                    onTouchStart={handleSliceStart}
                    onTouchMove={handleSliceMove}
                    onTouchEnd={handleSliceEnd}
                />
            </div>

            {gameState !== 'running' && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white text-center p-4">
                    {gameState === 'idle' && (
                        <>
                            <h2 className="text-6xl font-bold mb-4">Fruit Slicer</h2>
                            {isHost ? (
                                <button onClick={startGame} className="px-8 py-4 bg-green-500 text-white font-bold rounded-lg text-2xl hover:bg-green-600 transition-transform transform hover:scale-105">
                                    Start Game
                                </button>
                            ) : (
                                <p className="text-2xl">Waiting for the host to start the game...</p>
                            )}
                        </>
                    )}
                    {gameState === 'over' && (
                         <>
                            <h2 className="text-6xl font-bold mb-4">Game Over!</h2>
                            <p className="text-3xl mb-6">
                                {winner === player.id ? 'You Win! 🎉' : (winner === opponent.id ? `${opponent.name} Wins!` : 'It\'s a tie!')}
                            </p>
                            <div className="text-2xl mb-8 bg-white/20 p-4 rounded-lg">
                                <p>Final Score:</p>
                                <p>{player.name}: {playerScore} | {opponent.name}: {opponentScore}</p>
                            </div>
                            {isHost && (
                                <button onClick={startGame} className="px-8 py-4 bg-blue-500 text-white font-bold rounded-lg text-2xl hover:bg-blue-600 transition-transform transform hover:scale-105">
                                    Play Again
                                </button>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};