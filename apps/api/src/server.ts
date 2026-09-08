import Fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth.js";
import usersRoutes from "./routes/users.js";
import pairingsRoutes from "./routes/pairings.js";
import timezoneProfilesRoutes from "./routes/timezoneProfiles.js";
import calendarConnectionsRoutes from "./routes/calendarConnections.js";
import meetingsRoutes from "./routes/meetings.js";

const app = Fastify({ logger: true });

await app.register(cors);
await app.register(authPlugin);

app.get("/health", async () => ({ ok: true }));

await app.register(usersRoutes);
await app.register(pairingsRoutes);
await app.register(timezoneProfilesRoutes);
await app.register(calendarConnectionsRoutes);
await app.register(meetingsRoutes);

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
app.listen({ port, host }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
