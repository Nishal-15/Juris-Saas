import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    standard_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 users
        { duration: '1m', target: 50 },  // Stay at 50 users for 1 min
        { duration: '30s', target: 0 },  // Ramp down
      ],
      tags: { test_type: 'standard' },
    },
    spike_test: {
      executor: 'ramping-vus',
      startTime: '2m', // Run after standard load
      startVUs: 0,
      stages: [
        { duration: '10s', target: 500 }, // Sudden spike to 500 users
        { duration: '20s', target: 500 }, // Hold spike
        { duration: '20s', target: 0 },   // Cool down
      ],
      tags: { test_type: 'spike' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.01'],    // Error rate must be less than 1%
  },
};

const BASE_URL = __ENV.BACKEND_API_URL || 'http://localhost:5000/api';

export default function () {
  // Mock login to get token (adjust according to your auth logic)
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@jurisbot.com',
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  let token = '';
  try {
    token = loginRes.json('token');
  } catch (e) {
    // If login fails, skip the rest for this VU iteration
    return;
  }

  // Fetch AI Context / Cases (Simulating standard user activity)
  const casesRes = http.get(`${BASE_URL}/cases`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  check(casesRes, {
    'fetched cases successfully': (r) => r.status === 200,
  });

  sleep(1);
}
