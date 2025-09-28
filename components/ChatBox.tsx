
import React, { useState, useRef, useEffect } from 'react';
import type { PlayerInfo, ChatMessage, EmojiReaction } from '../types';
import { GameEvent } from '../types';
import { syncService } from '../services/syncService';
import { EMOJIS } from '../constants';
import { Icon } from './Icon';

interface ChatBoxProps {
    player: PlayerInfo;
    messages: ChatMessage[];
    setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
    setReactions: React.Dispatch<React.SetStateAction<EmojiReaction[]>>;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ player, messages, setMessages, setReactions }) => {
    const [text, setText] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim() === '') return;

        const newMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: player,
            text: text.trim()
        };
        setMessages(prev => [...prev, newMessage]);
        syncService.sendEvent({ type: GameEvent.CHAT_MESSAGE, payload: newMessage });
        setText('');
    };

    const handleEmoji = (emoji: string) => {
        const newReaction: EmojiReaction = {
            id: Date.now().toString(),
            sender: player.id,
            emoji
        };
        setReactions(prev => [...prev, newReaction]);
        syncService.sendEvent({ type: GameEvent.EMOJI_REACTION, payload: newReaction });
         setTimeout(() => {
            setReactions(r => r.filter(r => r.id !== newReaction.id));
        }, 3000);
    };

    return (
        <div className="flex-grow flex flex-col p-4 bg-gray-50 h-full overflow-hidden">
            <h3 className="text-lg font-semibold mb-2 text-gray-700 border-b pb-2 flex-shrink-0">Chat & Reactions</h3>
            <div className="flex-grow overflow-y-auto mb-4 pr-2">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col mb-3 ${msg.sender.id === player.id ? 'items-end' : 'items-start'}`}>
                        <span className={`text-xs text-gray-500 mb-1 px-1 ${msg.sender.id === player.id ? 'text-right' : 'text-left'}`}>{msg.sender.name}</span>
                        <div className={`rounded-lg px-3 py-2 max-w-xs ${msg.sender.id === player.id ? 'bg-secondary text-white' : 'bg-base-200 text-gray-800'}`}>
                           <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                 <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleEmoji(emoji)} className="p-2 rounded-full text-2xl hover:bg-gray-200 transition-colors">
                            {emoji}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Say something..."
                        className="flex-grow px-4 py-2 border border-base-300 rounded-full focus:ring-2 focus:ring-primary focus:outline-none transition"
                    />
                    <button type="submit" className="p-3 bg-primary text-white rounded-full hover:bg-blue-800 transition-colors flex-shrink-0">
                        <Icon name="send" />
                    </button>
                </form>
            </div>
        </div>
    );
};
