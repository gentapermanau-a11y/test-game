import { useEffect, useRef } from 'react';
import { renderGameFrame } from './renderer';
import { soundFX } from './sound';
import {
  DIFFICULTY_CONFIGS,
  type Asteroid,
  type AsteroidSize,
  type Bullet,
  type Difficulty,
  type Enemy,
  type EnemyKind,
  type FloatingText,
  type GameState,
  type HudSnapshot,
  type Particle,
  type Player,
  type PowerUp,
  type RunSummary,
  type Shockwave,
  type Star,
} from './types';

interface GameCanvasProps {
  gameState: GameState;
  difficulty: Difficulty;
  runId: number;
  highScore: number;
  onHudUpdate: (snapshot: HudSnapshot) => void;
  onGameOver: (summary: RunSummary) => void;
}

const NEBULA_IMAGE_PATH = '/src/assets/images/space_nebula_backdrop_1795098787659.jpg';

export function GameCanvas({
  gameState,
  difficulty,
  runId,
  highScore,
  onHudUpdate,
  onGameOver,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<GameState>(gameState);
  const difficultyRef = useRef<Difficulty>(difficulty);
  const highScoreRef = useRef<number>(highScore);
  const onHudUpdateRef = useRef(onHudUpdate);
  const onGameOverRef = useRef(onGameOver);

  gameStateRef.current = gameState;
  difficultyRef.current = difficulty;
  highScoreRef.current = highScore;
  onHudUpdateRef.current = onHudUpdate;
  onGameOverRef.current = onGameOver;

  // Mutable simulation state stored in ref for 60fps zero-allocation loop
  const simRef = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720,
    time: 0,
    bgScrollY: 0,
    nextEntityId: 1,
    stars: [] as Star[],
    player: null as Player | null,
    bullets: [] as Bullet[],
    asteroids: [] as Asteroid[],
    enemies: [] as Enemy[],
    powerUps: [] as PowerUp[],
    particles: [] as Particle[],
    shockwaves: [] as Shockwave[],
    floatingTexts: [] as FloatingText[],
    score: 0,
    wave: 1,
    nextWaveScore: 1200,
    waveBannerTimer: 0,
    asteroidSpawnTimer: 0.6,
    enemySpawnTimer: 1.5,
    shakeTime: 0,
    shakeMagnitude: 0,
    damageVignetteAlpha: 0,
    asteroidsDestroyed: 0,
    enemiesDestroyed: 0,
    shotsFired: 0,
    shotsHit: 0,
    dying: false,
    deathTimer: 0,
    nebulaImg: null as HTMLImageElement | null,
    nebulaReady: false,
    lastHudSyncKey: '',
    keys: new Set<string>(),
    pointerActive: false,
    pointerX: 0,
    pointerY: 0,
  });

  // Reset simulation whenever a new run starts
  useEffect(() => {
    const sim = simRef.current;
    const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];
    const startX = sim.width / 2;
    const startY = Math.max(120, sim.height - 96);

    sim.player = {
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      radius: 17,
      hp: cfg.startingHp,
      maxHp: cfg.startingHp,
      speed: 380,
      fireCooldown: 0,
      baseFireInterval: 0.16,
      invulnTimer: 1.0,
      hitFlash: 0,
      muzzleFlash: 0,
      overdriveTimer: 0,
      bankAngle: 0,
    };

    sim.bullets = [];
    sim.asteroids = [];
    sim.enemies = [];
    sim.powerUps = [];
    sim.particles = [];
    sim.shockwaves = [];
    sim.floatingTexts = [];
    sim.score = 0;
    sim.wave = 1;
    sim.nextWaveScore = 1200;
    sim.waveBannerTimer = runId > 0 ? 1.8 : 0;
    sim.asteroidSpawnTimer = 0.45;
    sim.enemySpawnTimer = 1.4;
    sim.shakeTime = 0;
    sim.shakeMagnitude = 0;
    sim.damageVignetteAlpha = 0;
    sim.asteroidsDestroyed = 0;
    sim.enemiesDestroyed = 0;
    sim.shotsFired = 0;
    sim.shotsHit = 0;
    sim.dying = false;
    sim.deathTimer = 0;
    sim.lastHudSyncKey = '';

    onHudUpdateRef.current({
      hp: cfg.startingHp,
      maxHp: cfg.startingHp,
      score: 0,
      wave: 1,
      overdriveRemaining: 0,
      waveBannerTimer: sim.waveBannerTimer,
    });
  }, [runId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sim = simRef.current;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Load nebula image with resilient fallback
    if (!sim.nebulaImg) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        sim.nebulaReady = true;
      };
      img.onerror = () => {
        sim.nebulaReady = false;
      };
      img.src = NEBULA_IMAGE_PATH;
      sim.nebulaImg = img;
    }

    const initStars = (w: number, h: number) => {
      const count = Math.min(180, Math.max(90, Math.floor((w * h) / 10500)));
      const tints = ['#f8fafc', '#bae6fd', '#fde68a', '#e0e7ff'];
      const nextStars: Star[] = [];
      for (let i = 0; i < count; i++) {
        const roll = Math.random();
        const layer: 0 | 1 | 2 = roll < 0.58 ? 0 : roll < 0.88 ? 1 : 2;
        nextStars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: layer === 0 ? 0.9 + Math.random() * 0.7 : layer === 1 ? 1.4 + Math.random() * 0.8 : 1.7 + Math.random() * 0.9,
          speed: layer === 0 ? 22 : layer === 1 ? 58 : 125,
          alpha: layer === 0 ? 0.45 : layer === 1 ? 0.72 : 0.92,
          twinklePhase: Math.random() * Math.PI * 2,
          layer,
          tint: tints[i % tints.length],
        });
      }
      sim.stars = nextStars;
    };

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sim.width = w;
      sim.height = h;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (sim.stars.length === 0) {
        initStars(w, h);
      } else {
        for (const s of sim.stars) {
          s.x = Math.min(s.x, w);
          s.y = Math.min(s.y, h);
        }
      }

      if (sim.player) {
        sim.player.x = Math.max(28, Math.min(w - 28, sim.player.x));
        sim.player.y = Math.max(76, Math.min(h - 32, sim.player.y));
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Keyboard listeners
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' ||
        e.code === 'ArrowUp' ||
        e.code === 'ArrowDown' ||
        e.code === 'ArrowLeft' ||
        e.code === 'ArrowRight'
      ) {
        if (gameStateRef.current === 'PLAYING') {
          e.preventDefault();
        }
      }
      sim.keys.add(e.code);
      if (gameStateRef.current === 'PLAYING') {
        soundFX.unlock();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      sim.keys.delete(e.code);
    };

    const onBlur = () => {
      sim.keys.clear();
      sim.pointerActive = false;
    };

    // Optional pointer/touch drag & fire support on canvas
    const onPointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;
      soundFX.unlock();
      sim.pointerActive = true;
      sim.pointerX = e.clientX;
      sim.pointerY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!sim.pointerActive) return;
      sim.pointerX = e.clientX;
      sim.pointerY = e.clientY;
    };

    const onPointerUp = () => {
      sim.pointerActive = false;
    };

    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    canvas.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    // Helper functions for entity spawning & FX
    const triggerShake = (mag: number, duration: number) => {
      if (prefersReducedMotion) return;
      sim.shakeMagnitude = Math.max(sim.shakeMagnitude, mag);
      sim.shakeTime = Math.max(sim.shakeTime, duration);
    };

    const spawnExplosion = (
      x: number,
      y: number,
      colors: string[],
      count: number,
      maxRadius: number,
      includeShards: boolean,
    ) => {
      sim.shockwaves.push({
        x,
        y,
        radius: 6,
        maxRadius,
        color: colors[0],
        alpha: 0.9,
        lineWidth: maxRadius > 45 ? 3.2 : 2.2,
      });

      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 45 + Math.random() * (maxRadius * 3.8);
        const isShard = includeShards && i % 3 === 0;
        const maxLife = 0.32 + Math.random() * 0.42;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: isShard ? 3.2 + Math.random() * 3.4 : 1.8 + Math.random() * 2.8,
          color: colors[i % colors.length],
          alpha: 1,
          life: maxLife,
          maxLife,
          drag: isShard ? 0.97 : 0.94,
          shape: isShard ? 'shard' : i % 2 === 0 ? 'spark' : 'circle',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 12,
        });
      }
    };

    const spawnHitSparks = (x: number, y: number, color: string) => {
      for (let i = 0; i < 6; i++) {
        const ang = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 140;
        const maxLife = 0.16 + Math.random() * 0.14;
        sim.particles.push({
          x,
          y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          radius: 1.6 + Math.random() * 1.4,
          color,
          alpha: 1,
          life: maxLife,
          maxLife,
          drag: 0.92,
          shape: 'spark',
          rotation: ang,
          rotSpeed: 0,
        });
      }
    };

    const addFloatingText = (x: number, y: number, text: string, color: string) => {
      sim.floatingTexts.push({
        x,
        y,
        vy: -38,
        text,
        color,
        life: 0.78,
        maxLife: 0.78,
      });
    };

    const createAsteroid = (
      size: AsteroidSize,
      x?: number,
      y?: number,
      vxOverride?: number,
      vyOverride?: number,
    ): Asteroid => {
      const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];
      const waveMult = 1 + (sim.wave - 1) * 0.08;
      const radius = size === 'large' ? 36 : size === 'medium' ? 23 : 13;
      const hp = size === 'large' ? 4 : size === 'medium' ? 2 : 1;
      const scoreValue = size === 'large' ? 140 : size === 'medium' ? 80 : 50;

      const vertexCount = size === 'large' ? 11 : size === 'medium' ? 9 : 7;
      const vertices = Array.from({ length: vertexCount }, (_, idx) => ({
        angle: (idx / vertexCount) * Math.PI * 2,
        distRatio: 0.76 + Math.random() * 0.32,
      }));

      const craterCount = size === 'large' ? 3 : size === 'medium' ? 2 : 1;
      const craters = Array.from({ length: craterCount }, () => {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 0.42;
        return {
          ox: Math.cos(a) * d,
          oy: Math.sin(a) * d,
          r: 0.14 + Math.random() * 0.14,
        };
      });

      const baseVy =
        (size === 'large' ? 88 : size === 'medium' ? 128 : 170) *
        cfg.enemySpeedMultiplier *
        waveMult;

      return {
        id: sim.nextEntityId++,
        x: x ?? 40 + Math.random() * Math.max(40, sim.width - 80),
        y: y ?? -radius - 10,
        vx: vxOverride ?? (Math.random() - 0.5) * 65,
        vy: vyOverride ?? baseVy * (0.85 + Math.random() * 0.35),
        radius,
        size,
        hp,
        maxHp: hp,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2.4,
        vertices,
        craters,
        hitFlash: 0,
        scoreValue,
      };
    };

    const spawnEnemy = () => {
      const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];
      const roll = Math.random();
      let kind: EnemyKind = 'scout';

      if (sim.wave >= 3 && roll > 0.78) {
        kind = 'cruiser';
      } else if (sim.wave >= 2 && roll > 0.62) {
        kind = roll > 0.88 ? 'cruiser' : 'striker';
      } else if (roll > 0.65 && sim.score > 300) {
        kind = 'striker';
      }

      const radius = kind === 'cruiser' ? 28 : kind === 'striker' ? 20 : 16;
      const hp =
        kind === 'cruiser'
          ? 7 + Math.floor(sim.wave * 0.8)
          : kind === 'striker'
            ? 3 + Math.floor(sim.wave * 0.3)
            : 1 + (sim.wave >= 4 ? 1 : 0);
      const baseSpeed =
        (kind === 'cruiser' ? 68 : kind === 'striker' ? 105 : 145) *
        cfg.enemySpeedMultiplier *
        (1 + (sim.wave - 1) * 0.06);

      const margin = Math.max(50, radius + 24);
      const x = margin + Math.random() * Math.max(40, sim.width - margin * 2);

      sim.enemies.push({
        id: sim.nextEntityId++,
        kind,
        x,
        y: -radius - 14,
        vx: (Math.random() - 0.5) * 40,
        vy: baseSpeed,
        radius,
        hp,
        maxHp: hp,
        fireTimer: (0.7 + Math.random() * 0.9) / cfg.enemyFireRateMultiplier,
        age: 0,
        phaseOffset: Math.random() * Math.PI * 2,
        hitFlash: 0,
        scoreValue: kind === 'cruiser' ? 350 : kind === 'striker' ? 180 : 110,
      });
    };

    const maybeDropPowerUp = (x: number, y: number, guaranteed: boolean) => {
      const chance = guaranteed ? 1 : 0.14;
      if (Math.random() > chance) return;
      const p = sim.player;
      // Favor repair slightly if hull is damaged
      const repairBias = p && p.hp < p.maxHp * 0.65 ? 0.65 : 0.45;
      const kind = Math.random() < repairBias ? 'repair' : 'overdrive';
      sim.powerUps.push({
        id: sim.nextEntityId++,
        kind,
        x,
        y,
        vy: 92,
        radius: 14,
        age: 0,
      });
    };

    const awardScore = (basePoints: number, x: number, y: number, color: string) => {
      const mult = DIFFICULTY_CONFIGS[difficultyRef.current].scoreMultiplier;
      const gained = Math.round((basePoints * mult) / 5) * 5;
      sim.score += gained;
      addFloatingText(x, y, `+${gained}`, color);

      if (sim.score >= sim.nextWaveScore) {
        sim.wave += 1;
        sim.nextWaveScore += 1200 + (sim.wave - 1) * 400;
        sim.waveBannerTimer = 2.2;
        soundFX.playWaveClear();
      }
    };

    const damagePlayer = (amount: number) => {
      const p = sim.player;
      if (!p || p.invulnTimer > 0 || sim.dying) return;

      p.hp = Math.max(0, p.hp - amount);
      p.invulnTimer = 1.1;
      p.hitFlash = 0.2;
      sim.damageVignetteAlpha = 0.48;
      triggerShake(9, 0.25);

      if (p.hp <= 0) {
        sim.dying = true;
        sim.deathTimer = 0.72;
        soundFX.playExplosion(true);
        soundFX.playGameOver();
        spawnExplosion(
          p.x,
          p.y,
          ['#38bdf8', '#f8fafc', '#fbbf24', '#f43f5e'],
          42,
          75,
          true,
        );
      } else {
        soundFX.playPlayerDamage();
        spawnHitSparks(p.x, p.y, '#fda4af');
      }
    };

    const firePlayerWeapons = (p: Player) => {
      const isOverdrive = p.overdriveTimer > 0;
      p.fireCooldown = isOverdrive ? p.baseFireInterval * 0.72 : p.baseFireInterval;
      p.muzzleFlash = 0.1;
      soundFX.playShoot(isOverdrive);

      if (isOverdrive) {
        const spreadShots = [
          { ox: 0, oy: -24, vx: 0, vy: -760 },
          { ox: -14, oy: -12, vx: -125, vy: -735 },
          { ox: 14, oy: -12, vx: 125, vy: -735 },
        ];
        for (const s of spreadShots) {
          sim.bullets.push({
            id: sim.nextEntityId++,
            x: p.x + s.ox,
            y: p.y + s.oy,
            vx: s.vx,
            vy: s.vy,
            radius: 4,
            damage: 1,
            fromPlayer: true,
            color: '#fde047',
            glowColor: 'rgba(250, 204, 21, 0.75)',
            life: 1.6,
            isOverdrive: true,
          });
        }
        sim.shotsFired += 3;
      } else {
        const wingOffsets = [-11, 11];
        for (const ox of wingOffsets) {
          sim.bullets.push({
            id: sim.nextEntityId++,
            x: p.x + ox,
            y: p.y - 14,
            vx: 0,
            vy: -720,
            radius: 3.6,
            damage: 1,
            fromPlayer: true,
            color: '#22d3ee',
            glowColor: 'rgba(34, 211, 238, 0.78)',
            life: 1.6,
          });
        }
        sim.shotsFired += 2;
      }
    };

    let rafId = 0;
    let lastTimestamp = performance.now();

    const stepSimulation = (dt: number) => {
      const state = gameStateRef.current;

      // Always drift stars & nebula softly on TITLE_MENU and PLAYING; freeze when PAUSED
      if (state !== 'PAUSED') {
        sim.time += dt;
        const starBoost = state === 'TITLE_MENU' ? 0.55 : 1;
        sim.bgScrollY += dt * 32 * starBoost;
        for (let i = 0; i < sim.stars.length; i++) {
          const s = sim.stars[i];
          s.y += s.speed * starBoost * dt;
          if (s.y > sim.height + 8) {
            s.y = -8;
            s.x = Math.random() * sim.width;
          }
        }
      }

      if (state !== 'PLAYING') {
        return;
      }

      const cfg = DIFFICULTY_CONFIGS[difficultyRef.current];
      const p = sim.player;

      // Handle post-death explosion delay before switching to Game Over screen
      if (sim.dying) {
        sim.deathTimer -= dt;
        if (sim.deathTimer <= 0) {
          sim.dying = false;
          const finalScore = sim.score;
          const prevBest = highScoreRef.current;
          const isNewHigh = finalScore > prevBest;
          const best = Math.max(prevBest, finalScore);
          const accuracy =
            sim.shotsFired > 0
              ? Math.min(100, Math.round((sim.shotsHit / sim.shotsFired) * 100))
              : 0;

          onGameOverRef.current({
            score: finalScore,
            highScore: best,
            isNewHighScore: isNewHigh,
            wave: sim.wave,
            asteroidsDestroyed: sim.asteroidsDestroyed,
            enemiesDestroyed: sim.enemiesDestroyed,
            shotsFired: sim.shotsFired,
            shotsHit: sim.shotsHit,
            accuracy,
            difficulty: difficultyRef.current,
          });
          return;
        }
      }

      // Update screen shake & damage vignette
      if (sim.shakeTime > 0) {
        sim.shakeTime = Math.max(0, sim.shakeTime - dt);
        if (sim.shakeTime === 0) sim.shakeMagnitude = 0;
      }
      if (sim.damageVignetteAlpha > 0) {
        sim.damageVignetteAlpha = Math.max(0, sim.damageVignetteAlpha - dt * 1.4);
      }
      if (sim.waveBannerTimer > 0) {
        sim.waveBannerTimer = Math.max(0, sim.waveBannerTimer - dt);
      }

      // 1. Player Movement & Weapons
      if (p && p.hp > 0 && !sim.dying) {
        let moveX = 0;
        let moveY = 0;

        if (sim.keys.has('ArrowLeft') || sim.keys.has('KeyA')) moveX -= 1;
        if (sim.keys.has('ArrowRight') || sim.keys.has('KeyD')) moveX += 1;
        if (sim.keys.has('ArrowUp') || sim.keys.has('KeyW')) moveY -= 1;
        if (sim.keys.has('ArrowDown') || sim.keys.has('KeyS')) moveY += 1;

        if (moveX !== 0 || moveY !== 0) {
          const len = Math.hypot(moveX, moveY);
          moveX /= len;
          moveY /= len;
          p.vx = moveX * p.speed;
          p.vy = moveY * p.speed;
        } else if (sim.pointerActive) {
          // Smooth pointer follow when dragging
          const dx = sim.pointerX - p.x;
          const dy = sim.pointerY - 32 - p.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 6) {
            const followSpeed = Math.min(p.speed * 1.2, dist * 10);
            p.vx = (dx / dist) * followSpeed;
            p.vy = (dy / dist) * followSpeed;
          } else {
            p.vx = 0;
            p.vy = 0;
          }
        } else {
          p.vx *= Math.pow(0.001, dt);
          p.vy *= Math.pow(0.001, dt);
          if (Math.abs(p.vx) < 4) p.vx = 0;
          if (Math.abs(p.vy) < 4) p.vy = 0;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Clamp within playfield (respecting top HUD zone)
        p.x = Math.max(26, Math.min(sim.width - 26, p.x));
        p.y = Math.max(76, Math.min(sim.height - 30, p.y));

        // Smooth banking tilt
        const targetBank = (p.vx / p.speed) * 0.22;
        p.bankAngle += (targetBank - p.bankAngle) * Math.min(1, dt * 14);

        p.fireCooldown = Math.max(0, p.fireCooldown - dt);
        p.invulnTimer = Math.max(0, p.invulnTimer - dt);
        p.hitFlash = Math.max(0, p.hitFlash - dt);
        p.muzzleFlash = Math.max(0, p.muzzleFlash - dt);
        p.overdriveTimer = Math.max(0, p.overdriveTimer - dt);

        const wantsFire =
          sim.keys.has('Space') ||
          sim.keys.has('KeyJ') ||
          sim.keys.has('Enter') ||
          sim.pointerActive;

        if (wantsFire && p.fireCooldown <= 0) {
          firePlayerWeapons(p);
        }
      }

      // 2. Spawning Asteroids & Enemies
      if (!sim.dying) {
        const waveFactor = 1 + (sim.wave - 1) * 0.14;
        sim.asteroidSpawnTimer -= dt;
        if (sim.asteroidSpawnTimer <= 0) {
          const r = Math.random();
          const size: AsteroidSize = r < 0.42 ? 'small' : r < 0.78 ? 'medium' : 'large';
          sim.asteroids.push(createAsteroid(size));
          const baseInterval = Math.max(0.42, 1.35 / (cfg.spawnRateMultiplier * waveFactor));
          sim.asteroidSpawnTimer = baseInterval * (0.7 + Math.random() * 0.6);
        }

        sim.enemySpawnTimer -= dt;
        if (sim.enemySpawnTimer <= 0) {
          spawnEnemy();
          const baseEnemyInterval = Math.max(0.65, 2.2 / (cfg.spawnRateMultiplier * waveFactor));
          sim.enemySpawnTimer = baseEnemyInterval * (0.75 + Math.random() * 0.5);
        }
      }

      // 3. Update Bullets
      for (let i = sim.bullets.length - 1; i >= 0; i--) {
        const b = sim.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;
        if (
          b.life <= 0 ||
          b.y < -30 ||
          b.y > sim.height + 30 ||
          b.x < -30 ||
          b.x > sim.width + 30
        ) {
          sim.bullets.splice(i, 1);
        }
      }

      // 4. Update Asteroids
      for (let i = sim.asteroids.length - 1; i >= 0; i--) {
        const a = sim.asteroids[i];
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.rotation += a.rotSpeed * dt;
        a.hitFlash = Math.max(0, a.hitFlash - dt);

        if (a.x < -a.radius - 40 || a.x > sim.width + a.radius + 40 || a.y > sim.height + a.radius + 40) {
          sim.asteroids.splice(i, 1);
        }
      }

      // 5. Update Enemies & Enemy Firing
      for (let i = sim.enemies.length - 1; i >= 0; i--) {
        const e = sim.enemies[i];
        e.age += dt;
        e.hitFlash = Math.max(0, e.hitFlash - dt);

        if (e.kind === 'scout') {
          e.x += Math.sin(e.age * 3.4 + e.phaseOffset) * 115 * dt;
          e.y += e.vy * dt;
        } else if (e.kind === 'striker') {
          e.x += Math.cos(e.age * 2.1 + e.phaseOffset) * 85 * dt;
          e.y += e.vy * dt;
        } else {
          // Cruiser sweeps gently
          e.x += Math.sin(e.age * 1.2 + e.phaseOffset) * 48 * dt;
          e.y += e.vy * dt;
        }

        // Keep enemies horizontally inside arena
        e.x = Math.max(e.radius + 14, Math.min(sim.width - e.radius - 14, e.x));

        // Enemy Shooting
        e.fireTimer -= dt;
        if (e.fireTimer <= 0 && e.y > 24 && e.y < sim.height * 0.72 && p && !sim.dying) {
          const bulletSpd = (e.kind === 'scout' ? 300 : 270) * cfg.enemySpeedMultiplier;
          if (e.kind === 'scout') {
            const dx = p.x - e.x;
            const dy = p.y - e.y;
            const len = Math.max(1, Math.hypot(dx, dy));
            sim.bullets.push({
              id: sim.nextEntityId++,
              x: e.x,
              y: e.y + 16,
              vx: (dx / len) * bulletSpd,
              vy: (dy / len) * bulletSpd,
              radius: 4,
              damage: 15,
              fromPlayer: false,
              color: '#fb7185',
              glowColor: 'rgba(244, 63, 94, 0.85)',
              life: 3.5,
            });
            e.fireTimer = (1.6 + Math.random() * 0.7) / cfg.enemyFireRateMultiplier;
          } else if (e.kind === 'striker') {
            [-12, 12].forEach((ox) => {
              sim.bullets.push({
                id: sim.nextEntityId++,
                x: e.x + ox,
                y: e.y + 14,
                vx: ox * 2.2,
                vy: bulletSpd * 1.05,
                radius: 4.2,
                damage: 16,
                fromPlayer: false,
                color: '#e879f9',
                glowColor: 'rgba(217, 70, 239, 0.85)',
                life: 3.5,
              });
            });
            e.fireTimer = (1.9 + Math.random() * 0.7) / cfg.enemyFireRateMultiplier;
          } else {
            // Cruiser 3-way fan burst
            [-0.28, 0, 0.28].forEach((angOffset) => {
              const ang = Math.PI / 2 + angOffset;
              sim.bullets.push({
                id: sim.nextEntityId++,
                x: e.x,
                y: e.y + 22,
                vx: Math.cos(ang) * bulletSpd,
                vy: Math.sin(ang) * bulletSpd,
                radius: 4.8,
                damage: 20,
                fromPlayer: false,
                color: '#fbbf24',
                glowColor: 'rgba(245, 158, 11, 0.85)',
                life: 3.8,
              });
            });
            e.fireTimer = (2.1 + Math.random() * 0.6) / cfg.enemyFireRateMultiplier;
          }
        }

        if (e.y > sim.height + e.radius + 40) {
          sim.enemies.splice(i, 1);
        }
      }

      // 6. Update PowerUps
      for (let i = sim.powerUps.length - 1; i >= 0; i--) {
        const pu = sim.powerUps[i];
        pu.y += pu.vy * dt;
        pu.age += dt;

        if (p && !sim.dying) {
          const dist = Math.hypot(pu.x - p.x, pu.y - p.y);
          if (dist < pu.radius + p.radius + 8) {
            soundFX.playPowerUp();
            if (pu.kind === 'repair') {
              const healed = Math.min(p.maxHp - p.hp, 25);
              p.hp = Math.min(p.maxHp, p.hp + 25);
              addFloatingText(pu.x, pu.y - 10, healed > 0 ? `+${healed} HP` : 'HULL FULL', '#34d399');
              spawnExplosion(pu.x, pu.y, ['#34d399', '#a7f3d0'], 12, 32, false);
            } else {
              p.overdriveTimer = 8.5;
              addFloatingText(pu.x, pu.y - 10, 'TRIPLE SHOT', '#fde047');
              spawnExplosion(pu.x, pu.y, ['#fde047', '#38bdf8'], 14, 36, false);
            }
            sim.powerUps.splice(i, 1);
            continue;
          }
        }

        if (pu.y > sim.height + 40) {
          sim.powerUps.splice(i, 1);
        }
      }

      // 7. Collisions: Player Bullets vs Asteroids & Enemies
      for (let bi = sim.bullets.length - 1; bi >= 0; bi--) {
        const b = sim.bullets[bi];
        if (!b.fromPlayer) {
          // Enemy bullet vs Player
          if (p && !sim.dying) {
            const dist = Math.hypot(b.x - p.x, b.y - p.y);
            if (dist < b.radius + p.radius * 0.78) {
              sim.bullets.splice(bi, 1);
              damagePlayer(b.damage);
            }
          }
          continue;
        }

        let consumed = false;

        // Check Enemies first
        for (let ei = sim.enemies.length - 1; ei >= 0; ei--) {
          const e = sim.enemies[ei];
          const dist = Math.hypot(b.x - e.x, b.y - e.y);
          if (dist < b.radius + e.radius * 0.92) {
            e.hp -= b.damage;
            e.hitFlash = 0.08;
            sim.shotsHit += 1;
            consumed = true;

            if (e.hp <= 0) {
              sim.enemiesDestroyed += 1;
              const isCruiser = e.kind === 'cruiser';
              soundFX.playExplosion(isCruiser);
              triggerShake(isCruiser ? 7 : 3.5, isCruiser ? 0.22 : 0.12);
              const expColors =
                e.kind === 'cruiser'
                  ? ['#fb7185', '#fbbf24', '#ffffff']
                  : e.kind === 'striker'
                    ? ['#e879f9', '#fb7185', '#fef08a']
                    : ['#fb923c', '#f43f5e', '#fef08a'];
              spawnExplosion(e.x, e.y, expColors, isCruiser ? 30 : 18, isCruiser ? 62 : 40, false);
              awardScore(e.scoreValue, e.x, e.y, '#fbbf24');
              maybeDropPowerUp(e.x, e.y, isCruiser);
              sim.enemies.splice(ei, 1);
            } else {
              soundFX.playHit();
              spawnHitSparks(b.x, b.y, '#fde047');
            }
            break;
          }
        }

        if (consumed) {
          sim.bullets.splice(bi, 1);
          continue;
        }

        // Check Asteroids
        for (let ai = sim.asteroids.length - 1; ai >= 0; ai--) {
          const a = sim.asteroids[ai];
          const dist = Math.hypot(b.x - a.x, b.y - a.y);
          if (dist < b.radius + a.radius * 0.92) {
            a.hp -= b.damage;
            a.hitFlash = 0.08;
            sim.shotsHit += 1;
            consumed = true;

            if (a.hp <= 0) {
              sim.asteroidsDestroyed += 1;
              const isLarge = a.size === 'large';
              soundFX.playExplosion(isLarge);
              triggerShake(isLarge ? 5.5 : 2.5, isLarge ? 0.18 : 0.1);
              spawnExplosion(
                a.x,
                a.y,
                ['#f59e0b', '#fb923c', '#94a3b8', '#fde68a'],
                isLarge ? 24 : 14,
                isLarge ? 54 : 34,
                true,
              );
              awardScore(a.scoreValue, a.x, a.y, '#38bdf8');
              maybeDropPowerUp(a.x, a.y, false);

              // Split large asteroids into 2 medium fragments
              if (a.size === 'large' && a.y > 0 && a.y < sim.height - 90) {
                sim.asteroids.push(
                  createAsteroid('medium', a.x - 14, a.y, a.vx - 55, Math.max(95, a.vy * 1.15)),
                );
                sim.asteroids.push(
                  createAsteroid('medium', a.x + 14, a.y, a.vx + 55, Math.max(95, a.vy * 1.15)),
                );
              }
              sim.asteroids.splice(ai, 1);
            } else {
              soundFX.playHit();
              spawnHitSparks(b.x, b.y, '#cbd5e1');
            }
            break;
          }
        }

        if (consumed) {
          sim.bullets.splice(bi, 1);
        }
      }

      // 8. Collisions: Player Ship vs Asteroids & Enemies
      if (p && !sim.dying) {
        for (let ai = sim.asteroids.length - 1; ai >= 0; ai--) {
          const a = sim.asteroids[ai];
          const dist = Math.hypot(a.x - p.x, a.y - p.y);
          if (dist < (a.radius + p.radius) * 0.82) {
            const dmg = a.size === 'large' ? 30 : a.size === 'medium' ? 22 : 16;
            damagePlayer(dmg);
            spawnExplosion(a.x, a.y, ['#fb923c', '#94a3b8'], 16, 38, true);
            sim.asteroids.splice(ai, 1);
          }
        }

        for (let ei = sim.enemies.length - 1; ei >= 0; ei--) {
          const e = sim.enemies[ei];
          const dist = Math.hypot(e.x - p.x, e.y - p.y);
          if (dist < (e.radius + p.radius) * 0.82) {
            const dmg = e.kind === 'cruiser' ? 35 : 22;
            damagePlayer(dmg);
            spawnExplosion(e.x, e.y, ['#fb7185', '#fbbf24'], 20, 44, false);
            sim.enemies.splice(ei, 1);
          }
        }
      }

      // 9. Update Particles, Shockwaves & Floating Text
      for (let i = sim.particles.length - 1; i >= 0; i--) {
        const pt = sim.particles[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        const damp = Math.pow(pt.drag, dt * 60);
        pt.vx *= damp;
        pt.vy *= damp;
        pt.rotation += pt.rotSpeed * dt;
        pt.life -= dt;
        pt.alpha = Math.max(0, pt.life / pt.maxLife);
        if (pt.life <= 0) {
          sim.particles.splice(i, 1);
        }
      }

      for (let i = sim.shockwaves.length - 1; i >= 0; i--) {
        const sw = sim.shockwaves[i];
        sw.radius += (sw.maxRadius - sw.radius) * Math.min(1, dt * 11);
        sw.alpha -= dt * 3.1;
        if (sw.alpha <= 0) {
          sim.shockwaves.splice(i, 1);
        }
      }

      for (let i = sim.floatingTexts.length - 1; i >= 0; i--) {
        const ft = sim.floatingTexts[i];
        ft.y += ft.vy * dt;
        ft.life -= dt;
        if (ft.life <= 0) {
          sim.floatingTexts.splice(i, 1);
        }
      }

      // 10. Sync HUD snapshot only when values change
      const hp = p ? p.hp : 0;
      const maxHp = p ? p.maxHp : 100;
      const od = p ? Math.ceil(p.overdriveTimer * 10) / 10 : 0;
      const wb = sim.waveBannerTimer > 0 ? 1 : 0;
      const syncKey = `${hp}|${sim.score}|${sim.wave}|${od}|${wb}`;
      if (syncKey !== sim.lastHudSyncKey) {
        sim.lastHudSyncKey = syncKey;
        onHudUpdateRef.current({
          hp,
          maxHp,
          score: sim.score,
          wave: sim.wave,
          overdriveRemaining: od,
          waveBannerTimer: sim.waveBannerTimer,
        });
      }
    };

    const loop = (now: number) => {
      const rawDt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      const dt = Math.min(Math.max(rawDt, 0), 0.05);

      stepSimulation(dt);

      const shakeAmt = sim.shakeTime > 0 ? sim.shakeMagnitude * (sim.shakeTime / 0.25) : 0;
      const shakeX = shakeAmt > 0 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;
      const shakeY = shakeAmt > 0 ? (Math.random() - 0.5) * 2 * shakeAmt : 0;

      renderGameFrame(ctx, {
        width: sim.width,
        height: sim.height,
        time: sim.time,
        bgScrollY: sim.bgScrollY,
        nebulaImg: sim.nebulaImg,
        nebulaReady: sim.nebulaReady,
        stars: sim.stars,
        player: sim.player,
        bullets: sim.bullets,
        asteroids: sim.asteroids,
        enemies: sim.enemies,
        powerUps: sim.powerUps,
        particles: sim.particles,
        shockwaves: sim.shockwaves,
        floatingTexts: sim.floatingTexts,
        shakeOffsetX: shakeX,
        shakeOffsetY: shakeY,
        damageVignetteAlpha: sim.damageVignetteAlpha,
        showEntities: gameStateRef.current !== 'TITLE_MENU',
      });

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      canvas.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-label="Solaris Vanguard 2D Space Shooter Arena"
      className="block h-full w-full touch-none"
    />
  );
}
