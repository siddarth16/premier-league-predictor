// API route for teams
import { NextResponse } from 'next/server';
import Database from '@/lib/database';
import { apiFootball } from '@/lib/api-football';

// GET /api/teams - Get all Premier League teams
export async function GET() {
  try {
    const teams = await Database.getTeams();
    
    // If no teams in database, try to fetch from API
    if (teams.length === 0) {
      try {
        const apiTeams = await apiFootball.getTeams();
        await Database.saveTeams(apiTeams);
        
        return NextResponse.json({
          success: true,
          data: apiTeams,
          message: 'Teams fetched from API and cached',
          count: apiTeams.length
        });
      } catch (apiError) {
        return NextResponse.json({
          success: false,
          error: 'No teams in database and API fetch failed',
          details: apiError instanceof Error ? apiError.message : 'Unknown error'
        }, { status: 500 });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: teams,
      count: teams.length
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/teams/sync - Manually sync teams from API
export async function POST() {
  try {
    const teams = await apiFootball.getTeams();
    await Database.saveTeams(teams);
    
    return NextResponse.json({
      success: true,
      message: 'Teams synced successfully',
      count: teams.length,
      apiUsage: {
        remaining: apiFootball.getRemainingRequests(),
        used: apiFootball.getRequestCount()
      }
    });
  } catch (error) {
    console.error('Error syncing teams:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync teams',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}