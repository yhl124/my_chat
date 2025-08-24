/**
 * AI 챗봇 비교 플랫폼 메인 페이지
 * 
 * 기본 모델과 고급 모델의 응답을 나란히 비교할 수 있는 인터페이스를 제공합니다.
 * - 듀얼 패널 채팅 인터페이스
 * - 실시간 메시지 전송 및 응답
 * - 모델 선택 (튜닝/RAG/웹검색)
 * - 샘플 프롬프트 제공
 * - 채팅 초기화 기능
 */

"use client";

import { Bot, Sparkles, RotateCcw } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { MessageInput } from "@/components/MessageInput";
import { SamplePrompts } from "@/components/SamplePrompts";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/useChat";
import { MODEL_NAMES } from "@/constants/prompts";

export default function ChatbotPage() {
  const {
    leftMessages,
    rightMessages,
    rightModel,
    setRightModel,
    isLoading,
    sendMessage,
    copyToClipboard,
    exportToPdf,
    clearMessages,
  } = useChat();

  const handleSendMessage = async (message: string) => {
    await sendMessage(message);
  };

  const handleSamplePrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bot className="h-6 w-6 text-accent" />
            AI 챗봇 비교 플랫폼
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={clearMessages}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            초기화
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] min-h-[calc(100vh-80px)] lg:min-h-0 flex flex-col">
        {/* Chat Area - Fixed Height with Responsive Design */}
        <div className="flex-1 min-h-0 pt-4 sm:pt-6 h-full">
          <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 h-full">
            {/* Left Side - Basic Model */}
            <ChatPanel
              title={MODEL_NAMES.BASIC}
              icon={<Bot className="h-4 w-4" />}
              messages={leftMessages}
              onCopy={copyToClipboard}
              onExport={() => exportToPdf('left')}
              variant="basic"
            />

            {/* Right Side - Advanced Model */}
            <ChatPanel
              title={MODEL_NAMES.TUNING}
              icon={<Sparkles className="h-4 w-4 text-accent" />}
              messages={rightMessages}
              onCopy={copyToClipboard}
              onExport={() => exportToPdf('right')}
              variant="advanced"
              rightModel={rightModel}
              onModelChange={setRightModel}
            />
          </div>
        </div>

        {/* Bottom Section - Fixed at bottom */}
        <div className="flex-shrink-0 pb-2 sm:pb-3">
          <div className="container mx-auto px-4">
          {/* Sample Prompts */}
          <div className="mb-3 sm:mb-4">
            <SamplePrompts 
              onSelectPrompt={handleSamplePrompt}
              disabled={isLoading}
            />
          </div>

          {/* Input Area */}
          <MessageInput 
            onSendMessage={handleSendMessage}
            disabled={isLoading}
          />
          </div>
        </div>
      </div>
    </div>
  );
}