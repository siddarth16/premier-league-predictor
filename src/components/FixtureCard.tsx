// Fixture Card component
import React from 'react';
import { Fixture, Prediction } from '@/types';
import { Card, CardContent } from './ui/Card';
import { Badge, ConfidenceBadge, PredictionBadge } from './ui/Badge';
import { Button } from './ui/Button';
import { format } from 'date-fns';

interface FixtureCardProps {
  fixture: Fixture;
  prediction?: Prediction;
  onPredict?: (fixtureId: number) => void;
  onViewAnalysis?: (fixture: Fixture) => void;
  loading?: boolean;
}

export const FixtureCard: React.FC<FixtureCardProps> = ({
  fixture,
  prediction,
  onPredict,
  onViewAnalysis,
  loading = false
}) => {
  const isCompleted = fixture.status.short === 'FT';
  const isLive = fixture.status.short === 'LIVE';
  const homeGoals = fixture.goals.home;
  const awayGoals = fixture.goals.away;

  const formatMatchDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm');
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = () => {
    if (isLive) {
      return <Badge variant="danger" size="sm">LIVE</Badge>;
    }
    if (isCompleted) {
      return <Badge variant="success" size="sm">FT</Badge>;
    }
    return <Badge variant="info" size="sm">{formatMatchDate(fixture.date)}</Badge>;
  };

  return (
    <Card hover className="w-full">
      <CardContent>
        <div className="space-y-4">
          {/* Match Status and Date */}
          <div className="flex justify-between items-center">
            {getStatusBadge()}
            <span className="text-xs text-gray-500">
              {fixture.league.round}
            </span>
          </div>

          {/* Teams and Score */}
          <div className="grid grid-cols-7 items-center gap-2">
            {/* Home Team */}
            <div className="col-span-3 text-right">
              <div className="flex items-center justify-end space-x-2">
                {fixture.teams.home.logo && (
                  <img 
                    src={fixture.teams.home.logo} 
                    alt={fixture.teams.home.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="font-medium text-gray-900 truncate">
                  {fixture.teams.home.name}
                </span>
              </div>
            </div>

            {/* Score/Time */}
            <div className="col-span-1 text-center">
              {isCompleted || isLive ? (
                <div className="text-lg font-bold text-gray-900">
                  {homeGoals} - {awayGoals}
                </div>
              ) : (
                <div className="text-sm text-gray-500">vs</div>
              )}
            </div>

            {/* Away Team */}
            <div className="col-span-3 text-left">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-gray-900 truncate">
                  {fixture.teams.away.name}
                </span>
                {fixture.teams.away.logo && (
                  <img 
                    src={fixture.teams.away.logo} 
                    alt={fixture.teams.away.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Prediction Section */}
          {prediction && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Prediction:</span>
                <PredictionBadge prediction={prediction.prediction} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Confidence:</span>
                <ConfidenceBadge confidence={prediction.confidence} />
              </div>
              
              {/* Quick factors display */}
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>
                  Home Form: {prediction.factors.home_form_score.toFixed(0)}
                </div>
                <div>
                  Away Form: {prediction.factors.away_form_score.toFixed(0)}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {!isCompleted && !prediction && onPredict && (
              <Button
                size="sm"
                onClick={() => onPredict(fixture.id)}
                loading={loading}
                disabled={loading}
                className="flex-1"
              >
                Generate Prediction
              </Button>
            )}
            
            {onViewAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewAnalysis(fixture)}
                className="flex-1"
              >
                View Analysis
              </Button>
            )}
          </div>

          {/* Match Info */}
          {fixture.referee && (
            <div className="text-xs text-gray-500 text-center border-t pt-2">
              Referee: {fixture.referee}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};