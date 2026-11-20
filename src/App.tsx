import { useCallback, useEffect, useState } from 'react';
import { GameOverModal } from './components/GameOverModal';
import { HudBar } from './components/HudBar';
import { PauseModal } from './components/PauseModal';
import { StartMenu } from './components/StartMenu';
import { GameCanvas } from './game/GameCanvas';
import { soundFX } from './game/sound';
import {
  DIFFICULTY_CONFIGS,
  type Difficulty,
  type GameState,
  type HudSnapshot,
  type RunSummary,
} from './game/types';

const HIGH_SCORE_STORAGE_KEY = 'solaris_vanguard_high_score';

function loadHighScore(): number {
  try {
    const raw = localStorage.getItem(HIGH_SCORE_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_STORAGE_KEY, String(score));
  } catch {
    // Ignore storage quota or sandbox errors
  }
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('standard');
  const [runId, setRunId] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => loadHighScore());
  const [muted, setMuted] = useState<boolean>(false);
  const [runSummary, setRunSummary] = useState<RunSummary | null>(null);

  const [hud, setHud] = useState<HudSnapshot>({
    hp: DIFFICULTY_CONFIGS.standard.startingHp,
    maxHp: DIFFICULTY_CONFIGS.standard.startingHp,
    score: 0,
    wave: 1,
    overdriveRemaining: 0,
    waveBannerTimer: 0,
  });

  const startNewRun = useCallback(() => {
    soundFX.unlock();
    setRunSummary(null);
    setRunId((id) => id + 1);
    setGameState('PLAYING');
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev === 'PLAYING') return 'PAUSED';
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, []);

  const handleMainMenu = useCallback(() => {
    setRunSummary(null);
    setGameState('TITLE_MENU');
  }, []);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundFX.setMuted(next);
      if (!next) {
        soundFX.unlock();
      }
      return next;
    });
  }, []);

  const handleGameOver = useCallback((summary: RunSummary) => {
    if (summary.highScore > 0) {
      setHighScore((prev) => {
        const nextBest = Math.max(prev, summary.highScore);
        saveHighScore(nextBest);
        return nextBest;
      });
    }
    setRunSummary(summary);
    setGameState('GAME_OVER');
  }, []);

  // Global P / Escape keyboard shortcut for Pause / Resume
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameState === 'PLAYING' || gameState === 'PAUSED') {
          e.preventDefault();
          handleTogglePause();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, handleTogglePause]);

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#050814]">
      <GameCanvas
        gameState={gameState}
        difficulty={difficulty}
        runId={runId}
        highScore={highScore}
        onHudUpdate={setHud}
        onGameOver={handleGameOver}
      />

      {(gameState === 'PLAYING' || gameState === 'PAUSED') && (
        <HudBar
          hud={hud}
          highScore={highScore}
          gameState={gameState}
          muted={muted}
          onToggleMute={handleToggleMute}
          onTogglePause={handleTogglePause}
        />
      )}

      {gameState === 'TITLE_MENU' && (
        <StartMenu
          difficulty={difficulty}
          highScore={highScore}
          muted={muted}
          onSelectDifficulty={setDifficulty}
          onToggleMute={handleToggleMute}
          onStartGame={startNewRun}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          score={hud.score}
          wave={hud.wave}
          onResume={handleTogglePause}
          onRestart={startNewRun}
          onMainMenu={handleMainMenu}
        />
      )}

      {gameState === 'GAME_OVER' && runSummary && (
        <GameOverModal
          summary={runSummary}
          onPlayAgain={startNewRun}
          onMainMenu={handleMainMenu}
        />
      )}
    </main>
  );
}
