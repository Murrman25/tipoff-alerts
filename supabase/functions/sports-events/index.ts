// Sports Events Edge Function - Proxy for SportsGameOdds API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Parse query parameters from the request URL
    const url = new URL(req.url);
    const leagueID = url.searchParams.get('leagueID');
    const oddsAvailable = url.searchParams.get('oddsAvailable');
    const limit = url.searchParams.get('limit') || '5';

    // Build the SportsGameOdds API URL
    const apiUrl = new URL('https://api.sportsgameodds.com/v2/events');
    apiUrl.searchParams.set('apiKey', apiKey);

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
