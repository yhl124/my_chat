/**
 * API 서비스 클래스
 * 
 * FastAPI 백엔드와의 모든 HTTP 통신을 관리하는 중앙화된 서비스입니다.
 * 
 * 주요 기능:
 * - HTTP 요청 래퍼 (120초 타임아웃, 에러 처리 포함)
 * - 실시간 스트리밍 메시지 전송 및 응답 처리
 * - 청크별 스트리밍 데이터 파싱 및 메타데이터 추출
 * - PDF 내보내기 API 연동
 * - 세션 저장/로드 API 연동
 * - 모델 정보 조회 및 헬스체크
 * 
 * 스트리밍 처리:
 * - Server-Sent Events를 통한 실시간 응답 수신
 * - 메타데이터와 에러 마커를 통한 상태 관리
 * - 청크별 콘텐츠 즉시 전송으로 자연스러운 대화 경험 제공
 * 
 * 사용 예시:
 * await apiService.sendMessageStream(message, 'basic', onChunk, onComplete, onError);
 */

import { config } from '@/config/env';
import { logger } from '@/lib/logger';
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
    // Increase timeout for LLM responses (120 seconds)
    const timeoutId = setTimeout(() => controller.abort(), 120000);

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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle specific abort errors
      if (error instanceof DOMException && error.name === 'AbortError') {
        logger.error('Request timeout - LLM response took too long', {
          endpoint,
          timeout: '120 seconds'
        });
        return {
          success: false,
          error: 'Request timeout - Please try again with a shorter message',
        };
      }
      
      logger.error('API request failed', {
        endpoint,
        error: errorMessage,
        options: {
          method: options.method,
          headers: options.headers
        }
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async sendMessage(message: string, method: 'basic' | ModelMethod): Promise<Message> {
    const endpoint = method === 'basic' ? '/api/chat/basic' : `/api/chat/${method}`;
    
    logger.info('Sending chat message', {
      method,
      endpoint,
      messageLength: message.length
    });

    const response = await this.makeRequest<any>(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        message: message,
        method: method,
      }),
    });

    if (!response.success) {
      logger.error('Failed to send message', {
        method,
        endpoint,
        error: response.error
      });
      throw new Error(response.error || 'Failed to send message');
    }

    logger.info('Message sent successfully', {
      method,
      responseId: response.data.id,
      tokensPerSecond: response.data.tokens_per_second
    });

    // Convert backend response to frontend Message format
    const backendResponse = response.data;
    return {
      id: backendResponse.id,
      role: backendResponse.role,
      content: backendResponse.content,
      timestamp: new Date(backendResponse.timestamp),
      method: backendResponse.method as ModelMethod | undefined,
      tokens_per_second: backendResponse.tokens_per_second,
    };
  }

  async sendMessageStream(
    message: string, 
    method: 'basic' | ModelMethod,
    onChunk: (chunk: string) => void,
    onComplete: (metadata: any) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const endpoint = method === 'basic' ? '/api/chat/basic' : `/api/chat/${method}`;
    
    logger.info('Sending streaming chat message', {
      method,
      endpoint,
      messageLength: message.length
    });

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          method: method,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Check for metadata completion
        const metadataMatch = buffer.match(/\[METADATA\](.+?)\[\/METADATA\]/);
        if (metadataMatch) {
          try {
            const metadata = JSON.parse(metadataMatch[1]);
            onComplete(metadata);
          } catch (e) {
            logger.error('Failed to parse metadata', { error: e });
          }
          break;
        }

        // Check for error completion
        const errorMatch = buffer.match(/\[ERROR\](.+?)\[\/ERROR\]/);
        if (errorMatch) {
          onError(errorMatch[1]);
          break;
        }

        // Send content chunks immediately (only actual content)
        if (chunk && !chunk.includes('[METADATA]') && !chunk.includes('[ERROR]')) {
          if (chunk.length > 0) {
            onChunk(chunk);
          }
        }
      }

      logger.info('Streaming message completed successfully');
      
    } catch (error) {
      logger.error('Failed to send streaming message', {
        method,
        endpoint,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      onError(error instanceof Error ? error.message : 'Unknown error');
    }
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

  async getModels(): Promise<ApiResponse<any>> {
    return this.makeRequest('/api/models');
  }

  async healthCheck(): Promise<ApiResponse<any>> {
    return this.makeRequest('/health');
  }
}

export const apiService = new ApiService();