import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { SessionStats as SessionStatsType } from '../../../server/src/schema';

interface SessionStatsProps {
  stats: SessionStatsType;
  onReset: () => void;
  isResetting: boolean;
}

interface StatCardProps {
  value: number;
  label: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

function StatCard({ value, label, emoji, bgColor, borderColor, textColor }: StatCardProps) {
  return (
    <div className={`text-center p-3 ${bgColor} rounded-lg border ${borderColor} transition-all duration-200 hover:scale-105`}>
      <div className={`text-2xl font-bold ${textColor} mb-1`}>
        {value}
      </div>
      <div className={`text-sm ${textColor} flex items-center justify-center gap-1`}>
        <span>{label}</span>
        <span>{emoji}</span>
      </div>
    </div>
  );
}

export function SessionStats({ stats, onReset, isResetting }: SessionStatsProps) {
  const winPercentage = stats.total_games > 0 
    ? Math.round((stats.wins / stats.total_games) * 100)
    : 0;

  const getPerformanceMessage = () => {
    if (stats.total_games === 0) return "Ready to start your journey! 🚀";
    if (winPercentage >= 70) return "You're on fire! 🔥";
    if (winPercentage >= 50) return "Great performance! 👏";
    if (winPercentage >= 30) return "Keep practicing! 💪";
    return "Don't give up! 🌟";
  };

  const getPerformanceEmoji = () => {
    if (stats.total_games === 0) return "🎮";
    if (winPercentage >= 70) return "🏆";
    if (winPercentage >= 50) return "😊";
    if (winPercentage >= 30) return "🤔";
    return "😅";
  };

  return (
    <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0">
      <CardHeader>
        <CardTitle className="text-xl text-gray-800 flex items-center gap-2">
          📊 Your Stats
          <span className="text-lg">{getPerformanceEmoji()}</span>
        </CardTitle>
        <CardDescription>
          {getPerformanceMessage()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            value={stats.wins}
            label="Wins"
            emoji="🏆"
            bgColor="bg-green-50 hover:bg-green-100"
            borderColor="border-green-200"
            textColor="text-green-600"
          />
          <StatCard
            value={stats.losses}
            label="Losses"
            emoji="😅"
            bgColor="bg-red-50 hover:bg-red-100"
            borderColor="border-red-200"
            textColor="text-red-600"
          />
          <StatCard
            value={stats.ties}
            label="Ties"
            emoji="🤝"
            bgColor="bg-yellow-50 hover:bg-yellow-100"
            borderColor="border-yellow-200"
            textColor="text-yellow-600"
          />
          <StatCard
            value={stats.total_games}
            label="Total"
            emoji="🎮"
            bgColor="bg-blue-50 hover:bg-blue-100"
            borderColor="border-blue-200"
            textColor="text-blue-600"
          />
        </div>

        {stats.total_games > 0 && (
          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600 mb-1">{winPercentage}%</div>
            <div className="text-sm text-purple-700 flex items-center justify-center gap-1">
              Win Rate <span>📈</span>
            </div>
            {stats.last_played && (
              <div className="text-xs text-purple-600 mt-2 opacity-75">
                Last played: {new Date(stats.last_played).toLocaleString()}
              </div>
            )}
          </div>
        )}

        <Separator />

        <div className="space-y-2">
          <Button
            onClick={onReset}
            disabled={isResetting || stats.total_games === 0}
            variant="outline"
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200 hover:border-red-300 disabled:opacity-50 transition-all duration-200"
          >
            {isResetting ? '🔄 Resetting...' : '🗑️ Reset Session'}
          </Button>
          
          {stats.total_games === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Play some games to enable reset
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}