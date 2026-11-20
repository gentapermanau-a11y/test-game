import { Play, Volume2, VolumeX } from 'lucide-react';
import { DIFFICULTY_CONFIGS, type Difficulty } from '../game/types';

interface StartMenuProps {
  difficulty: Difficulty;
  highScore: number;
  muted: boolean;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onToggleMute: () => void;
  onStartGame: () => void;
}

const DIFFICULTIES: Difficulty[] = ['standard', 'fast', 'veteran'];

export function StartMenu({
  difficulty,
  highScore,
  muted,
  onSelectDifficulty,
  onToggleMute,
  onStartGame,
}: StartMenuProps) {
  const activeConfig = DIFFICULTY_CONFIGS[difficulty];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-xl rounded-2xl border border-white/12 bg-slate-950/80 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
        {/* Top Row: Title & Sound Toggle */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-balance">
              Solaris Vanguard
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300 sm:text-base">
              Pilot your interceptor through dense asteroid fields and hostile squadrons. Survive waves and climb the scoreboard.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/12 bg-slate-900/90 text-slate-200 transition-colors hover:border-cyan-400/50 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
          >
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
        </div>

        {/* High Score Strip (Clean unboxed metadata) */}
        {highScore > 0 && (
          <div className="mt-5 flex items-center gap-2 border-y border-white/10 py-2.5 text-sm">
            <span className="text-slate-400">Personal Best</span>
            <span className="text-slate-600" aria-hidden="true">
              ·
            </span>
            <span className="font-mono font-bold tabular-nums text-amber-300">
              {highScore.toLocaleString()} pts
            </span>
          </div>
        )}

        {/* Difficulty Segmented Control */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold text-slate-200">Difficulty</span>
            <span className="text-xs text-slate-400">{activeConfig.description}</span>
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-white/10 bg-slate-900/80 p-1">
            {DIFFICULTIES.map((key) => {
              const cfg = DIFFICULTY_CONFIGS[key];
              const isSelected = difficulty === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelectDifficulty(key)}
                  className={`min-h-[40px] rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Reference */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-sm font-semibold text-slate-200">Controls</p>
          <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
              <span className="text-xs text-slate-400">Move Ship</span>
              <span className="font-mono text-xs font-semibold text-white">WASD / Arrows</span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
              <span className="text-xs text-slate-400">Fire Lasers</span>
              <span className="font-mono text-xs font-semibold text-white">Space / Drag</span>
            </div>
            <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-start">
              <span className="text-xs text-slate-400">Pause Game</span>
              <span className="font-mono text-xs font-semibold text-white">P or Esc</span>
            </div>
          </div>
        </div>

        {/* Primary CTA */}
        <div className="mt-7">
          <button
            type="button"
            onClick={onStartGame}
            className="flex min-h-[48px] w-full items-center justify-center gap-2.5 rounded-xl bg-cyan-400 px-6 py-3 text-base font-bold text-slate-950 whitespace-nowrap shadow-[0_0_24px_rgba(34,211,238,0.45)] transition-all hover:bg-cyan-300 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          >
            <Play className="h-5 w-5 fill-slate-950" aria-hidden="true" />
            <span>Start Game</span>
          </button>
        </div>
      </div>
    </div>
  );
}
