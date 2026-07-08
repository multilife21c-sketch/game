// ============================================================
//  portal-sdk.js  —  게임에 붙이는 통합 랭킹 SDK (같은 저장소 호스팅용)
// ------------------------------------------------------------
//  사용법: 게임 HTML 끝에 추가
//
//    <script type="module">
//      import { Nova } from "../../portal-sdk.js";   // games/<id>/ 기준 상대경로
//      Nova.init("neon-strikers");           // 포탈에 등록한 게임 ID
//      Nova.onUser(u => console.log(u?.displayName));  // (선택) 로그인 사용자
//      // 게임 오버 시:
//      Nova.reportScore(finalScore);
//    </script>
//
//  ※ 같은 도메인(같은 저장소)에 올린 게임은 포탈 로그인 세션을 그대로
//    공유하므로 별도 로그인 없이 점수가 그 사용자 이름으로 기록됩니다.
//  ※ 외부(다른 도메인) 호스팅 게임은 같은 Firebase 프로젝트로 직접
//    로그인 + 기록해야 합니다. (README 참고)
// ============================================================
import {
  DEMO, auth, db, onAuthStateChanged,
  collection, addDoc, serverTimestamp, doc, getDoc, setDoc,
} from "./firebase-config.js";

let GAME_ID = null;
// 🗓️ 주간 시즌 (ISO 주차, 예: 2026-W28) — 매주 월요일 자동으로 새 리더보드 시작
function _season(){
  const d = new Date();
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const ys = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const wk = Math.ceil((((t - ys) / 86400000) + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(wk).padStart(2, '0');
}
let CURRENT = null;
const userCbs = [];

export const Nova = {
  init(gameId){ GAME_ID = gameId; return Nova; },
  season(){ return _season(); },

  onUser(cb){ userCbs.push(cb); if(CURRENT!==undefined) cb(CURRENT); return Nova; },

  get user(){ return CURRENT; },

  // 점수 보고 — 그 사용자의 최고 점수만 갱신(원하면 always=true로 매판 기록)
  async reportScore(score, { always=false } = {}){
    if(DEMO){ console.info("[Nova] demo mode — score not sent:", score); return false; }
    if(!GAME_ID){ console.warn("[Nova] init(gameId) 먼저 호출하세요"); return false; }
    if(!CURRENT){ console.info("[Nova] 비로그인 — 점수 미기록"); return false; }
    score = Math.round(Number(score)||0);
    try{
      // 사용자별 최고기록 문서: scores/{gameId}_{uid}
      const SEASON = _season();
      const ref = doc(db, "scores", `${GAME_ID}_${SEASON}_${CURRENT.uid}`);
      if(!always){
        const prev = await getDoc(ref);
        if(prev.exists() && (prev.data().score||0) >= score) return false;
      }
      await setDoc(ref, {
        gameId: GAME_ID, uid: CURRENT.uid, season: SEASON,
        name: CURRENT.displayName || "익명", photoURL: CURRENT.photoURL || "",
        score, createdAt: serverTimestamp(),
      }, { merge:true });
      return true;
    }catch(e){ console.error("[Nova] reportScore 실패", e); return false; }
  },
};

if(!DEMO){
  onAuthStateChanged(auth, async (u)=>{
    if(u){
      // 포탈에서 설정한 랭킹 닉네임을 우선 사용 (없으면 구글 이름)
      let nick=null;
      try{ const s=await getDoc(doc(db,"users",u.uid));
        if(s.exists()) nick=s.data().nickname||null; }catch(e){}
      CURRENT={ uid:u.uid, displayName: nick||u.displayName, photoURL:u.photoURL, googleName:u.displayName };
    } else CURRENT=null;
    userCbs.forEach(cb=>{ try{ cb(CURRENT); }catch(e){} });
  });
}else{ CURRENT = null; }
