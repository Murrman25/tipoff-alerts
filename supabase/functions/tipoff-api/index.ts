import { handleTipoffApiRequest } from './router.ts';

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(
      JSON.stringify({ error: 'Supabase service configuration missing' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      },
    );
  }

  return handleTipoffApiRequest(req, {
    sportsApiKey: Deno.env.get('SPORTSGAMEODDS_API_KEY'),
    supabaseUrl,
    supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY'),
    serviceRoleKey,
  });
});
