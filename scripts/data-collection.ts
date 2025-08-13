// Data collection scripts for Premier League Predictor
// These scripts will collect and update data from API Football

import { apiFootball } from '../src/lib/api-football';
import Database from '../src/lib/database';
import { Team, Fixture, Standing, TeamStatistics } from '../src/types';

export class DataCollector {
  
  // Collect and store all Premier League teams
  async collectTeams(season: number = 2024): Promise<void> {
    try {
      console.log(`🔄 Collecting Premier League teams for season ${season}...`);
      
      const teams = await apiFootball.getTeams(season);
      console.log(`📥 Retrieved ${teams.length} teams`);
      
      await Database.saveTeams(teams);
      console.log(`✅ Saved ${teams.length} teams to database`);
      
    } catch (error) {
      console.error('❌ Error collecting teams:', error);
      throw error;
    }
  }

  // Collect upcoming fixtures
  async collectUpcomingFixtures(days: number = 7): Promise<void> {
    try {
      console.log(`🔄 Collecting upcoming fixtures for next ${days} days...`);
      
      const fixtures = await apiFootball.getUpcomingFixtures(days);
      console.log(`📥 Retrieved ${fixtures.length} upcoming fixtures`);
      
      await Database.saveFixtures(fixtures);
      console.log(`✅ Saved ${fixtures.length} fixtures to database`);
      
    } catch (error) {
      console.error('❌ Error collecting upcoming fixtures:', error);
      throw error;
    }
  }

  // Collect league standings
  async collectStandings(season: number = 2024): Promise<void> {
    try {
      console.log(`🔄 Collecting league standings for season ${season}...`);
      
      const standings = await apiFootball.getStandings(season);
      console.log(`📥 Retrieved standings for ${standings.length} teams`);
      
      await Database.saveStandings(standings);
      console.log(`✅ Saved standings to database`);
      
    } catch (error) {
      console.error('❌ Error collecting standings:', error);
      throw error;
    }
  }

  // Collect team statistics
  async collectTeamStatistics(season: number = 2024): Promise<void> {
    try {
      console.log(`🔄 Collecting team statistics for season ${season}...`);
      
      const teams = await Database.getTeams();
      
      for (const team of teams) {
        try {
          console.log(`📊 Getting statistics for ${team.name}...`);
          
          const rawStats = await apiFootball.getTeamStatistics(team.id, season);
          
          // Transform API response to our TeamStatistics format
          const stats = rawStats as Record<string, unknown>;
          const fixtures = stats.fixtures as Record<string, unknown> || {};
          const goals = stats.goals as Record<string, unknown> || {};
          
          const teamStats: TeamStatistics = {
            team_id: team.id,
            season: season,
            played: (fixtures.played as Record<string, unknown>)?.total as number || 0,
            wins: (fixtures.wins as Record<string, unknown>)?.total as number || 0,
            draws: (fixtures.draws as Record<string, unknown>)?.total as number || 0,
            losses: (fixtures.loses as Record<string, unknown>)?.total as number || 0,
            goals_for: ((goals.for as Record<string, unknown>)?.total as Record<string, unknown>)?.total as number || 0,
            goals_against: ((goals.against as Record<string, unknown>)?.total as Record<string, unknown>)?.total as number || 0,
            goal_difference: (((goals.for as Record<string, unknown>)?.total as Record<string, unknown>)?.total as number || 0) - (((goals.against as Record<string, unknown>)?.total as Record<string, unknown>)?.total as number || 0),
            points: ((fixtures.wins as Record<string, unknown>)?.total as number || 0) * 3 + ((fixtures.draws as Record<string, unknown>)?.total as number || 0),
            home_wins: (fixtures.wins as Record<string, unknown>)?.home as number || 0,
            home_draws: (fixtures.draws as Record<string, unknown>)?.home as number || 0,
            home_losses: (fixtures.loses as Record<string, unknown>)?.home as number || 0,
            away_wins: (fixtures.wins as Record<string, unknown>)?.away as number || 0,
            away_draws: (fixtures.draws as Record<string, unknown>)?.away as number || 0,
            away_losses: (fixtures.loses as Record<string, unknown>)?.away as number || 0,
            form: stats.form as string || '',
            clean_sheets: (stats.clean_sheet as Record<string, unknown>)?.total as number || 0,
            failed_to_score: (stats.failed_to_score as Record<string, unknown>)?.total as number || 0,
            created_at: new Date(),
            updated_at: new Date()
          };
          
          await Database.saveTeamStatistics(teamStats);
          console.log(`✅ Saved statistics for ${team.name}`);
          
          // Small delay to avoid hitting rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (teamError) {
          console.error(`❌ Error collecting stats for ${team.name}:`, teamError);
          // Continue with next team even if one fails
        }
      }
      
      console.log(`✅ Completed team statistics collection`);
      
    } catch (error) {
      console.error('❌ Error collecting team statistics:', error);
      throw error;
    }
  }

  // Daily data sync - optimized for API limits
  async dailySync(): Promise<void> {
    try {
      console.log('🌅 Starting daily data sync...');
      console.log(`📊 API Requests remaining: ${apiFootball.getRemainingRequests()}`);
      
      // Priority 1: Upcoming fixtures (most important for predictions)
      await this.collectUpcomingFixtures(7);
      
      // Priority 2: League standings (updates daily)
      await this.collectStandings();
      
      // Priority 3: Teams (only if we don't have them)
      const teams = await Database.getTeams();
      if (teams.length === 0) {
        await this.collectTeams();
      }
      
      // Priority 4: Team statistics (if we have enough API calls left)
      const remainingRequests = apiFootball.getRemainingRequests();
      if (remainingRequests > 25) { // Reserve some requests for other operations
        console.log(`📊 ${remainingRequests} requests remaining, collecting team statistics...`);
        await this.collectTeamStatistics();
      } else {
        console.log(`⚠️ Only ${remainingRequests} requests remaining, skipping team statistics`);
      }
      
      console.log('✅ Daily sync completed successfully');
      console.log(`📊 API Requests used today: ${apiFootball.getRequestCount()}`);
      
    } catch (error) {
      console.error('❌ Daily sync failed:', error);
      throw error;
    }
  }

  // Initialize database with essential data
  async initializeDatabase(): Promise<void> {
    try {
      console.log('🔧 Initializing database with essential data...');
      
      // Check if we already have teams
      const existingTeams = await Database.getTeams();
      
      if (existingTeams.length === 0) {
        console.log('📥 No teams found, collecting Premier League teams...');
        await this.collectTeams();
      } else {
        console.log(`✅ Found ${existingTeams.length} teams in database`);
      }
      
      // Get some initial fixtures
      await this.collectUpcomingFixtures(14); // Next 2 weeks
      
      // Get current standings
      await this.collectStandings();
      
      console.log('✅ Database initialization completed');
      
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  // Get API usage statistics
  getApiUsage(): { used: number; remaining: number; total: number } {
    const used = apiFootball.getRequestCount();
    const remaining = apiFootball.getRemainingRequests();
    return {
      used,
      remaining,
      total: 100
    };
  }

  // Health check for all systems
  async healthCheck(): Promise<{ api: boolean; database: boolean; overall: boolean }> {
    const apiHealth = await apiFootball.healthCheck();
    const dbHealth = await Database.healthCheck();
    
    return {
      api: apiHealth,
      database: dbHealth,
      overall: apiHealth && dbHealth
    };
  }
}

// Export singleton instance
export const dataCollector = new DataCollector();

// CLI interface for running scripts manually
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  async function runCommand() {
    try {
      switch (command) {
        case 'init':
          await dataCollector.initializeDatabase();
          break;
        case 'daily':
          await dataCollector.dailySync();
          break;
        case 'teams':
          await dataCollector.collectTeams();
          break;
        case 'fixtures':
          const days = parseInt(args[1]) || 7;
          await dataCollector.collectUpcomingFixtures(days);
          break;
        case 'standings':
          await dataCollector.collectStandings();
          break;
        case 'stats':
          await dataCollector.collectTeamStatistics();
          break;
        case 'health':
          const health = await dataCollector.healthCheck();
          console.log('🏥 Health Check Results:', health);
          break;
        case 'usage':
          const usage = dataCollector.getApiUsage();
          console.log('📊 API Usage:', usage);
          break;
        default:
          console.log(`
🚀 Premier League Predictor Data Collection

Available commands:
  init      - Initialize database with essential data
  daily     - Run daily data sync (recommended)
  teams     - Collect Premier League teams
  fixtures  - Collect upcoming fixtures (optional: days)
  standings - Collect league standings
  stats     - Collect team statistics
  health    - Check system health
  usage     - Show API usage statistics

Examples:
  npm run data-collect init
  npm run data-collect daily
  npm run data-collect fixtures 14
          `);
      }
    } catch (error) {
      console.error('❌ Command failed:', error);
      process.exit(1);
    }
  }

  runCommand();
}