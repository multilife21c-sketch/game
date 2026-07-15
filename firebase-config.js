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
// ⚠️ 보안 안내: 아래 apiKey 는 Firebase "웹 API 키"로, 클라이언트에 공개되는 것이 정상입니다
//   (비밀이 아님 — https://firebase.google.com/docs/projects/api-keys).
//   실제 보호는 ① Firestore 보안 규칙(firestore.rules) ② Google Cloud Console 의 API 키
//   HTTP 리퍼러 제한 으로 이뤄집니다. 아래 도메인만 허용하도록 콘솔에서 키를 제한하세요:
//     https://multilife21c-sketch.github.io/*  ,  https://game-sooty-gamma.vercel.app/*
//     https://nova-arcade-55375.firebaseapp.com/*  ,  https://nova-arcade-55375.web.app/*
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

// ============================================================
//  🔒 인앱 브라우저(카카오톡/인스타그램/네이버 등) 감지 + 탈출
//  Google은 보안 정책상 인앱 웹뷰에서의 OAuth 로그인을 원천 차단합니다
//  (403 disallowed_useragent). 코드로 우회할 수 없으므로,
//  로그인 시도 전에 감지해서 기본 브라우저로 안내/탈출시킵니다.
// ============================================================
export function isInAppBrowser() {
  const ua = navigator.userAgent || navigator.vendor || "";
  return /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|NAVER\(inapp|WhatsApp|MicroMessenger|Zalo|Snapchat/i.test(ua);
}

export function inAppBrowserName() {
  const ua = navigator.userAgent || "";
  if (/KAKAOTALK/i.test(ua)) return "카카오톡";
  if (/Instagram/i.test(ua)) return "인스타그램";
  if (/FBAN|FBAV/i.test(ua)) return "페이스북";
  if (/Line\//i.test(ua)) return "라인";
  if (/NAVER\(inapp/i.test(ua)) return "네이버 앱";
  if (/MicroMessenger/i.test(ua)) return "위챗";
  return "인앱 브라우저";
}

// 가능하면 기본 브라우저로 즉시 전환(카카오톡/라인), 안 되면 false 반환(안내 필요)
export function escapeToExternalBrowser() {
  const ua = navigator.userAgent || "";
  const url = location.href;
  if (/KAKAOTALK/i.test(ua)) {
    location.href = "kakaotalk://web/openExternal?url=" + encodeURIComponent(url);
    return true;
  }
  if (/Line\//i.test(ua)) {
    location.href = url + (url.includes("?") ? "&" : "?") + "openExternalBrowser=1";
    return true;
  }
  if (/Android/i.test(ua) && (/Instagram|FBAN|FBAV|NAVER\(inapp|MicroMessenger/i.test(ua))) {
    // 안드로이드: Chrome 인텐트로 강제 오픈 시도
    const bare = url.replace(/^https?:\/\//, "");
    location.href = "intent://" + bare + "#Intent;scheme=https;package=com.android.chrome;end";
    return true;
  }
  return false; // iOS 인스타/페북 등은 직접 탈출 URL scheme이 없어 안내 필요
}

export {
  app, auth, db,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  signOut, onAuthStateChanged,
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, onSnapshot, serverTimestamp, increment,
  arrayUnion, arrayRemove, writeBatch,
};
