const baseUrl = process.env.TIPOFF_API_BASE_URL ||
  'https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/tipoff-api';

async function getJson(url, headers = {}) {
  const response = await fetch(url, { headers });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, ok: response.ok, body };
}

async function main() {
  const checks = [];

  checks.push(await getJson(`${baseUrl}/games/search?status=all&limit=5`));

  const games = checks[0].body?.data || [];
  if (Array.isArray(games) && games.length > 0) {
    const firstEventID = games[0].eventID;
    checks.push(await getJson(`${baseUrl}/games/${encodeURIComponent(firstEventID)}`));
  }

  const token = process.env.SMOKE_AUTH_BEARER;
  if (token) {
    checks.push(await getJson(`${baseUrl}/alerts`, { Authorization: `Bearer ${token}` }));
  }

  checks.forEach((result, idx) => {
    console.log(`check_${idx + 1}`, {
      status: result.status,
      ok: result.ok,
      hasData: Boolean(result.body?.data),
      error: result.body?.error || null,
    });
  });

  const failed = checks.some((item) => !item.ok);
  if (failed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('smoke-tipoff failed', error);
  process.exit(1);
});
