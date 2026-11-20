export type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type Difficulty = 'standard' | 'fast' | 'veteran';

export interface DifficultyConfig {
  label: string;
  description: string;
  spawnRateMultiplier: number;
  enemySpeedMultiplier: number;
  enemyFireRateMultiplier: number;
  scoreMultiplier: number;
  startingHp: number;
}

export const DIFFICULTY_CONFIGS: Record<Difficulty, DifficultyConfig> = {
  standard: {
    label: 'Standard',
    description: 'Balanced pace for steady arcade runs',
    spawnRateMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    enemyFireRateMultiplier: 1.0,
    scoreMultiplier: 1.0,
    startingHp: 100,
  },
  fast: {
    label: 'Arcade Fast',
    description: 'Higher speed, quicker waves, +25% score',
    spawnRateMultiplier: 1.25,
    enemySpeedMultiplier: 1.22,
    enemyFireRateMultiplier: 1.15,
    scoreMultiplier: 1.25,
    startingHp: 100,
  },
  veteran: {
    label: 'Veteran',
    description: 'Relentless fleets, 80 hull, +50% score',
    spawnRateMultiplier: 1.45,
    enemySpeedMultiplier: 1.35,
    enemyFireRateMultiplier: 1.35,
    scoreMultiplier: 1.5,
    startingHp: 80,
  },
};

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  fireCooldown: number;
  baseFireInterval: number;
  invulnTimer: number;
  hitFlash: number;
  muzzleFlash: number;
  overdriveTimer: number;
  bankAngle: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  damage: number;
  fromPlayer: boolean;
  color: string;
  glowColor: string;
  life: number;
  isOverdrive?: boolean;
}

export type AsteroidSize = 'small' | 'medium' | 'large';

export interface AsteroidVertex {
  angle: number;
  distRatio: number;
}

export interface Crater {
  ox: number;
  oy: number;
  r: number;
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  size: AsteroidSize;
  hp: number;
  maxHp: number;
  rotation: number;
  rotSpeed: number;
  vertices: AsteroidVertex[];
  craters: Crater[];
  hitFlash: number;
  scoreValue: number;
}

export type EnemyKind = 'scout' | 'striker' | 'cruiser';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  fireTimer: number;
  age: number;
  phaseOffset: number;
  hitFlash: number;
  scoreValue: number;
}

export type PowerUpKind = 'repair' | 'overdrive';

export interface PowerUp {
  id: number;
  kind: PowerUpKind;
  x: number;
  y: number;
  vy: number;
  radius: number;
  age: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  drag: number;
  shape: 'circle' | 'shard' | 'spark';
  rotation: number;
  rotSpeed: number;
}

export interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
  lineWidth: number;
}

export interface FloatingText {
  x: number;
  y: number;
  vy: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  twinklePhase: number;
  layer: 0 | 1 | 2;
  tint: string;
}

export interface HudSnapshot {
  hp: number;
  maxHp: number;
  score: number;
  wave: number;
  overdriveRemaining: number;
  waveBannerTimer: number;
}

export interface RunSummary {
  score: number;
  highScore: number;
  isNewHighScore: boolean;
  wave: number;
  asteroidsDestroyed: number;
  enemiesDestroyed: number;
  shotsFired: number;
  shotsHit: number;
  accuracy: number;
  difficulty: Difficulty;
}
