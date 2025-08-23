/**
 * 채팅 메시지 컴포넌트
 * 
 * 개별 채팅 메시지를 렌더링합니다.
 * - 사용자 메시지: 우측 정렬, 기본 스타일
 * - AI 응답: 좌측 정렬, 기본 모델은 말풍선 포함
 * - 복사 버튼: 고급 모델은 항상 표시, 기본 모델은 hover 시 표시
 * - 메시지 하단: 토큰/초 정보 및 방법론 뱃지 (AI 응답만)
 */

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Clock } from "lucide-react";
import type { Message } from "@/types/chat";
import { ChatSkeleton } from "./ChatSkeleton";

interface ChatMessageProps {
  message: Message;
  onCopy: (text: string) => void;
  variant?: 'basic' | 'advanced';
}

export function ChatMessage({ message, onCopy, variant = 'basic' }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isAdvanced = variant === 'advanced';

  // Show skeleton for loading assistant messages
  if (!isUser && message.isLoading) {
    return <ChatSkeleton variant={variant} />;
  }

  return (
    <div className={`flex ${isUser ? "justify-end mb-4" : "justify-start mb-8"}`}>
      <div className="relative max-w-[80%] group flex items-end gap-1">
        <div
          className={`p-3 rounded-lg relative whitespace-pre-wrap break-words ${
            isUser
              ? "bg-primary text-primary-foreground"
              : isAdvanced
              ? "bg-purple-100 text-purple-900 border border-purple-200"
              : "bg-blue-50 text-blue-900 border border-blue-200"
          } ${
            !isUser && !isAdvanced 
              ? "before:content-[''] before:absolute before:left-[-8px] before:top-4 before:w-0 before:h-0 before:border-[8px] before:border-transparent before:border-r-blue-50"
              : ""
          }`}
        >
          {message.content}
        </div>
        {!isUser && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCopy(message.content)}
            className={`h-6 w-6 p-0 bg-background border shadow-sm transition-opacity flex-shrink-0 ${
              isAdvanced ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
        {!isUser && (
          <div className="absolute -bottom-6 left-3 right-3 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{message.tokens_per_second || 0} 토큰/초</span>
            </div>
            <div className="flex items-center gap-1">
              {/* 기본 모델명 표시 */}
              {!message.method && (
                <Badge variant="secondary" className="text-xs">
                  Gemma-3 4B
                </Badge>
              )}
              {/* 고급 모델 뱃지 */}
              {message.method && (
                <Badge variant="secondary" className="text-xs">
                  {message.method === 'tuning' ? '튜닝 모델' :
                   message.method === 'rag' ? 'RAG' : '웹검색'}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}