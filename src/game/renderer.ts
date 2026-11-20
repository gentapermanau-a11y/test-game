import type {
  Asteroid,
  Bullet,
  Enemy,
  FloatingText,
  Particle,
  Player,
  PowerUp,
  Shockwave,
  Star,
} from './types';

export interface RenderContextState {
  width: number;
  height: number;
  time: number;
  bgScrollY: number;
  nebulaImg: HTMLImageElement | null;
  nebulaReady: boolean;
  stars: Star[];
  player: Player | null;
  bullets: Bullet[];
  asteroids: Asteroid[];
  enemies: Enemy[];
  powerUps: PowerUp[];
  particles: Particle[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  shakeOffsetX: number;
  shakeOffsetY: number;
  damageVignetteAlpha: number;
  showEntities: boolean;
}

export function renderGameFrame(ctx: CanvasRenderingContext2D, state: RenderContextState) {
  const { width, height, time, bgScrollY, nebulaImg, nebulaReady } = state;

  // 1. Deep void base fill
  ctx.fillStyle = '#050814';
  ctx.fillRect(0, 0, width, height);

  // 2. Cosmic Nebula Backdrop (smoothly drifting image with procedural fallback)
  ctx.save();
  if (nebulaReady && nebulaImg && nebulaImg.naturalWidth > 0) {
    const imgAspect = nebulaImg.naturalWidth / nebulaImg.naturalHeight;
    const viewAspect = width / Math.max(height, 1);
    let drawW = width;
    let drawH = height;

    if (viewAspect > imgAspect) {
      drawW = width * 1.08;
      drawH = drawW / imgAspect;
    } else {
      drawH = height * 1.16;
      drawW = drawH * imgAspect;
    }

    const offsetX = (width - drawW) / 2;
    const driftSpan = Math.max(drawH - height, 40);
    // Smooth sine-wave vertical drift so it never seams or snaps
    const driftY = ((Math.sin(bgScrollY * 0.015) + 1) * 0.5) * -driftSpan;

    ctx.globalAlpha = 0.56;
    ctx.drawImage(nebulaImg, offsetX, driftY, drawW, drawH);

    // Subtle dark vignette scrim so glowing projectiles and ships pop clearly
    const scrim = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.2,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.85,
    );
    scrim.addColorStop(0, 'rgba(5, 8, 20, 0.18)');
    scrim.addColorStop(1, 'rgba(5, 8, 20, 0.65)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = scrim;
    ctx.fillRect(0, 0, width, height);
  } else {
    // Procedural cosmic nebula fallback
    const g1 = ctx.createRadialGradient(
      width * 0.25,
      height * 0.35,
      20,
      width * 0.25,
      height * 0.35,
      width * 0.65,
    );
    g1.addColorStop(0, 'rgba(20, 184, 166, 0.16)');
    g1.addColorStop(0.5, 'rgba(30, 58, 138, 0.12)');
    g1.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, width, height);

    const g2 = ctx.createRadialGradient(
      width * 0.78,
      height * 0.68,
      20,
      width * 0.78,
      height * 0.68,
      width * 0.55,
    );
    g2.addColorStop(0, 'rgba(245, 158, 11, 0.12)');
    g2.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
    g2.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();

  // 3. Multi-layer Parallax Starfield
  ctx.save();
  for (let i = 0; i < state.stars.length; i++) {
    const s = state.stars[i];
    const twinkle = 0.72 + 0.28 * Math.sin(time * 2.6 + s.twinklePhase);
    ctx.globalAlpha = s.alpha * twinkle;
    ctx.fillStyle = s.tint;

    if (s.layer === 2) {
      // Foreground fast stars get subtle vertical streak
      ctx.fillRect(s.x - s.size * 0.4, s.y - s.size * 2.2, s.size * 0.9, s.size * 3.8);
    } else {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  if (!state.showEntities) {
    return;
  }

  // Apply screen shake for active combat layers
  ctx.save();
  ctx.translate(state.shakeOffsetX, state.shakeOffsetY);

  // 4. Power-ups
  for (let i = 0; i < state.powerUps.length; i++) {
    drawPowerUp(ctx, state.powerUps[i], time);
  }

  // 5. Bullets (additive glow)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < state.bullets.length; i++) {
    drawBullet(ctx, state.bullets[i]);
  }
  ctx.restore();

  // 6. Asteroids
  for (let i = 0; i < state.asteroids.length; i++) {
    drawAsteroid(ctx, state.asteroids[i]);
  }

  // 7. Enemies
  for (let i = 0; i < state.enemies.length; i++) {
    drawEnemy(ctx, state.enemies[i], time);
  }

  // 8. Player Ship
  if (state.player && state.player.hp > 0) {
    drawPlayerShip(ctx, state.player, time);
  }

  // 9. Shockwaves & Particles
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < state.shockwaves.length; i++) {
    const sw = state.shockwaves[i];
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = sw.color;
    ctx.globalAlpha = Math.max(0, sw.alpha);
    ctx.lineWidth = sw.lineWidth;
    ctx.stroke();
  }
  ctx.restore();

  for (let i = 0; i < state.particles.length; i++) {
    drawParticle(ctx, state.particles[i]);
  }

  // 10. Floating Score / Status Popups
  ctx.save();
  ctx.font = '700 13px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let i = 0; i < state.floatingTexts.length; i++) {
    const ft = state.floatingTexts[i];
    const progress = 1 - ft.life / ft.maxLife;
    ctx.globalAlpha = Math.max(0, 1 - Math.pow(progress, 1.6));
    ctx.fillStyle = 'rgba(5, 8, 20, 0.75)';
    ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.restore();

  ctx.restore(); // End screen shake transform

  // 11. Subtle Crimson Damage Vignette Flash
  if (state.damageVignetteAlpha > 0.01) {
    const vig = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      Math.min(width, height) * 0.35,
      width * 0.5,
      height * 0.5,
      Math.max(width, height) * 0.75,
    );
    vig.addColorStop(0, 'rgba(239, 68, 68, 0)');
    vig.addColorStop(1, `rgba(239, 68, 68, ${state.damageVignetteAlpha.toFixed(3)})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet) {
  const angle = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  ctx.save();
  ctx.translate(b.x, b.y);
  ctx.rotate(angle);

  // Outer glow halo
  const halo = ctx.createRadialGradient(0, 0, 1, 0, 0, b.radius * 3.8);
  halo.addColorStop(0, b.glowColor);
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(0, 0, b.radius * 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Elongated plasma bolt
  const boltLen = b.fromPlayer ? (b.isOverdrive ? 18 : 15) : 12;
  const boltW = b.fromPlayer ? 2.6 : 2.8;

  ctx.fillStyle = b.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, boltW, boltLen * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // White-hot core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -1, boltW * 0.5, boltLen * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayerShip(ctx: CanvasRenderingContext2D, p: Player, time: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.bankAngle);

  // Invulnerability blink & shield shimmer
  if (p.invulnTimer > 0) {
    const pulse = 0.55 + 0.45 * Math.sin(time * 28);
    ctx.globalAlpha = 0.45 + 0.55 * pulse;

    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 2, p.radius * 1.65, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Overdrive golden-cyan aura
  if (p.overdriveTimer > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(0, 0, p.radius * 0.5, 0, 0, p.radius * 1.9);
    aura.addColorStop(0, 'rgba(250, 204, 21, 0.25)');
    aura.addColorStop(0.6, 'rgba(34, 211, 238, 0.16)');
    aura.addColorStop(1, 'rgba(34, 211, 238, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Twin Thruster Exhaust Flames
  const speedBoost = Math.max(0, -p.vy / p.speed) * 8;
  const flameLen = 14 + speedBoost + Math.sin(time * 48) * 4;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  [-9, 9].forEach((tx) => {
    const grad = ctx.createLinearGradient(tx, 14, tx, 14 + flameLen);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.35, p.overdriveTimer > 0 ? '#fde047' : '#38bdf8');
    grad.addColorStop(1, 'rgba(14, 165, 233, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tx - 3.5, 13);
    ctx.lineTo(tx + 3.5, 13);
    ctx.lineTo(tx, 14 + flameLen);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  // Muzzle Flash Glow when firing
  if (p.muzzleFlash > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const flashAlpha = Math.min(1, p.muzzleFlash * 10);
    ctx.fillStyle = p.overdriveTimer > 0
      ? `rgba(253, 224, 71, ${flashAlpha * 0.85})`
      : `rgba(56, 189, 248, ${flashAlpha * 0.85})`;
    const cannons = p.overdriveTimer > 0 ? [-15, 0, 15] : [-12, 12];
    cannons.forEach((cx) => {
      const cy = cx === 0 ? -24 : -10;
      ctx.beginPath();
      ctx.arc(cx, cy, 7, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Outer wingtip cannons
  ctx.fillStyle = '#334155';
  ctx.fillRect(-14.5, -10, 3, 14);
  ctx.fillRect(11.5, -10, 3, 14);
  ctx.fillStyle = p.overdriveTimer > 0 ? '#fbbf24' : '#22d3ee';
  ctx.fillRect(-14, -12, 2, 4);
  ctx.fillRect(12, -12, 2, 4);

  // Main Swept Wings & Hull
  ctx.beginPath();
  ctx.moveTo(0, -23); // Nose
  ctx.lineTo(7, -8);
  ctx.lineTo(22, 10); // Right wingtip
  ctx.lineTo(20, 15);
  ctx.lineTo(10, 11);
  ctx.lineTo(7, 16);
  ctx.lineTo(-7, 16);
  ctx.lineTo(-10, 11);
  ctx.lineTo(-20, 15);
  ctx.lineTo(-22, 10); // Left wingtip
  ctx.lineTo(-7, -8);
  ctx.closePath();

  const hullGrad = ctx.createLinearGradient(-20, -20, 20, 16);
  if (p.hitFlash > 0) {
    hullGrad.addColorStop(0, '#ffffff');
    hullGrad.addColorStop(1, '#fecaca');
  } else {
    hullGrad.addColorStop(0, '#f8fafc');
    hullGrad.addColorStop(0.55, '#cbd5e1');
    hullGrad.addColorStop(1, '#64748b');
  }
  ctx.fillStyle = hullGrad;
  ctx.fill();

  ctx.strokeStyle = p.overdriveTimer > 0 ? '#facc15' : '#38bdf8';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Accent Wing Stripes
  ctx.fillStyle = p.overdriveTimer > 0 ? '#f59e0b' : '#06b6d4';
  ctx.beginPath();
  ctx.moveTo(-7, -2);
  ctx.lineTo(-17, 10);
  ctx.lineTo(-13, 10);
  ctx.lineTo(-6, 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(7, -2);
  ctx.lineTo(17, 10);
  ctx.lineTo(13, 10);
  ctx.lineTo(6, 2);
  ctx.closePath();
  ctx.fill();

  // Glowing Cockpit Canopy
  const canopyGrad = ctx.createLinearGradient(0, -13, 0, 2);
  canopyGrad.addColorStop(0, '#a5f3fc');
  canopyGrad.addColorStop(0.6, '#0284c7');
  canopyGrad.addColorStop(1, '#0f172a');
  ctx.fillStyle = canopyGrad;
  ctx.beginPath();
  ctx.ellipse(0, -5, 4, 8.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rotation);

  ctx.beginPath();
  a.vertices.forEach((v, idx) => {
    const r = a.radius * v.distRatio;
    const vx = Math.cos(v.angle) * r;
    const vy = Math.sin(v.angle) * r;
    if (idx === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  });
  ctx.closePath();

  if (a.hitFlash > 0) {
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#ffffff';
  } else {
    const rockGrad = ctx.createRadialGradient(-a.radius * 0.3, -a.radius * 0.3, a.radius * 0.1, 0, 0, a.radius);
    rockGrad.addColorStop(0, '#94a3b8');
    rockGrad.addColorStop(0.55, '#475569');
    rockGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = rockGrad;
    ctx.strokeStyle = '#cbd5e1';
  }
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();

  // Surface craters
  if (a.hitFlash <= 0) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
    ctx.lineWidth = 1;
    for (let i = 0; i < a.craters.length; i++) {
      const c = a.craters[i];
      ctx.beginPath();
      ctx.arc(c.ox * a.radius, c.oy * a.radius, c.r * a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  ctx.save();
  ctx.translate(e.x, e.y);

  // Subtle engine glow at top (facing downward)
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const flamePulse = 7 + Math.sin(time * 36 + e.phaseOffset) * 2.5;
  const engColor =
    e.kind === 'scout'
      ? 'rgba(251, 146, 60, 0.85)'
      : e.kind === 'striker'
        ? 'rgba(232, 121, 249, 0.85)'
        : 'rgba(244, 63, 94, 0.9)';
  ctx.fillStyle = engColor;
  ctx.beginPath();
  ctx.arc(0, -e.radius * 0.78, flamePulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (e.kind === 'scout') {
    // Sleek Crimson/Amber Dart Interceptor
    ctx.beginPath();
    ctx.moveTo(0, 18); // Nose pointing down
    ctx.lineTo(15, -8);
    ctx.lineTo(5, -6);
    ctx.lineTo(0, -15);
    ctx.lineTo(-5, -6);
    ctx.lineTo(-15, -8);
    ctx.closePath();

    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#e11d48';
    ctx.fill();
    ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : '#fda4af';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    // Core canopy
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.ellipse(0, 2, 3.5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'striker') {
    // Twin-boom Violet/Coral Striker
    ctx.beginPath();
    ctx.moveTo(0, 20);
    ctx.lineTo(9, 4);
    ctx.lineTo(22, 10);
    ctx.lineTo(20, -12);
    ctx.lineTo(9, -15);
    ctx.lineTo(5, -8);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-9, -15);
    ctx.lineTo(-20, -12);
    ctx.lineTo(-22, 10);
    ctx.lineTo(-9, 4);
    ctx.closePath();

    ctx.fillStyle = e.hitFlash > 0 ? '#ffffff' : '#9333ea';
    ctx.fill();
    ctx.strokeStyle = e.hitFlash > 0 ? '#ffffff' : '#e879f9';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Glowing plasma core
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, 3, 5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Heavy Armored Cruiser
    ctx.beginPath();
    ctx.moveTo(0, 28);
    ctx.lineTo(16, 18);
    ctx.lineTo(30, 4);
    ctx.lineTo(28, -16);
    ctx.lineTo(14, -24);
    ctx.lineTo(-14, -24);
    ctx.lineTo(-28, -16);
    ctx.lineTo(-30, 4);
    ctx.lineTo(-16, 18);
    ctx.closePath();

    const cruiserGrad = ctx.createLinearGradient(0, -24, 0, 28);
    if (e.hitFlash > 0) {
      cruiserGrad.addColorStop(0, '#ffffff');
      cruiserGrad.addColorStop(1, '#fecdd3');
    } else {
      cruiserGrad.addColorStop(0, '#4c0519');
      cruiserGrad.addColorStop(0.5, '#be123c');
      cruiserGrad.addColorStop(1, '#fb7185');
    }
    ctx.fillStyle = cruiserGrad;
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Reactor core
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(0, 2, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(0, 2, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Show health bar for damaged multi-HP enemies
  if (e.hp < e.maxHp && e.maxHp > 1) {
    const barW = Math.max(28, e.radius * 1.4);
    const barH = 4;
    const ratio = Math.max(0, e.hp / e.maxHp);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-barW / 2, -e.radius - 12, barW, barH);
    ctx.fillStyle = ratio > 0.45 ? '#fb7185' : '#f59e0b';
    ctx.fillRect(-barW / 2, -e.radius - 12, barW * ratio, barH);
  }

  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, time: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const pulse = 1 + 0.12 * Math.sin(time * 7 + p.age);
  const isRepair = p.kind === 'repair';
  const mainColor = isRepair ? '#10b981' : '#f59e0b';
  const glowColor = isRepair ? 'rgba(16, 185, 129, 0.45)' : 'rgba(245, 158, 11, 0.48)';

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, p.radius * 2.1 * pulse);
  aura.addColorStop(0, glowColor);
  aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius * 2.1 * pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Outer hexagonal/diamond ring
  ctx.rotate(time * 1.6);
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const ang = (i * Math.PI) / 3;
    const px = Math.cos(ang) * p.radius * pulse;
    const py = Math.sin(ang) * p.radius * pulse;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner symbol (unrotated)
  ctx.rotate(-time * 1.6);
  ctx.fillStyle = '#ffffff';
  if (isRepair) {
    // Clean medical/repair cross
    ctx.fillRect(-2, -6, 4, 12);
    ctx.fillRect(-6, -2, 12, 4);
  } else {
    // Triple-shot chevron / bolt
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(6, 2);
    ctx.lineTo(2, 2);
    ctx.lineTo(2, 7);
    ctx.lineTo(-2, 7);
    ctx.lineTo(-2, 2);
    ctx.lineTo(-6, 2);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, pt: Particle) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, pt.alpha);
  if (pt.shape !== 'shard') {
    ctx.globalCompositeOperation = 'lighter';
  }
  ctx.translate(pt.x, pt.y);
  ctx.rotate(pt.rotation);
  ctx.fillStyle = pt.color;

  if (pt.shape === 'shard') {
    ctx.beginPath();
    ctx.moveTo(-pt.radius, -pt.radius * 0.6);
    ctx.lineTo(pt.radius, -pt.radius * 0.2);
    ctx.lineTo(pt.radius * 0.4, pt.radius);
    ctx.closePath();
    ctx.fill();
  } else if (pt.shape === 'spark') {
    ctx.fillRect(-pt.radius * 1.8, -pt.radius * 0.4, pt.radius * 3.6, pt.radius * 0.8);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, pt.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
