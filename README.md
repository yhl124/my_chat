# AI Chat Platform

완전한 AI 챗봇 비교 플랫폼 - vLLM 로컬 서빙과 FastAPI 백엔드, Next.js 프론트엔드로 구성

## 🚀 빠른 시작

### 통합 관리 도구 사용 (권장)


```bash
# 루트 폴더에서 back의 uv venv로 실행
uv run --project back python manage.py start all

# 모든 서비스 시작 (브라우저 자동 실행 없음)
python manage.py start all

# 개별 서비스 관리
python manage.py start backend     # 백엔드만 시작
python manage.py start frontend    # 프론트엔드만 시작
python manage.py restart all       # 모든 서비스 재시작
python manage.py stop all          # 모든 서비스 중지

# 상태 및 관리
python manage.py status            # 서비스 상태 확인
python manage.py logs backend      # 백엔드 로그 확인
python manage.py health            # 시스템 건강 상태 점검
python manage.py install          # 모든 의존성 설치
python manage.py clean             # 로그 파일 정리
```

### 수동 실행 방법

#### 백엔드만 실행
```bash
cd back
uv run python run.py              # 포트 3001
# 또는
PORT=3002 uv run python run.py    # 다른 포트 사용
```

#### 프론트엔드만 실행
```bash
cd front
npm run dev                       # 브라우저 자동 실행 없음
npm run dev:open                  # 브라우저 자동 실행 포함
```

## 📋 시스템 요구사항

### 필수 요구사항
- **Python 3.12+** - 백엔드 실행
- **Node.js 18+** - 프론트엔드 실행
- **[uv](https://docs.astral.sh/uv/)** - Python 패키지 관리
- **vLLM 서버** - 로컬 8000번 포트에서 실행 중

### 선택사항
- **Cloudflare Tunnel** - 외부 접속용

## 🏗️ 아키텍처

```
my_chat/
├── front/          # Next.js 프론트엔드 (포트 3000)
├── back/           # FastAPI 백엔드 (포트 3001) 
├── logs/           # 로그 파일들
├── start-all.*     # 전체 시작 스크립트
└── stop-all.*      # 전체 종료 스크립트
```

## 🌐 포트 구성

| 서비스 | 포트 | 설명 |
|--------|------|------|
| 프론트엔드 | 3000 | Next.js 개발 서버 |
| 백엔드 | 3001 | FastAPI 서버 |
| vLLM | 8000 | LLM 모델 서빙 |

## 📊 로그 시스템

### 로그 파일 위치
```
logs/
├── startup.log        # 시작 로그
├── backend.log        # 백엔드 로그
├── backend_error.log  # 백엔드 에러 로그
└── frontend.log       # 프론트엔드 로그
```

### 로그 기능
- **자동 로테이션**: 10MB마다 파일 분할
- **에러 분리**: 에러는 별도 파일에 저장
- **프론트엔드 로거**: 브라우저에서 로그 뷰어 제공
- **실시간 모니터링**: 콘솔과 파일에 동시 출력

### 프론트엔드 로그 뷰어
- 브라우저 우측 하단의 "🔍 Logs" 버튼 클릭
- 실시간 로그 확인, 필터링, 다운로드 가능
- 전역 에러 핸들링 및 자동 로깅

## 🔧 설정

### 백엔드 설정 (.env)
```env
# 서버 설정
HOST=localhost
PORT=3001
DEBUG=false

# 프론트엔드 URL (CORS)
FRONTEND_URL=http://localhost:3000

# vLLM 서버 설정
VLLM_HOST=localhost
VLLM_PORT=8000

# Cloudflare 터널 지원
CLOUDFLARE_TUNNEL_URL=https://your-tunnel.trycloudflare.com
USE_TUNNEL=false
```

### 프론트엔드 설정 (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000
```

## 📡 API 엔드포인트

### 백엔드 API
- **Health Check**: `GET /health`
- **모델 목록**: `GET /api/models`
- **기본 채팅**: `POST /api/chat/basic`
- **튜닝 모델**: `POST /api/chat/tuning`
- **RAG 채팅**: `POST /api/chat/rag`
- **웹 검색**: `POST /api/chat/websearch`

### API 문서
- **Swagger UI**: http://localhost:3001/docs
- **ReDoc**: http://localhost:3001/redoc

## 🔍 모니터링 및 디버깅

### 상태 확인
```bash
# vLLM 서버 확인
curl http://localhost:8000/v1/models

# 백엔드 상태 확인  
curl http://localhost:3001/health

# 프론트엔드 접속
open http://localhost:3000
```

### 로그 실시간 확인
```bash
# 백엔드 로그
tail -f logs/backend.log

# 에러 로그
tail -f logs/backend_error.log

# 프론트엔드 로그
tail -f logs/frontend.log
```

## 🌍 프로덕션 배포

### Cloudflare Tunnel 설정
1. Cloudflare Tunnel 생성
2. 백엔드 환경 변수 설정:
   ```env
   CLOUDFLARE_TUNNEL_URL=https://your-tunnel.trycloudflare.com
   USE_TUNNEL=true
   ```
3. 터널 실행:
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

## 🛠️ 개발

### 개발 모드 실행
```bash
# 백엔드 디버그 모드
cd back
DEBUG=true ./start.sh

# 프론트엔드 개발 서버
cd front  
npm run dev
```

### 새로운 채팅 방식 추가
1. 백엔드: `back/src/api/chat.py`에 엔드포인트 추가
2. 프론트엔드: `front/src/config/env.ts`에 모델 설정 추가
3. 타입 정의: `front/src/types/chat.ts` 업데이트

## 🐛 문제 해결

### 자주 발생하는 문제

**vLLM 연결 실패**
```bash
# vLLM 상태 확인
curl http://localhost:8000/v1/models

# 재시작이 필요한 경우
# vLLM 서버를 8000번 포트에서 실행
```

**포트 충돌**
```bash
# 서비스 상태 확인
python manage.py status

# 모든 서비스 강제 종료
python manage.py stop all

# 또는 수동으로 포트 확인
netstat -tulpn | grep :3000  # 프론트엔드
netstat -tulpn | grep :3001  # 백엔드
```

**CORS 에러**
- 백엔드 .env의 FRONTEND_URL 확인
- 프론트엔드 .env.local의 API_BASE_URL 확인

**로그가 생성되지 않음**
- logs/ 디렉토리 권한 확인
- 디스크 공간 확인

## 📈 성능 최적화

### 로그 파일 관리
- 자동 로테이션: 10MB 제한
- 백업 파일: 최대 5개 보관
- 정기적인 로그 정리 권장

### 리소스 모니터링
- 백엔드 메모리 사용량 모니터링
- vLLM 서버 GPU/CPU 사용률 확인
- 네트워크 연결 상태 모니터링

## 🔒 보안

### 기본 보안 설정
- CORS 제한: 지정된 도메인만 허용
- API 타임아웃: 30초 제한
- 에러 정보 최소화

### 프로덕션 권장사항
- HTTPS 사용
- API 키 기반 인증 구현
- 요청 속도 제한 (Rate Limiting)
- 로그 민감정보 마스킹

## 📞 지원

### 로그 분석
1. 프론트엔드 로그 뷰어에서 에러 확인
2. `logs/` 폴더의 로그 파일 확인  
3. API 상태 확인: `/health` 엔드포인트

### 개발자 도구
- 프론트엔드: 브라우저 콘솔에서 `aiChatLogger` 접근
- 백엔드: Swagger UI에서 API 테스트
- vLLM: OpenAPI 호환 엔드포인트 제공