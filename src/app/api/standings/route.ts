// API route for standings
import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { apiFootball } from '@/lib/api-football';

// GET /api/standings - Get Premier League standings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const season = parseInt(searchParams.get('season') || '2024');
    
    let standings = await Database.getStandings();
    
    // If no standings in database, try to fetch from API
    if (standings.length === 0) {
      try {
        const apiStandings = await apiFootball.getStandings(season);
        await Database.saveStandings(apiStandings);
        standings = apiStandings;
      } catch (apiError) {
        return NextResponse.json({
          success: false,
          error: 'No standings in database and API fetch failed',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: standings,
      count: standings.length,
      season: season
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch standings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/standings/sync - Manually sync standings from API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const season = body.season || 2024;
    
    const standings = await apiFootball.getStandings(season);
    await Database.saveStandings(standings);
    
    return NextResponse.json({
      success: true,
      message: `Standings synced successfully for season ${season}`,
      count: standings.length,
      season: season,
      apiUsage: {
        remaining: apiFootball.getRemainingRequests(),
        used: apiFootball.getRequestCount()
      }
    });
  } catch (error) {
    console.error('Error syncing standings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync standings',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}