import { Alert, AlertDescription } from '@/components/ui/alert';

const THINKING_MESSAGES = [
  '🎲 Rolling the dice...',
  '🤖 Computer is strategizing...',
  '🧠 AI brain processing...',
  '⚡ Calculating the perfect move...',
  '🎯 Analyzing your choice...',
  '🔮 Consulting the crystal ball...',
  '🎪 The suspense is killing us...',
  '🌟 Magic is happening...'
];

const THINKING_DESCRIPTIONS = [
  'The computer is making its choice!',
  'Artificial intelligence at work!',
  'Preparing for battle!',
  'The moment of truth approaches...',
  'Victory or defeat awaits!',
  'The computer is ready to compete!',
  'Digital neurons firing...',
  'Get ready for the result!'
];

export function LoadingState() {
  const message = THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)];
  const description = THINKING_DESCRIPTIONS[Math.floor(Math.random() * THINKING_DESCRIPTIONS.length)];

  return (
    <Alert className="border-2 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200 animate-pulse">
      <AlertDescription className="text-center space-y-3">
        <div className="text-2xl mb-2 animate-bounce">
          {message}
        </div>
        <div className="text-gray-600">
          {description}
        </div>
        
        {/* Animated thinking dots */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-3 h-3 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>

        {/* Progress bar simulation */}
        <div className="w-full bg-yellow-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-pulse"></div>
        </div>
      </AlertDescription>
    </Alert>
  );
}