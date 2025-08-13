// Database connection and utilities with API Football integration
// Hybrid approach: Use API Football when available, fallback to mock data

import { Team, Fixture, TeamStatistics, Standing, Prediction } from '@/types';
import { apiFootball } from './api-football';

// Mock database storage (in production, this would be PostgreSQL)
interface MockDatabase {
  teams: Team[];
  fixtures: Fixture[];
  teamStatistics: TeamStatistics[];
  standings: Standing[];
  predictions: Prediction[];
}

// Initialize mock database
const mockDB: MockDatabase = {
  teams: [],
  fixtures: [],
  teamStatistics: [],
  standings: [],
  predictions: []
};

// Database operations
export class Database {
  // Teams operations with API Football integration
  static async getTeams(): Promise<Team[]> {
    try {
      if (apiFootball.hasApiKey()) {
        const teams = await apiFootball.getTeams();
        // Cache teams in mock database
        await this.saveTeams(teams);
        return teams;
      }
    } catch (error) {
      console.warn('API Football unavailable, using cached data:', error);
    }
    
    // Fallback to mock data
    return mockDB.teams.length > 0 ? mockDB.teams : this.getMockTeams();
  }

  static async getTeamById(id: number): Promise<Team | null> {
    return mockDB.teams.find(team => team.id === id) || null;
  }

  static async saveTeam(team: Team): Promise<void> {
    const existingIndex = mockDB.teams.findIndex(t => t.id === team.id);
    if (existingIndex >= 0) {
      mockDB.teams[existingIndex] = team;
    } else {
      mockDB.teams.push(team);
    }
  }

  static async saveTeams(teams: Team[]): Promise<void> {
    for (const team of teams) {
      await this.saveTeam(team);
    }
  }

  // Fixtures operations
  static async getFixtures(): Promise<Fixture[]> {
    return mockDB.fixtures;
  }

  static async getUpcomingFixtures(days: number = 7): Promise<Fixture[]> {
    const now = new Date();
    const future = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    return mockDB.fixtures.filter(fixture => {
      const fixtureDate = new Date(fixture.date);
      return fixtureDate >= now && fixtureDate <= future;
    });
  }

  static async getFixtureById(id: number): Promise<Fixture | null> {
    return mockDB.fixtures.find(fixture => fixture.id === id) || null;
  }

  static async saveFixture(fixture: Fixture): Promise<void> {
    const existingIndex = mockDB.fixtures.findIndex(f => f.id === fixture.id);
    if (existingIndex >= 0) {
      mockDB.fixtures[existingIndex] = fixture;
    } else {
      mockDB.fixtures.push(fixture);
    }
  }

  static async saveFixtures(fixtures: Fixture[]): Promise<void> {
    for (const fixture of fixtures) {
      await this.saveFixture(fixture);
    }
  }

  // Team Statistics operations
  static async getTeamStatistics(teamId: number, season: number): Promise<TeamStatistics | null> {
    return mockDB.teamStatistics.find(
      stats => stats.team_id === teamId && stats.season === season
    ) || null;
  }

  static async saveTeamStatistics(stats: TeamStatistics): Promise<void> {
    const existingIndex = mockDB.teamStatistics.findIndex(
      s => s.team_id === stats.team_id && s.season === stats.season
    );
    if (existingIndex >= 0) {
      mockDB.teamStatistics[existingIndex] = stats;
    } else {
      mockDB.teamStatistics.push(stats);
    }
  }

  // Standings operations
  static async getStandings(): Promise<Standing[]> {
    return mockDB.standings.filter(standing => 
      standing.team.id // This is a simplified filter, would be more complex with real DB
    );
  }

  static async saveStandings(standings: Standing[]): Promise<void> {
    // Clear existing standings for the season (simplified)
    mockDB.standings.length = 0;
    mockDB.standings.push(...standings);
  }

  // Predictions operations
  static async getPredictions(): Promise<Prediction[]> {
    return mockDB.predictions;
  }

  static async getPredictionByFixtureId(fixtureId: number): Promise<Prediction | null> {
    return mockDB.predictions.find(pred => pred.fixture_id === fixtureId) || null;
  }

  static async savePrediction(prediction: Prediction): Promise<void> {
    const existingIndex = mockDB.predictions.findIndex(p => p.fixture_id === prediction.fixture_id);
    if (existingIndex >= 0) {
      mockDB.predictions[existingIndex] = prediction;
    } else {
      mockDB.predictions.push(prediction);
    }
  }

  // Utility functions
  static async getTeamRecentForm(teamId: number, matches: number = 5): Promise<Fixture[]> {
    const teamFixtures = mockDB.fixtures
      .filter(fixture => 
        (fixture.teams.home.id === teamId || fixture.teams.away.id === teamId) &&
        fixture.status.short === 'FT' // Only completed matches
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, matches);

    return teamFixtures;
  }

  static async getHeadToHeadRecords(team1Id: number, team2Id: number, limit: number = 10): Promise<Fixture[]> {
    return mockDB.fixtures
      .filter(fixture => 
        ((fixture.teams.home.id === team1Id && fixture.teams.away.id === team2Id) ||
         (fixture.teams.home.id === team2Id && fixture.teams.away.id === team1Id)) &&
        fixture.status.short === 'FT'
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  // Database health check
  static async healthCheck(): Promise<boolean> {
    try {
      // In a real implementation, this would ping the actual database
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  // Clear all data (for testing)
  static async clearAll(): Promise<void> {
    mockDB.teams.length = 0;
    mockDB.fixtures.length = 0;
    mockDB.teamStatistics.length = 0;
    mockDB.standings.length = 0;
    mockDB.predictions.length = 0;
  }

  // Mock data generators for fallback
  static getMockTeams(): Team[] {
    return [
      { id: 33, name: "Manchester United", code: "MAN", country: "England", founded: 1878, national: false, logo: "https://media.api-sports.io/football/teams/33.png" },
      { id: 34, name: "Newcastle United", code: "NEW", country: "England", founded: 1892, national: false, logo: "https://media.api-sports.io/football/teams/34.png" },
      { id: 35, name: "Bournemouth", code: "BOU", country: "England", founded: 1899, national: false, logo: "https://media.api-sports.io/football/teams/35.png" },
      { id: 36, name: "Fulham", code: "FUL", country: "England", founded: 1879, national: false, logo: "https://media.api-sports.io/football/teams/36.png" },
      { id: 37, name: "Tottenham", code: "TOT", country: "England", founded: 1882, national: false, logo: "https://media.api-sports.io/football/teams/37.png" },
      { id: 38, name: "Watford", code: "WAT", country: "England", founded: 1881, national: false, logo: "https://media.api-sports.io/football/teams/38.png" },
      { id: 39, name: "Wolves", code: "WOL", country: "England", founded: 1877, national: false, logo: "https://media.api-sports.io/football/teams/39.png" },
      { id: 40, name: "Liverpool", code: "LIV", country: "England", founded: 1892, national: false, logo: "https://media.api-sports.io/football/teams/40.png" },
      { id: 41, name: "Southampton", code: "SOU", country: "England", founded: 1885, national: false, logo: "https://media.api-sports.io/football/teams/41.png" },
      { id: 42, name: "Arsenal", code: "ARS", country: "England", founded: 1886, national: false, logo: "https://media.api-sports.io/football/teams/42.png" },
      { id: 43, name: "Birmingham City", code: "BIR", country: "England", founded: 1875, national: false, logo: "https://media.api-sports.io/football/teams/43.png" },
      { id: 44, name: "Burnley", code: "BUR", country: "England", founded: 1882, national: false, logo: "https://media.api-sports.io/football/teams/44.png" },
      { id: 45, name: "Everton", code: "EVE", country: "England", founded: 1878, national: false, logo: "https://media.api-sports.io/football/teams/45.png" },
      { id: 46, name: "Leicester City", code: "LEI", country: "England", founded: 1884, national: false, logo: "https://media.api-sports.io/football/teams/46.png" },
      { id: 47, name: "Crystal Palace", code: "CRY", country: "England", founded: 1905, national: false, logo: "https://media.api-sports.io/football/teams/47.png" },
      { id: 48, name: "West Ham", code: "WHU", country: "England", founded: 1895, national: false, logo: "https://media.api-sports.io/football/teams/48.png" },
      { id: 49, name: "Chelsea", code: "CHE", country: "England", founded: 1905, national: false, logo: "https://media.api-sports.io/football/teams/49.png" },
      { id: 50, name: "Manchester City", code: "MCI", country: "England", founded: 1880, national: false, logo: "https://media.api-sports.io/football/teams/50.png" },
      { id: 51, name: "Brighton", code: "BHA", country: "England", founded: 1901, national: false, logo: "https://media.api-sports.io/football/teams/51.png" },
      { id: 52, name: "Brentford", code: "BRE", country: "England", founded: 1889, national: false, logo: "https://media.api-sports.io/football/teams/52.png" }
    ];
  }

  static getMockFixtures(): Fixture[] {
    const now = new Date();
    const teams = this.getMockTeams();
    
    return [
      {
        id: 1001,
        referee: "M. Dean",
        timezone: "UTC",
        date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        timestamp: Math.floor(now.getTime() / 1000) + 86400,
        periods: { first: null, second: null },
        venue: { id: 1, name: "Old Trafford", city: "Manchester" },
        status: { long: "Not Started", short: "NS", elapsed: null },
        league: { id: 39, name: "Premier League", country: "England", logo: "", flag: "", season: 2025, round: "Regular Season - 1" },
        teams: {
          home: teams[0], // Manchester United
          away: teams[1]  // Newcastle United
        },
        goals: { home: null, away: null },
        score: {
          halftime: { home: null, away: null },
          fulltime: { home: null, away: null },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      },
      {
        id: 1002,
        referee: "A. Taylor",
        timezone: "UTC",
        date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
        timestamp: Math.floor(now.getTime() / 1000) + 172800,
        periods: { first: null, second: null },
        venue: { id: 2, name: "Emirates Stadium", city: "London" },
        status: { long: "Not Started", short: "NS", elapsed: null },
        league: { id: 39, name: "Premier League", country: "England", logo: "", flag: "", season: 2025, round: "Regular Season - 1" },
        teams: {
          home: teams[9], // Arsenal
          away: teams[19] // Manchester City
        },
        goals: { home: null, away: null },
        score: {
          halftime: { home: null, away: null },
          fulltime: { home: null, away: null },
          extratime: { home: null, away: null },
          penalty: { home: null, away: null }
        }
      }
    ];
  }
}

// Export database instance
export default Database;