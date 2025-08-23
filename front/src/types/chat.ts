/**
 * 채팅 관련 타입 정의
 * 
 * 애플리케이션 전반에서 사용되는 채팅 관련 인터페이스와 타입을 정의합니다.
 * - Message: 개별 채팅 메시지 구조
 * - ChatSession: 채팅 세션 전체 데이터
 * - ModelConfig: AI 모델 설정
 * - ApiResponse: API 응답 표준 형식
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  method?: ModelMethod;
  tokens_per_second?: number;
  isLoading?: boolean;
}

export type ModelMethod = 'tuning' | 'rag' | 'websearch';

export interface ChatSession {
  id: string;
  leftMessages: Message[];
  rightMessages: Message[];
  rightModel: ModelMethod;
  createdAt: Date;
  updatedAt: Date;
}

export interface ModelConfig {
  name: string;
  method: ModelMethod;
  endpoint?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}