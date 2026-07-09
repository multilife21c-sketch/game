# 보안 정책 (Security)

## GitHub Secret Scanning 경고에 대하여

이 저장소에는 Firebase **웹 API 키**가 포함되어 있으며, GitHub Secret Scanning이
"Google API Key"로 이를 감지할 수 있습니다. **이는 진짜 비밀 유출이 아닙니다.**

Firebase 웹 API 키는 브라우저에서 Firebase에 접속하기 위해 **클라이언트 코드에
반드시 공개되어야 하는 식별자**입니다. Google 공식 문서도 이 키가 노출되어도
안전하다고 명시합니다:
https://firebase.google.com/docs/projects/api-keys

즉 이 키는 비밀번호가 아니라 "프로젝트 주소"에 가깝습니다.

## 실제 보호 장치 (2단계)

웹 API 키는 지울 수 없으므로(지우면 앱이 동작하지 않음), 실제 보호는 아래로 합니다.

### 1. Firestore 보안 규칙 — `firestore.rules`
- 로그인한 본인만 자신의 점수 기록 가능
- 문서 ID 형식 강제: `{gameId}_{season}_{uid}`
- 게임별 점수 상한 + 필드 화이트리스트 (콘솔 치트 차단)
- Firebase 콘솔 → Firestore Database → 규칙 에 게시해야 적용됨

### 2. API 키 HTTP 리퍼러 제한 — Google Cloud Console
- 콘솔 → API 및 서비스 → 사용자 인증 정보 → 해당 브라우저 키
- "애플리케이션 제한사항" → **HTTP 리퍼러(웹사이트)** 선택
- 아래 도메인만 허용:
  - `https://multilife21c-sketch.github.io/*`
  - `https://game-sooty-gamma.vercel.app/*`
  - `https://nova-arcade-55375.firebaseapp.com/*`
  - `https://nova-arcade-55375.web.app/*`
- (API 제한사항은 건드리지 않음 — "키 제한 안함" 유지)
- 이렇게 하면 키가 노출되어도 **허용 도메인 밖에서는 무용지물**이 됩니다.

## GitHub 경고 닫기
위 2단계 적용 후, GitHub → Security → Secret scanning 에서 각 경고를
**Dismiss → "Used in tests" 또는 "Won't fix"** 로 닫으면 됩니다
(Firebase 웹 키는 공개가 정상이므로 정당한 사유입니다).
