'use client';

import React, { useEffect, useState } from 'react';
import { FixtureCard } from '@/components/FixtureCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingPage, LoadingCard } from '@/components/ui/Loading';
import { useAppStore } from '@/lib/store';

export default function PredictionsPage() {
  const {
    fixtures,
    predictions,
    loading,
    error,
    fetchFixtures,
    fetchPredictions,
    generatePrediction,
    setError,
    confidenceFilter,
    setConfidenceFilter,
    filterDays,
    setFilterDays
  } = useAppStore();

  const [localLoading, setLocalLoading] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLocalLoading(true);
      try {
        await Promise.all([
          fetchFixtures(true, filterDays),
          fetchPredictions(true, filterDays)
        ]);
      } catch {
        setError('Failed to load predictions data');
      } finally {
        setLocalLoading(false);
      }
    };

    loadData();
  }, [fetchFixtures, fetchPredictions, setError, filterDays]);

  const handleGeneratePrediction = async (fixtureId: number) => {
    try {
      await generatePrediction(fixtureId);
    } catch {
      setError('Failed to generate prediction');
    }
  };

  const handleGenerateAllPredictions = async () => {
    setGeneratingAll(true);
    const fixturesWithoutPredictions = fixtures.filter(
      fixture => !predictions.find(p => p.fixture_id === fixture.id)
    );

    try {
      for (const fixture of fixturesWithoutPredictions.slice(0, 10)) { // Limit to 10
        await handleGeneratePrediction(fixture.id);
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch {
      setError('Failed to generate all predictions');
    } finally {
      setGeneratingAll(false);
    }
  };

  // Filter predictions based on confidence level
  const filteredPredictions = predictions.filter(prediction => {
    if (confidenceFilter === 'all') return true;
    if (confidenceFilter === 'high') return prediction.confidence >= 75;
    if (confidenceFilter === 'medium') return prediction.confidence >= 50 && prediction.confidence < 75;
    if (confidenceFilter === 'low') return prediction.confidence < 50;
    return true;
  });

  // Get fixtures with their predictions
  const fixturesWithPredictions = fixtures.map(fixture => ({
    fixture,
    prediction: predictions.find(p => p.fixture_id === fixture.id)
  }));

  // Statistics
  const totalPredictions = predictions.length;
  const highConfidence = predictions.filter(p => p.confidence >= 75).length;
  const mediumConfidence = predictions.filter(p => p.confidence >= 50 && p.confidence < 75).length;
  const lowConfidence = predictions.filter(p => p.confidence < 50).length;
  const averageConfidence = totalPredictions > 0 
    ? Math.round(predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions)
    : 0;

  const predictionBreakdown = {
    homeWins: predictions.filter(p => p.prediction === 'HOME_WIN').length,
    draws: predictions.filter(p => p.prediction === 'DRAW').length,
    awayWins: predictions.filter(p => p.prediction === 'AWAY_WIN').length
  };

  if (localLoading && !fixtures.length) {
    return <LoadingPage message="Loading predictions..." />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Match Predictions
        </h1>
        <p className="text-lg text-gray-600">
          AI-powered Premier League match outcome predictions
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

      {/* Stats and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle size="sm">Prediction Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{totalPredictions}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{highConfidence}</div>
                  <div className="text-sm text-gray-600">High Confidence</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{mediumConfidence}</div>
                  <div className="text-sm text-gray-600">Medium</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{lowConfidence}</div>
                  <div className="text-sm text-gray-600">Low</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">{averageConfidence}%</div>
                  <div className="text-sm text-gray-600">Avg Confidence</div>
                </div>
              </div>
              
              {/* Prediction breakdown */}
              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{predictionBreakdown.homeWins}</div>
                    <div className="text-sm text-gray-600">Home Wins</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{predictionBreakdown.draws}</div>
                    <div className="text-sm text-gray-600">Draws</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{predictionBreakdown.awayWins}</div>
                    <div className="text-sm text-gray-600">Away Wins</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle size="sm">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Days filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Range
                </label>
                <select
                  value={filterDays}
                  onChange={(e) => setFilterDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={7}>Next 7 days</option>
                  <option value={14}>Next 14 days</option>
                  <option value={30}>Next 30 days</option>
                </select>
              </div>

              {/* Confidence filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confidence Level
                </label>
                <select
                  value={confidenceFilter}
                  onChange={(e) => setConfidenceFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Predictions</option>
                  <option value="high">High (75%+)</option>
                  <option value="medium">Medium (50-74%)</option>
                  <option value="low">Low (30-49%)</option>
                </select>
              </div>

              {/* Generate all button */}
              <Button
                onClick={handleGenerateAllPredictions}
                loading={generatingAll}
                disabled={generatingAll || loading}
                className="w-full"
                size="sm"
              >
                Generate All
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Predictions List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Upcoming Fixtures & Predictions</CardTitle>
            <Badge variant="info">
              {confidenceFilter === 'all' ? 'All' : 
               confidenceFilter === 'high' ? 'High Confidence' :
               confidenceFilter === 'medium' ? 'Medium Confidence' : 'Low Confidence'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <LoadingCard key={index} />
              ))}
            </div>
          ) : fixturesWithPredictions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔮</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No fixtures found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or check back later for new matches.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {fixturesWithPredictions
                .filter(({ prediction }) => {
                  if (!prediction) return confidenceFilter === 'all';
                  return filteredPredictions.includes(prediction);
                })
                .map(({ fixture, prediction }) => (
                  <FixtureCard
                    key={fixture.id}
                    fixture={fixture}
                    prediction={prediction}
                    onPredict={handleGeneratePrediction}
                    onViewAnalysis={(f) => window.location.href = `/analysis?fixture=${f.id}`}
                    loading={loading}
                  />
                ))
              }
            </div>
          )}
          
          {/* Empty state for filtered results */}
          {fixturesWithPredictions.length > 0 && 
           fixturesWithPredictions.filter(({ prediction }) => {
             if (!prediction) return confidenceFilter === 'all';
             return filteredPredictions.includes(prediction);
           }).length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No predictions match your filters
              </h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your confidence level or time range filters.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setConfidenceFilter('all');
                  setFilterDays(7);
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Algorithm Info */}
      <Card>
        <CardHeader>
          <CardTitle size="sm">How Predictions Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-medium text-gray-900 mb-1">Form Analysis</h4>
              <p className="text-gray-600">
                Analyzes recent match results, goals scored/conceded, and current team form over the last 5-10 games.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">⚽</div>
              <h4 className="font-medium text-gray-900 mb-1">Statistical Model</h4>
              <p className="text-gray-600">
                Considers attacking strength, defensive records, home advantage, and head-to-head history.
              </p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🤖</div>
              <h4 className="font-medium text-gray-900 mb-1">Machine Learning</h4>
              <p className="text-gray-600">
                Uses logistic regression with multiple features to generate probability-based predictions.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}