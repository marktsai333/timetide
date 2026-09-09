import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { app } from "./firebase";
import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;
const PUSH_SERVER_URL = import.meta.env.VITE_PUSH_SERVER_URL as string | undefined;
const APP_SECRET = import.meta.env.VITE_APP_SECRET as string | undefined;

export async function requestPushPermission(uid: string): Promise<"granted" | "denied" | "unsupported"> {
  if (!(await isSupported())) return "unsupported";
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return "denied";

  const registration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(app);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  if (!token) return "denied";

  await setDoc(doc(db, "users", uid), { fcmToken: token }, { merge: true });
  return "granted";
}

export async function sendPushNotification(params: { recipientUid: string; title: string; body: string }) {
  if (!PUSH_SERVER_URL) return;
  try {
    await fetch(PUSH_SERVER_URL, {
      method: "POST",
      headers: { "content-type": "application/json", "x-app-secret": APP_SECRET ?? "" },
      body: JSON.stringify(params),
    });
  } catch {
    // Push is best-effort -- the in-app realtime sync already works regardless.
  }
}
