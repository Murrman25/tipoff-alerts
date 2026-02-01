// Sports Events Edge Function - Proxy for SportsGameOdds API with Team Enrichment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STORAGE_URL = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/team-logos`;

// Helper to construct logo URL from filename
const getLogoUrl = (filename: string | null): string | null => {
  if (!filename) return null;
  return `${STORAGE_URL}/${encodeURIComponent(filename + '.png')}`;
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('SPORTSGAMEODDS_API_KEY');
    if (!apiKey) {
      console.error('SPORTSGAMEODDS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for team lookups
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse query parameters from the request URL
    const url = new URL(req.url);
    const eventID = url.searchParams.get('eventID');
    const leagueID = url.searchParams.get('leagueID');
    const oddsAvailable = url.searchParams.get('oddsAvailable');
    const limit = url.searchParams.get('limit') || '5';

    // Build the SportsGameOdds API URL
    const apiUrl = new URL('https://api.sportsgameodds.com/v2/events');
    apiUrl.searchParams.set('apiKey', apiKey);

    // If specific eventID requested, fetch just that event
    if (eventID) {
      apiUrl.searchParams.set('eventID', eventID);
      console.log(`Fetching specific event: ${eventID}`);
    } else {
      // Forward filter parameters - API requires leagueID on free tier, default to major leagues
      if (leagueID) {
        apiUrl.searchParams.set('leagueID', leagueID);
      } else {
        // Default to major US leagues when no filter specified
        apiUrl.searchParams.set('leagueID', 'NBA,NFL,MLB,NHL,NCAAB,NCAAF');
      }
      if (oddsAvailable === 'true') {
        apiUrl.searchParams.set('oddsAvailable', 'true');
      }
      
      // Only fetch upcoming/current games (from today onwards)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      apiUrl.searchParams.set('startsAtFrom', today.toISOString());
      
      apiUrl.searchParams.set('limit', limit);
    }

    // Request key odds markets for Moneyline, Spread, and Over/Under
    apiUrl.searchParams.set('oddID', [
      'points-home-game-ml-home',
      'points-away-game-ml-away',
      'points-home-game-sp-home',
      'points-away-game-sp-away',
      'points-all-game-ou-over',
      'points-all-game-ou-under'
    ].join(','));

    console.log(`Fetching events from SportsGameOdds API with filters: leagueID=${leagueID}, oddsAvailable=${oddsAvailable}, limit=${limit}`);

    const response = await fetch(apiUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SportsGameOdds API error: ${response.status} - ${errorText}`);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch events from API',
          status: response.status 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched ${data.data?.length || 0} events`);

    // Enrich events with team logo URLs from the teams registry
    if (data.data && Array.isArray(data.data)) {
      // Collect all unique team IDs from the events
      const teamIds = new Set<string>();
      data.data.forEach((event: any) => {
        if (event.teams?.home?.teamID) teamIds.add(event.teams.home.teamID);
        if (event.teams?.away?.teamID) teamIds.add(event.teams.away.teamID);
      });

      // Batch lookup all teams from the registry
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('id, display_name, short_name, city, league, sport, logo_filename, sportsgameodds_id')
        .in('sportsgameodds_id', Array.from(teamIds));

      if (teamsError) {
        console.error('Error fetching teams:', teamsError);
      }

      // Create a lookup map by sportsgameodds_id
      const teamsMap = new Map<string, any>();
      if (teamsData) {
        teamsData.forEach((team: any) => {
          if (team.sportsgameodds_id) {
            teamsMap.set(team.sportsgameodds_id, team);
          }
        });
      }

      console.log(`Found ${teamsMap.size} team mappings for ${teamIds.size} unique teams`);

      // Enrich each event with logo URLs
      data.data = data.data.map((event: any) => {
        const homeTeamData = teamsMap.get(event.teams?.home?.teamID);
        const awayTeamData = teamsMap.get(event.teams?.away?.teamID);

        return {
          ...event,
          teams: {
            home: {
              ...event.teams.home,
              logoUrl: homeTeamData ? getLogoUrl(homeTeamData.logo_filename) : null,
              canonical: homeTeamData ? {
                id: homeTeamData.id,
                displayName: homeTeamData.display_name,
                shortName: homeTeamData.short_name,
                city: homeTeamData.city,
                league: homeTeamData.league,
                sport: homeTeamData.sport,
              } : null,
            },
            away: {
              ...event.teams.away,
              logoUrl: awayTeamData ? getLogoUrl(awayTeamData.logo_filename) : null,
              canonical: awayTeamData ? {
                id: awayTeamData.id,
                displayName: awayTeamData.display_name,
                shortName: awayTeamData.short_name,
                city: awayTeamData.city,
                league: awayTeamData.league,
                sport: awayTeamData.sport,
              } : null,
            },
          },
        };
      });
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sports-events function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
