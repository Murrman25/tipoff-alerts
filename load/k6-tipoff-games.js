import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: Number(__ENV.VUS || 300),
  duration: __ENV.DURATION || '15m',
  thresholds: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<300'],
  },
};

const baseUrl = __ENV.TIPOFF_API_BASE_URL ||
  'https://wxcezmqaknhftwnpkanu.supabase.co/functions/v1/tipoff-api';

export default function () {
  const res = http.get(`${baseUrl}/games/search?status=all&limit=10`);
  check(res, {
    'status is 200': (r) => r.status === 200,
    'has data array': (r) => {
      try {
        const body = JSON.parse(r.body);
        return Array.isArray(body.data);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
