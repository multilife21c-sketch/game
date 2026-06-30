# 🕹️ NOVA ARCADE — 게임 허브 포탈

다양한 게임을 한 곳에 모아 **계속 추가하며 운영**하는 정적(static) 게임 포탈입니다.
빌드 과정 없이 Vercel / GitHub Pages에 그대로 올리면 됩니다.

---

## 📁 폴더 구조

```
game-portal/
├─ index.html          # 포탈 메인 (갤러리·검색·로그인·즐겨찾기·랭킹)
├─ admin.html          # 관리자: 게임 추가/수정/삭제 UI
├─ firebase-config.js  # ⭐ 여기 한 곳만 채우면 됨 (키 + 관리자 UID)
├─ portal-sdk.js       # 게임에 붙이는 통합 랭킹 SDK
├─ games.json          # 시드 카탈로그 (데모 모드 + 최초 가져오기용)
├─ firestore.rules     # Firebase 보안 규칙 (콘솔에 붙여넣기)
└─ games/
   ├─ neon-strikers/index.html   # ✅ 슬롯 완료 (즉시 동작)
   └─ nationrise/index.html      # ✅ 슬롯 완료 (즉시 동작)
   └─ (cosmic-gear 는 React라 별도 배포 → URL 등록)
```

---

## 🚦 2단계로 돌리기

### 1단계 — 일단 그냥 보기 (데모 모드, 5초)

`firebase-config.js`를 안 채워도 **갤러리는 바로 동작**합니다.
로컬 확인:

```bash
cd game-portal
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000
```

데모 모드에서는 `games.json`을 읽어 갤러리/검색/필터/게임 실행이 됩니다.
(로그인·즐겨찾기·랭킹은 회색으로 비활성 — 2단계에서 켜집니다.)

> ⚠️ `index.html`을 파일(`file://`)로 직접 열면 `fetch`가 막혀 빈 화면이 됩니다. 반드시 위처럼 **서버로 띄우거나 배포**해서 확인하세요.

### 2단계 — 로그인·즐겨찾기·랭킹 켜기 (Firebase, 약 10분)

| 순서 | 작업 |
|---|---|
| 1 | [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성 → **웹 앱 추가** |
| 2 | 표시되는 `firebaseConfig` 값을 `firebase-config.js`에 붙여넣기 |
| 3 | **Authentication → Sign-in method → Google** 사용 설정 |
| 4 | **Firestore Database** 생성 (프로덕션 모드) |
| 5 | **Firestore → 규칙** 에 `firestore.rules` 내용 붙여넣고 게시 |
| 6 | 한 번 본인 계정으로 로그인 → 콘솔 **Authentication → Users** 에서 내 **UID** 복사 |
| 7 | 그 UID를 `firebase-config.js`의 `ADMIN_UIDS` **와** `firestore.rules`의 `isAdmin()` 두 곳에 넣기 |

이제 `apiKey`가 실제 값으로 바뀌면 데모 배너가 사라지고 모든 기능이 켜집니다.

---

## 🚀 배포

**GitHub Pages**: 이 폴더를 저장소에 push → Settings → Pages → 브랜치 지정. 끝.
**Vercel**: 폴더를 import → 프레임워크 "Other" → 빌드 명령 없음(정적). 끝.

> Firebase 콘솔 **Authentication → Settings → 승인된 도메인**에 배포 주소(`xxx.github.io`, `xxx.vercel.app`)를 추가해야 구글 로그인이 됩니다.

---

## ➕ 게임 추가하는 법 (운영의 핵심)

### A. 같은 저장소에 올리는 HTML 게임 (단일 파일)

1. `games/내게임/index.html` 로 파일 복사
2. `admin.html` 접속 → **+ 새 게임** → URL에 `games/내게임/` 입력 → 추가
3. 끝. 포탈에 카드가 즉시 뜸

### B. 외부 호스팅 게임 (예: COSMIC GEAR / React)

1. 게임을 자체 Vercel 등으로 배포
2. `admin.html` → **+ 새 게임** → URL에 `https://...vercel.app/` 전체 주소 등록

> Firebase 설정 전이라면 `admin.html` 대신 `games.json`에 직접 항목을 추가해도 됩니다. 설정 후엔 admin에서 **games.json 가져오기** 버튼으로 한 번에 등록할 수 있습니다.

---

## 🏆 게임에 통합 랭킹 붙이기 (선택)

게임이 점수를 같은 Firebase로 보고하면 포탈 랭킹에 쌓입니다.
**같은 저장소에 올린 게임은 포탈 로그인 세션을 공유**하므로 게임 안에서 따로 로그인할 필요가 없습니다.

게임 HTML 끝에 추가:

```html
<script type="module">
  import { Nova } from "../../portal-sdk.js";   // games/<id>/ 기준
  Nova.init("neon-strikers");                    // admin에 등록한 게임 ID와 동일하게

  // 게임 오버 시 (그 사용자의 최고점만 갱신됨):
  Nova.reportScore(finalScore);
</script>
```

그리고 admin에서 해당 게임의 **"점수 보고(랭킹)"** 체크박스를 켜면 카드의 🏆 랭킹에서 TOP 20이 보입니다.
(첫 조회 시 Firestore가 복합 색인 생성 링크를 콘솔 오류로 안내합니다 — 클릭 한 번으로 생성.)

> 외부 도메인 게임은 세션 공유가 안 되므로, 같은 Firebase 프로젝트로 자체 로그인 후 동일 방식으로 기록하면 됩니다.

---

## 🎨 커스터마이징 메모

- **사이트 이름**: `index.html`의 헤더 `NOVA ARCADE` 텍스트, `<title>` 수정
- **테마 색**: 각 파일 상단 `:root` CSS 변수 (`--amber`, `--cyan` 등)
- **게임 카드 색**: 게임별 `accent` / `accent2` (admin의 색상 피커)
- **대표 게임(히어로)**: admin에서 "대표 게임" 체크 (하나만)

---

## 🧱 데이터 모델 (Firestore)

| 컬렉션 | 문서 | 용도 |
|---|---|---|
| `games` | `{gameId}` | 게임 카탈로그 (admin이 관리, 누구나 읽기) |
| `users` | `{uid}` | 프로필 + 즐겨찾기 배열 (본인만) |
| `scores` | `{gameId}_{uid}` | 사용자별 최고 점수 (통합 랭킹) |

`playCount`는 `games` 문서 안의 필드로, 로그인 사용자가 플레이할 때만 +1 됩니다.
