import type { FastifyInstance } from "fastify";
import { RegisterUserResponseSchema } from "@timetide/shared";
import { prisma } from "../lib/prisma.js";
import { generateDeviceToken, hashToken } from "../lib/tokens.js";

export default async function usersRoutes(app: FastifyInstance) {
  app.post("/api/users", async (_request, reply) => {
    const token = generateDeviceToken();
    const user = await prisma.user.create({
      data: { deviceTokenHash: hashToken(token) },
    });
    const body = RegisterUserResponseSchema.parse({ userId: user.id, token });
    return reply.code(201).send(body);
  });

  app.get("/api/me", { preHandler: app.authenticate }, async (request) => {
    return prisma.user.findUniqueOrThrow({
      where: { id: request.userId },
      include: { timezoneProfile: true },
    });
  });
}
