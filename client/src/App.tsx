// ============================================================
// PRISMATIC DEPTHS — App Entry
// Design: Neon Dungeon Terminal
// ============================================================

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { GameProvider, useGame } from "./contexts/GameContext";
import HeroSelectScreen from "./pages/HeroSelect";
import GameScreen from "./pages/GameScreen";
import { GameOverScreen, VictoryScreen } from "./pages/GameOver";
import ErrorBoundary from "./components/ErrorBoundary";

function GameRouter() {
  const { state } = useGame();

  if (state.phase === 'hero-select') return <HeroSelectScreen />;
  if (state.phase === 'game-over') return <GameOverScreen />;
  if (state.phase === 'victory') return <VictoryScreen />;
  return <GameScreen />;
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <GameProvider>
            <GameRouter />
          </GameProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
