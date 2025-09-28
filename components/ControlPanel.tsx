
import React, { useState } from 'react';
import type { Template } from '../types';
import { TEMPLATES } from '../constants';
import { getDrawingIdea } from '../services/geminiService';
import { Icon } from './Icon';

interface ControlPanelProps {
    onClear: () => void;
    onSelectTemplate: (template: Template | null) => void;
    activeTemplate: Template | null;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ onClear, onSelectTemplate, activeTemplate }) => {
    const [idea, setIdea] = useState('');
    const [isLoadingIdea, setIsLoadingIdea] = useState(false);

    const fetchIdea = async () => {
        setIsLoadingIdea(true);
        setIdea('...');
        const newIdea = await getDrawingIdea();
        setIdea(newIdea);
        setIsLoadingIdea(false);
    };

    return (
        <div className="p-4 border-b border-base-300 bg-white">
            <h3 className="text-lg font-semibold mb-3 text-gray-700">Controls</h3>
            <div className="space-y-3">
                <button onClick={onClear} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium">
                    <Icon name="trash" /> Clear Canvas
                </button>
                <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="font-medium text-gray-600 mb-2">Drawing Idea</p>
                    <div className="flex items-center gap-2">
                         <button onClick={fetchIdea} disabled={isLoadingIdea} className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:bg-gray-400">
                           {isLoadingIdea ? <Icon name="loading" /> : <Icon name="idea" />}
                        </button>
                        <p className="flex-grow text-center text-gray-800 bg-white p-2 rounded-md h-10 flex items-center justify-center">
                            {idea || 'Click for an idea!'}
                        </p>
                    </div>
                </div>
                 <div className="bg-gray-100 p-3 rounded-lg">
                    <p className="font-medium text-gray-600 mb-2">Templates</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => onSelectTemplate(null)} className={`h-16 rounded-md flex items-center justify-center text-gray-700 font-semibold transition-all ${!activeTemplate ? 'ring-2 ring-primary bg-blue-100' : 'bg-white hover:bg-gray-200'}`}>
                            None
                        </button>
                        {TEMPLATES.map(t => (
                             <button key={t.id} onClick={() => onSelectTemplate(t)} className={`h-16 rounded-md bg-cover bg-center relative overflow-hidden transition-all ${activeTemplate?.id === t.id ? 'ring-2 ring-primary' : ''}`}>
                                <img src={t.url} alt={t.name} className="absolute w-full h-full object-cover"/>
                                <div className="absolute w-full h-full bg-black/40 flex items-center justify-center">
                                    <span className="text-white font-semibold text-sm text-center">{t.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
