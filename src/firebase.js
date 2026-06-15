import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, onSnapshot } from "firebase/firestore";
import { firebaseConfig, ROOM_ID } from "./firebaseConfig";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const stateRef = () => doc(db, "rooms", ROOM_ID, "meta", "state");
const usersCol = () => collection(db, "rooms", ROOM_ID, "users");
const userRef = (n) => doc(db, "rooms", ROOM_ID, "users", n);

export async function getState() {
  const s = await getDoc(stateRef());
  return s.exists() ? s.data() : null;
}
export async function saveState(partial) {
  await setDoc(stateRef(), partial, { merge: true });
}
export async function joinUser(name) {
  const s = await getDoc(userRef(name));
  if (!s.exists()) await setDoc(userRef(name), { joined: new Date().toISOString(), picks: {} });
  return s.exists();
}
export async function savePick(name, matchId, pick) {
  // pick = '1' | 'X' | '2' | null (null = remove)
  const s = await getDoc(userRef(name));
  const picks = s.exists() ? (s.data().picks || {}) : {};
  if (pick === null) delete picks[matchId];
  else picks[matchId] = pick;
  await setDoc(userRef(name), { picks }, { merge: true });
}
export async function resetUserPicks(name) {
  await setDoc(userRef(name), { picks: {} }, { merge: true });
}
export async function resetAllPicks() {
  const snap = await getDocs(usersCol());
  await Promise.all(snap.docs.map((d) => setDoc(userRef(d.id), { picks: {} }, { merge: true })));
}
export function subscribeState(cb) {
  return onSnapshot(stateRef(), (s) => cb(s.exists() ? s.data() : null));
}
export function subscribeUsers(cb) {
  return onSnapshot(usersCol(), (snap) => {
    const out = {};
    snap.forEach((d) => { out[d.id] = d.data(); });
    cb(out);
  });
}
