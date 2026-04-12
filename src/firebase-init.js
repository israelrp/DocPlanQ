/**
 * Inicialización Firebase (app + Firestore listo para usar).
 * Tras `npm install`, se genera `firebase-init.bundle.js` (ver package.json).
 *
 * Uso desde script clásico: HarmoniqFirebase.getFirestoreDb()
 * Seguridad: restringe lectura/escritura en Firestore con reglas en la consola de Firebase.
 */
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

/** Colección fija: votos «¿Te sirvió esta página?» (Sí / No). */
export const PAGE_FEEDBACK_COLLECTION = "docs_page_feedback";

const firebaseConfig = {
  apiKey: "AIzaSyCShj4v_-z6lllyll6_-uq5rBUcitu-peY",
  authDomain: "planq-9e2ea.firebaseapp.com",
  projectId: "planq-9e2ea",
  storageBucket: "planq-9e2ea.firebasestorage.app",
  messagingSenderId: "516263967044",
  appId: "1:516263967044:web:843a390501276546e6ff11",
  measurementId: "G-9SH2JME2QF",
};

function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

const app = getFirebaseApp();

/** Firestore: usar cuando implementes lecturas/escrituras. */
export function getFirestoreDb() {
  return getFirestore(app);
}

export function getFirebaseAppInstance() {
  return app;
}

/**
 * Guarda un voto en Firestore: página actual + sí/no.
 * @param {"yes"|"no"} choice — valor de data-rtf en los botones
 */
export async function savePageFeedback(choice) {
  if (choice !== "yes" && choice !== "no") return;
  const db = getFirestore(app);
  const loc = typeof window !== "undefined" ? window.location : null;
  const href = loc ? loc.href : "";
  const pathname = loc ? loc.pathname : "";
  const hash = loc && loc.hash ? loc.hash : "";
  await addDoc(collection(db, PAGE_FEEDBACK_COLLECTION), {
    helpful: choice === "yes",
    vote: choice,
    url: href,
    pathname,
    hash,
    lang: typeof document !== "undefined" ? document.documentElement.lang || "" : "",
    createdAt: serverTimestamp(),
  });
}

isSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {});
