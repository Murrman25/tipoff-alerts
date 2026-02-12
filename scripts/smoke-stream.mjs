const baseUrl = process.env.TIPOFF_API_BASE_URL ||
  'https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/tipoff-api';

const eventIDs = process.env.SMOKE_EVENT_IDS;
if (!eventIDs) {
  console.error('SMOKE_EVENT_IDS is required (comma-separated event ids)');
  process.exit(1);
}

const url = `${baseUrl}/stream?eventIDs=${encodeURIComponent(eventIDs)}&channels=odds,status`;
const controller = new AbortController();
setTimeout(() => controller.abort(), 15000).unref();

const response = await fetch(url, { signal: controller.signal });
if (!response.ok || !response.body) {
  console.error('stream check failed', response.status);
  process.exit(1);
}

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';
let sawHeartbeat = false;
let sawReady = false;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  if (buffer.includes('event: ready')) sawReady = true;
  if (buffer.includes('event: heartbeat')) sawHeartbeat = true;

  if (sawReady && sawHeartbeat) {
    console.log('stream heartbeat ok');
    process.exit(0);
  }
}

console.error('stream heartbeat missing');
process.exit(1);
