'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge, ConfidenceBadge, PredictionBadge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/Loading';
import { useAppStore } from '@/lib/store';

interface AnalysisData {
  fixture?: Record<string, unknown>;
  teams?: {
    home: Record<string, unknown>;
    away: Record<string, unknown>;
  };
  headToHead?: {
    matches: Record<string, unknown>[];
    summary: Record<string, unknown>;
  };
  factors?: Record<string, unknown>;
  prediction?: Record<string, unknown>;
}

function AnalysisPageContent() {
  const searchParams = useSearchParams();
  const fixtureId = searchParams.get('fixture');
  
  const { error, setError } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData>({});

  useEffect(() => {
    if (fixtureId) {
      fetchAnalysis(parseInt(fixtureId));
    }
  }, [fixtureId]);

  const fetchAnalysis = async (id: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analysis?fixture_id=${id}`);
      const data = await response.json();
      
      if (data.success) {
        setAnalysisData(data.data);
      } else {
        setError(data.error || 'Failed to load analysis');
      }
    } catch {
      setError('Failed to fetch analysis data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingPage message="Loading match analysis..." />;
  }

  if (!fixtureId) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Match Analysis
        </h2>
        <p className="text-gray-600 mb-6">
          Select a fixture to view detailed analysis and predictions.
        </p>
        <Button onClick={() => window.location.href = '/predictions'}>
          View Predictions
        </Button>
      </div>
    );
  }

  if (!analysisData.fixture) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Analysis Not Available
        </h2>
        <p className="text-gray-600 mb-6">
          Unable to load analysis for this fixture.
        </p>
        <Button onClick={() => window.location.href = '/predictions'}>
          Back to Predictions
        </Button>
      </div>
    );
  }

  const { fixture, teams, headToHead, factors, prediction } = analysisData;
  const homeTeam = teams?.home?.team as Record<string, unknown> | undefined;
  const awayTeam = teams?.away?.team as Record<string, unknown> | undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Match Analysis
        </h1>
        <p className="text-lg text-gray-600">
          Detailed breakdown and prediction factors
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
              <div className="mt-4">
                <Button size="sm" variant="outline" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Header */}
      <Card>
        <CardContent className="text-center py-8">
          <div className="grid grid-cols-7 items-center gap-4">
            {/* Home Team */}
            <div className="col-span-3">
              <div className="flex items-center justify-end space-x-3">
                {(homeTeam?.logo as string) && (
                  <img 
                    src={homeTeam?.logo as string} 
                    alt={homeTeam?.name as string}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-900">
                    {homeTeam?.name as string}
                  </h2>
                  <Badge variant="success" size="sm">Home</Badge>
                </div>
              </div>
            </div>

            {/* VS */}
            <div className="col-span-1">
              <div className="text-2xl font-bold text-gray-500">VS</div>
              <div className="text-sm text-gray-600 mt-2">
                {new Date(fixture?.date as string).toLocaleDateString()}
              </div>
            </div>

            {/* Away Team */}
            <div className="col-span-3">
              <div className="flex items-center space-x-3">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-gray-900">
                    {awayTeam?.name as string}
                  </h2>
                  <Badge variant="info" size="sm">Away</Badge>
                </div>
                {(awayTeam?.logo as string) && (
                  <img 
                    src={awayTeam?.logo as string} 
                    alt={awayTeam?.name as string}
                    className="w-12 h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Summary */}
      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-lg text-gray-600 mb-2">Predicted Outcome</div>
                <PredictionBadge prediction={prediction?.prediction as 'HOME_WIN' | 'DRAW' | 'AWAY_WIN'} />
              </div>
              <div>
                <div className="text-lg text-gray-600 mb-2">Confidence Level</div>
                <ConfidenceBadge confidence={prediction?.confidence as number} />
              </div>
              <div>
                <div className="text-lg text-gray-600 mb-2">Algorithm Version</div>
                <Badge variant="default">{prediction?.algorithm_version as string}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form Analysis */}
      {teams && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Home Team Form */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">{homeTeam?.name as string} - Recent Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {((teams.home.form as Record<string, unknown>)?.wins as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {((teams.home.form as Record<string, unknown>)?.draws as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Draws</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {((teams.home.form as Record<string, unknown>)?.losses as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {((teams.home.form as Record<string, unknown>)?.formScore as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Form Score</div>
                  </div>
                </div>

                {/* Goals */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {((teams.home.form as Record<string, unknown>)?.goalsFor as number) || 0}
                      </div>
                      <div className="text-gray-600">Goals For</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {((teams.home.form as Record<string, unknown>)?.goalsAgainst as number) || 0}
                      </div>
                      <div className="text-gray-600">Goals Against</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Away Team Form */}
          <Card>
            <CardHeader>
              <CardTitle size="sm">{awayTeam?.name as string} - Recent Form</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {((teams.away.form as Record<string, unknown>)?.wins as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Wins</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {((teams.away.form as Record<string, unknown>)?.draws as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Draws</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {((teams.away.form as Record<string, unknown>)?.losses as number) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Losses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {((teams.away.form as Record<string, unknown>)?.formScore as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">Form Score</div>
                  </div>
                </div>

                {/* Goals */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {((teams.away.form as Record<string, unknown>)?.goalsFor as number) || 0}
                      </div>
                      <div className="text-gray-600">Goals For</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-900">
                        {((teams.away.form as Record<string, unknown>)?.goalsAgainst as number) || 0}
                      </div>
                      <div className="text-gray-600">Goals Against</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistical Comparison */}
      {teams && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Attack vs Defense */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Attacking Strength</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {((teams.home.statistics as Record<string, unknown>)?.attackingStrength as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">{homeTeam?.name as string}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {((teams.away.statistics as Record<string, unknown>)?.attackingStrength as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">{awayTeam?.name as string}</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Defensive Strength</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {((teams.home.statistics as Record<string, unknown>)?.defensiveStrength as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">{homeTeam?.name as string}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900 mb-1">
                      {((teams.away.statistics as Record<string, unknown>)?.defensiveStrength as number)?.toFixed(0) || 0}
                    </div>
                    <div className="text-sm text-gray-600">{awayTeam?.name as string}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Head to Head */}
      {headToHead && headToHead.matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Head-to-Head Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-6">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {(headToHead.summary as Record<string, unknown>)?.totalMatches as number || 0}
                </div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {(headToHead.summary as Record<string, unknown>)?.team1Wins as number || 0}
                </div>
                <div className="text-sm text-gray-600">{homeTeam?.name as string} Wins</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(headToHead.summary as Record<string, unknown>)?.draws as number || 0}
                </div>
                <div className="text-sm text-gray-600">Draws</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {(headToHead.summary as Record<string, unknown>)?.team2Wins as number || 0}
                </div>
                <div className="text-sm text-gray-600">{awayTeam?.name as string} Wins</div>
              </div>
            </div>

            {/* Recent Matches */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-4">Recent Meetings</h4>
              <div className="space-y-2">
                {headToHead.matches.slice(0, 5).map((match: Record<string, unknown>, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded">
                    <div className="text-sm">
                      {new Date(match.date as string).toLocaleDateString()}
                    </div>
                    <div className="text-sm font-medium">
                      {(match.teams as Record<string, Record<string, unknown>>).home.name as string} {(match.goals as Record<string, unknown>).home as number} - {(match.goals as Record<string, unknown>).away as number} {(match.teams as Record<string, Record<string, unknown>>).away.name as string}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prediction Factors */}
      {factors && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction Factors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {((factors.homeAdvantage as number)?.toFixed(1)) || 0}%
                </div>
                <div className="text-sm text-gray-600">Home Advantage</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {(((factors.formComparison as Record<string, unknown>)?.difference as number)?.toFixed(1)) || 0}
                </div>
                <div className="text-sm text-gray-600">Form Difference</div>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 mb-1">
                  {((((factors.strengthComparison as Record<string, unknown>)?.attacking as Record<string, unknown>)?.home as number)?.toFixed(0)) || 0}
                </div>
                <div className="text-sm text-gray-600">Home Attack Rating</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/predictions'}
        >
          ← Back to Predictions
        </Button>
        
        <Button
          onClick={() => window.location.href = '/'}
        >
          Dashboard
        </Button>
      </div>
    </div>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<LoadingPage message="Loading analysis page..." />}>
      <AnalysisPageContent />
    </Suspense>
  );
}