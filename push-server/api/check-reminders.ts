import type { VercelRequest, VercelResponse } from "@vercel/node";
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.headers["x-app-secret"] !== process.env.APP_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const db = admin.firestore();
  const now = new Date();

  const snap = await db
    .collectionGroup("meetings")
    .where("status", "==", "confirmed")
    .where("reminderSent", "==", false)
    .get();

  let sent = 0;
  for (const doc of snap.docs) {
    const meeting = doc.data();
    const startAt = new Date(meeting.startAt);
    const reminderMinutesBefore = meeting.reminderMinutesBefore ?? 15;
    const remindAt = new Date(startAt.getTime() - reminderMinutesBefore * 60_000);

    if (now < remindAt || now >= startAt) continue;

    const pairingRef = doc.ref.parent.parent;
    if (!pairingRef) continue;
    const pairingSnap = await pairingRef.get();
    const memberUids: string[] = pairingSnap.data()?.memberUids ?? [];

    for (const uid of memberUids) {
      const userDoc = await db.doc(`users/${uid}`).get();
      const token = userDoc.data()?.fcmToken as string | undefined;
      if (!token) continue;
      try {
        await admin.messaging().send({
          token,
          data: {
            title: "行程快到了",
            body: meeting.title || "打電話",
          },
        });
        sent++;
      } catch {
        // ignore individual send failures, still mark as sent below so it doesn't retry forever
      }
    }

    await doc.ref.update({ reminderSent: true });
  }

  res.status(200).json({ checked: snap.docs.length, sent });
}
