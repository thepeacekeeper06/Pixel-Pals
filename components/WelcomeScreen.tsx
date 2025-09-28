import React, { useState } from 'react';
import type { GameType } from '../types';
import { GAME_INFO } from '../constants';
import { Icon } from './Icon';

interface WelcomeScreenProps {
    onSetupRoom: (playerName: string, gameType: GameType, roomCode?: string) => void;
}

const GameCard: React.FC<{
    type: GameType;
    info: { title: string; description: string; imageUrl: string };
    isSelected: boolean;
    onSelect: () => void;
}> = ({ type, info, isSelected, onSelect }) => {
    return (
        <div
            onClick={onSelect}
            className={`group rounded-xl border-2 transition-all duration-300 ease-in-out cursor-pointer overflow-hidden transform hover:-translate-y-1 hover:shadow-2xl ${isSelected ? 'border-primary ring-2 ring-primary shadow-xl' : 'border-base-300'}`}
        >
            <div className="h-40 overflow-hidden relative">
                <img src={info.imageUrl} alt={info.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
            <div className="p-4 bg-white">
                <h3 className={`text-xl font-bold ${isSelected ? 'text-primary' : 'text-gray-800'}`}>{info.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{info.description}</p>
            </div>
        </div>
    );
};

const SetupModal: React.FC<{
    mode: 'create' | 'join';
    onClose: () => void;
    onSubmit: (playerName: string, roomCode?: string) => void;
}> = ({ mode, onClose, onSubmit }) => {
    const [playerName, setPlayerName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = () => {
        if (playerName.trim().length < 2) {
            setError('Please enter a name (at least 2 characters).');
            return;
        }
        if (mode === 'join' && roomCode.trim().length < 4) {
            setError('Please enter a valid room code.');
            return;
        }
        setError('');
        onSubmit(playerName, roomCode);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors">
                    <Icon name="close" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                    {mode === 'create' ? 'Create a New Room' : 'Join an Existing Room'}
                </h2>
                <div className="space-y-4">
                     <div>
                        <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                        <input
                            id="playerName" type="text" value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:outline-none transition"
                            maxLength={12}
                        />
                    </div>
                    {mode === 'join' && (
                         <div>
                            <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-1">Room Code</label>
                            <input
                                id="roomCode" type="text" value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="Enter 5-digit code..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:outline-none transition"
                                maxLength={5}
                            />
                        </div>
                    )}
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button onClick={handleSubmit} className={`w-full px-4 py-3 text-white font-bold rounded-lg transition-colors ${mode === 'create' ? 'bg-primary hover:bg-blue-800' : 'bg-accent hover:bg-orange-600'}`}>
                        {mode === 'create' ? 'Create & Go!' : 'Join Game'}
                    </button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-fade-in-up { animation: fade-in-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};


export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSetupRoom }) => {
    const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
    const [modalState, setModalState] = useState<'create' | 'join' | null>(null);

    const handleSetupSubmit = (playerName: string, roomCode?: string) => {
        if (!selectedGame) return;
        onSetupRoom(playerName, selectedGame, roomCode);
    };
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
             <div className="text-center mb-8">
                <h1 style={{fontFamily: "'Pacifico', cursive"}} className="text-7xl text-primary">Pixel Pals</h1>
                <p className="text-xl text-gray-600 mt-2">Team up and get creative!</p>
            </div>
            
            <div className="w-full max-w-4xl bg-white p-6 sm:p-8 rounded-2xl shadow-xl">
                 <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">1. Choose a Game</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                     {Object.entries(GAME_INFO).map(([type, info]) => (
                        <GameCard 
                            key={type}
                            type={type as GameType}
                            info={info}
                            isSelected={selectedGame === type}
                            onSelect={() => setSelectedGame(type as GameType)}
                        />
                     ))}
                 </div>

                 <hr className="border-t-2 border-gray-200 border-dashed my-6"/>

                 <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">2. Start Playing</h2>
                 <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                     <button 
                        onClick={() => setModalState('create')}
                        disabled={!selectedGame}
                        className="w-full sm:w-auto px-10 py-4 bg-primary text-white font-bold rounded-lg text-lg hover:bg-blue-800 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        Create Room
                    </button>
                    <button 
                        onClick={() => setModalState('join')}
                        disabled={!selectedGame}
                        className="w-full sm:w-auto px-10 py-4 bg-accent text-white font-bold rounded-lg text-lg hover:bg-orange-600 transition-all transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100"
                    >
                        Join Room
                    </button>
                 </div>
            </div>

            {modalState && (
                <SetupModal 
                    mode={modalState}
                    onClose={() => setModalState(null)}
                    onSubmit={handleSetupSubmit}
                />
            )}
        </div>
    );
};