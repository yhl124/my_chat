/**
 * 환경 설정 관리
 * 
 * 애플리케이션의 모든 설정값을 중앙에서 관리합니다.
 * - API 설정: 백엔드 URL, 타임아웃 등
 * - 기능 플래그: 개발/프로덕션 환경별 기능 토글
 * - 모델 설정: 각 AI 모델의 엔드포인트
 * - UI 설정: 메시지 길이 제한, 애니메이션 속도 등
 * 
 * 환경 변수(.env.local)를 통해 설정값 변경 가능
 */

export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  features: {
    enablePdfExport: process.env.NEXT_PUBLIC_ENABLE_PDF_EXPORT === 'true',
    enableWebSearch: process.env.NEXT_PUBLIC_ENABLE_WEB_SEARCH === 'true',
    enableRag: process.env.NEXT_PUBLIC_ENABLE_RAG === 'true',
  },
  models: {
    basic: {
      name: 'Basic Model',
      endpoint: '/api/chat/basic',
    },
    advanced: {
      tuning: {
        name: '튜닝 모델',
        endpoint: '/api/chat/tuning',
      },
      rag: {
        name: 'RAG',
        endpoint: '/api/chat/rag',
      },
      websearch: {
        name: '웹검색',
        endpoint: '/api/chat/websearch',
      },
    },
  },
  ui: {
    maxMessageLength: parseInt(process.env.NEXT_PUBLIC_MAX_MESSAGE_LENGTH || '2000'),
    typingSpeed: parseInt(process.env.NEXT_PUBLIC_TYPING_SPEED || '50'),
  },
} as const;