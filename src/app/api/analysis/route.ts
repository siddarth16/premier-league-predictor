// API route for detailed match analysis
import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { predictionEngine, generateMatchContext } from '@/lib/prediction-engine';

// GET /api/analysis - Get detailed analysis for a fixture
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fixtureId = searchParams.get('fixture_id');
    const team1Id = searchParams.get('team1_id');
    const team2Id = searchParams.get('team2_id');

    // Analysis for specific fixture
    if (fixtureId) {
      const fixture = await Database.getFixtureById(parseInt(fixtureId));
      if (!fixture) {
        return NextResponse.json({
          success: false,
          error: 'Fixture not found'
        }, { status: 404 });
      }

      // Generate comprehensive match context
      const context = await generateMatchContext(fixture);
      
      // Get existing prediction if available
      const existingPrediction = await Database.getPredictionByFixtureId(parseInt(fixtureId));

      return NextResponse.json({
        success: true,
        data: {
          fixture: context.fixture,
          teams: {
            home: {
              team: context.homeTeam,
              form: context.homeForm,
              statistics: context.homeStats
            },
            away: {
              team: context.awayTeam,
              form: context.awayForm,
              statistics: context.awayStats
            }
          },
          headToHead: {
            matches: context.headToHeadRecord,
            summary: await analyzeHeadToHeadSummary(context.homeTeam.id, context.awayTeam.id, context.headToHeadRecord)
          },
          factors: {
            homeAdvantage: context.homeAdvantage,
            formComparison: {
              home: context.homeForm.formScore,
              away: context.awayForm.formScore,
              difference: context.homeForm.formScore - context.awayForm.formScore
            },
            strengthComparison: {
              attacking: {
                home: context.homeStats.attackingStrength,
                away: context.awayStats.attackingStrength
              },
              defensive: {
                home: context.homeStats.defensiveStrength,
                away: context.awayStats.defensiveStrength
              }
            }
          },
          prediction: existingPrediction,
          confidence: predictionEngine.getConfidenceLevels()
        }
      });
    }

    // Head-to-head analysis for two teams
    if (team1Id && team2Id) {
      const team1 = await Database.getTeamById(parseInt(team1Id));
      const team2 = await Database.getTeamById(parseInt(team2Id));
      
      if (!team1 || !team2) {
        return NextResponse.json({
          success: false,
          error: 'One or both teams not found'
        }, { status: 404 });
      }

      const [team1Form, team2Form, team1Stats, team2Stats, headToHead] = await Promise.all([
        predictionEngine.analyzeTeamForm(team1.id),
        predictionEngine.analyzeTeamForm(team2.id),
        predictionEngine.analyzeTeamStatistics(team1.id),
        predictionEngine.analyzeTeamStatistics(team2.id),
        Database.getHeadToHeadRecords(team1.id, team2.id, 10)
      ]);

      return NextResponse.json({
        success: true,
        data: {
          teams: {
            team1: {
              team: team1,
              form: team1Form,
              statistics: team1Stats
            },
            team2: {
              team: team2,
              form: team2Form,
              statistics: team2Stats
            }
          },
          comparison: {
            form: {
              team1: team1Form.formScore,
              team2: team2Form.formScore,
              advantage: team1Form.formScore > team2Form.formScore ? 'team1' : team2Form.formScore > team1Form.formScore ? 'team2' : 'neutral'
            },
            attack: {
              team1: team1Stats.attackingStrength,
              team2: team2Stats.attackingStrength,
              advantage: team1Stats.attackingStrength > team2Stats.attackingStrength ? 'team1' : 'team2'
            },
            defense: {
              team1: team1Stats.defensiveStrength,
              team2: team2Stats.defensiveStrength,
              advantage: team1Stats.defensiveStrength > team2Stats.defensiveStrength ? 'team1' : 'team2'
            }
          },
          headToHead: {
            matches: headToHead,
            summary: await analyzeHeadToHeadSummary(team1.id, team2.id, headToHead)
          }
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Either fixture_id or both team1_id and team2_id are required'
    }, { status: 400 });

  } catch (error) {
    console.error('Error in analysis API:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to analyze head-to-head summary  
async function analyzeHeadToHeadSummary(team1Id: number, team2Id: number, matches: unknown[]) {
  let team1Wins = 0;
  let team2Wins = 0;
  let draws = 0;
  let team1Goals = 0;
  let team2Goals = 0;

  for (const match of matches) {
    const matchData = match as Record<string, unknown>;
    const teams = matchData.teams as Record<string, Record<string, unknown>>;
    const goals = matchData.goals as Record<string, unknown>;
    const isTeam1Home = teams.home.id === team1Id;
    const t1Goals = isTeam1Home ? (goals.home as number || 0) : (goals.away as number || 0);
    const t2Goals = isTeam1Home ? (goals.away as number || 0) : (goals.home as number || 0);

    team1Goals += t1Goals;
    team2Goals += t2Goals;

    if (t1Goals > t2Goals) {
      team1Wins++;
    } else if (t2Goals > t1Goals) {
      team2Wins++;
    } else {
      draws++;
    }
  }

  return {
    totalMatches: matches.length,
    team1Wins,
    team2Wins,
    draws,
    team1Goals,
    team2Goals,
    averageGoalsPerMatch: matches.length > 0 ? (team1Goals + team2Goals) / matches.length : 0,
    dominant: team1Wins > team2Wins ? 'team1' : team2Wins > team1Wins ? 'team2' : 'balanced'
  };
}