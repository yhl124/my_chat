/**
 * 채팅 상태 관리 훅
 * 
 * 채팅 인터페이스의 모든 상태와 로직을 관리하는 핵심 커스텀 훅입니다.
 * 
 * 주요 기능:
 * - 좌측(기본 모델)/우측(고급 모델) 메시지 상태 관리
 * - 실시간 스트리밍 메시지 전송 및 응답 처리
 * - 고급 모델 선택 (튜닝/RAG/웹검색)
 * - 복사, PDF 내보내기, 초기화 기능
 * - 로딩 상태 관리 및 에러 처리
 * 
 * 사용 예시:
 * const { sendMessage, leftMessages, rightMessages, isLoading } = useChat();
 * 
 * 스트리밍 처리:
 * - 기본 모델: 실시간 스트리밍으로 응답 표시
 * - 고급 모델: 현재는 "개발 중" 메시지 표시 (향후 구현 예정)
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Message, ModelMethod } from '@/types/chat';
import { apiService } from '@/services/api';

export function useChat() {
  const [leftMessages, setLeftMessages] = useState<Message[]>([]);
  const [rightMessages, setRightMessages] = useState<Message[]>([]);
  const [rightModel, setRightModel] = useState<ModelMethod>('tuning');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);

    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to left side
    setLeftMessages(prev => [...prev, userMessage]);
    setRightMessages(prev => [...prev, userMessage]);

    // Create assistant message placeholders with loading state
    const leftAssistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      method: undefined,
      tokens_per_second: 0,
      isLoading: true,
    };

    const rightAssistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      method: rightModel,
      tokens_per_second: 0,
      isLoading: true,
    };

    // Add placeholder messages
    setLeftMessages(prev => [...prev, leftAssistantMessage]);
    setRightMessages(prev => [...prev, rightAssistantMessage]);

    try {
      // Track accumulated content for streaming
      let accumulatedContent = '';
      
      // Send basic model with streaming
      apiService.sendMessageStream(
        content,
        'basic',
        (chunk: string) => {
          // Accumulate content locally first
          accumulatedContent += chunk;
          
          // Update left message with accumulated content
          setLeftMessages(prev => 
            prev.map(msg => 
              msg.id === leftAssistantMessage.id 
                ? { ...msg, content: accumulatedContent, isLoading: false }
                : msg
            )
          );
        },
        (metadata: any) => {
          // Update final metadata and trim trailing whitespace
          setLeftMessages(prev => 
            prev.map(msg => 
              msg.id === leftAssistantMessage.id 
                ? { 
                    ...msg, 
                    content: msg.content, // Preserve formatting
                    timestamp: new Date(metadata.timestamp),
                    tokens_per_second: metadata.total_chars / metadata.time_taken,
                    isLoading: false
                  }
                : msg
            )
          );
        },
        (error: string) => {
          // Handle error
          setLeftMessages(prev => 
            prev.map(msg => 
              msg.id === leftAssistantMessage.id 
                ? { ...msg, content: `Error: ${error}`, isLoading: false }
                : msg
            )
          );
        }
      );

      // For advanced models, show "coming soon" message
      setRightMessages(prev => 
        prev.map(msg => 
          msg.id === rightAssistantMessage.id 
            ? { 
                ...msg, 
                content: '고급 모델 기능은 현재 개발 중입니다. 곧 지원될 예정입니다! 🚀',
                timestamp: new Date(),
                isLoading: false
              }
            : msg
        )
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      
      // Update both messages with error
      const errorMessage = `오류가 발생했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`;
      
      setLeftMessages(prev => 
        prev.map(msg => 
          msg.id === leftAssistantMessage.id 
            ? { ...msg, content: errorMessage, isLoading: false }
            : msg
        )
      );
      
      setRightMessages(prev => 
        prev.map(msg => 
          msg.id === rightAssistantMessage.id 
            ? { ...msg, content: errorMessage, isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [rightModel, isLoading]);

  const clearMessages = useCallback(() => {
    setLeftMessages([]);
    setRightMessages([]);
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Add success toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Add error toast notification here
    }
  }, []);

  const exportToPdf = useCallback(async (side: 'left' | 'right') => {
    const messages = side === 'left' ? leftMessages : rightMessages;
    try {
      const response = await apiService.exportToPdf(messages, side);
      if (response.success && response.data) {
        // Handle PDF download
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-${side}-${new Date().toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  }, [leftMessages, rightMessages]);

  return {
    leftMessages,
    rightMessages,
    rightModel,
    setRightModel,
    isLoading,
    sendMessage,
    clearMessages,
    copyToClipboard,
    exportToPdf,
  };
}