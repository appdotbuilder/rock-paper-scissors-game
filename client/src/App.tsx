import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { GameChoiceButton } from '@/components/GameChoiceButton';
import { SessionStats as SessionStatsComponent } from '@/components/SessionStats';
import { GameResult } from '@/components/GameResult';
import { LoadingState } from '@/components/LoadingState';
import type { 
  GameChoice, 
  PlayRoundResponse, 
  SessionStats, 
  GameRound
} from '../../server/src/schema';

// Generate a random session ID for this browser session
const SESSION_ID = 'session-' + Math.random().toString(36).substring(2, 15);

// Game choice configuration with emojis and animations
const CHOICES = {
  rock: { emoji: '🪨', name: 'Rock', description: 'Crushes scissors' },
  paper: { emoji: '📄', name: 'Paper', description: 'Covers rock' },
  scissors: { emoji: '✂️', name: 'Scissors', description: 'Cuts paper' }
} as const;



function App() {
  const [gameState, setGameState] = useState<{
    lastGame: PlayRoundResponse | null;
    isPlaying: boolean;
    showResult: boolean;
  }>({
    lastGame: null,
    isPlaying: false,
    showResult: false
  });

  const [sessionStats, setSessionStats] = useState<SessionStats>({
    session_id: SESSION_ID,
    wins: 0,
    losses: 0,
    ties: 0,
    total_games: 0,
    last_played: null
  });

  const [gameHistory, setGameHistory] = useState<GameRound[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [highlightedChoice, setHighlightedChoice] = useState<GameChoice | null>(null);

  // Load initial session stats and game history
  const loadSessionData = useCallback(async () => {
    try {
      setError(null);
      const [stats, history] = await Promise.all([
        trpc.getSessionStats.query({ session_id: SESSION_ID }),
        trpc.getGameHistory.query({ session_id: SESSION_ID })
      ]);
      setSessionStats(stats);
      setGameHistory(history);
    } catch (error) {
      console.error('Failed to load session data:', error);
      setError('Failed to load game data. Please refresh the page.');
    }
  }, []);

  useEffect(() => {
    loadSessionData();
  }, [loadSessionData]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (gameState.isPlaying) return;
      
      let choice: GameChoice | null = null;
      switch (event.key.toLowerCase()) {
        case 'r':
          choice = 'rock';
          break;
        case 'p':
          choice = 'paper';
          break;
        case 's':
          choice = 'scissors';
          break;
      }
      
      if (choice) {
        setHighlightedChoice(choice);
        setTimeout(() => playRound(choice), 100);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.isPlaying]);

  // Play a round
  const playRound = async (playerChoice: GameChoice) => {
    setGameState(prev => ({ ...prev, isPlaying: true, showResult: false }));
    setError(null);
    setHighlightedChoice(null);

    try {
      const result = await trpc.playRound.mutate({
        session_id: SESSION_ID,
        player_choice: playerChoice
      });

      // Update session stats with the response data
      setSessionStats(result.session_stats);

      // Show the result with animation
      setTimeout(() => {
        setGameState({
          lastGame: result,
          isPlaying: false,
          showResult: true
        });
      }, 1000); // Add suspense before revealing result

      // Refresh game history
      const updatedHistory = await trpc.getGameHistory.query({ session_id: SESSION_ID });
      setGameHistory(updatedHistory);

    } catch (error) {
      console.error('Failed to play round:', error);
      setError('Failed to play round. Please try again.');
      setGameState(prev => ({ ...prev, isPlaying: false }));
    }
  };

  // Reset session
  const resetSession = async () => {
    setIsResetting(true);
    setError(null);
    try {
      await trpc.resetSession.mutate({ session_id: SESSION_ID });
      await loadSessionData();
      setGameState({
        lastGame: null,
        isPlaying: false,
        showResult: false
      });
    } catch (error) {
      console.error('Failed to reset session:', error);
      setError('Failed to reset session. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-4 gradient-animate">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            🪨📄✂️ Rock Paper Scissors
          </h1>
          <p className="text-xl text-white/90 drop-shadow">
            Challenge the computer and test your luck!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2">
            <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl text-gray-800">
                  {gameState.isPlaying ? '🤔 Computer is thinking...' : 'Choose your weapon!'}
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  {gameState.isPlaying 
                    ? 'Get ready for the result!' 
                    : 'Pick Rock, Paper, or Scissors to play'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Display */}
                {error && (
                  <Alert className="border-2 bg-red-50 border-red-200">
                    <AlertDescription className="text-center text-red-700">
                      🚨 {error}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Game Choices */}
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(CHOICES).map(([choice, config]) => (
                    <div
                      key={choice}
                      className={`transition-all duration-200 ${
                        highlightedChoice === choice ? 'scale-105 ring-2 ring-purple-400 ring-opacity-50' : ''
                      }`}
                    >
                      <GameChoiceButton
                        choice={choice as GameChoice}
                        emoji={config.emoji}
                        name={config.name}
                        description={config.description}
                        onPlay={playRound}
                        disabled={gameState.isPlaying}
                      />
                    </div>
                  ))}
                </div>

                {/* Game Result */}
                {gameState.showResult && gameState.lastGame && (
                  <GameResult 
                    result={gameState.lastGame} 
                    choicesConfig={CHOICES}
                  />
                )}

                {/* Loading State */}
                {gameState.isPlaying && <LoadingState />}
              </CardContent>
            </Card>
          </div>

          {/* Statistics & History */}
          <div className="space-y-6">
            {/* Session Statistics */}
            <SessionStatsComponent
              stats={sessionStats}
              onReset={resetSession}
              isResetting={isResetting}
            />

            {/* Recent Games */}
            {gameHistory.length > 0 && (
              <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-800 flex items-center">
                    📜 Recent Games
                  </CardTitle>
                  <CardDescription>Your last few rounds</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {gameHistory.slice(0, 10).map((game: GameRound) => (
                      <div 
                        key={game.id} 
                        className="flex items-center justify-between p-2 rounded-md bg-gray-50 border"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">
                            {CHOICES[game.player_choice].emoji}
                          </span>
                          <span className="text-xs text-gray-500">vs</span>
                          <span className="text-lg">
                            {CHOICES[game.computer_choice].emoji}
                          </span>
                        </div>
                        <Badge 
                          variant={
                            game.result === 'win' ? 'default' :
                            game.result === 'loss' ? 'destructive' :
                            'secondary'
                          }
                          className="text-xs"
                        >
                          {game.result === 'win' ? '🏆' : 
                           game.result === 'loss' ? '😅' : '🤝'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/80 space-y-2">
          <p className="text-sm">
            Made with ❤️ • Rock beats Scissors • Paper beats Rock • Scissors beats Paper
          </p>
          <p className="text-xs opacity-75">
            💡 Keyboard shortcuts: Press R for Rock, P for Paper, S for Scissors
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;