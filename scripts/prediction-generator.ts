// Prediction generation and testing scripts
import { predictionEngine } from '../src/lib/prediction-engine';
import Database from '../src/lib/database';
import { dataCollector } from './data-collection';

export class PredictionGenerator {
  
  // Generate predictions for all upcoming fixtures
  async generateUpcomingPredictions(days: number = 7): Promise<void> {
    try {
      console.log(`🔮 Generating predictions for next ${days} days...`);
      
      // First ensure we have recent data
      console.log('📥 Checking for recent data...');
      const fixtures = await Database.getUpcomingFixtures(days);
      
      if (fixtures.length === 0) {
        console.log('⚠️ No upcoming fixtures found. Syncing data...');
        await dataCollector.collectUpcomingFixtures(days);
      }
      
      // Generate predictions
      const predictions = await predictionEngine.predictUpcomingMatches(days);
      
      console.log(`🎯 Generated ${predictions.length} predictions:`);
      
      // Display predictions summary
      let highConfidence = 0;
      let mediumConfidence = 0;
      let lowConfidence = 0;
      
      for (const { fixture, prediction } of predictions) {
        const homeTeam = fixture.teams.home.name;
        const awayTeam = fixture.teams.away.name;
        const pred = prediction.prediction;
        const conf = prediction.confidence;
        
        if (conf >= 75) highConfidence++;
        else if (conf >= 50) mediumConfidence++;
        else lowConfidence++;
        
        console.log(`📊 ${homeTeam} vs ${awayTeam}: ${pred} (${conf}%)`);
      }
      
      console.log(`\n📈 Confidence Summary:`);
      console.log(`   High (75%+): ${highConfidence} predictions`);
      console.log(`   Medium (50-74%): ${mediumConfidence} predictions`);
      console.log(`   Low (30-49%): ${lowConfidence} predictions`);
      
    } catch (error) {
      console.error('❌ Error generating predictions:', error);
      throw error;
    }
  }

  // Generate prediction for specific fixture
  async generateFixturePrediction(fixtureId: number): Promise<void> {
    try {
      console.log(`🔮 Generating prediction for fixture ${fixtureId}...`);
      
      const fixture = await Database.getFixtureById(fixtureId);
      if (!fixture) {
        console.error(`❌ Fixture ${fixtureId} not found`);
        return;
      }
      
      const predictionResult = await predictionEngine.predictMatch(fixture);
      
      console.log(`\n🏈 Match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
      console.log(`📅 Date: ${fixture.date}`);
      console.log(`🎯 Prediction: ${predictionResult.prediction}`);
      console.log(`📊 Confidence: ${predictionResult.confidence}%`);
      console.log(`\n📈 Analysis Factors:`);
      console.log(`   Home Form: ${predictionResult.factors.homeFormScore.toFixed(1)}`);
      console.log(`   Away Form: ${predictionResult.factors.awayFormScore.toFixed(1)}`);
      console.log(`   Head-to-Head: ${predictionResult.factors.headToHeadScore.toFixed(1)}`);
      console.log(`   Home Advantage: ${predictionResult.factors.homeAdvantage.toFixed(1)}`);
      console.log(`   Goal Difference Factor: ${predictionResult.factors.goalDifferenceFactor.toFixed(1)}`);
      
    } catch (error) {
      console.error('❌ Error generating fixture prediction:', error);
      throw error;
    }
  }

  // Test prediction accuracy (for completed matches)
  async testPredictionAccuracy(matches: number = 10): Promise<void> {
    try {
      console.log(`🧪 Testing prediction accuracy on last ${matches} completed matches...`);
      
      const allFixtures = await Database.getFixtures();
      const completedFixtures = allFixtures
        .filter(f => f.status.short === 'FT' && f.goals.home !== null && f.goals.away !== null)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, matches);
      
      if (completedFixtures.length === 0) {
        console.log('⚠️ No completed fixtures found for testing');
        return;
      }
      
      let correct = 0;
      let total = 0;
      const results = [];
      
      for (const fixture of completedFixtures) {
        try {
          const prediction = await predictionEngine.predictMatch(fixture);
          
          // Determine actual result
          const homeGoals = fixture.goals.home || 0;
          const awayGoals = fixture.goals.away || 0;
          let actualResult: string;
          
          if (homeGoals > awayGoals) {
            actualResult = 'HOME_WIN';
          } else if (awayGoals > homeGoals) {
            actualResult = 'AWAY_WIN';
          } else {
            actualResult = 'DRAW';
          }
          
          const isCorrect = prediction.prediction === actualResult;
          if (isCorrect) correct++;
          total++;
          
          results.push({
            fixture: `${fixture.teams.home.name} ${homeGoals}-${awayGoals} ${fixture.teams.away.name}`,
            predicted: prediction.prediction,
            actual: actualResult,
            confidence: prediction.confidence,
            correct: isCorrect
          });
          
        } catch (predError) {
          console.warn(`⚠️ Could not predict match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        }
      }
      
      const accuracy = total > 0 ? (correct / total) * 100 : 0;
      
      console.log(`\n📊 Prediction Accuracy Test Results:`);
      console.log(`   Matches Tested: ${total}`);
      console.log(`   Correct Predictions: ${correct}`);
      console.log(`   Accuracy: ${accuracy.toFixed(1)}%`);
      
      console.log(`\n📋 Detailed Results:`);
      for (const result of results) {
        const status = result.correct ? '✅' : '❌';
        console.log(`   ${status} ${result.fixture} | Predicted: ${result.predicted} | Actual: ${result.actual} | Confidence: ${result.confidence}%`);
      }
      
    } catch (error) {
      console.error('❌ Error testing prediction accuracy:', error);
      throw error;
    }
  }

  // Analyze team strengths and weaknesses
  async analyzeTeam(teamId: number): Promise<void> {
    try {
      const team = await Database.getTeamById(teamId);
      if (!team) {
        console.error(`❌ Team ${teamId} not found`);
        return;
      }
      
      console.log(`🔍 Analyzing ${team.name}...`);
      
      const [form, stats] = await Promise.all([
        predictionEngine.analyzeTeamForm(teamId),
        predictionEngine.analyzeTeamStatistics(teamId)
      ]);
      
      console.log(`\n📈 Recent Form (Last 5 matches):`);
      console.log(`   Wins: ${form.wins}`);
      console.log(`   Draws: ${form.draws}`);
      console.log(`   Losses: ${form.losses}`);
      console.log(`   Goals For: ${form.goalsFor}`);
      console.log(`   Goals Against: ${form.goalsAgainst}`);
      console.log(`   Form Score: ${form.formScore.toFixed(1)}/100`);
      
      console.log(`\n📊 Season Statistics:`);
      console.log(`   Home Advantage: ${stats.homeAdvantage.toFixed(1)}%`);
      console.log(`   Goal Differential: ${stats.goalDifferential}`);
      console.log(`   Clean Sheet Ratio: ${stats.cleanSheetRatio.toFixed(1)}%`);
      console.log(`   Scoring Consistency: ${stats.scoringConsistency.toFixed(1)}%`);
      console.log(`   Defensive Strength: ${stats.defensiveStrength.toFixed(1)}/100`);
      console.log(`   Attacking Strength: ${stats.attackingStrength.toFixed(1)}/100`);
      
      // Provide insights
      console.log(`\n💡 Insights:`);
      
      if (form.formScore >= 75) {
        console.log(`   🔥 Excellent recent form`);
      } else if (form.formScore >= 50) {
        console.log(`   📈 Good recent form`);
      } else {
        console.log(`   📉 Poor recent form`);
      }
      
      if (stats.attackingStrength >= 70) {
        console.log(`   ⚡ Strong attacking team`);
      }
      
      if (stats.defensiveStrength >= 70) {
        console.log(`   🛡️ Solid defensive team`);
      }
      
      if (stats.homeAdvantage >= 70) {
        console.log(`   🏠 Strong home advantage`);
      }
      
    } catch (error) {
      console.error('❌ Error analyzing team:', error);
      throw error;
    }
  }

  // Get prediction statistics
  async getPredictionStats(): Promise<void> {
    try {
      console.log('📊 Prediction Engine Statistics...');
      
      const predictions = await Database.getPredictions();
      
      if (predictions.length === 0) {
        console.log('⚠️ No predictions found');
        return;
      }
      
      let homeWins = 0;
      let draws = 0;
      let awayWins = 0;
      let totalConfidence = 0;
      
      for (const pred of predictions) {
        totalConfidence += pred.confidence;
        
        switch (pred.prediction) {
          case 'HOME_WIN':
            homeWins++;
            break;
          case 'DRAW':
            draws++;
            break;
          case 'AWAY_WIN':
            awayWins++;
            break;
        }
      }
      
      const avgConfidence = totalConfidence / predictions.length;
      
      console.log(`\n📈 Prediction Statistics:`);
      console.log(`   Total Predictions: ${predictions.length}`);
      console.log(`   Home Wins: ${homeWins} (${((homeWins/predictions.length)*100).toFixed(1)}%)`);
      console.log(`   Draws: ${draws} (${((draws/predictions.length)*100).toFixed(1)}%)`);
      console.log(`   Away Wins: ${awayWins} (${((awayWins/predictions.length)*100).toFixed(1)}%)`);
      console.log(`   Average Confidence: ${avgConfidence.toFixed(1)}%`);
      
    } catch (error) {
      console.error('❌ Error getting prediction stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const predictionGenerator = new PredictionGenerator();

// CLI interface for running prediction scripts
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function runCommand() {
    try {
      switch (command) {
        case 'upcoming':
          const days = parseInt(args[1]) || 7;
          await predictionGenerator.generateUpcomingPredictions(days);
          break;
        case 'fixture':
          const fixtureId = parseInt(args[1]);
          if (!fixtureId) {
            console.error('❌ Please provide a fixture ID');
            process.exit(1);
          }
          await predictionGenerator.generateFixturePrediction(fixtureId);
          break;
        case 'test':
          const matches = parseInt(args[1]) || 10;
          await predictionGenerator.testPredictionAccuracy(matches);
          break;
        case 'analyze':
          const teamId = parseInt(args[1]);
          if (!teamId) {
            console.error('❌ Please provide a team ID');
            process.exit(1);
          }
          await predictionGenerator.analyzeTeam(teamId);
          break;
        case 'stats':
          await predictionGenerator.getPredictionStats();
          break;
        default:
          console.log(`
🔮 Premier League Prediction Generator

Available commands:
  upcoming [days]    - Generate predictions for upcoming matches (default: 7 days)
  fixture <id>       - Generate prediction for specific fixture
  test [matches]     - Test accuracy on completed matches (default: 10)
  analyze <team_id>  - Analyze team strengths and weaknesses
  stats              - Show prediction statistics

Examples:
  npm run predict upcoming 14
  npm run predict fixture 12345
  npm run predict test 20
  npm run predict analyze 33
  npm run predict stats
          `);
      }
    } catch (error) {
      console.error('❌ Command failed:', error);
      process.exit(1);
    }
  }

  runCommand();
}