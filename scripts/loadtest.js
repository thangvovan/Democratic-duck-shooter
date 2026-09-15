// Simulates the API traffic of N concurrent players (default 60).
// Each player: GET leaderboard -> POST session -> (plays locally) -> POST score -> GET leaderboard.
//
// Run the server with:  TRUST_PROXY=1 MIN_GAME_SECONDS=0 npm start
// Then:                 npm run loadtest -- http://localhost:3000 60 3

const BASE = process.argv[2] || 'http://localhost:3000';
const PLAYERS = Number(process.argv[3] || 60);
const ROUNDS = Number(process.argv[4] || 3);

const latencies = [];
const statusCounts = {};

async function call(method, path, ip, body) {
  const start = performance.now();
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  latencies.push(performance.now() - start);
  statusCounts[res.status] = (statusCounts[res.status] || 0) + 1;
  return { status: res.status, data };
}

function fakeGame() {
  const correct = 10 + Math.floor(Math.random() * 7);
  const ducksShot = Math.floor(correct * 0.8);
  const escapes = Math.floor(Math.random() * 3);
  const bodyguardsShot = 3 * (escapes + 1);
  const presidentDefeated = Math.random() < 0.6;
  const base = ducksShot * 100 + bodyguardsShot * 150 + (presidentDefeated ? 1000 : 0);
  return {
    score: Math.round(base * 1.3),
    stats: {
      questions: 16,
      correct,
      wrong: 16 - correct,
      ducksShot,
      bodyguardsShot,
      presidentDefeated,
      bulletsFired: ducksShot + bodyguardsShot + 8,
      escapes,
    },
  };
}

async function player(id, round) {
  const ip = `10.0.${round}.${id}`;
  await call('GET', '/api/leaderboard?limit=10', ip);
  const session = await call('POST', '/api/session', ip);
  if (session.status !== 200) return;
  await new Promise((r) => setTimeout(r, Math.random() * 500));
  const game = fakeGame();
  await call('POST', '/api/scores', ip, { token: session.data.token, nickname: `LOAD${round}_${id}`, ...game });
  await call('GET', '/api/leaderboard?limit=10', ip);
}

const t0 = performance.now();
for (let round = 0; round < ROUNDS; round++) {
  await Promise.all(Array.from({ length: PLAYERS }, (_, i) => player(i, round)));
}
const total = performance.now() - t0;

latencies.sort((a, b) => a - b);
const pct = (p) => latencies[Math.min(latencies.length - 1, Math.floor((p / 100) * latencies.length))].toFixed(1);
console.log(`${PLAYERS} concurrent players × ${ROUNDS} rounds, ${latencies.length} requests in ${(total / 1000).toFixed(2)}s`);
console.log(`status: ${JSON.stringify(statusCounts)}`);
console.log(`latency ms  p50=${pct(50)}  p95=${pct(95)}  p99=${pct(99)}  max=${pct(100)}`);
