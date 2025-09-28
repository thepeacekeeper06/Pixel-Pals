import type { Template, BrushStyle, FruitType, GameType } from './types';

// --- Shared Constants ---
export const SYNC_STORAGE_KEY_PREFIX = 'pixel-pals-sync-';
export const PLAYER_INFO_KEY = 'pixel-pals-player-info';
export const ROOM_ID_KEY = 'pixel-pals-room-id';
export const GAME_TYPE_KEY = 'pixel-pals-game-type';

export const GAME_INFO: Record<GameType, { title: string; description: string; imageUrl: string }> = {
    DOODLE: {
        title: 'Doodle Together',
        description: 'A real-time collaborative drawing canvas.',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/clo-virtual-fashion.firebasestorage.app/o/Google_AI_Studio_2025-09-27T17_13_33.385Z.png?alt=media&token=da02ca6f-7f6a-4541-99e6-98b30752bdf1'
    },
    FRUIT_SLICER: {
        title: 'Fruit Slicer',
        description: 'Slice and dice fruit with a friend for the high score.',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/clo-virtual-fashion.firebasestorage.app/o/Google_AI_Studio_2025-09-27T17_14_50.134Z.png?alt=media&token=9d32384b-3173-496c-a6d7-ffef7550456c'
    },
    DOTS_AND_BOXES: {
        title: 'Dots and Boxes',
        description: 'A classic strategy game of wits and lines.',
        imageUrl: 'https://firebasestorage.googleapis.com/v0/b/clo-virtual-fashion.firebasestorage.app/o/Google_AI_Studio_2025-09-27T17_16_22.771Z.png?alt=media&token=8ce5e1a7-e9e8-4760-8ddc-e5a88509c89a'
    }
};


// --- Doodle Game Constants ---
export const COLORS = ['#000000', '#EF4444', '#F97316', '#84CC16', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899'];
export const BRUSH_SIZES = [4, 8, 16, 32];
export const BRUSH_STYLES: BrushStyle[] = ['solid', 'dashed', 'dotted'];

export const TEMPLATES: Template[] = [
    { id: 'cat', name: 'Cool Cat', url: 'https://i.imgur.com/s4p2h23.png' },
    { id: 'rocket', name: 'Space Rocket', url: 'https://i.imgur.com/N4G2f0S.png' },
    { id: 'dino', name: 'Dinosaur Doodle', url: 'https://i.imgur.com/eO3G48G.png' },
    { id: 'ocean', name: 'Sea Life', url: 'https://i.imgur.com/OANm9p9.png' }
];

export const EMOJIS = ['👍', '😂', '😍', '🤯', '🎨', '🚀'];


// --- Fruit Slicer Constants ---
export const FRUITS: Record<FruitType, string> = {
  apple: 'https://i.imgur.com/dAFaI8q.png',
  banana: 'https://i.imgur.com/MzoeN3A.png',
  strawberry: 'https://i.imgur.com/5J3322A.png',
  watermelon: 'https://i.imgur.com/kS9j7sI.png',
  bomb: 'https://i.imgur.com/T0fGo2j.png'
};

export const GAME_CONFIG = {
    GRAVITY: 0.05,
    SPAWN_INTERVAL: 800, // ms
    MAX_FRUITS: 10,
    SLICE_FADE_SPEED: 2, // ticks per frame
};

// --- Dots and Boxes Constants ---
export const DNB_GRID_SIZE = 5; // results in a 4x4 box grid
export const PLAYER_COLORS = ['#3B82F6', '#EF4444', '#22C55E', '#F97316', '#8B5CF6', '#EC4899', '#14B8A6', '#64748B'];