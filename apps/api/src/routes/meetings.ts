import type { FastifyInstance } from "fastify";
import { CreateMeetingRequestSchema } from "@timetide/shared";
import { prisma } from "../lib/prisma.js";

export default async function meetingsRoutes(app: FastifyInstance) {
  app.get("/api/meetings", { preHandler: app.authenticate }, async (request) => {
    return prisma.meeting.findMany({
      where: { pairing: { OR: [{ userAId: request.userId! }, { userBId: request.userId! }] } },
      orderBy: { startAt: "asc" },
    });
  });

  app.post("/api/meetings", { preHandler: app.authenticate }, async (request, reply) => {
    const input = CreateMeetingRequestSchema.parse(request.body);
    const meeting = await prisma.meeting.create({
      data: {
        pairingId: input.pairingId,
        proposedByUserId: request.userId!,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        title: input.title,
        notes: input.notes,
        syncToCalendar: input.syncToCalendar,
        reminderOnly: input.reminderOnly,
      },
    });
    return reply.code(201).send(meeting);
  });
}
