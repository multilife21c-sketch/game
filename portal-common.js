// ============================================================
//  NOVA ARCADE — 공통 시작화면 헤더 & 데일리 도전 SDK
//  사용법: <script type="module">
//            import { NovaHeader } from "../../portal-common.js";
//            NovaHeader.mount(document.getElementById('some-container'));
//          </script>
//  자동 표시: 프로필, 닉네임, 이번 주 순위, 내 최고점, 오늘의 데일리 배지
//  자동 감지: 게임 ID (Nova.init이 먼저 호출되어 있어야 함)
// ============================================================
import { Nova } from "./portal-sdk.js";
import { DEMO, db, collection, query, where, orderBy, limit, getDocs,
         doc, getDoc, setDoc, serverTimestamp } from "./firebase-config.js";

// ============================================================
//  데일리 도전 정의 (매일 랜덤 3개 선정)
//  key: 고유 ID / gameId / desc / target(달성 기준 점수) / points(보상)
// ============================================================
const DAILY_POOL = [
  { key:'ns_score_2000',  gameId:'neon-snap',      desc:'NEON SNAP 점수 2000+',      target:2000,   points:10 },
  { key:'ns_stage_3',     gameId:'neon-snap',      desc:'NEON SNAP 스테이지 3 도달', target:3,      points:15, metric:'stage' },
  { key:'nd_streak_3',    gameId:'neon-duel',      desc:'NEON DUEL 3연승',           target:300000, points:15 },
  { key:'nd_streak_5',    gameId:'neon-duel',      desc:'NEON DUEL 5연승',           target:500000, points:25 },
  { key:'ng_win',         gameId:'neural-grid',    desc:'NEURAL GRID 클리어 1회',    target:10000,  points:15 },
  { key:'ng_score_50k',   gameId:'neural-grid',    desc:'NEURAL GRID 50,000점',      target:50000,  points:20 },
  { key:'st_trophy_100',  gameId:'neon-strikers',  desc:'NEON STRIKERS 트로피 +100', target:100,    points:15, metric:'delta' },
  { key:'st_trophy_200',  gameId:'neon-strikers',  desc:'NEON STRIKERS 트로피 +200', target:200,    points:25, metric:'delta' },
  { key:'nr_score_5k',    gameId:'neon-runner',    desc:'NEON RUNNER 5,000점',       target:5000,   points:15 },
  { key:'nr_score_20k',   gameId:'neon-runner',    desc:'NEON RUNNER 20,000점',      target:20000,  points:25 },
  { key:'cg_wave_20',     gameId:'cosmic-gear',    desc:'COSMIC GEAR 웨이브 20',     target:20,     points:20 },
  { key:'nb_score_15k',   gameId:'neon-beat',      desc:'NEON BEAT 15,000점 달성',   target:15000,  points:15 },
  { key:'nb_score_40k',   gameId:'neon-beat',      desc:'NEON BEAT 40,000점 달성',   target:40000,  points:25 },
];

const _ymd = () => {
  const d = new Date(); // KST 자정 기준
  const kst = new Date(d.getTime() + 9*3600*1000);
  return kst.toISOString().slice(0,10); // "2026-07-11"
};

// 오늘의 도전 3개 (날짜 시드 기반 결정적 선택 → 모든 유저에게 동일)
function _pickDaily(ymd){
  let h = 0; for(const c of ymd) h = (h*31 + c.charCodeAt(0)) | 0;
  const pool = DAILY_POOL.slice();
  const picks = [];
  for(let i=0; i<3 && pool.length; i++){
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    picks.push(pool.splice(h % pool.length, 1)[0]);
  }
  return picks;
}

// ============================================================
//  NovaHeader — 게임 시작화면에 공통 헤더 렌더
// ============================================================
export const NovaHeader = {
  _gameId: null,
  _user: null,
  _stats: null,   // {rank, best, totalUsers}

  async mount(container, gameId){
    if(!container) return;
    this._gameId = gameId || (window.__NOVA_GAME_ID || null);
    // 스타일 주입 (1회만)
    if(!document.getElementById('nova-header-css')){
      const st = document.createElement('style'); st.id = 'nova-header-css';
      st.textContent = `
      .nova-header{background:linear-gradient(135deg,rgba(13,22,38,.9),rgba(20,14,42,.9));
        border:1px solid #2c4060;border-radius:14px;padding:14px 16px;
        display:flex;flex-direction:column;gap:10px;
        font-family:'Noto Sans KR',system-ui,sans-serif;color:#e6ecf7;
        max-width:520px;width:100%;box-sizing:border-box;box-shadow:0 6px 22px rgba(0,0,0,.3);}
      .nova-header .nh-top{display:flex;align-items:center;gap:12px;}
      .nova-header .nh-av{width:44px;height:44px;border-radius:50%;border:2px solid #22d3ee;
        background:#0d1830;object-fit:cover;box-shadow:0 0 12px rgba(34,211,238,.4);flex-shrink:0;}
      .nova-header .nh-hi{flex:1;min-width:0;}
      .nova-header .nh-nick{font-weight:900;font-size:18px;
        background:linear-gradient(90deg,#22d3ee,#a855f7);-webkit-background-clip:text;background-clip:text;color:transparent;
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .nova-header .nh-sub{font-size:12px;color:#8194ad;margin-top:2px;}
      .nova-header .nh-stats{display:flex;gap:10px;flex-wrap:wrap;}
      .nova-header .nh-stat{flex:1;min-width:120px;background:rgba(13,22,38,.6);
        border:1px solid #1e2c43;border-radius:10px;padding:8px 10px;display:flex;flex-direction:column;gap:2px;}
      .nova-header .nh-lbl{font-size:10.5px;color:#8194ad;letter-spacing:.4px;}
      .nova-header .nh-val{font-weight:900;font-size:15px;color:#ffd23f;font-family:'Orbitron','Noto Sans KR',sans-serif;}
      .nova-header .nh-stat.rank .nh-val{color:#22d3ee;}
      .nova-header .nh-daily{background:rgba(255,210,63,.06);border:1px solid rgba(255,210,63,.3);
        border-radius:10px;padding:8px 10px;}
      .nova-header .nh-dhead{display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#ffd23f;font-weight:700;}
      .nova-header .nh-dhead b{font-family:'Orbitron',sans-serif;}
      .nova-header .nh-dlist{display:flex;gap:6px;margin-top:6px;}
      .nova-header .nh-dbadge{flex:1;background:rgba(0,0,0,.35);border-radius:6px;padding:5px 6px;
        font-size:11px;color:#c9d4e5;line-height:1.35;text-align:left;position:relative;
        border:1px solid rgba(255,210,63,.15);}
      .nova-header .nh-dbadge.done{background:rgba(61,220,151,.15);border-color:rgba(61,220,151,.6);color:#c8f5df;}
      .nova-header .nh-dbadge .nh-dpt{position:absolute;top:3px;right:5px;font-size:9.5px;color:#ffd23f;font-weight:900;}
      .nova-header .nh-dbadge.done .nh-dpt{color:#3ddc97;}
      .nova-header .nh-dbadge .nh-check{display:none;}
      .nova-header .nh-dbadge.done .nh-check{display:inline;color:#3ddc97;font-weight:900;}
      .nova-header .nh-empty{padding:14px;text-align:center;color:#8194ad;font-size:13px;}
      `;
      document.head.appendChild(st);
    }
    container.innerHTML = `
      <div class="nova-header">
        <div class="nh-top">
          <img class="nh-av" id="nh-avatar" alt="">
          <div class="nh-hi">
            <div class="nh-nick" id="nh-nick">확인 중…</div>
            <div class="nh-sub" id="nh-sub">포탈에 로그인하면 랭킹·기록이 연동됩니다</div>
          </div>
        </div>
        <div class="nh-stats" id="nh-stats" style="display:none;">
          <div class="nh-stat rank"><span class="nh-lbl">🏆 이번 주 순위</span><span class="nh-val" id="nh-rank">–</span></div>
          <div class="nh-stat"><span class="nh-lbl">⭐ 내 최고점</span><span class="nh-val" id="nh-best">–</span></div>
        </div>
        <div class="nh-daily" id="nh-daily" style="display:none;">
          <div class="nh-dhead"><span>🎯 오늘의 도전</span><span>보유 <b id="nh-dpoints">0</b> P</span></div>
          <div class="nh-dlist" id="nh-dlist"></div>
        </div>
      </div>`;
    Nova.onUser(u => this._onUser(u));
  },

  async _onUser(u){
    this._user = u || null;
    const av = document.getElementById('nh-avatar');
    const nick = document.getElementById('nh-nick');
    const sub = document.getElementById('nh-sub');
    const stats = document.getElementById('nh-stats');
    const daily = document.getElementById('nh-daily');
    if(!u){
      if(av){ av.style.display='none'; }
      if(nick) nick.textContent = '⚪ 비로그인';
      if(sub) sub.textContent = '포탈에서 구글 로그인하면 랭킹·닉네임·도전 진행이 저장됩니다';
      if(stats) stats.style.display='none';
      if(daily) daily.style.display='none';
      return;
    }
    if(av){
      if(u.photoURL){ av.src = u.photoURL; av.style.display=''; }
      else av.style.display='none';
    }
    if(nick) nick.textContent = u.displayName || '플레이어';
    if(sub) sub.textContent = '🟢 로그인됨 · 통합 랭킹 · 데일리 도전 진행 중';
    // 랭킹/최고점 표시
    if(stats && this._gameId){ stats.style.display='flex'; await this._loadStats(u.uid); }
    // 데일리 도전
    if(daily){ daily.style.display='block'; await this._loadDaily(u.uid); }
  },

  async _loadStats(uid){
    if(DEMO) return;
    try{
      const season = Nova.season();
      // 이번 주 이 게임 상위 200 → 그 안에서 내 위치와 내 최고점
      const snap = await getDocs(query(collection(db,'scores'),
        where('gameId','==',this._gameId), orderBy('score','desc'), limit(200)));
      const rows = snap.docs.map(d=>d.data()).filter(x => (x.season||null) === season);
      let rank = 0, best = 0;
      rows.forEach((r,i)=>{ if(r.uid===uid){ rank = i+1; best = Number(r.score||0); } });
      const rEl = document.getElementById('nh-rank');
      const bEl = document.getElementById('nh-best');
      if(rEl) rEl.textContent = rank ? ('#'+rank) : '–';
      if(bEl) bEl.textContent = best ? best.toLocaleString() : '–';
    }catch(e){ console.warn('[NovaHeader] stats', e); }
  },

  async _loadDaily(uid){
    if(DEMO) return;
    try{
      const ymd = _ymd();
      const picks = _pickDaily(ymd);
      // 유저 문서에서 오늘 진행/포인트 로드
      const uref = doc(db, 'users', uid);
      const usnap = await getDoc(uref);
      const udata = usnap.exists() ? usnap.data() : {};
      const prog = (udata.dailyProgress && udata.dailyProgress.ymd === ymd) ? (udata.dailyProgress.done||{}) : {};
      const pts = Number(udata.dpoints||0);
      const dpEl = document.getElementById('nh-dpoints'); if(dpEl) dpEl.textContent = pts;
      const list = document.getElementById('nh-dlist'); if(!list) return;
      list.innerHTML = picks.map(p=>`
        <div class="nh-dbadge ${prog[p.key]?'done':''}">
          <span class="nh-dpt">+${p.points}P <span class="nh-check">✓</span></span>
          ${p.desc}
        </div>`).join('');
    }catch(e){ console.warn('[NovaHeader] daily', e); }
  },

  // 게임에서 호출: 점수 획득 시 데일리 자동 체크
  //   NovaHeader.checkDaily({ score: 2500, stage: 4 })
  async checkDaily(metrics){
    if(DEMO || !this._user || !this._gameId) return;
    try{
      const uid = this._user.uid;
      const ymd = _ymd();
      const picks = _pickDaily(ymd);
      const uref = doc(db, 'users', uid);
      const usnap = await getDoc(uref);
      const udata = usnap.exists() ? usnap.data() : {};
      const cur = (udata.dailyProgress && udata.dailyProgress.ymd === ymd) ? (udata.dailyProgress.done||{}) : {};
      let newlyDone = [];
      let ptsAdd = 0;
      for(const p of picks){
        if(p.gameId !== this._gameId || cur[p.key]) continue;
        // metric 결정
        const val = (p.metric === 'stage') ? Number(metrics.stage||0)
                  : (p.metric === 'delta') ? Number(metrics.delta||0)
                  : Number(metrics.score||0);
        if(val >= p.target){ cur[p.key] = true; newlyDone.push(p); ptsAdd += p.points; }
      }
      if(newlyDone.length === 0) return;
      // 저장
      await setDoc(uref, {
        dailyProgress: { ymd, done: cur },
        dpoints: (Number(udata.dpoints||0) + ptsAdd),
        lastSeen: serverTimestamp()
      }, { merge: true });
      // 화면 갱신
      await this._loadDaily(uid);
      // 축하 배너
      this._celebrate(newlyDone, ptsAdd);
    }catch(e){ console.warn('[NovaHeader] checkDaily', e); }
  },

  _celebrate(list, pts){
    const w = document.createElement('div');
    w.style.cssText = 'position:fixed;top:20%;left:50%;transform:translateX(-50%);z-index:99999;'
      + 'background:linear-gradient(135deg,#ffd23f,#ff8c42);color:#1a1206;padding:16px 22px;'
      + 'border-radius:14px;font-family:\'Noto Sans KR\',sans-serif;font-weight:900;font-size:15px;'
      + 'box-shadow:0 10px 40px rgba(255,140,60,.5);text-align:center;max-width:88vw;';
    w.innerHTML = `🎉 데일리 도전 ${list.length}개 완료! <br>+${pts} 포인트<br>`
      + list.map(p=>`<span style="font-size:12px;font-weight:500;">✓ ${p.desc}</span>`).join('<br>');
    document.body.appendChild(w);
    setTimeout(()=>{ w.style.transition='opacity .5s'; w.style.opacity=0; setTimeout(()=>w.remove(), 500); }, 3200);
  }
};

// 편의를 위한 export
export { _ymd, _pickDaily, DAILY_POOL };
