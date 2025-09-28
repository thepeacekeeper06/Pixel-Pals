import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DrawingCanvas } from './DrawingCanvas';
import { Toolbar } from './Toolbar';
import { ChatBox } from './ChatBox';
import { ControlPanel } from './ControlPanel';
import type { ChatMessage, EmojiReaction, SyncEventPayload, Template, DrawData, PlayerInfo, BrushStyle, Point, CursorMovePayload } from '../types';
import { Player, GameEvent } from '../types';
import { COLORS, BRUSH_SIZES, BRUSH_STYLES, TEMPLATES } from '../constants';
import { syncService } from '../services/syncService';

interface GameScreenProps {
  player: PlayerInfo;
  opponent: PlayerInfo;
}

export const GameScreen: React.FC<GameScreenProps> = ({ player, opponent }) => {
    const [color, setColor] = useState(COLORS[0]);
    const [lineWidth, setLineWidth] = useState(BRUSH_SIZES[1]);
    const [brushStyle, setBrushStyle] = useState<BrushStyle>(BRUSH_STYLES[0]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [reactions, setReactions] = useState<EmojiReaction[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
    const [remoteCursor, setRemoteCursor] = useState<CursorMovePayload | null>(null);

    const drawHandlerRef = useRef<((data: DrawData) => void) | null>(null);
    const clearHandlerRef = useRef<(() => void) | null>(null);
    const templateHandlerRef = useRef<((url: string | null) => void) | null>(null);
    const cursorHandlerRef = useRef<((data: CursorMovePayload | null) => void) | null>(null);

    const handleSyncEvent = useCallback((event: SyncEventPayload) => {
        switch (event.type) {
            case GameEvent.DRAW:
                drawHandlerRef.current?.(event.payload);
                break;
            case GameEvent.CURSOR_MOVE:
                 if (event.payload.player.id !== player.id) {
                    cursorHandlerRef.current?.(event.payload);
                }
                break;
            case GameEvent.CLEAR_CANVAS:
                clearHandlerRef.current?.();
                break;
            case GameEvent.SELECT_TEMPLATE:
                const template = TEMPLATES.find(t => t.id === event.payload) || null;
                templateHandlerRef.current?.(template?.url ?? null);
                setActiveTemplate(template);
                break;
            case GameEvent.CHAT_MESSAGE:
                setMessages(prev => [...prev, event.payload]);
                break;
            case GameEvent.EMOJI_REACTION:
                setReactions(prev => [...prev, event.payload]);
                setTimeout(() => {
                    setReactions(r => r.filter(r => r.id !== event.payload.id));
                }, 3000);
                break;
        }
    }, [player.id]);

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
    
    const handleClear = () => {
        clearHandlerRef.current?.();
        syncService.sendEvent({ type: GameEvent.CLEAR_CANVAS, payload: null });
    };

    const handleSelectTemplate = (template: Template | null) => {
        templateHandlerRef.current?.(template?.url ?? null);
        setActiveTemplate(template);
        syncService.sendEvent({ type: GameEvent.SELECT_TEMPLATE, payload: template?.id ?? null });
    };

    return (
        <div className="w-screen h-screen flex flex-col md:flex-row bg-base-200 font-sans overflow-hidden">
            <div className="relative flex-grow flex flex-col items-center justify-center p-4">
                <Toolbar 
                    color={color} setColor={setColor} 
                    lineWidth={lineWidth} setLineWidth={setLineWidth}
                    brushStyle={brushStyle} setBrushStyle={setBrushStyle}
                />
                <DrawingCanvas
                    player={player}
                    color={color}
                    lineWidth={lineWidth}
                    brushStyle={brushStyle}
                    setDrawHandler={(handler) => { drawHandlerRef.current = handler; }}
                    setClearHandler={(handler) => { clearHandlerRef.current = handler; }}
                    setTemplateHandler={(handler) => { templateHandlerRef.current = handler; }}
                    setCursorHandler={(handler) => { cursorHandlerRef.current = handler; }}
                />
                <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg shadow-md text-sm">
                    <p>You: <span className={`font-bold ${player.id === Player.Player1 ? 'text-blue-600' : 'text-red-600'}`}>{player.name}</span></p>
                    <p>Opponent: <span className={`font-bold ${opponent.id === Player.Player1 ? 'text-blue-600' : 'text-red-600'}`}>{opponent.name}</span></p>
                </div>
                {reactions.map(r => (
                    <div key={r.id} className="absolute text-6xl animate-ping pointer-events-none" style={{top: `${Math.random()*60+20}%`, left: `${Math.random()*60+20}%`}}>
                        {r.emoji}
                    </div>
                ))}
            </div>
            <div className="w-full md:w-80 lg:w-96 bg-white flex-shrink-0 flex flex-col shadow-lg border-l border-base-300 h-full">
                <ControlPanel 
                    onClear={handleClear}
                    onSelectTemplate={handleSelectTemplate}
                    activeTemplate={activeTemplate}
                />
                <ChatBox 
                    player={player}
                    messages={messages}
                    setMessages={setMessages}
                    setReactions={setReactions}
                />
            </div>
        </div>
    );
};