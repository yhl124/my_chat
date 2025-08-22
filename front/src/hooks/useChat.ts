/**
 * 채팅 상태 관리 훅
 * 
 * 채팅 인터페이스의 모든 상태와 로직을 관리합니다.
 * - 좌측(기본)/우측(고급) 메시지 상태 관리
 * - 메시지 전송 및 응답 처리
 * - 모델 선택 및 설정
 * - 복사, PDF 내보내기, 초기화 기능
 * - 로딩 상태 관리
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

    // Add user message to both sides
    setLeftMessages(prev => [...prev, userMessage]);
    setRightMessages(prev => [...prev, userMessage]);

    try {
      // Send to both models concurrently
      const [basicResponse, advancedResponse] = await Promise.all([
        apiService.sendMessage(content, 'basic'),
        apiService.sendMessage(content, rightModel),
      ]);

      setLeftMessages(prev => [...prev, basicResponse]);
      setRightMessages(prev => [...prev, advancedResponse]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Add error handling UI feedback here
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