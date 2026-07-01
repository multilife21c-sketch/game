// ============================================================
//  firebase-config.js  —  여기 한 곳만 채우면 됩니다
// ============================================================
//  1) Firebase 콘솔(console.firebase.google.com)에서 웹 앱 생성
//  2) 아래 firebaseConfig 값 붙여넣기
//  3) 본인 로그인 후 콘솔의 Authentication > Users 에서 UID 복사 →
//     ADMIN_UIDS 에 넣으면 admin.html 사용 가능
//
//  ※ 값을 채우기 전까지는 자동으로 "데모 모드"로 동작합니다
//    (로그인/랭킹/즐겨찾기 비활성, games.json 으로 갤러리만 표시)
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit, onSnapshot,
  serverTimestamp, increment, arrayUnion, arrayRemove, writeBatch,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ▼▼▼ 여기 채우세요 ▼▼▼
export const firebaseConfig = {
  apiKey: "AIzaSyApM7BihAI_Lbo81WXweO2hvRo2fAtH1W8",
  authDomain: "nova-arcade-55375.firebaseapp.com",
  projectId: "nova-arcade-55375",
  storageBucket: "nova-arcade-55375.firebasestorage.app",
  messagingSenderId: "585521594918",
  appId: "1:585521594918:web:8af817caea2a60a579dce7"
};

// 관리자 UID 목록 (admin.html 접근 + 게임 CRUD 권한)
export const ADMIN_UIDS = [
  "KLYhz0dSVJVEJh2EJLZGAh9UM6w1",
];
// ▲▲▲ 여기까지 ▲▲▲

// apiKey 가 아직 PASTE_ 로 시작하면 데모 모드
export const DEMO = String(firebaseConfig.apiKey).startsWith("PASTE_");

let app = null, auth = null, db = null;
if (!DEMO) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  try { await setPersistence(auth, browserLocalPersistence); } catch (e) {}
}

export const isAdmin = (uid) => !!uid && ADMIN_UIDS.includes(uid);

export {
  app, auth, db,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment,
  arrayUnion, arrayRemove, writeBatch,
};
