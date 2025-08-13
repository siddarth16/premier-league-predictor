// Premier League Prediction Engine
// Multi-layer approach combining form analysis, statistics, and machine learning

import { Fixture, Team, PredictionResult, PredictionFactors } from '@/types';
import Database from './database';

export interface FormAnalysis {
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  formScore: number; // 0-100 scale
}

export interface StatisticalAnalysis {
  homeAdvantage: number;
  goalDifferential: number;
  cleanSheetRatio: number;
  scoringConsistency: number;
  defensiveStrength: number;
  attackingStrength: number;
}

export interface MatchContext {
  homeTeam: Team;
  awayTeam: Team;
  fixture: Fixture;
  homeForm: FormAnalysis;
  awayForm: FormAnalysis;
  homeStats: StatisticalAnalysis;
  awayStats: StatisticalAnalysis;
  headToHeadRecord: Fixture[];
  homeAdvantage: number;
}

export class PredictionEngine {
  private readonly HOME_ADVANTAGE_FACTOR = 0.15; // 15% boost for home team
  private readonly FORM_WEIGHT = 0.4; // 40% weight for recent form
  private readonly STATS_WEIGHT = 0.35; // 35% weight for statistics
  private readonly ML_WEIGHT = 0.25; // 25% weight for ML model

  // Analyze recent form (last 5-10 matches)
  async analyzeTeamForm(teamId: number, matches: number = 5): Promise<FormAnalysis> {
    try {
      const recentMatches = await Database.getTeamRecentForm(teamId, matches);
      
      let wins = 0;
      let draws = 0;
      let losses = 0;
      let goalsFor = 0;
      let goalsAgainst = 0;

      for (const match of recentMatches) {
        const isHome = match.teams.home.id === teamId;
        const teamGoals = isHome ? (match.goals.home || 0) : (match.goals.away || 0);
        const opponentGoals = isHome ? (match.goals.away || 0) : (match.goals.home || 0);

        goalsFor += teamGoals;
        goalsAgainst += opponentGoals;

        if (teamGoals > opponentGoals) {
          wins++;
        } else if (teamGoals === opponentGoals) {
          draws++;
        } else {
          losses++;
        }
      }

      const points = (wins * 3) + draws;
      const maxPoints = matches * 3;
      const formScore = (points / maxPoints) * 100;

      return {
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        points,
        formScore
      };
    } catch (error) {
      console.error('Error analyzing team form:', error);
      // Return neutral form if analysis fails
      return {
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        formScore: 50
      };
    }
  }

  // Analyze team statistics across multiple seasons for better accuracy
  async analyzeTeamStatistics(teamId: number): Promise<StatisticalAnalysis> {
    try {
      // Use API Football's multi-season analysis or fallback to database
      const { apiFootball } = await import('./api-football');
      
      let multiSeasonData: Array<{ season: number; stats: Record<string, unknown>; weight: number }> = [];
      
      try {
        if (apiFootball.hasApiKey()) {
          multiSeasonData = await apiFootball.getMultiSeasonTeamStatistics(teamId);
        }
      } catch (apiError) {
        console.warn('API Football unavailable, using database fallback');
      }

      // Fallback to database with manual season weighting
      if (multiSeasonData.length === 0) {
        const seasons = apiFootball.getAnalysisSeasons();
        for (const { season, weight } of seasons) {
          try {
            const stats = await Database.getTeamStatistics(teamId, season);
            if (stats) {
              multiSeasonData.push({ season, stats: stats as unknown as Record<string, unknown>, weight });
            }
          } catch (dbError) {
            console.warn(`No database data for team ${teamId} in season ${season}`);
          }
        }
      }

      let weightedStats = {
        homeAdvantage: 0,
        goalDifferential: 0,
        cleanSheetRatio: 0,
        scoringConsistency: 0,
        defensiveStrength: 0,
        attackingStrength: 0
      };

      let totalWeight = 0;

      for (const { stats, weight } of multiSeasonData) {
        if (stats && (stats.played as number) > 0) {
          const totalMatches = stats.played as number;
          const homeWins = stats.home_wins as number || 0;
          const homeDraws = stats.home_draws as number || 0;
          const homeLosses = stats.home_losses as number || 0;
          
          const homeAdvantage = ((homeWins * 3 + homeDraws) / ((homeWins + homeDraws + homeLosses) * 3)) * 100;
          const goalDifferential = stats.goal_difference as number || 0;
          const cleanSheets = stats.clean_sheets as number || 0;
          const failedToScore = stats.failed_to_score as number || 0;
          const goalsFor = stats.goals_for as number || 0;
          const goalsAgainst = stats.goals_against as number || 0;
          
          const cleanSheetRatio = (cleanSheets / totalMatches) * 100;
          const scoringConsistency = ((totalMatches - failedToScore) / totalMatches) * 100;
          
          // Defensive strength: goals conceded per match (inverted)
          const goalsConceededPerMatch = goalsAgainst / totalMatches;
          const defensiveStrength = Math.max(0, 100 - (goalsConceededPerMatch * 25));
          
          // Attacking strength: goals scored per match
          const goalsScoredPerMatch = goalsFor / totalMatches;
          const attackingStrength = Math.min(100, goalsScoredPerMatch * 40);

          // Apply weighted contribution
          weightedStats.homeAdvantage += homeAdvantage * weight;
          weightedStats.goalDifferential += goalDifferential * weight;
          weightedStats.cleanSheetRatio += cleanSheetRatio * weight;
          weightedStats.scoringConsistency += scoringConsistency * weight;
          weightedStats.defensiveStrength += defensiveStrength * weight;
          weightedStats.attackingStrength += attackingStrength * weight;
          
          totalWeight += weight;
        }
      }

      // If we have no data at all, return neutral stats
      if (totalWeight === 0) {
        return {
          homeAdvantage: 50,
          goalDifferential: 0,
          cleanSheetRatio: 0,
          scoringConsistency: 50,
          defensiveStrength: 50,
          attackingStrength: 50
        };
      }

      // Normalize by actual weight received (in case some seasons had no data)
      return {
        homeAdvantage: Math.min(100, Math.max(0, weightedStats.homeAdvantage / totalWeight)),
        goalDifferential: weightedStats.goalDifferential / totalWeight,
        cleanSheetRatio: Math.min(100, Math.max(0, weightedStats.cleanSheetRatio / totalWeight)),
        scoringConsistency: Math.min(100, Math.max(0, weightedStats.scoringConsistency / totalWeight)),
        defensiveStrength: Math.min(100, Math.max(0, weightedStats.defensiveStrength / totalWeight)),
        attackingStrength: Math.min(100, Math.max(0, weightedStats.attackingStrength / totalWeight))
      };
    } catch (error) {
      console.error('Error analyzing team statistics:', error);
      return {
        homeAdvantage: 50,
        goalDifferential: 0,
        cleanSheetRatio: 0,
        scoringConsistency: 50,
        defensiveStrength: 50,
        attackingStrength: 50
      };
    }
  }

  // Analyze head-to-head record
  async analyzeHeadToHead(team1Id: number, team2Id: number): Promise<number> {
    try {
      const h2hMatches = await Database.getHeadToHeadRecords(team1Id, team2Id, 10);
      
      if (h2hMatches.length === 0) {
        return 50; // Neutral if no history
      }

      let team1Score = 0;
      const totalMatches = h2hMatches.length;

      for (const match of h2hMatches) {
        const isTeam1Home = match.teams.home.id === team1Id;
        const team1Goals = isTeam1Home ? (match.goals.home || 0) : (match.goals.away || 0);
        const team2Goals = isTeam1Home ? (match.goals.away || 0) : (match.goals.home || 0);

        if (team1Goals > team2Goals) {
          team1Score += 3; // Win
        } else if (team1Goals === team2Goals) {
          team1Score += 1; // Draw
        }
        // Loss = 0 points
      }

      const maxScore = totalMatches * 3;
      return (team1Score / maxScore) * 100;
    } catch (error) {
      console.error('Error analyzing head-to-head:', error);
      return 50; // Neutral on error
    }
  }

  // Simple machine learning model (logistic regression approach)
  private calculateMLProbability(context: MatchContext): { homeWin: number; draw: number; awayWin: number } {
    // Features for ML model
    const features = {
      homeFormDiff: context.homeForm.formScore - context.awayForm.formScore,
      goalDiff: context.homeStats.goalDifferential - context.awayStats.goalDifferential,
      attackDefBalance: (context.homeStats.attackingStrength - context.awayStats.defensiveStrength),
      cleanSheetDiff: context.homeStats.cleanSheetRatio - context.awayStats.cleanSheetRatio,
      homeAdvantage: context.homeAdvantage
    };

    // Simplified logistic regression weights (these would be trained on historical data)
    const weights = {
      homeFormDiff: 0.02,
      goalDiff: 0.01,
      attackDefBalance: 0.015,
      cleanSheetDiff: 0.008,
      homeAdvantage: 0.5,
      intercept: 0.1
    };

    // Calculate home win probability
    const homeWinLogit = 
      features.homeFormDiff * weights.homeFormDiff +
      features.goalDiff * weights.goalDiff +
      features.attackDefBalance * weights.attackDefBalance +
      features.cleanSheetDiff * weights.cleanSheetDiff +
      features.homeAdvantage * weights.homeAdvantage +
      weights.intercept;

    // Convert to probability using sigmoid function
    const homeWinProb = 1 / (1 + Math.exp(-homeWinLogit));

    // Calculate away win probability (inverse with adjustment)
    const awayWinLogit = -homeWinLogit * 0.8; // Slightly favor draws
    const awayWinProb = 1 / (1 + Math.exp(-awayWinLogit));

    // Draw probability is what's left
    const drawProb = 1 - homeWinProb - awayWinProb;

    // Normalize probabilities
    const total = homeWinProb + drawProb + awayWinProb;
    
    return {
      homeWin: homeWinProb / total,
      draw: Math.max(0.1, drawProb / total), // Ensure minimum draw probability
      awayWin: awayWinProb / total
    };
  }

  // Generate match context for prediction
  async generateMatchContext(fixture: Fixture): Promise<MatchContext> {
    const homeTeam = fixture.teams.home;
    const awayTeam = fixture.teams.away;

    // Analyze both teams in parallel
    const [homeForm, awayForm, homeStats, awayStats, headToHead] = await Promise.all([
      this.analyzeTeamForm(homeTeam.id),
      this.analyzeTeamForm(awayTeam.id),
      this.analyzeTeamStatistics(homeTeam.id),
      this.analyzeTeamStatistics(awayTeam.id),
      Database.getHeadToHeadRecords(homeTeam.id, awayTeam.id, 10)
    ]);

    return {
      homeTeam,
      awayTeam,
      fixture,
      homeForm,
      awayForm,
      homeStats,
      awayStats,
      headToHeadRecord: headToHead,
      homeAdvantage: this.HOME_ADVANTAGE_FACTOR * 100
    };
  }

  // Main prediction function
  async predictMatch(fixture: Fixture): Promise<PredictionResult> {
    try {
      const context = await generateMatchContext(fixture);
      
      // Calculate individual factor scores
      const formDifference = context.homeForm.formScore - context.awayForm.formScore;
      const homeFormScore = Math.max(0, Math.min(100, 50 + formDifference));
      const awayFormScore = Math.max(0, Math.min(100, 50 - formDifference));
      
      const headToHeadScore = await this.analyzeHeadToHead(context.homeTeam.id, context.awayTeam.id);
      const homeAdvantage = this.HOME_ADVANTAGE_FACTOR * 100;
      
      const goalDiffFactor = Math.max(0, Math.min(100, 50 + (context.homeStats.goalDifferential - context.awayStats.goalDifferential) * 2));

      // Weighted scoring approach
      const homeScore = 
        (homeFormScore * this.FORM_WEIGHT) +
        ((context.homeStats.attackingStrength + context.homeStats.defensiveStrength) / 2 * this.STATS_WEIGHT) +
        (headToHeadScore * 0.1) +
        (homeAdvantage * 0.15);

      const awayScore = 
        (awayFormScore * this.FORM_WEIGHT) +
        ((context.awayStats.attackingStrength + context.awayStats.defensiveStrength) / 2 * this.STATS_WEIGHT) +
        ((100 - headToHeadScore) * 0.1);

      // ML model probabilities
      const mlProbs = this.calculateMLProbability(context);
      
      // Combine all approaches
      const scoreDifference = homeScore - awayScore;
      let prediction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
      let confidence: number;

      if (scoreDifference > 10) {
        prediction = 'HOME_WIN';
        confidence = Math.min(95, 60 + (scoreDifference / 2));
      } else if (scoreDifference < -10) {
        prediction = 'AWAY_WIN';
        confidence = Math.min(95, 60 + (Math.abs(scoreDifference) / 2));
      } else {
        // Close match - check ML model for tie-breaker
        const maxProb = Math.max(mlProbs.homeWin, mlProbs.draw, mlProbs.awayWin);
        if (maxProb === mlProbs.homeWin) {
          prediction = 'HOME_WIN';
        } else if (maxProb === mlProbs.awayWin) {
          prediction = 'AWAY_WIN';
        } else {
          prediction = 'DRAW';
        }
        confidence = Math.min(75, 45 + (maxProb * 30));
      }

      // Prepare prediction factors
      const factors: PredictionFactors = {
        homeFormScore,
        awayFormScore,
        headToHeadScore,
        homeAdvantage,
        goalDifferenceFactor: goalDiffFactor
      };

      return {
        prediction,
        confidence: Math.round(confidence),
        factors
      };

    } catch (error) {
      console.error('Error predicting match:', error);
      // Return conservative prediction on error
      return {
        prediction: 'DRAW',
        confidence: 30,
        factors: {
          homeFormScore: 50,
          awayFormScore: 50,
          headToHeadScore: 50,
          homeAdvantage: 0,
          goalDifferenceFactor: 50
        }
      };
    }
  }

  // Predict multiple upcoming fixtures
  async predictUpcomingMatches(days: number = 7): Promise<Array<{ fixture: Fixture; prediction: PredictionResult }>> {
    try {
      const upcomingFixtures = await Database.getUpcomingFixtures(days);
      const predictions: Array<{ fixture: Fixture; prediction: PredictionResult }> = [];

      // Process fixtures in batches to avoid overwhelming the system
      const batchSize = 5;
      for (let i = 0; i < upcomingFixtures.length; i += batchSize) {
        const batch = upcomingFixtures.slice(i, i + batchSize);
        
        const batchPredictions = await Promise.all(
          batch.map(async (fixture) => ({
            fixture,
            prediction: await this.predictMatch(fixture)
          }))
        );

        predictions.push(...batchPredictions);
        
        // Small delay between batches
        if (i + batchSize < upcomingFixtures.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting upcoming matches:', error);
      return [];
    }
  }

  // Get prediction confidence levels
  getConfidenceLevels() {
    return {
      high: 75, // 75%+ confidence
      medium: 50, // 50-74% confidence  
      low: 30 // 30-49% confidence
    };
  }

  // Validate prediction quality (for testing)
  validatePrediction(prediction: PredictionResult): boolean {
    return (
      prediction.confidence >= 0 && 
      prediction.confidence <= 100 &&
      ['HOME_WIN', 'DRAW', 'AWAY_WIN'].includes(prediction.prediction) &&
      prediction.factors.homeFormScore >= 0 &&
      prediction.factors.awayFormScore >= 0
    );
  }
}

// Export singleton instance
export const predictionEngine = new PredictionEngine();

// Helper function for external use
export async function generateMatchContext(fixture: Fixture): Promise<MatchContext> {
  return predictionEngine.generateMatchContext(fixture);
}