'use client';

import React, { useEffect, useState } from 'react';
import { FixtureCard } from '@/components/FixtureCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage, LoadingCard } from '@/components/ui/Loading';
import { useAppStore } from '@/lib/store';

export default function Dashboard() {
  const {
    fixtures,
    standings,
    predictions,
    loading,
    error,
    fetchFixtures,
    fetchStandings,
    fetchPredictions,
    generatePrediction,
    setError
  } = useAppStore();

  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLocalLoading(true);
      try {
        await Promise.all([
          fetchFixtures(true, 7),
          fetchStandings(),
          fetchPredictions(true, 7)
        ]);
      } catch {
        setError('Failed to load dashboard data');
      } finally {
        setLocalLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchFixtures, fetchStandings, fetchPredictions, setError]);

  const handleGeneratePrediction = async (fixtureId: number) => {
    try {
      await generatePrediction(fixtureId);
    } catch {
      setError('Failed to generate prediction');
    }
  };

  const upcomingFixtures = fixtures.slice(0, 6);
  const topStandings = standings.slice(0, 10);

  // Find predictions for fixtures
  const getFixturePrediction = (fixtureId: number) => {
    return predictions.find(p => p.fixture_id === fixtureId);
  };

  if (localLoading && !fixtures.length) {
    return <LoadingPage message="Loading Premier League data..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Premier League Predictor
        </h1>
        <p className="text-xl text-gray-600">
          AI-powered match predictions and analysis
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
              <div className="mt-2 text-sm text-red-700">
                {error}
              </div>
              <div className="mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {fixtures.length}
            </div>
            <div className="text-sm text-gray-600">Upcoming Fixtures</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {predictions.length}
            </div>
            <div className="text-sm text-gray-600">Predictions Generated</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {predictions.filter(p => p.confidence >= 75).length}
            </div>
            <div className="text-sm text-gray-600">High Confidence</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {standings.length ? standings[0]?.team.name || 'N/A' : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">League Leader</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upcoming Fixtures */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Upcoming Fixtures</CardTitle>
                <Badge variant="info">Next 7 Days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <LoadingCard key={index} />
                  ))}
                </div>
              ) : upcomingFixtures.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No upcoming fixtures found
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingFixtures.map((fixture) => (
                    <FixtureCard
                      key={fixture.id}
                      fixture={fixture}
                      prediction={getFixturePrediction(fixture.id)}
                      onPredict={handleGeneratePrediction}
                      loading={loading}
                    />
                  ))}
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={() => window.location.href = '/predictions'}>
                      View All Predictions
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Mini League Table */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle size="sm">League Table</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : topStandings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No standings data available
                </div>
              ) : (
                <div className="space-y-3">
                  {topStandings.map((standing) => (
                    <div 
                      key={standing.team.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="w-6 text-center font-medium text-gray-600">
                          {standing.rank}
                        </span>
                        {standing.team.logo && (
                          <img 
                            src={standing.team.logo} 
                            alt={standing.team.name}
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <span className="font-medium text-gray-900 truncate">
                          {standing.team.name}
                        </span>
                      </div>
                      <span className="font-bold text-gray-900">
                        {standing.points}
                      </span>
                    </div>
                  ))}
                  <div className="text-center pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = '/standings'}
                    >
                      Full Table
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => window.location.href = '/predictions'}
              className="h-20 flex flex-col"
            >
              <span className="text-2xl mb-1">🔮</span>
              <span>View Predictions</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/analysis'}
              className="h-20 flex flex-col"
            >
              <span className="text-2xl mb-1">📊</span>
              <span>Match Analysis</span>
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/standings'}
              className="h-20 flex flex-col"
            >
              <span className="text-2xl mb-1">📈</span>
              <span>League Table</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
