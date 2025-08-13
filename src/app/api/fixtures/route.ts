// API route for fixtures
import { NextRequest, NextResponse } from 'next/server';
import Database from '@/lib/database';
import { apiFootball } from '@/lib/api-football';

// GET /api/fixtures - Get fixtures with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming');
    const days = parseInt(searchParams.get('days') || '7');
    
    let fixtures;
    
    if (upcoming === 'true') {
      console.log(`🔄 Fetching upcoming fixtures for next ${days} days...`);
      fixtures = await Database.getUpcomingFixtures(days);
      console.log(`📊 Found ${fixtures.length} upcoming fixtures in database`);
      
      // If no upcoming fixtures in database, try to fetch from API
      if (fixtures.length === 0 && apiFootball.hasApiKey()) {
        try {
          console.log('🌐 Attempting to fetch fixtures from API Football...');
          const apiFixtures = await apiFootball.getUpcomingFixtures(days);
          console.log(`✅ Successfully fetched ${apiFixtures.length} fixtures from API`);
          await Database.saveFixtures(apiFixtures);
          fixtures = apiFixtures;
        } catch (apiError) {
          console.error('❌ Failed to fetch fixtures from API:', apiError);
        }
      }
    } else {
      fixtures = await Database.getFixtures();
    }
    
    return NextResponse.json({
      success: true,
      data: fixtures,
      count: fixtures.length,
      filters: {
        upcoming: upcoming === 'true',
        days: days
      }
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/fixtures/sync - Manually sync upcoming fixtures
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const days = body.days || 7;
    
    const fixtures = await apiFootball.getUpcomingFixtures(days);
    await Database.saveFixtures(fixtures);
    
    return NextResponse.json({
      success: true,
      message: `Fixtures synced successfully for next ${days} days`,
      count: fixtures.length,
      apiUsage: {
        remaining: apiFootball.getRemainingRequests(),
        used: apiFootball.getRequestCount()
      }
    });
  } catch (error) {
    console.error('Error syncing fixtures:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to sync fixtures',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}