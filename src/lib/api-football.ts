// API Football integration
import axios, { AxiosResponse } from 'axios';
import { Team, Fixture, Standing, ApiFootballResponse } from '@/types';

const API_BASE_URL = 'https://v3.football.api-sports.io';
const PREMIER_LEAGUE_ID = 39; // Premier League ID in API Football
// Dynamic season calculation based on current date
function getCurrentSeason(): number {
  // API Football Free Plan Limitation:
  // Free tier only has access to seasons 2021, 2022, and 2023
  // Always use 2023 as it's the latest available season on free plan
  console.log('🏟️ Using 2023 season data (free plan limitation: only 2021-2023 available)');
  return 2023;
}

const CURRENT_SEASON = getCurrentSeason();

// Get seasons for multi-season analysis with weights
function getAnalysisSeasons(): Array<{ season: number; weight: number }> {
  const currentSeason = getCurrentSeason();
  return [
    { season: currentSeason, weight: 0.5 },      // Current season: 50%
    { season: currentSeason - 1, weight: 0.3 },  // Previous season: 30%
    { season: currentSeason - 2, weight: 0.2 }   // Historical season: 20%
  ];
}

// API rate limiting tracker
class RateLimiter {
  private requestCount = 0;
  private lastReset = new Date();

  canMakeRequest(): boolean {
    const now = new Date();
    // Reset count if it's a new day
    if (now.getDate() !== this.lastReset.getDate()) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    return this.requestCount < 100; // Free tier limit
  }

  incrementRequest(): void {
    this.requestCount++;
  }

  getRemainingRequests(): number {
    return Math.max(0, 100 - this.requestCount);
  }

  getRequestCount(): number {
    return this.requestCount;
  }
}

const rateLimiter = new RateLimiter();

// API Football client
export class ApiFootball {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.API_FOOTBALL_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  API_FOOTBALL_KEY not found in environment variables');
      console.warn('📝 Create a .env.local file with your API key from api-football.com');
      console.warn('🔄 App will use mock data for demonstration purposes');
    } else {
      console.log('✅ API_FOOTBALL_KEY found, will attempt to fetch real data');
      console.log(`🏟️ Current season: ${CURRENT_SEASON}`);
    }
  }

  // Check if API key is available
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('API_FOOTBALL_KEY not configured. Please add your API key to .env.local file.');
    }

    if (!rateLimiter.canMakeRequest()) {
      throw new Error(`Daily API limit reached. Remaining requests: ${rateLimiter.getRemainingRequests()}`);
    }

    try {
      const response: AxiosResponse<ApiFootballResponse<T>> = await axios.get(
        `${API_BASE_URL}${endpoint}`,
        {
          headers: {
            'X-RapidAPI-Key': this.apiKey,
            'X-RapidAPI-Host': 'v3.football.api-sports.io'
          },
          params
        }
      );

      rateLimiter.incrementRequest();

      if (response.data.errors.length > 0) {
        throw new Error(`API Error: ${response.data.errors.join(', ')}`);
      }

      return response.data.response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('API Football request failed:', {
          endpoint,
          params,
          status: error.response?.status,
          message: error.message
        });
        throw new Error(`API request failed: ${error.response?.status} ${error.message}`);
      }
      throw error;
    }
  }

  // Get Premier League teams
  async getTeams(season: number = CURRENT_SEASON): Promise<Team[]> {
    const teams = await this.makeRequest<Team[]>('/teams', {
      league: PREMIER_LEAGUE_ID,
      season
    });
    return teams;
  }

  // Get Premier League fixtures
  async getFixtures(season: number = CURRENT_SEASON, next: number = 10): Promise<Fixture[]> {
    const fixtures = await this.makeRequest<Fixture[]>('/fixtures', {
      league: PREMIER_LEAGUE_ID,
      season,
      next
    });
    return fixtures;
  }

  // Get recent fixtures from 2023 season (simulating "upcoming" for demo)
  // Since free plan only has historical data, we'll get recent completed fixtures
  async getUpcomingFixtures(days: number = 7): Promise<Fixture[]> {
    console.log('📅 Free plan limitation: Getting recent 2023 fixtures instead of upcoming');
    
    // Get fixtures from a specific timeframe in 2023 season
    const fixtures = await this.makeRequest<Fixture[]>('/fixtures', {
      league: PREMIER_LEAGUE_ID,
      season: 2023,
      last: days // Get last N fixtures instead of next N
    });
    return fixtures;
  }

  // Get team statistics
  async getTeamStatistics(teamId: number, season: number = CURRENT_SEASON): Promise<Record<string, unknown>> {
    const stats = await this.makeRequest<Record<string, unknown>>('/teams/statistics', {
      league: PREMIER_LEAGUE_ID,
      season,
      team: teamId
    });
    return stats;
  }

  // Get league standings
  async getStandings(season: number = CURRENT_SEASON): Promise<Standing[]> {
    const standings = await this.makeRequest<Record<string, unknown>[]>('/standings', {
      league: PREMIER_LEAGUE_ID,
      season
    });
    
    // Extract standings from the nested response structure
    if (standings.length === 0) return [];
    
    const standingsData = standings[0] as Record<string, unknown>;
    const league = standingsData?.league as Record<string, unknown>;
    const standingsArray = league?.standings as unknown[][];
    
    return (standingsArray?.[0] as unknown as Standing[]) || [];
  }

  // Get head-to-head records
  async getHeadToHead(team1: number, team2: number): Promise<Fixture[]> {
    const h2h = await this.makeRequest<Fixture[]>('/fixtures/headtohead', {
      h2h: `${team1}-${team2}`,
      last: 10
    });
    return h2h;
  }

  // Get team recent fixtures
  async getTeamRecentFixtures(teamId: number, last: number = 5): Promise<Fixture[]> {
    const fixtures = await this.makeRequest<Fixture[]>('/fixtures', {
      team: teamId,
      last,
      league: PREMIER_LEAGUE_ID
    });
    return fixtures;
  }

  // Get specific fixture details
  async getFixture(fixtureId: number): Promise<Fixture | null> {
    const fixtures = await this.makeRequest<Fixture[]>('/fixtures', {
      id: fixtureId
    });
    return fixtures[0] || null;
  }

  // Get league information
  async getLeagueInfo(season: number = CURRENT_SEASON): Promise<Record<string, unknown> | null> {
    const leagues = await this.makeRequest<Record<string, unknown>[]>('/leagues', {
      id: PREMIER_LEAGUE_ID,
      season
    });
    return leagues[0] || null;
  }

  // Utility methods
  getRemainingRequests(): number {
    return rateLimiter.getRemainingRequests();
  }

  getRequestCount(): number {
    return rateLimiter.getRequestCount();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<Record<string, unknown>>('/status');
      return true;
    } catch (error) {
      console.error('API Football health check failed:', error);
      return false;
    }
  }

  // Get multi-season team statistics for better analysis
  async getMultiSeasonTeamStatistics(teamId: number): Promise<Array<{ season: number; stats: Record<string, unknown>; weight: number }>> {
    const seasons = getAnalysisSeasons();
    const results = [];

    for (const { season, weight } of seasons) {
      try {
        const stats = await this.getTeamStatistics(teamId, season);
        if (stats) {
          results.push({ season, stats, weight });
        }
      } catch {
        console.warn(`No statistics available for team ${teamId} in season ${season}`);
      }
    }

    return results;
  }

  // Get current season number
  getCurrentSeason(): number {
    return CURRENT_SEASON;
  }

  // Get analysis seasons with weights
  getAnalysisSeasons(): Array<{ season: number; weight: number }> {
    return getAnalysisSeasons();
  }
}

// Create and export singleton instance
export const apiFootball = new ApiFootball();

// Export constants and utility functions
export {
  PREMIER_LEAGUE_ID,
  CURRENT_SEASON,
  getCurrentSeason,
  getAnalysisSeasons
};