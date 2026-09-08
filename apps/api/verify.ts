import Fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./src/plugins/auth.js";
import usersRoutes from "./src/routes/users.js";
import pairingsRoutes from "./src/routes/pairings.js";
import timezoneProfilesRoutes from "./src/routes/timezoneProfiles.js";
import calendarConnectionsRoutes from "./src/routes/calendarConnections.js";
import meetingsRoutes from "./src/routes/meetings.js";

const app = Fastify({ logger: false });
await app.register(cors);
await app.register(authPlugin);
app.get("/health", async () => ({ ok: true }));
await app.register(usersRoutes);
await app.register(pairingsRoutes);
await app.register(timezoneProfilesRoutes);
await app.register(calendarConnectionsRoutes);
await app.register(meetingsRoutes);

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAIL: ${msg}`);
  console.log(`OK: ${msg}`);
}

// health check
const health = await app.inject({ method: "GET", url: "/health" });
assert(health.statusCode === 200, "GET /health -> 200");

// register user A
const userAReg = await app.inject({ method: "POST", url: "/api/users" });
assert(userAReg.statusCode === 201, "POST /api/users (A) -> 201");
const { userId: userAId, token: tokenA } = userAReg.json();
console.log("  userA:", userAId);

// register user B
const userBReg = await app.inject({ method: "POST", url: "/api/users" });
assert(userBReg.statusCode === 201, "POST /api/users (B) -> 201");
const { userId: userBId, token: tokenB } = userBReg.json();
console.log("  userB:", userBId);

// unauthenticated /api/me should fail
const meNoAuth = await app.inject({ method: "GET", url: "/api/me" });
assert(meNoAuth.statusCode === 401, "GET /api/me without token -> 401");

// authenticated /api/me for A
const meA = await app.inject({
  method: "GET",
  url: "/api/me",
  headers: { authorization: `Bearer ${tokenA}` },
});
assert(meA.statusCode === 200, "GET /api/me (A) -> 200");
assert(meA.json().id === userAId, "GET /api/me (A) returns correct id");

// set timezone profile for A
const setTzA = await app.inject({
  method: "PUT",
  url: "/api/timezone-profile",
  headers: { authorization: `Bearer ${tokenA}` },
  payload: { ianaTimezone: "Asia/Taipei", label: "台北" },
});
assert(setTzA.statusCode === 200, "PUT /api/timezone-profile (A) -> 200");
assert(setTzA.json().ianaTimezone === "Asia/Taipei", "timezone profile persisted correctly");

// A creates a pairing invite
const createPairing = await app.inject({
  method: "POST",
  url: "/api/pairings",
  headers: { authorization: `Bearer ${tokenA}` },
});
assert(createPairing.statusCode === 201, "POST /api/pairings (A) -> 201");
const { inviteCode } = createPairing.json();
console.log("  inviteCode:", inviteCode);

// B redeems the invite
const redeem = await app.inject({
  method: "POST",
  url: "/api/pairings/redeem",
  headers: { authorization: `Bearer ${tokenB}` },
  payload: { inviteCode },
});
assert(redeem.statusCode === 200, "POST /api/pairings/redeem (B) -> 200");
assert(redeem.json().status === "ACTIVE", "pairing status is ACTIVE after redeem");
assert(redeem.json().userBId === userBId, "pairing.userBId set to B");

// redeeming again should fail (already used, inviteCode cleared)
const redeemAgain = await app.inject({
  method: "POST",
  url: "/api/pairings/redeem",
  headers: { authorization: `Bearer ${tokenA}` },
  payload: { inviteCode },
});
assert(redeemAgain.statusCode === 404, "re-redeeming used invite code -> 404");

console.log("\nAll checks passed.");
process.exit(0);
