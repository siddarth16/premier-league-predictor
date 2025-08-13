// API route for predictions
import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { predictionEngine } from '@/lib/prediction-engine';
import { Prediction } from '@/types';

// GET /api/predictions - Get existing predictions or generate new ones
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixture_id');
    const upcoming = searchParams.get('upcoming');
    const days = parseInt(searchParams.get('days') || '7');
    const generate = searchParams.get('generate') === 'true';

    // Get specific fixture prediction
    if (fixtureId) {
      const existingPrediction = await Database.getPredictionByFixtureId(parseInt(fixtureId));
      
      if (existingPrediction && !generate) {
        return NextResponse.json({
          success: true,
          data: existingPrediction,
          source: 'cached'
        });
      }

      // Generate new prediction
      const fixture = await Database.getFixtureById(parseInt(fixtureId));
      if (!fixture) {
        return NextResponse.json({
          success: false,
          error: 'Fixture not found'
        }, { status: 404 });
      }

      const predictionResult = await predictionEngine.predictMatch(fixture);
      
      // Save prediction to database
      const prediction: Prediction = {
        id: crypto.randomUUID(),
        fixture_id: fixture.id,
        home_team_id: fixture.teams.home.id,
        away_team_id: fixture.teams.away.id,
        prediction: predictionResult.prediction,
        confidence: predictionResult.confidence,
        algorithm_version: '1.0.0',
        factors: {
          home_form_score: predictionResult.factors.homeFormScore,
          away_form_score: predictionResult.factors.awayFormScore,
          head_to_head_score: predictionResult.factors.headToHeadScore,
          home_advantage: predictionResult.factors.homeAdvantage,
          goal_difference_factor: predictionResult.factors.goalDifferenceFactor
        },
        created_at: new Date()
      };

      await Database.savePrediction(prediction);

      return NextResponse.json({
        success: true,
        data: prediction,
        source: 'generated'
      });
    }

    // Get predictions for upcoming matches
    if (upcoming === 'true') {
      const predictions = await predictionEngine.predictUpcomingMatches(days);
      
      // Save all predictions to database
      const savedPredictions = [];
      for (const { fixture, prediction: predictionResult } of predictions) {
        const prediction: Prediction = {
          id: crypto.randomUUID(),
          fixture_id: fixture.id,
          home_team_id: fixture.teams.home.id,
          away_team_id: fixture.teams.away.id,
          prediction: predictionResult.prediction,
          confidence: predictionResult.confidence,
          algorithm_version: '1.0.0',
          factors: {
            home_form_score: predictionResult.factors.homeFormScore,
            away_form_score: predictionResult.factors.awayFormScore,
            head_to_head_score: predictionResult.factors.headToHeadScore,
            home_advantage: predictionResult.factors.homeAdvantage,
            goal_difference_factor: predictionResult.factors.goalDifferenceFactor
          },
          created_at: new Date()
        };

        await Database.savePrediction(prediction);
        savedPredictions.push({
          fixture,
          prediction
        });
      }

      return NextResponse.json({
        success: true,
        data: savedPredictions,
        count: savedPredictions.length,
        days: days,
        source: 'generated'
      });
    }

    // Get all existing predictions
    const allPredictions = await Database.getPredictions();
    return NextResponse.json({
      success: true,
      data: allPredictions,
      count: allPredictions.length,
      source: 'database'
    });

  } catch (error) {
    console.error('Error in predictions API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/predictions - Generate predictions for specific fixtures
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fixture_ids, regenerate = false } = body;

    if (!fixture_ids || !Array.isArray(fixture_ids)) {
      return NextResponse.json({
        success: false,
        error: 'fixture_ids array is required'
      }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (const fixtureId of fixture_ids) {
      try {
        // Check if prediction already exists
        if (!regenerate) {
          const existing = await Database.getPredictionByFixtureId(fixtureId);
          if (existing) {
            results.push({
              fixture_id: fixtureId,
              prediction: existing,
              status: 'existing'
            });
            continue;
          }
        }

        // Get fixture
        const fixture = await Database.getFixtureById(fixtureId);
        if (!fixture) {
          errors.push({
            fixture_id: fixtureId,
            error: 'Fixture not found'
          });
          continue;
        }

        // Generate prediction
        const predictionResult = await predictionEngine.predictMatch(fixture);
        
        const prediction: Prediction = {
          id: crypto.randomUUID(),
          fixture_id: fixture.id,
          home_team_id: fixture.teams.home.id,
          away_team_id: fixture.teams.away.id,
          prediction: predictionResult.prediction,
          confidence: predictionResult.confidence,
          algorithm_version: '1.0.0',
          factors: {
            home_form_score: predictionResult.factors.homeFormScore,
            away_form_score: predictionResult.factors.awayFormScore,
            head_to_head_score: predictionResult.factors.headToHeadScore,
            home_advantage: predictionResult.factors.homeAdvantage,
            goal_difference_factor: predictionResult.factors.goalDifferenceFactor
          },
          created_at: new Date()
        };

        await Database.savePrediction(prediction);
        
        results.push({
          fixture_id: fixtureId,
          prediction,
          status: regenerate ? 'regenerated' : 'generated'
        });

      } catch (fixtureError) {
        errors.push({
          fixture_id: fixtureId,
          error: fixtureError instanceof Error ? fixtureError.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        predictions: results,
        errors: errors
      },
      stats: {
        processed: fixture_ids.length,
        successful: results.length,
        failed: errors.length
      }
    });

  } catch (error) {
    console.error('Error generating predictions:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate predictions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}