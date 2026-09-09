import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  if (req.headers["x-app-secret"] !== process.env.APP_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { recipientUid, title, body } = req.body as { recipientUid?: string; title?: string; body?: string };
  if (!recipientUid || !title) {
    res.status(400).json({ error: "Missing recipientUid or title" });
    return;
  }

  const userDoc = await admin.firestore().doc(`users/${recipientUid}`).get();
  const token = userDoc.data()?.fcmToken as string | undefined;
  if (!token) {
    res.status(404).json({ error: "Recipient has no registered device" });
    return;
  }

  try {
    await admin.messaging().send({
      token,
      data: { title, body: body ?? "" },
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}
