import type { FastifyInstance } from "fastify";
import { CreatePairingResponseSchema, RedeemPairingRequestSchema } from "@timetide/shared";
import { prisma } from "../lib/prisma.js";
import { generateInviteCode } from "../lib/tokens.js";

const INVITE_TTL_MINUTES = 15;

export default async function pairingsRoutes(app: FastifyInstance) {
  app.post("/api/pairings", { preHandler: app.authenticate }, async (request, reply) => {
    const inviteCode = generateInviteCode();
    const inviteCodeExpiresAt = new Date(Date.now() + INVITE_TTL_MINUTES * 60_000);
    const pairing = await prisma.pairing.create({
      data: { userAId: request.userId!, inviteCode, inviteCodeExpiresAt },
    });
    const body = CreatePairingResponseSchema.parse({
      pairingId: pairing.id,
      inviteCode,
      expiresAt: inviteCodeExpiresAt.toISOString(),
    });
    return reply.code(201).send(body);
  });

  app.post("/api/pairings/redeem", { preHandler: app.authenticate }, async (request, reply) => {
    const { inviteCode } = RedeemPairingRequestSchema.parse(request.body);
    const pairing = await prisma.pairing.findUnique({ where: { inviteCode } });

    if (!pairing || pairing.status !== "PENDING") {
      return reply.code(404).send({ error: "Invite code not found or already used" });
    }
    if (pairing.inviteCodeExpiresAt && pairing.inviteCodeExpiresAt < new Date()) {
      return reply.code(410).send({ error: "Invite code expired" });
    }
    if (pairing.userAId === request.userId) {
      return reply.code(400).send({ error: "Cannot redeem your own invite code" });
    }

    const updated = await prisma.pairing.update({
      where: { id: pairing.id },
      data: { userBId: request.userId, status: "ACTIVE", inviteCode: null, acceptedAt: new Date() },
    });
    return reply.send(updated);
  });
}
