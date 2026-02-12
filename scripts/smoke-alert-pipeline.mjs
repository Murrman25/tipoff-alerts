const redisUrl = process.env.REDIS_REST_URL;
const redisToken = process.env.REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
  console.error('REDIS_REST_URL and REDIS_REST_TOKEN are required');
  process.exit(1);
}

async function getKey(key) {
  const encoded = encodeURIComponent(key);
  const response = await fetch(`${redisUrl}/GET/${encoded}`, {
    headers: {
      Authorization: `Bearer ${redisToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`redis GET failed (${response.status})`);
  }

  const payload = await response.json();
  return payload.result;
}

const ingestionBeat = await getKey('workers:ingestion:last_heartbeat');
const ingestionCycle = await getKey('workers:ingestion:last_cycle_at');

if (!ingestionBeat || !ingestionCycle) {
  console.error('missing ingestion worker heartbeat/cycle markers');
  process.exit(1);
}

console.log('alert pipeline preflight ok', {
  ingestionBeat,
  ingestionCycle,
});
