# AI 챗봇 비교 플랫폼

AI 모델들의 응답을 실시간으로 비교할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- **듀얼 패널 인터페이스**: 기본 모델과 고급 모델의 응답을 나란히 비교
- **다중 모델 지원**: 튜닝 모델, RAG, 웹검색 방식 선택 가능
- **실시간 채팅**: 양방향 대화 인터페이스
- **응답 내보내기**: PDF 형태로 채팅 내용 다운로드
- **샘플 프롬프트**: 미리 정의된 질문으로 빠른 테스트

## 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Framework**: Tailwind CSS, shadcn/ui
- **State Management**: React Hooks (useChat)
- **Icons**: Lucide React
- **Future**: FastAPI 백엔드, 데이터베이스 연동

## 개발 환경 설정

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

http://localhost:3000에서 애플리케이션에 접근할 수 있습니다.

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Feature Flags
NEXT_PUBLIC_ENABLE_PDF_EXPORT=true
NEXT_PUBLIC_ENABLE_WEB_SEARCH=true
NEXT_PUBLIC_ENABLE_RAG=true

# UI Configuration
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=2000
NEXT_PUBLIC_TYPING_SPEED=50
```

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # 전역 스타일
│   ├── layout.tsx         # 루트 레이아웃
│   └── page.tsx           # 메인 페이지
├── components/            # 재사용 컴포넌트
│   ├── ui/                # shadcn/ui 컴포넌트
│   ├── ChatMessage.tsx    # 채팅 메시지 컴포넌트
│   ├── ChatPanel.tsx      # 채팅 패널 컴포넌트
│   ├── MessageInput.tsx   # 메시지 입력 컴포넌트
│   └── SamplePrompts.tsx  # 샘플 프롬프트 컴포넌트
├── hooks/                 # React 훅
│   └── useChat.ts         # 채팅 상태 관리 훅
├── services/              # API 서비스 레이어
│   └── api.ts             # API 클라이언트
├── types/                 # TypeScript 타입 정의
│   └── chat.ts            # 채팅 관련 타입
├── constants/             # 상수 정의
│   └── prompts.ts         # 프롬프트 상수
└── config/                # 설정 파일
    └── env.ts             # 환경 변수 설정
```

## 빌드 및 배포

### 프로덕션 빌드
```bash
npm run build
npm start
```

### 미래 배포 계획
- **로컬 호스팅**: Cloudflare Tunnel을 통한 외부 접근
- **백엔드**: FastAPI 서버 연동
- **데이터베이스**: 채팅 세션 및 사용자 데이터 저장

## 개발 가이드

### 새로운 모델 추가
1. `src/types/chat.ts`에서 `ModelMethod` 타입 확장
2. `src/constants/prompts.ts`에서 `MODEL_NAMES` 업데이트
3. `src/services/api.ts`에서 API 엔드포인트 추가

### 새로운 컴포넌트 추가
- `src/components/` 디렉토리에 컴포넌트 생성
- TypeScript와 적절한 Props 인터페이스 사용
- shadcn/ui 컴포넌트 활용 권장

### API 연동
- `src/services/api.ts`의 `ApiService` 클래스 확장
- 환경 변수를 통한 설정 관리
- 적절한 에러 핸들링 구현

## 라이선스

MIT License