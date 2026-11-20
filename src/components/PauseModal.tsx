import { Home, Play, RotateCcw } from 'lucide-react';

interface PauseModalProps {
  score: number;
  wave: number;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export function PauseModal({
  score,
  wave,
  onResume,
  onRestart,
  onMainMenu,
}: PauseModalProps) {
  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/12 bg-slate-950/90 p-6 shadow-2xl sm:p-7">
        <h2 id="pause-title" className="font-display text-2xl font-bold text-white">
          Game Paused
        </h2>
        <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
          <span className="font-mono tabular-nums">Score {score.toLocaleString()}</span>
          <span className="text-slate-600" aria-hidden="true">
            ·
          </span>
          <span className="font-mono tabular-nums text-cyan-300">Wave {wave}</span>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-bold text-slate-950 whitespace-nowrap transition-colors hover:bg-cyan-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <Play className="h-4 w-4 fill-slate-950" aria-hidden="true" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-100 whitespace-nowrap transition-colors hover:border-white/30 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Restart</span>
          </button>

          <button
            type="button"
            onClick={onMainMenu}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-transparent px-5 py-2.5 text-sm font-medium text-slate-300 whitespace-nowrap transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
}
