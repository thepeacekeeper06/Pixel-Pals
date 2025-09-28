import React, { useState, useEffect, useCallback } from 'react';
import { GameScreen } from './components/GameScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FruitSlicerGame } from './components/FruitSlicerGame';
import { DotsAndBoxesGame } from './components/DotsAndBoxesGame';
import { Player, GameEvent, PlayerInfo, SyncEventPayload, GameType } from './types';
import { PLAYER_INFO_KEY, ROOM_ID_KEY, GAME_TYPE_KEY } from './constants';
import { syncService } from './services/syncService';
import { Icon } from './components/Icon';

const Lobby: React.FC<{ roomCode: string; player: PlayerInfo }> = ({ roomCode, player }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 p-4">
            <h1 style={{fontFamily: "'Pacifico', cursive"}} className="text-6xl text-primary mb-4">Pixel Pals</h1>
            <p className="text-2xl mb-8">Welcome, {player.name}!</p>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center w-full max-w-md">
                <h2 className="text-xl font-semibold mb-2">Room Code</h2>
                <p className="text-4xl font-bold text-secondary tracking-widest bg-gray-100 p-3 rounded-md mb-4">{roomCode}</p>
                <p className="text-gray-600 mb-6">Share this code with a friend to have them join your room!</p>
                 <div className="flex justify-center items-center space-x-2 mt-6">
                    <div className="w-4 h-4 bg-secondary rounded-full animate-bounce"></div>
                    <div className="w-4 h-4 bg-secondary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-4 h-4 bg-secondary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
            </div>
        </div>
    );
};


function App() {
    const [gameState, setGameState] = useState<'welcome' | 'lobby' | 'playing'>('welcome');
    const [player, setPlayer] = useState<PlayerInfo | null>(null);
    const [opponent, setOpponent] = useState<PlayerInfo | null>(null);
    const [roomCode, setRoomCode] = useState<string | null>(null);
    const [gameType, setGameType] = useState<GameType | null>(null);
    const [isHost, setIsHost] = useState(false);

    const handleSyncEvent = useCallback((event: SyncEventPayload) => {
        switch (event.type) {
            case GameEvent.PLAYER_JOIN:
                // This is only ever received by the host from the joining player.
                const newOpponent = event.payload.player;
                setOpponent(newOpponent);
                // Host confirms the join and sends their info back to start the game.
                syncService.sendEvent({
                    type: GameEvent.GAME_START,
                    payload: { opponent: player!, gameType: gameType! }
                });
                setGameState('playing');
                break;
            case GameEvent.GAME_START:
                 // This is only ever received by the guest from the host.
                setOpponent(event.payload.opponent);
                setGameType(event.payload.gameType);
                setGameState('playing');
                break;
            case GameEvent.PLAYER_UPDATE:
                 if (event.payload.player.id !== player?.id) {
                    setOpponent(prev => ({...prev!, ...event.payload.player }));
                }
                break;
        }
    }, [player, gameType]);

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

    useEffect(() => {
        // Restore session
        const savedPlayer = sessionStorage.getItem(PLAYER_INFO_KEY);
        const savedRoom = sessionStorage.getItem(ROOM_ID_KEY);
        const savedGameType = sessionStorage.getItem(GAME_TYPE_KEY) as GameType;

        if (savedPlayer && savedRoom && savedGameType) {
            const playerInfo = JSON.parse(savedPlayer);
            setPlayer(playerInfo);
            setRoomCode(savedRoom);
            setGameType(savedGameType);
            syncService.init();
            syncService.connect(savedRoom);
            setGameState('lobby');
            if (playerInfo.id === Player.Player1) {
                setIsHost(true);
            }
        }
    }, []);
    
    const setupRoom = (playerName: string, selectedGameType: GameType, existingRoomCode?: string) => {
        const isCreating = !existingRoomCode;
        const newRoomCode = existingRoomCode || Math.random().toString(36).substring(2, 7).toUpperCase();
        const newPlayer: PlayerInfo = {
            id: isCreating ? Player.Player1 : Player.Player2,
            name: playerName,
        };
        
        setPlayer(newPlayer);
        setRoomCode(newRoomCode);
        setGameType(selectedGameType);
        setIsHost(isCreating);
        
        sessionStorage.setItem(PLAYER_INFO_KEY, JSON.stringify(newPlayer));
        sessionStorage.setItem(ROOM_ID_KEY, newRoomCode);
        sessionStorage.setItem(GAME_TYPE_KEY, selectedGameType);
        
        syncService.init();
        syncService.connect(newRoomCode);

        if (!isCreating) { // If joining, announce presence
            syncService.sendEvent({ type: GameEvent.PLAYER_JOIN, payload: { player: newPlayer } });
        }
        
        setGameState('lobby');
    };
    
    const handleGoHome = () => {
        sessionStorage.removeItem(PLAYER_INFO_KEY);
        sessionStorage.removeItem(ROOM_ID_KEY);
        sessionStorage.removeItem(GAME_TYPE_KEY);
        
        syncService.disconnect();
        
        setGameState('welcome');
        setPlayer(null);
        setOpponent(null);
        setRoomCode(null);
        setGameType(null);
        setIsHost(false);
    };
    
    const renderContent = () => {
        if (gameState === 'welcome') {
            return <WelcomeScreen onSetupRoom={setupRoom} />;
        }

        if (gameState === 'lobby' && roomCode && player) {
            return <Lobby roomCode={roomCode} player={player} />;
        }

        if (gameState === 'playing' && player && opponent && gameType) {
            if (gameType === 'DOODLE') {
                return <GameScreen player={player} opponent={opponent} />;
            }
            if (gameType === 'FRUIT_SLICER') {
                return <FruitSlicerGame player={player} opponent={opponent} isHost={isHost} />;
            }
            if (gameType === 'DOTS_AND_BOXES') {
                return <DotsAndBoxesGame player={player} opponent={opponent} isHost={isHost} />;
            }
        }
        return <div>Loading...</div>; // Or some error state
    };
    
    return (
        <div className="w-screen h-screen">
            {gameState !== 'welcome' && (
                <button 
                    onClick={handleGoHome} 
                    className="absolute top-4 right-4 z-50 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-lg text-gray-700 hover:bg-white hover:text-primary transition-colors"
                    aria-label="Go to Home Screen"
                >
                    <Icon name="home" />
                </button>
            )}
            {renderContent()}
        </div>
    );
}


export default App;
