# Claude Code Project Memory

> 🤖 AI Chat Comparison Platform 개발 히스토리 및 프로젝트 메모리

## 📋 프로젝트 개요

### 프로젝트명
AI Chat Comparison Platform - 듀얼 패널 AI 모델 비교 플랫폼

### 개발 기간
2024년 개발 시작 (계속 진행 중)

### 기술 스택
- **Frontend**: Next.js 15 + React 19 + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI + Python 3.8+ + Pydantic + httpx
- **AI**: vLLM 서빙 (localhost:8000)
- **Package Management**: uv (Python), npm (Node.js)

## 🏗️ 아키텍처 설계

### 전체 구조
```
AI Chat Platform
├── Frontend (Next.js) :3000
├── Backend (FastAPI) :3001  
└── vLLM Server :8000
```

### 주요 컴포넌트
1. **듀얼 채팅 패널**: 기본 모델 vs 고급 모델 비교
2. **실시간 스트리밍**: SSE를 통한 자연스러운 응답
3. **모델 선택**: 튜닝/RAG/웹검색 모드 지원
4. **UI/UX**: 반응형 디자인과 직관적인 인터페이스

## 🔧 핵심 기능 구현

### 1. 실시간 스트리밍 시스템
- **백엔드**: FastAPI StreamingResponse + vLLM 연동
- **프론트엔드**: Fetch API + ReadableStream
- **프로토콜**: 청크 단위 실시간 전송
- **메타데이터**: `[METADATA]{}[/METADATA]` 마커 사용

### 2. 스트리밍 구현 상세
```typescript
// 프론트엔드 스트리밍 처리
const reader = response.body?.getReader();
while (!done) {
  const chunk = decoder.decode(value, { stream: true });
  if (!chunk.includes('[METADATA]')) {
    onChunk(chunk); // 실시간 업데이트
  }
}
```

```python
# 백엔드 스트리밍 처리  
async for chunk in vllm_client.chat_completion_stream():
  content_chunk = chunk["choices"][0]["delta"]["content"]
  yield content_chunk  # 즉시 전송
```

### 3. 상태 관리
- **useChat 훅**: 중앙화된 채팅 상태 관리
- **메시지 상태**: 로딩/완료/에러 상태 관리
- **모델 선택**: 고급 모델 동적 변경

## 🐛 해결한 주요 문제들

### 1. 스트리밍 중복 텍스트 문제
**문제**: 스트리밍 중 한 줄로 출력 후 마지막에 전체 텍스트 중복 표시
**원인**: 
- 백엔드에서 메타데이터 앞 불필요한 `\n\n` 추가
- 프론트엔드에서 버퍼 내용 중복 전송
**해결**:
- 백엔드: `yield content_chunk` (raw content만)
- 프론트엔드: 청크 즉시 전송, 메타데이터는 완료 신호로만 사용

### 2. 줄바꿈 처리 문제
**문제**: 스트리밍 중 줄바꿈 무시되어 한 줄로 표시
**원인**: `chunk.replace(/\n/g, '')` 으로 모든 줄바꿈 제거
**해결**: `chunk.trim()` 만 사용하여 줄바꿈 보존

### 3. 메시지 간격 조정
**요구사항**: AI 응답 후 간격↑, 사용자 메시지 후 간격↓
**해결**: 
- 사용자 메시지: `mb-4` (16px)
- AI 응답: `mb-8` (32px)
- 토큰 정보: `bottom-4` (말풍선에서 16px 떨어짐)

### 4. 포트 관리
**문제**: 포트 충돌 및 환경별 포트 변경
**해결**: 
- 환경 변수 기반 포트 설정
- run.py에서 `PORT` 환경 변수 지원
- 프론트엔드 설정: 3002 포트 임시 사용

## 📁 파일 구조와 역할

### 백엔드 핵심 파일
```
back/src/
├── main.py              # FastAPI 앱 생성, CORS, 라이프사이클
├── api/chat.py          # 채팅 엔드포인트, 스트리밍 로직
├── services/vllm_client.py # vLLM 클라이언트, 모델 관리
├── models/chat.py       # Pydantic 데이터 모델
└── config/settings.py   # 환경 설정 관리
```

### 프론트엔드 핵심 파일
```
front/src/
├── app/page.tsx         # 메인 페이지 (듀얼 패널)
├── hooks/useChat.ts     # 채팅 상태 관리 훅
├── services/api.ts      # FastAPI 백엔드 통신
├── components/
│   ├── ChatMessage.tsx  # 개별 메시지 컴포넌트
│   ├── ChatSkeleton.tsx # 로딩 스켈레톤
│   └── ChatPanel.tsx    # 채팅 패널 컨테이너
└── config/env.ts        # 환경 설정
```

## 🎯 개발 원칙과 패턴

### 1. 코드 구조 원칙
- **단일 책임**: 각 컴포넌트/함수는 하나의 역할만
- **타입 안전성**: TypeScript 적극 활용
- **재사용성**: 컴포넌트 기반 설계
- **확장성**: 새로운 모델 추가 용이한 구조

### 2. 에러 처리
- **백엔드**: try-catch + 구조화된 로깅
- **프론트엔드**: onError 콜백 + 사용자 친화적 메시지
- **타임아웃**: 120초 제한으로 무한 대기 방지

### 3. 사용자 경험
- **실시간 피드백**: 타이핑하는듯한 응답 표시
- **로딩 상태**: 스켈레톤 UI로 자연스러운 대기
- **반응형**: 모바일부터 데스크톱까지 대응

## 🔄 현재 상태

### 완료된 기능
- ✅ 듀얼 패널 채팅 인터페이스
- ✅ 실시간 스트리밍 응답 (기본 모델)
- ✅ vLLM 서버 연동 및 모델 관리
- ✅ 메시지 간격 및 UI 최적화
- ✅ 에러 처리 및 로깅 시스템
- ✅ 타입 안전한 API 통신

### 개발 중/예정 기능
- 🔄 고급 모델 구현 (튜닝/RAG/웹검색) - 현재는 "개발 중" 메시지
- 🔄 PDF 내보내기 기능
- 🔄 세션 저장/로드 기능
- 🔄 사용자 인증 시스템

## 🚀 배포 및 운영

### 개발 환경
- **프론트엔드**: `npm run dev` (localhost:3000)
- **백엔드**: `uv run python run.py` (localhost:3001/3002)
- **vLLM**: 별도 서버 (localhost:8000)

### 환경 변수 관리
```bash
# 백엔드
PORT=3001
VLLM_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

# 프론트엔드  
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## 💡 학습 내용과 개선점

### 기술적 학습
1. **스트리밍 처리**: ReadableStream과 async generator 활용
2. **상태 관리**: React 훅을 통한 복잡한 상태 관리
3. **타입 시스템**: 프론트엔드-백엔드 타입 일관성
4. **API 설계**: RESTful 원칙과 실시간 통신 병행

### 앞으로의 개선 방향
1. **성능 최적화**: 메모이제이션, 가상화 적용
2. **테스트 코드**: 단위/통합 테스트 구축
3. **모니터링**: 로그 분석 및 성능 메트릭
4. **확장성**: 마이크로서비스 아키텍처 고려

## 🔗 중요한 설계 결정

### 1. 스트리밍 프로토콜
**선택**: 단순한 텍스트 스트리밍 + 메타데이터 마커
**이유**: 구현 단순성, 디버깅 용이성
**장점**: 실시간 응답, 자연스러운 UX
**단점**: 바이너리 데이터 처리 제한

### 2. 상태 관리 방식
**선택**: React 훅 기반 상태 관리
**이유**: 프로젝트 규모에 적합, 학습 비용 낮음
**대안**: Redux, Zustand 등 고려했으나 불필요

### 3. API 설계
**선택**: RESTful + 스트리밍 하이브리드
**구조**: `/api/chat/{method}` 형태
**확장성**: 새로운 모델 추가 시 엔드포인트 추가

## 🏃‍♀️ 다음 단계

### 단기 목표 (1-2주)
- [ ] 통합 명령어 스크립트 작성
- [ ] 브라우저 자동 실행 비활성화
- [ ] 고급 모델 실제 구현 시작

### 중기 목표 (1-2개월)
- [ ] PDF 내보내기 기능 완성
- [ ] 사용자 세션 관리
- [ ] 성능 최적화 및 캐싱

### 장기 목표 (3-6개월)
- [ ] 사용자 인증 시스템
- [ ] 모델 성능 분석 대시보드
- [ ] 클라우드 배포 및 확장

---

**마지막 업데이트**: 2024년
**주요 기여자**: Claude Assistant + 사용자