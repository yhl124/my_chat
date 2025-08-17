/**
 * 채팅 패널 컴포넌트
 * 
 * 기본 모델 또는 고급 모델의 채팅 인터페이스를 렌더링합니다.
 * - 헤더: 모델명, 설정 (고급 모델의 경우), PDF 내보내기 버튼
 * - 메시지 목록: 사용자와 AI의 대화 내역 표시
 * - 각 메시지에 복사 버튼 및 토큰/초 정보 제공
 * - 고급 모델의 경우 방법론 뱃지 표시
 */

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Sparkles, Download } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import type { Message, ModelMethod } from "@/types/chat";
import { MODEL_NAMES } from "@/constants/prompts";

interface ChatPanelProps {
  title: string;
  icon: React.ReactNode;
  messages: Message[];
  onCopy: (text: string) => void;
  onExport: () => void;
  variant: 'basic' | 'advanced';
  rightModel?: ModelMethod;
  onModelChange?: (model: ModelMethod) => void;
}

export function ChatPanel({
  title,
  icon,
  messages,
  onCopy,
  onExport,
  variant,
  rightModel,
  onModelChange,
}: ChatPanelProps) {
  return (
    <Card className="flex flex-col !p-0">
      <div className="px-4 py-1.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
            {icon}
            {title}
          </h2>
          {variant === 'advanced' && rightModel && onModelChange && (
            <Select value={rightModel} onValueChange={onModelChange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tuning">{MODEL_NAMES.TUNING}</SelectItem>
                <SelectItem value="rag">{MODEL_NAMES.RAG}</SelectItem>
                <SelectItem value="websearch">{MODEL_NAMES.WEBSEARCH}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={onExport} className="h-8 w-8 p-0">
          <Download className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-6 min-h-[400px]">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onCopy={onCopy}
            variant={variant}
          />
        ))}
      </div>
    </Card>
  );
}