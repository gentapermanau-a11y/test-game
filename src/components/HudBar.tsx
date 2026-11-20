import { Pause, Play, ShieldAlert, ShieldCheck, Volume2, VolumeX, Zap } from 'lucide-react';
import type { GameState, HudSnapshot } from '../game/types';

interface HudBarProps {
  hud: HudSnapshot;
  highScore: number;
  gameState: GameState;
  muted: boolean;
  onToggleMute: () => void;
  onTogglePause: () => void;
}

export function HudBar({
  hud,
  highScore,
  gameState,
  muted,
  onToggleMute,
  onTogglePause,
}: HudBarProps) {
  const hpPct = hud.maxHp > 0 ? Math.max(0, Math.min(100, (hud.hp / hud.maxHp) * 100)) : 0;
  const isCritical = hpPct <= 30;
  const isWarning = hpPct > 30 && hpPct <= 60;
  const bestScore = Math.max(highScore, hud.score);

  const barColorClass = isCritical
    ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.75)]'
    : isWarning
      ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
      : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]';

  const statusText = isCritical ? 'Low Hull' : isWarning ? 'Damaged' : 'Intact';

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-20 px-4 pt-3 sm:px-6 sm:pt-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2.5 backdrop-blur-md">
        {/* Zone 1: Hull Health Meter (non-hue-only: icon + text state + tabular count) */}
        <div className="pointer-events-auto flex min-w-0 items-center gap-3">
          {isCritical ? (
            <ShieldAlert className="h-5 w-5 shrink-0 text-rose-400" aria-hidden="true" />
          ) : (
            <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
          )}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs font-medium leading-none whitespace-nowrap">
              <span className="font-mono tabular-nums text-slate-100">
                HP {hud.hp}/{hud.maxHp}
              </span>
              <span className="text-slate-500" aria-hidden="true">
                ·
              </span>
              <span
                className={
                  isCritical
                    ? 'text-rose-400'
                    : isWarning
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                }
              >
                {statusText}
              </span>
            </div>
            <div
              className="h-2 w-28 overflow-hidden rounded-sm bg-slate-800/90 sm:w-40"
              role="progressbar"
              aria-label="Ship Hull Health"
              aria-valuenow={hud.hp}
              aria-valuemin={0}
              aria-valuemax={hud.maxHp}
            >
              <div
                className={`h-full transition-all duration-150 ${barColorClass}`}
                style={{ width: `${hpPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Zone 2: Clean Unboxed Score / Best / Wave Telemetry */}
        <div className="flex items-center gap-3 text-sm whitespace-nowrap sm:gap-5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-medium text-slate-400">Score</span>
            <span className="font-mono text-base font-bold tabular-nums text-white sm:text-lg">
              {hud.score.toLocaleString()}
            </span>
          </div>

          <span className="hidden text-slate-600 sm:inline" aria-hidden="true">
            ·
          </span>

          <div className="hidden items-baseline gap-1.5 sm:flex">
            <span className="text-xs font-medium text-slate-400">Best</span>
            <span className="font-mono text-sm font-medium tabular-nums text-slate-200">
              {bestScore.toLocaleString()}
            </span>
          </div>

          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>

          <div className="flex items-baseline gap-1.5">
            <span className="text-xs font-medium text-slate-400">Wave</span>
            <span className="font-mono text-sm font-bold tabular-nums text-cyan-300">
              {hud.wave}
            </span>
          </div>

          {hud.overdriveRemaining > 0 && (
            <>
              <span className="hidden text-slate-600 md:inline" aria-hidden="true">
                ·
              </span>
              <div className="hidden items-center gap-1 font-mono text-xs font-semibold tabular-nums text-amber-300 md:flex">
                <Zap className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                <span>Triple Shot {hud.overdriveRemaining.toFixed(1)}s</span>
              </div>
            </>
          )}
        </div>

        {/* Zone 3: Sound & Pause Controls (40px+ targets) */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-slate-900/80 text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-10 items-center gap-2 rounded-lg border border-white/15 bg-slate-900/90 px-3.5 text-sm font-semibold text-slate-100 whitespace-nowrap shrink-0 transition-colors hover:border-cyan-400/60 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {gameState === 'PAUSED' ? (
              <>
                <Play className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                <span>Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Unobtrusive Wave Toast */}
      {hud.waveBannerTimer > 0 && gameState === 'PLAYING' && (
        <div className="mt-6 flex justify-center">
          <div className="rounded-lg border border-cyan-400/30 bg-slate-950/75 px-5 py-2 text-center backdrop-blur-sm">
            <p className="font-display text-lg font-bold tracking-wide text-cyan-200">
              Wave {hud.wave}
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
