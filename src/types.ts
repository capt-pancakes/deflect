export interface Vec2 {
  x: number;
  y: number;
}

export interface Signal {
  id: number;
  pos: Vec2;
  vel: Vec2;
  color: SignalColor;
  radius: number;
  trail: Vec2[];
  alive: boolean;
  age: number;
  enteredArena: boolean;
  deflected: boolean;
  nearMissTriggered?: boolean;
}

export interface Deflector {
  id: number;
  start: Vec2;
  end: Vec2;
  life: number;
  maxLife: number;
  opacity: number;
}

export interface Port {
  angleStart: number;
  angleEnd: number;
  color: SignalColor;
  pulsePhase: number;
  catchCount: number;
}

export interface Particle {
  pos: Vec2;
  vel: Vec2;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export interface FloatingText {
  text: string;
  pos: Vec2;
  color: string;
  life: number;
  maxLife: number;
}

export interface NearMissRing {
  life: number;
  radius: number;
}

export type SignalColor = 'red' | 'blue' | 'green' | 'yellow';

export type GameMode = 'arcade' | 'zen' | 'daily';

export type GameState = 'menu' | 'playing' | 'gameover';

export interface GameConfig {
  mode: GameMode;
  coreRadius: number;
  coreHP: number;
  maxDeflectors: number;
  deflectorLife: number;
  signalRadius: number;
  signalSpeed: number;
  spawnInterval: number;
}

export const COLORS: Record<SignalColor, string> = {
  red: '#ff4466',
  blue: '#4488ff',
  green: '#44ff88',
  yellow: '#ffcc44',
};

export const COLOR_GLOW: Record<SignalColor, string> = {
  red: '#ff446688',
  blue: '#4488ff88',
  green: '#44ff8888',
  yellow: '#ffcc4488',
};

export const SIGNAL_COLORS: SignalColor[] = ['red', 'blue', 'green', 'yellow'];

export const DEFAULT_CONFIG: GameConfig = {
  mode: 'arcade',
  coreRadius: 30,
  coreHP: 5,
  maxDeflectors: 3,
  deflectorLife: 3,
  signalRadius: 8,
  signalSpeed: 120,
  spawnInterval: 1.5,
};
