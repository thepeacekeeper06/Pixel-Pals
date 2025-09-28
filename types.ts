export enum Player {
  Player1 = 'Player1',
  Player2 = 'Player2',
  None = 'None'
}

export interface PlayerInfo {
    id: Player;
    name: string;
    color?: string;
}

export interface Point {
  x: number;
  y: number;
}

export type BrushStyle = 'solid' | 'dashed' | 'dotted';
export type GameType = 'DOODLE' | 'FRUIT_SLICER' | 'DOTS_AND_BOXES';

export interface DrawData {
  start: Point;
  end: Point;
  color: string;
  lineWidth: number;
  brushStyle: BrushStyle;
}

export interface Template {
    id: string;
    name:string;
    url: string;
}

// --- Fruit Slicer Types ---
export type FruitType = 'apple' | 'banana' | 'strawberry' | 'watermelon' | 'bomb';

export interface Fruit {
    id: string;
    type: FruitType;
    pos: Point;
    velocity: Point;
}

export interface Slice {
    id: string;
    points: Point[];
    tick: number;
}

// --- Dots and Boxes Types ---
export interface LinePosition {
    row: number;
    col: number;
    type: 'h' | 'v'; // horizontal or vertical
}

export interface BoxState {
    row: number;
    col: number;
    owner: Player;
}

export interface DotsAndBoxesState {
    turn: Player;
    lines: Record<string, Player>; // key: `${row}-${col}-${type}`
    boxes: BoxState[];
    scores: { [key in Player]?: number };
    gameOver: boolean;
    winner: Player | null;
}

export enum GameEvent {
    // Drawing
    DRAW = 'DRAW',
    CURSOR_MOVE = 'CURSOR_MOVE',
    CLEAR_CANVAS = 'CLEAR_CANVAS',
    SELECT_TEMPLATE = 'SELECT_TEMPLATE',
    // Chat
    CHAT_MESSAGE = 'CHAT_MESSAGE',
    EMOJI_REACTION = 'EMOJI_REACTION',
    // Room management
    PLAYER_JOIN = 'PLAYER_JOIN',
    PLAYER_UPDATE = 'PLAYER_UPDATE',
    GAME_START = 'GAME_START',
    // Fruit Slicer
    START_FRUIT_GAME = 'START_FRUIT_GAME',
    SPAWN_FRUIT = 'SPAWN_FRUIT',
    SLICE_ITEM = 'SLICE_ITEM',
    GAME_OVER_FRUIT = 'GAME_OVER_FRUIT',
    // Dots and Boxes
    SELECT_LINE = 'SELECT_LINE',
    RESTART_DNB_GAME = 'RESTART_DNB_GAME',
}

export interface ChatMessage {
    id: string;
    sender: PlayerInfo;
    text: string;
}

export interface EmojiReaction {
    id: string;
    sender: Player;
    emoji: string;
}

export interface CursorMovePayload {
    player: PlayerInfo;
    point: Point | null;
}

export type SyncEventPayload =
    // Drawing
    | { type: GameEvent.DRAW; payload: DrawData }
    | { type: GameEvent.CURSOR_MOVE; payload: CursorMovePayload }
    | { type: GameEvent.CLEAR_CANVAS; payload: null }
    | { type: GameEvent.SELECT_TEMPLATE; payload: string | null }
    // Chat
    | { type: GameEvent.CHAT_MESSAGE; payload: ChatMessage }
    | { type: GameEvent.EMOJI_REACTION; payload: EmojiReaction }
    // Room
    | { type: GameEvent.PLAYER_JOIN; payload: { player: PlayerInfo } }
    | { type: GameEvent.PLAYER_UPDATE; payload: { player: PlayerInfo } }
    | { type: GameEvent.GAME_START; payload: { opponent: PlayerInfo; gameType: GameType } }
    // Fruit Slicer
    | { type: GameEvent.START_FRUIT_GAME; payload: null }
    | { type: GameEvent.SPAWN_FRUIT; payload: Fruit }
    | { type: GameEvent.SLICE_ITEM; payload: { itemId: string; slicerId: Player } }
    | { type: GameEvent.GAME_OVER_FRUIT; payload: { winner: Player } }
    // Dots and Boxes
    | { type: GameEvent.SELECT_LINE; payload: { line: LinePosition; player: Player } }
    | { type: GameEvent.RESTART_DNB_GAME; payload: null };