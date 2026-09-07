import type { FastifyInstance } from "fastify";
import { TimezoneProfileSchema } from "@timetide/shared";
import { prisma } from "../lib/prisma.js";

export default async function timezoneProfilesRoutes(app: FastifyInstance) {
  app.put("/api/timezone-profile", { preHandler: app.authenticate }, async (request, reply) => {
    const input = TimezoneProfileSchema.parse(request.body);
    const profile = await prisma.timezoneProfile.upsert({
      where: { userId: request.userId! },
      create: { userId: request.userId!, ...input },
      update: input,
    });
    return reply.send(profile);
  });
}
