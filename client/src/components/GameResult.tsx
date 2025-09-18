import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import type { PlayRoundResponse } from '../../../server/src/schema';

interface GameResultProps {
  result: PlayRoundResponse;
  choicesConfig: Record<string, { emoji: string; name: string; description: string }>;
}

// Result messages with more variety
const RESULT_MESSAGES = {
  win: [
    '🎉 Fantastic! You won!',
    '🏆 Victory is yours!',
    '✨ Brilliant move!',
    '🎯 Perfect choice!',
    '🌟 You nailed it!',
    '👑 You\'re the champion!',
    '🚀 Outstanding play!'
  ],
  loss: [
    '😅 Nice try! Computer wins this round!',
    '🤖 The AI got you this time!',
    '💭 So close! Better luck next time!',
    '🎲 Tough break! Try again!',
    '🤷 It happens to the best of us!',
    '🔄 Shake it off and go again!',
    '💪 Don\'t give up! You\'ve got this!'
  ],
  tie: [
    '🤝 Great minds think alike!',
    '🔄 Perfect balance! It\'s a tie!',
    '⚖️ Evenly matched! Draw!',
    '🎭 You both picked the same!',
    '🤯 What are the odds! A tie!',
    '🔮 You read each other\'s minds!',
    '⭐ Symmetry at its finest!'
  ]
} as const;

export function GameResult({ result, choicesConfig }: GameResultProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation and set message
    setIsAnimating(true);
    const messages = RESULT_MESSAGES[result.result];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    setCurrentMessage(randomMessage);

    // Reset animation after it completes
    const timer = setTimeout(() => setIsAnimating(false), 600);
    return () => clearTimeout(timer);
  }, [result]);

  const getResultStyles = () => {
    switch (result.result) {
      case 'win':
        return 'from-green-50 to-emerald-50 border-green-200 glow-win';
      case 'loss':
        return 'from-red-50 to-rose-50 border-red-200 glow-loss';
      case 'tie':
        return 'from-yellow-50 to-amber-50 border-yellow-200 glow-tie';
    }
  };

  const getVsSymbol = () => {
    switch (result.result) {
      case 'win': return '🏆';
      case 'loss': return '💥';
      case 'tie': return '⚡';
    }
  };

  const getActionDescription = () => {
    const playerChoice = choicesConfig[result.player_choice].name;
    const computerChoice = choicesConfig[result.computer_choice].name;
    
    if (result.result === 'win') {
      const actions: Record<string, Record<string, string>> = {
        rock: { scissors: 'crushes' },
        paper: { rock: 'covers' },
        scissors: { paper: 'cuts' }
      };
      const action = actions[result.player_choice]?.[result.computer_choice] || 'beats';
      return `${playerChoice} ${action} ${computerChoice}!`;
    } else if (result.result === 'loss') {
      const actions: Record<string, Record<string, string>> = {
        rock: { paper: 'is covered by' },
        paper: { scissors: 'is cut by' },
        scissors: { rock: 'is crushed by' }
      };
      const action = actions[result.player_choice]?.[result.computer_choice] || 'loses to';
      return `${playerChoice} ${action} ${computerChoice}!`;
    } else {
      return `Both chose ${playerChoice}! Perfect synchronization!`;
    }
  };

  return (
    <Alert className={`border-2 bg-gradient-to-r ${getResultStyles()} transition-all duration-300`}>
      <AlertDescription className="text-center space-y-4">
        {/* Result Message */}
        <div className={`text-2xl font-bold text-gray-800 transition-all duration-300 ${isAnimating ? 'bounce-in' : ''}`}>
          {currentMessage}
        </div>

        {/* Visual Battle Display */}
        <div className="flex justify-center items-center space-x-8">
          <div className={`text-center transition-all duration-500 ${isAnimating ? 'scale-110' : ''}`}>
            <div className="text-6xl mb-2 animate-bounce">
              {choicesConfig[result.player_choice].emoji}
            </div>
            <div className="text-sm text-gray-600 font-medium bg-blue-100 px-2 py-1 rounded-full border border-blue-200">
              You 👤
            </div>
          </div>

          <div className="text-center">
            <div className={`text-4xl mb-2 transition-all duration-300 ${isAnimating ? 'animate-spin' : ''}`}>
              {getVsSymbol()}
            </div>
            <div className="text-xs text-gray-500 font-medium">VS</div>
          </div>

          <div className={`text-center transition-all duration-500 ${isAnimating ? 'scale-110' : ''}`}>
            <div className="text-6xl mb-2 animate-bounce" style={{ animationDelay: '0.1s' }}>
              {choicesConfig[result.computer_choice].emoji}
            </div>
            <div className="text-sm text-gray-600 font-medium bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
              Computer 🤖
            </div>
          </div>
        </div>

        {/* Action Description */}
        <div className="text-lg text-gray-700 font-medium bg-white/50 px-4 py-2 rounded-lg border border-gray-200">
          {getActionDescription()}
        </div>

        {/* Fun Facts or Encouragement */}
        <div className="text-sm text-gray-600 italic">
          {result.result === 'win' && "🎯 Your strategic thinking paid off!"}
          {result.result === 'loss' && "🎮 Every loss is a lesson learned!"}
          {result.result === 'tie' && "🤝 Great minds really do think alike!"}
        </div>
      </AlertDescription>
    </Alert>
  );
}