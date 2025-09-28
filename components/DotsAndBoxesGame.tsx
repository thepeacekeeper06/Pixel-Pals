import React, { useState, useEffect, useCallback } from 'react';
import type { PlayerInfo, DotsAndBoxesState, SyncEventPayload, LinePosition, BoxState } from '../types';
import { Player, GameEvent } from '../types';
import { syncService } from '../services/syncService';
import { DNB_GRID_SIZE, PLAYER_COLORS } from '../constants';
import { Icon } from './Icon';

interface DotsAndBoxesGameProps {
  player: PlayerInfo;
  opponent: PlayerInfo;
  isHost: boolean;
}

const getLineId = (line: LinePosition) => `${line.row}-${line.col}-${line.type}`;

const createInitialState = (): DotsAndBoxesState => ({
  turn: Player.Player1,
  lines: {},
  boxes: [],
  scores: { [Player.Player1]: 0, [Player.Player2]: 0 },
  gameOver: false,
  winner: null,
});

export const DotsAndBoxesGame: React.FC<DotsAndBoxesGameProps> = ({ player, opponent, isHost }) => {
    const [gameState, setGameState] = useState<DotsAndBoxesState>(createInitialState());
    const [localPlayerInfo, setLocalPlayerInfo] = useState<PlayerInfo>({ ...player, color: player.color || PLAYER_COLORS[0] });
    const [localOpponentInfo, setLocalOpponentInfo] = useState<PlayerInfo>({ ...opponent, color: opponent.color || PLAYER_COLORS[1] });

    useEffect(() => {
        setLocalPlayerInfo(p => ({...p, ...player, color: player.color || p.color || PLAYER_COLORS[0]}));
        setLocalOpponentInfo(o => ({...o, ...opponent, color: opponent.color || o.color || PLAYER_COLORS[1]}));
    }, [player, opponent]);

    const getPlayerColor = (playerId: Player) => {
        if (playerId === localPlayerInfo.id) return localPlayerInfo.color;
        if (playerId === localOpponentInfo.id) return localOpponentInfo.color;
        return '#9ca3af'; // gray-400
    }
    
    const updateGameState = useCallback((line: LinePosition, playerMakingMove: Player) => {
        setGameState(prev => {
            const newLines = { ...prev.lines, [getLineId(line)]: playerMakingMove };
            
            const newlyCompletedBoxes: BoxState[] = [];
            const { row, col, type } = line;
            
            const potentialBoxes: {r: number, c: number}[] = [];
            if (type === 'h') {
                if (row > 0) potentialBoxes.push({r: row-1, c: col});
                if (row < DNB_GRID_SIZE - 1) potentialBoxes.push({r: row, c: col});
            } else { // 'v'
                if (col > 0) potentialBoxes.push({r: row, c: col-1});
                if (col < DNB_GRID_SIZE - 1) potentialBoxes.push({r: row, c: col});
            }

            for (const box of potentialBoxes) {
                const isAlreadyClaimed = prev.boxes.some(b => b.row === box.r && b.col === box.c);
                if (isAlreadyClaimed) continue;
                
                const top = newLines[getLineId({row: box.r, col: box.c, type: 'h'})];
                const bottom = newLines[getLineId({row: box.r + 1, col: box.c, type: 'h'})];
                const left = newLines[getLineId({row: box.r, col: box.c, type: 'v'})];
                const right = newLines[getLineId({row: box.r, col: box.c + 1, type: 'v'})];

                if (top && bottom && left && right) {
                    newlyCompletedBoxes.push({ row: box.r, col: box.c, owner: playerMakingMove });
                }
            }

            const newBoxes = [...prev.boxes, ...newlyCompletedBoxes];
            const newScores = { ...prev.scores };
            if (newlyCompletedBoxes.length > 0) {
                newScores[playerMakingMove] = (newScores[playerMakingMove] || 0) + newlyCompletedBoxes.length;
            }

            const totalLines = (DNB_GRID_SIZE * (DNB_GRID_SIZE - 1)) * 2;
            const gameOver = Object.keys(newLines).length === totalLines;
            let winner: Player | null = null;
            if (gameOver) {
                if (newScores[Player.Player1]! > newScores[Player.Player2]!) winner = Player.Player1;
                else if (newScores[Player.Player2]! > newScores[Player.Player1]!) winner = Player.Player2;
                else winner = Player.None;
            }

            return {
                ...prev,
                lines: newLines,
                boxes: newBoxes,
                scores: newScores,
                turn: newlyCompletedBoxes.length > 0 ? prev.turn : (prev.turn === Player.Player1 ? Player.Player2 : Player.Player1),
                gameOver,
                winner,
            }
        });
    }, []);

    const handleLineClick = (line: LinePosition) => {
        if (gameState.lines[getLineId(line)] || gameState.turn !== player.id || gameState.gameOver) {
            return;
        }
        syncService.sendEvent({ type: GameEvent.SELECT_LINE, payload: { line, player: player.id } });
        updateGameState(line, player.id);
    };
    
    const handleSyncEvent = useCallback((event: SyncEventPayload) => {
        switch (event.type) {
            case GameEvent.SELECT_LINE:
                if (event.payload.player !== player.id) {
                    updateGameState(event.payload.line, event.payload.player);
                }
                break;
            case GameEvent.RESTART_DNB_GAME:
                setGameState(createInitialState());
                break;
        }
    }, [player.id, updateGameState]);

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
    
    const handleColorChange = (color: string) => {
        const updatedPlayer = { ...localPlayerInfo, color };
        setLocalPlayerInfo(updatedPlayer);
        syncService.sendEvent({ type: GameEvent.PLAYER_UPDATE, payload: { player: updatedPlayer }});
    }

    const handleRestart = () => {
        if (!isHost) return;
        syncService.sendEvent({ type: GameEvent.RESTART_DNB_GAME, payload: null });
        setGameState(createInitialState());
    }

    const boardSize = 500;
    const padding = 40;
    const dotRadius = 6;
    const lineThickness = 8;
    const gridSize = DNB_GRID_SIZE;
    const cellSize = (boardSize - padding * 2) / (gridSize - 1);

    const horizontalLines: LinePosition[] = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize - 1; c++) {
            horizontalLines.push({ row: r, col: c, type: 'h' as const });
        }
    }
    const verticalLines: LinePosition[] = [];
    for (let r = 0; r < gridSize - 1; r++) {
        for (let c = 0; c < gridSize; c++) {
            verticalLines.push({ row: r, col: c, type: 'v' as const });
        }
    }
    const dots = [];
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            dots.push({ row: r, col: c});
        }
    }

    return (
        <div className="w-screen h-screen bg-base-100 flex flex-col md:flex-row items-center justify-center font-sans overflow-hidden p-4 gap-8">
            <div className="relative" style={{width: boardSize, height: boardSize}}>
                <svg width={boardSize} height={boardSize} className="rounded-lg bg-white shadow-lg">
                    {/* Render completed boxes first */}
                    {gameState.boxes.map(box => {
                        const boxColor = getPlayerColor(box.owner);
                        const x = padding + box.col * cellSize;
                        const y = padding + box.row * cellSize;
                        const cross1Length = Math.hypot(cellSize, cellSize);
                        return (
                            <g key={`box-${box.row}-${box.col}`}>
                                <rect
                                    x={x} y={y} width={cellSize} height={cellSize}
                                    fill={boxColor}
                                    className="opacity-20"
                                />
                                <line x1={x} y1={y} x2={x + cellSize} y2={y + cellSize} stroke={boxColor} strokeWidth="4" strokeLinecap="round" className="box-cross" style={{'--line-length': cross1Length} as React.CSSProperties}/>
                                <line x1={x + cellSize} y1={y} x2={x} y2={y + cellSize} stroke={boxColor} strokeWidth="4" strokeLinecap="round" className="box-cross delay-100" style={{'--line-length': cross1Length} as React.CSSProperties}/>
                            </g>
                        );
                    })}

                    {/* Render claimed lines */}
                    {Object.entries(gameState.lines).map(([id, owner]) => {
                         const [row, col, type] = id.split('-');
                         const r = parseInt(row), c = parseInt(col);
                         const isHorizontal = type === 'h';
                         return <line
                            key={id}
                            x1={padding + c * cellSize}
                            y1={padding + r * cellSize}
                            x2={padding + (c + (isHorizontal ? 1 : 0)) * cellSize}
                            y2={padding + (r + (isHorizontal ? 0 : 1)) * cellSize}
                            stroke={getPlayerColor(owner)}
                            strokeWidth={lineThickness}
                            strokeLinecap="round"
                            className="transition-colors"
                         />
                    })}
                    
                     {/* Render clickable areas for unclaimed lines */}
                     {[...horizontalLines, ...verticalLines].map(line => {
                         const id = getLineId(line);
                         if (gameState.lines[id]) return null; // Already claimed
                         const isHorizontal = line.type === 'h';
                         const isMyTurn = gameState.turn === player.id;
                         return <rect
                            key={`click-${id}`}
                            x={padding + line.col * cellSize - (isHorizontal ? 0 : lineThickness)}
                            y={padding + line.row * cellSize - (isHorizontal ? lineThickness : 0)}
                            width={isHorizontal ? cellSize : lineThickness * 2}
                            height={isHorizontal ? lineThickness * 2 : cellSize}
                            fill="transparent"
                            onClick={() => handleLineClick(line)}
                            className={isMyTurn && !gameState.gameOver ? 'cursor-pointer group' : 'cursor-not-allowed'}
                         >
                            {/* Hover effect */}
                            <line
                                x1={padding + line.col * cellSize}
                                y1={padding + line.row * cellSize}
                                x2={padding + (line.col + (isHorizontal ? 1 : 0)) * cellSize}
                                y2={padding + (line.row + (isHorizontal ? 0 : 1)) * cellSize}
                                stroke={localPlayerInfo.color}
                                strokeWidth={lineThickness}
                                strokeLinecap="round"
                                className="opacity-0 group-hover:opacity-40 transition-opacity"
                            />
                         </rect>
                     })}

                     {/* Render dots */}
                     {dots.map(dot => (
                        <circle key={`dot-${dot.row}-${dot.col}`} cx={padding + dot.col * cellSize} cy={padding + dot.row * cellSize} r={dotRadius} fill="#6b7280" />
                     ))}
                </svg>
                 <style>{`
                    .box-cross {
                        stroke-dasharray: var(--line-length);
                        stroke-dashoffset: var(--line-length);
                        animation: draw-line 0.3s ease-out forwards;
                    }
                    @keyframes draw-line {
                        to {
                            stroke-dashoffset: 0;
                        }
                    }
                    .delay-100 { animation-delay: 0.1s; }
                `}</style>
            </div>
            <div className="w-full md:w-80 bg-white p-6 rounded-lg shadow-lg flex flex-col gap-6">
                <div className="text-center">
                     <h2 className="text-2xl font-bold text-gray-800">Dots and Boxes</h2>
                </div>
                 {gameState.gameOver ? (
                    <div className="text-center flex flex-col items-center gap-4">
                        <h3 className="text-xl font-bold text-primary">Game Over!</h3>
                        <p className="text-lg">
                            {gameState.winner === Player.None ? "It's a Tie!" : 
                            (gameState.winner === player.id ? 'You Win! 🎉' : `${opponent.name} Wins!`)}
                        </p>
                        {isHost && (
                            <button onClick={handleRestart} className="flex items-center gap-2 px-6 py-2 bg-secondary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                <Icon name="replay" /> Play Again
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">
                           {gameState.turn === player.id ? "Your Turn" : `${opponent.name}'s Turn`}
                        </h3>
                        <div className={`w-full h-2 rounded-full mt-2 transition-colors ${gameState.turn === player.id ? 'bg-green-400' : 'bg-gray-300'}`}></div>
                    </div>
                )}
                <div className="flex justify-around items-center">
                    <div className="text-center">
                        <p className="font-bold text-lg" style={{color: localPlayerInfo.color}}>{localPlayerInfo.name}</p>
                        <p className="text-4xl font-bold text-gray-700">{gameState.scores[localPlayerInfo.id] || 0}</p>
                    </div>
                     <div className="text-center">
                        <p className="font-bold text-lg" style={{color: localOpponentInfo.color}}>{localOpponentInfo.name}</p>
                        <p className="text-4xl font-bold text-gray-700">{gameState.scores[localOpponentInfo.id] || 0}</p>
                    </div>
                </div>

                <div>
                    <h4 className="text-md font-semibold mb-2 text-gray-600">Your Color</h4>
                    <div className="flex flex-wrap gap-2">
                        {PLAYER_COLORS.map(color => (
                            <button 
                                key={color}
                                onClick={() => handleColorChange(color)}
                                className={`w-8 h-8 rounded-full transition-transform transform hover:scale-110 ${localPlayerInfo.color === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                                style={{backgroundColor: color}}
                                aria-label={`Select color ${color}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};