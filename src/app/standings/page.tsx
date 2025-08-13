'use client';

import React, { useEffect, useState } from 'react';
import { StandingsTable } from '@/components/StandingsTable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
// import { Badge } from '@/components/ui/Badge';
import { LoadingPage } from '@/components/ui/Loading';
import { useAppStore } from '@/lib/store';

export default function StandingsPage() {
  const {
    standings,
    loading,
    error,
    fetchStandings,
    setError
  } = useAppStore();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadStandings = async () => {
      setLocalLoading(true);
      try {
        await fetchStandings();
      } catch {
        setError('Failed to load standings');
      } finally {
        setLocalLoading(false);
      }
    };

    loadStandings();
  }, [fetchStandings, setError]);

  // Calculate additional statistics
  const getLeagueStats = () => {
    if (standings.length === 0) return null;

    const totalGoals = standings.reduce((sum, team) => sum + team.all.goals.for, 0);
    const totalMatches = standings.reduce((sum, team) => sum + team.all.played, 0);
    const avgGoalsPerMatch = totalMatches > 0 ? (totalGoals / (totalMatches / 2)).toFixed(2) : '0';

    const topScorer = standings.reduce((top, team) => 
      team.all.goals.for > top.all.goals.for ? team : top
    );

    const bestDefense = standings.reduce((best, team) => 
      team.all.goals.against < best.all.goals.against ? team : best
    );

    const mostWins = standings.reduce((most, team) => 
      team.all.win > most.all.win ? team : most
    );

    return {
      totalGoals,
      avgGoalsPerMatch,
      topScorer,
      bestDefense,
      mostWins
    };
  };

  const stats = getLeagueStats();

  if (localLoading && !standings.length) {
    return <LoadingPage message="Loading Premier League table..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Premier League Table
        </h1>
        <p className="text-lg text-gray-600">
          Current season standings and statistics
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

      {/* League Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.avgGoalsPerMatch}
              </div>
              <div className="text-sm text-gray-600">Goals per Match</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-xl font-bold text-green-600 mb-2">
                {stats.topScorer.team.name}
              </div>
              <div className="text-lg text-gray-700">{stats.topScorer.all.goals.for}</div>
              <div className="text-sm text-gray-600">Most Goals Scored</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-xl font-bold text-red-600 mb-2">
                {stats.bestDefense.team.name}
              </div>
              <div className="text-lg text-gray-700">{stats.bestDefense.all.goals.against}</div>
              <div className="text-sm text-gray-600">Fewest Goals Conceded</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="text-center">
              <div className="text-xl font-bold text-purple-600 mb-2">
                {stats.mostWins.team.name}
              </div>
              <div className="text-lg text-gray-700">{stats.mostWins.all.win}</div>
              <div className="text-sm text-gray-600">Most Wins</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table */}
      <StandingsTable standings={standings} loading={loading} />

      {/* Additional Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* European Competitions */}
        <Card>
          <CardHeader>
            <CardTitle size="sm">European Competitions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <div>
                  <div className="font-medium text-gray-900">Champions League (1st - 4th)</div>
                  <div className="text-sm text-gray-600">Qualify for group stage</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <div>
                  <div className="font-medium text-gray-900">Europa League (5th - 6th)</div>
                  <div className="text-sm text-gray-600">Qualify for group stage</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-600 rounded"></div>
                <div>
                  <div className="font-medium text-gray-900">Relegation (18th - 20th)</div>
                  <div className="text-sm text-gray-600">Relegated to Championship</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Guide */}
        <Card>
          <CardHeader>
            <CardTitle size="sm">Form Guide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Legend:</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Win</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">Draw</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-gray-600">Loss</span>
                </div>
              </div>
              
              <div className="pt-2 border-t text-xs text-gray-600">
                Form shows the last 5 matches for each team
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Explanation */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">Table Columns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-900">P</div>
              <div className="text-gray-600">Played</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">W</div>
              <div className="text-gray-600">Won</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">D</div>
              <div className="text-gray-600">Drawn</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">L</div>
              <div className="text-gray-600">Lost</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">GF/GA</div>
              <div className="text-gray-600">Goals For/Against</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">GD</div>
              <div className="text-gray-600">Goal Difference</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <Button
          onClick={() => fetchStandings()}
          loading={loading}
          disabled={loading}
          variant="outline"
        >
          Refresh Table
        </Button>
      </div>
    </div>
  );
}