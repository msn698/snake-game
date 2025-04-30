export interface Tile {
  type: 'sand' | 'road' | 'obstacle' | 'goal';
  traction: number; // 0-1 value representing how much traction the tile provides
  x: number;
  y: number;
}

export interface Car {
  x: number;
  y: number;
  rotation: number; // in degrees
  velocity: {
    x: number;
    y: number;
  };
}

export interface Collectible {
  x: number;
  y: number;
  type: 'fuel' | 'powerup';
  value: number;
}

export interface Level {
  grid: Tile[][];
  timeLimit: number;
  collectibles: Collectible[];
}

export interface Position {
  x: number;
  y: number;
}

export interface Food {
  position: Position;
  type: 'normal' | 'special' | 'bonus';
  value: number;
  color: string;
}

export type SnakeSkin = 'classic' | 'rainbow' | 'fire' | 'ice';

export interface Snake {
  body: Position[];
  direction: 'up' | 'down' | 'left' | 'right';
  speed: number;
  skin: SnakeSkin;
}

export interface HighScore {
  name: string;
  score: number;
  date: string;
}

export interface GameState {
  snake: Snake;
  food: Food;
  score: number;
  isGameOver: boolean;
  gridSize: number;
  cellSize: number;
  gameSpeed: number;
  highScores: HighScore[];
  playerName: string;
}

export type Direction = 'up' | 'down' | 'left' | 'right'; 