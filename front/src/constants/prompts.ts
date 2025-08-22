/**
 * 프롬프트 및 UI 텍스트 상수
 * 
 * 애플리케이션에서 사용되는 고정 텍스트들을 관리합니다.
 * - SAMPLE_PROMPTS: 빠른 테스트를 위한 미리 정의된 질문들
 * - PLACEHOLDER_TEXT: 입력 필드 안내 텍스트
 * - MODEL_NAMES: 각 모델의 표시명
 */

export const SAMPLE_PROMPTS = [
  "최신 AI 기술 동향에 대해 설명해주세요",
  "효과적인 프로젝트 관리 방법을 알려주세요",
  "건강한 식단 계획을 세우는 방법은?",
] as const;

export const PLACEHOLDER_TEXT = "메시지를 입력하세요... (Shift+Enter로 줄바꿈)" as const;

export const MODEL_NAMES = {
  BASIC: "기본 모델",
  TUNING: "튜닝 모델",
  RAG: "RAG",
  WEBSEARCH: "웹검색",
} as const;