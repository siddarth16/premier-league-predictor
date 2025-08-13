// API route for system health check
import { NextResponse } from 'next/server';
import Database from '@/lib/database';
import { apiFootball } from '@/lib/api-football';

// GET /api/health - System health check
export async function GET() {
  try {
    const [apiHealth, dbHealth] = await Promise.all([
      apiFootball.healthCheck().catch(() => false),
      Database.healthCheck().catch(() => false)
    ]);
    
    const teams = await Database.getTeams();
    const fixtures = await Database.getFixtures();
    
    const health = {
      status: apiHealth && dbHealth ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        api: {
          status: apiHealth ? 'up' : 'down',
          configured: apiFootball.hasApiKey(),
          keyPresent: !!process.env.API_FOOTBALL_KEY,
          keyLength: process.env.API_FOOTBALL_KEY?.length || 0,
          usage: {
            used: apiFootball.getRequestCount(),
            remaining: apiFootball.getRemainingRequests(),
            total: 100
          }
        },
        database: {
          status: dbHealth ? 'up' : 'down',
          data: {
            teams: teams.length,
            fixtures: fixtures.length
          }
        }
      },
      overall: apiHealth && dbHealth
    };
    
    const statusCode = health.overall ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}