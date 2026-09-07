import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../lib/prisma.js";
import { hashToken } from "../lib/tokens.js";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(async function authPlugin(app: FastifyInstance) {
  app.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
    if (!token) {
      return reply.code(401).send({ error: "Missing bearer token" });
    }
    const user = await prisma.user.findUnique({ where: { deviceTokenHash: hashToken(token) } });
    if (!user) {
      return reply.code(401).send({ error: "Invalid token" });
    }
    request.userId = user.id;
  });
});
