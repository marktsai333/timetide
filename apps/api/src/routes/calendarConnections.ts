import type { FastifyInstance } from "fastify";
import { CalendarConnectionSchema } from "@timetide/shared";
import { prisma } from "../lib/prisma.js";

// No real OAuth this round -- this just records intent ("I want to connect Google, free/busy
// only") so the roadmap has a row to attach real tokens to later. Status always stays PENDING.
export default async function calendarConnectionsRoutes(app: FastifyInstance) {
  app.get("/api/calendar-connections", { preHandler: app.authenticate }, async (request) => {
    return prisma.calendarConnection.findMany({ where: { userId: request.userId! } });
  });

  app.post("/api/calendar-connections", { preHandler: app.authenticate }, async (request, reply) => {
    const input = CalendarConnectionSchema.parse(request.body);
    const connection = await prisma.calendarConnection.create({
      data: { userId: request.userId!, provider: input.provider, syncMode: input.syncMode },
    });
    return reply.code(201).send(connection);
  });
}
