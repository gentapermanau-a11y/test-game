import { Home, RotateCcw, Trophy } from 'lucide-react';
import { DIFFICULTY_CONFIGS, type RunSummary } from '../game/types';

interface GameOverModalProps {
  summary: RunSummary;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function GameOverModal({
  summary,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const diffLabel = DIFFICULTY_CONFIGS[summary.difficulty].label;

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gameover-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-white/12 bg-slate-950/90 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="gameover-title" className="font-display text-3xl font-extrabold text-white">
              Game Over
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {diffLabel} · Wave {summary.wave}
            </p>
          </div>
          {summary.isNewHighScore && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-300">
              <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>New Best</span>
            </div>
          )}
        </div>

        {/* Final Score Focal Display */}
        <div className="mt-6 border-y border-white/10 py-4">
          <p className="text-xs font-medium text-slate-400">Final Score</p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-cyan-300">
            {summary.score.toLocaleString()}
          </p>
          <p className="mt-1.5 font-mono text-xs tabular-nums text-slate-400">
            Best Score: {summary.highScore.toLocaleString()}
          </p>
        </div>

        {/* Run Breakdown */}
        <div className="mt-5 grid grid-cols-3 gap-4 text-left">
          <div>
            <p className="text-xs text-slate-400">Enemies</p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
              {summary.enemiesDestroyed}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Asteroids</p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
              {summary.asteroidsDestroyed}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400">Accuracy</p>
            <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">
              {summary.accuracy}%
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onPlayAgain}
            className="flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 whitespace-nowrap shadow-[0_0_20px_rgba(34,211,238,0.35)] transition-colors hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Play Again</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-200 whitespace-nowrap transition-colors hover:border-white/30 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
