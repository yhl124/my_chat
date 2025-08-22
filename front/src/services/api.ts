/**
 * API 서비스 클래스
 * 
 * 백엔드와의 모든 통신을 관리합니다.
 * - HTTP 요청 래퍼 (타임아웃, 에러 처리 포함)
 * - 메시지 전송 및 응답 처리 (현재는 모의 응답)
 * - PDF 내보내기 API 연동 준비
 * - 세션 저장/로드 API 연동 준비
 * - 향후 FastAPI 백엔드 연동을 위한 구조
 */

import { config } from '@/config/env';
import type { ApiResponse, Message, ModelMethod } from '@/types/chat';

class ApiService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.api.baseUrl;
    this.timeout = config.api.timeout;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async sendMessage(message: string, method: 'basic' | ModelMethod): Promise<Message> {
    // 임시 모의 응답 (실제 API 연동 시 제거)
    return new Promise((resolve) => {
      setTimeout(() => {
        const methodName = method === 'basic' ? '기본' : 
          method === 'tuning' ? '튜닝 모델' : 
          method === 'rag' ? 'RAG' : '웹검색';
        
        resolve({
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `${message}에 대한 ${methodName} 답변입니다. ${method !== 'basic' ? '추가적인 컨텍스트와 최신 정보를 포함합니다.' : ''}`,
          timestamp: new Date(),
          method: method !== 'basic' ? method as ModelMethod : undefined,
          tokens_per_second: method === 'basic' ? 45 : 62,
        });
      }, method === 'basic' ? 1000 : 1500);
    });
  }

  async exportToPdf(messages: Message[], side: 'left' | 'right'): Promise<ApiResponse<Blob>> {
    // 실제 구현 시 FastAPI 백엔드 연동
    return this.makeRequest(`/api/export/pdf`, {
      method: 'POST',
      body: JSON.stringify({ messages, side }),
    });
  }

  async saveSession(sessionData: any): Promise<ApiResponse<string>> {
    // 실제 구현 시 데이터베이스 연동
    return this.makeRequest('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async loadSession(sessionId: string): Promise<ApiResponse<any>> {
    return this.makeRequest(`/api/sessions/${sessionId}`);
  }
}

export const apiService = new ApiService();