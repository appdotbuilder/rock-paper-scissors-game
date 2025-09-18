import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { GameChoice } from '../../../server/src/schema';

interface GameChoiceButtonProps {
  choice: GameChoice;
  emoji: string;
  name: string;
  description: string;
  onPlay: (choice: GameChoice) => void;
  disabled: boolean;
}

export function GameChoiceButton({ 
  choice, 
  emoji, 
  name, 
  description, 
  onPlay, 
  disabled 
}: GameChoiceButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onPlay(choice);
    
    // Reset pressed state after animation
    setTimeout(() => setIsPressed(false), 200);
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled}
      className={`
        h-24 text-4xl bg-white hover:bg-gray-50 border-2 border-gray-200 
        hover:border-purple-300 text-gray-700 hover:text-purple-600 
        transition-all duration-200 shadow-lg relative overflow-hidden
        ${!disabled ? 'hover:scale-105 active:scale-95' : ''}
        ${isPressed ? 'scale-95' : ''}
        ${disabled ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}
      `}
      variant="outline"
    >
      <div className="flex flex-col items-center relative z-10">
        <span 
          className={`
            text-5xl mb-1 transition-all duration-200 
            ${isPressed ? 'scale-110' : ''}
            ${disabled ? 'grayscale' : ''}
          `}
        >
          {emoji}
        </span>
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-gray-400 mt-1">
          {choice === 'rock' ? 'Press R' : 
           choice === 'paper' ? 'Press P' : 'Press S'}
        </span>
      </div>
      
      {/* Ripple effect on click */}
      {isPressed && (
        <div className="absolute inset-0 bg-purple-200 rounded-md animate-ping opacity-25" />
      )}
      
      {/* Hover tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
        {description}
      </div>
    </Button>
  );
}